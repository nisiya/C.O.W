///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="scopeTree.ts" />
/* ------------
codeGen.ts
Requires global.ts, tree.ts, scopeTree.ts
------------ */
var Compiler;
(function (Compiler) {
    var CodeGen = /** @class */ (function () {
        function CodeGen() {
            this.ACC = ["A9", "AD"];
            this.XREG = ["A2", "AE"];
            this.YREG = ["A0", "AC"];
        }
        CodeGen.prototype.start = function (asTree, scopeTree) {
            _OutputLog = "";
            this.asTree = asTree;
            this.code = new Array();
            this.heap = new Array();
            this.tempNum = 0;
            this.jumpNum = 0;
            this.staticTable = new Map();
            this.jumpTable = new Map();
            this.stringTable = new Map();
            this.currentScope = scopeTree.root;
            this.varOffset = 0;
            // front load the true and false values
            this.addString("false");
            this.falseAddr = 255 - this.heap.length;
            this.addString("true");
            this.trueAddr = 255 - this.heap.length;
            // start with root like always
            this.handleBlock(asTree.root);
            // end of code
            this.addBreak();
            var tempCodeLen = this.code.length;
            // pad the 00s
            while (this.code.length + this.heap.length < 255) {
                this.code.push("00");
            }
            // append heap to the end
            while (this.heap.length > 0) {
                this.pushByte(this.heap.pop());
            }
            this.handleBackpatch(tempCodeLen);
            if (this.code.length > 256) {
                return null; // memory exceeds 256 bytes
            }
            else {
                return this.code;
            }
        };
        CodeGen.prototype.handleBlock = function (blockNode) {
            var childScopeIndex = 0; // which child to visit
            var tempScope = this.currentScope;
            for (var i = 0; i < blockNode.childrenNodes.length; i++) {
                var childNode = blockNode.childrenNodes[i];
                if (childNode.value == "Block") {
                    this.currentScope = tempScope.childrenScopes[childScopeIndex];
                    this.handleBlock(childNode);
                    this.currentScope = this.currentScope.parentScope;
                    childScopeIndex++;
                }
                else {
                    this.createCode(childNode);
                }
            }
            this.currentScope = tempScope;
        };
        CodeGen.prototype.createCode = function (currentNode) {
            _OutputLog += "\n   CODEGEN --> Found [" + currentNode.value
                + "] on line " + currentNode.location[0] + " and column " + currentNode.location[1];
            switch (currentNode.value) {
                case "VarDecl":
                    this.createVarDecl(currentNode);
                    break;
                case "Assign":
                    this.createAssign(currentNode);
                    break;
                case "while":
                    this.createWhile(currentNode);
                    break;
                case "if":
                    this.createIf(currentNode);
                    break;
                case "print":
                    this.createPrint(currentNode);
                    break;
            }
        };
        // add entry to static table
        // returns the temp location address
        CodeGen.prototype.addToStatic = function (id, type) {
            var tempAddr = "T" + this.tempNum + " XX";
            this.staticTable.set(id + "@" + this.currentScope.level, [type, tempAddr, this.varOffset]);
            this.tempNum++;
            this.varOffset++;
            return tempAddr;
        };
        // add entry to jump table
        // returns current point in code
        CodeGen.prototype.addToJump = function () {
            var jumpKey = "J" + this.jumpNum;
            this.jumpTable.set(jumpKey, 0);
            this.pushByte("D0");
            this.pushByte(jumpKey);
            this.jumpNum++;
            return this.code.length - 1;
        };
        CodeGen.prototype.createVarDecl = function (varDeclNode) {
            var id = varDeclNode.childrenNodes[1].value;
            var type = varDeclNode.childrenNodes[0].value;
            var tempAddr = this.addToStatic(id, type);
            if (type != "string") {
                this.loadRegConst(0, this.ACC[0]);
                this.storeAcc(tempAddr);
            } // else load the string pointer when initialized
        };
        // add to heap
        CodeGen.prototype.addString = function (value) {
            this.heap.push("00"); // strings are 00-terminated
            for (var i = value.length - 1; i >= 0; i--) {
                var asciiVal = value.charCodeAt(i);
                this.heap.push(asciiVal.toString(16).toUpperCase());
            }
        };
        CodeGen.prototype.createAssign = function (assignNode) {
            var id = assignNode.childrenNodes[0].value;
            // identify value to be loaded
            var varType = this.createExpr(assignNode.childrenNodes[1], this.ACC);
            var tempAddr;
            if (varType == "string") {
                tempAddr = this.findTempAddr(id); // string reassignment
                if (tempAddr == null) {
                    tempAddr = this.addToStatic(id, "string");
                }
            }
            else {
                // find temp address
                tempAddr = this.findTempAddr(id);
            }
            // store value to temp address
            this.storeAcc(tempAddr);
        };
        CodeGen.prototype.createPrint = function (printNode) {
            var varType = this.createExpr(printNode.childrenNodes[0], this.YREG);
            if (varType == "int") {
                this.loadRegConst(1, this.XREG[0]);
            }
            else {
                this.loadRegConst(2, this.XREG[0]);
            }
            this.pushByte("FF"); //system call
        };
        // identify type of variable
        CodeGen.prototype.findType = function (id) {
            var locInfo = this.staticTable.get(id + "@" + this.currentScope.level);
            if (locInfo == null) {
                var tempScope = this.currentScope.parentScope;
                while (locInfo == null) {
                    locInfo = this.staticTable.get(id + "@" + tempScope.level);
                    tempScope = tempScope.parentScope;
                }
            }
            return locInfo[0];
        };
        // does addition by adding to accumulator and storing at temp location
        CodeGen.prototype.calculateSum = function (additionNode) {
            _OutputLog += "\n   CODEGEN --> Found [" + additionNode.value
                + "] on line " + additionNode.location[0] + " and column " + additionNode.location[1];
            var isDigit = /^[0-9]$/;
            // load Acc with value
            var digit = additionNode.childrenNodes[0].value;
            this.loadRegConst(parseInt(digit), this.ACC[0]);
            // store at temp address
            var tempAddr = "T" + this.tempNum + " XX";
            this.storeAcc(tempAddr);
            this.staticTable.set("Temp" + this.tempNum, ["int", tempAddr, this.varOffset]);
            this.tempNum++;
            this.varOffset++;
            var sumAddr = tempAddr;
            var rightOperand = additionNode.childrenNodes[1];
            // check for more addition
            while (rightOperand.value == "Add") {
                // load Acc with value
                digit = rightOperand.childrenNodes[0].value;
                this.loadRegConst(parseInt(digit), this.ACC[0]);
                // add value from sum storage
                this.addAcc(sumAddr);
                // store value back to sum storage
                this.storeAcc(sumAddr);
                rightOperand = rightOperand.childrenNodes[1];
            }
            // the last value in IntExpr
            if (isDigit.test(rightOperand.value)) {
                // load Acc with value
                digit = rightOperand.childrenNodes[0].value;
                this.loadRegConst(parseInt(digit), this.ACC[0]);
                // add value from sum storage
                this.addAcc(sumAddr);
            }
            else {
                var varAddr = this.findTempAddr(rightOperand.value);
                this.addAcc(varAddr);
            }
            this.storeAcc(sumAddr);
            return sumAddr;
        };
        // find the corresponding TXXX address
        CodeGen.prototype.findTempAddr = function (id) {
            var locInfo = this.staticTable.get(id + "@" + this.currentScope.level);
            if (locInfo == null) {
                var tempScope = this.currentScope.parentScope;
                while (locInfo == null) {
                    locInfo = this.staticTable.get(id + "@" + tempScope.level);
                    tempScope = tempScope.parentScope;
                }
            }
            return locInfo[1];
        };
        CodeGen.prototype.handleNotEq = function () {
            this.loadRegConst(0, this.ACC[0]);
            var neqJumpNdx = this.addToJump();
            this.code[neqJumpNdx] = "02";
            this.loadRegConst(1, this.ACC[0]);
            var tempAddr = this.addToStatic("Neq" + this.tempNum, "int");
            this.storeAcc(tempAddr);
            this.loadRegConst(0, this.XREG[0]);
            this.compareX(tempAddr);
        };
        CodeGen.prototype.createWhile = function (whileNode) {
            var tempAddr;
            var jumpDes = this.code.length; // top of loop
            this.createBool(whileNode.childrenNodes[0]);
            // NotEqual case
            if (whileNode.childrenNodes[0].value == "NotEqual") {
                this.handleNotEq();
            }
            var jumpNdx = this.addToJump();
            this.handleBlock(whileNode.childrenNodes[1]);
            // jump forward to top of while
            this.loadRegConst(2, this.XREG[0]);
            this.loadRegConst(1, this.ACC[0]);
            tempAddr = this.addToStatic("CpX" + this.tempNum, "int");
            this.storeAcc(tempAddr);
            this.compareX(tempAddr);
            var jumpNdx2 = this.addToJump();
            this.code[jumpNdx2] = this.decimalToHex((256 - this.code.length) + jumpDes);
            this.code[jumpNdx] = this.decimalToHex(this.code.length - jumpNdx - 1);
        };
        CodeGen.prototype.createIf = function (ifNode) {
            this.createBool(ifNode.childrenNodes[0]);
            // NotEqual case
            if (ifNode.childrenNodes[0].value == "NotEqual") {
                this.handleNotEq();
            }
            var jumpNdx = this.addToJump();
            this.handleBlock(ifNode.childrenNodes[1]);
            this.code[jumpNdx] = this.decimalToHex(this.code.length - jumpNdx - 1);
        };
        CodeGen.prototype.createBool = function (boolNode) {
            var tempAddr;
            if (boolNode.value == "true") {
                this.loadRegConst(this.trueAddr, this.XREG[0]);
                this.loadRegConst(this.trueAddr, this.ACC[0]);
                tempAddr = this.addToStatic(boolNode.value + "" + this.tempNum, "bool");
                this.storeAcc(tempAddr);
                this.compareX(tempAddr);
            }
            else if (boolNode.value == "false") {
                this.loadRegConst(this.falseAddr, this.XREG[0]);
                this.loadRegConst(this.trueAddr, this.ACC[0]);
                tempAddr = this.addToStatic(boolNode.value + "" + this.tempNum, "bool");
                this.storeAcc(tempAddr);
                this.compareX(tempAddr);
            }
            else {
                // check first variable
                var var1Type = this.createExpr(boolNode.childrenNodes[0], this.XREG);
                var var2Node = boolNode.childrenNodes[1];
                var isId = /^[a-z]$/;
                var isDigit = /^[0-9]$/;
                var isString = /^\"([a-zA-Z]|\s)*\"$/;
                // then check second varible
                if (isString.test(var2Node.value)) {
                    var stringPointer = void 0;
                    var stringVal = var2Node.value.substring(1, var2Node.value.length - 1);
                    // add to heap if string does not already exist
                    if (this.stringTable.get(stringVal) == null) {
                        this.addString(stringVal); // ignore the quotes
                        stringPointer = 255 - this.heap.length;
                        this.stringTable.set(stringVal, stringPointer);
                    }
                    else {
                        stringPointer = this.stringTable.get(stringVal);
                    }
                    this.loadRegConst(stringPointer, this.ACC[0]); // pointer to string
                    tempAddr = this.addToStatic("string" + this.tempNum, "string");
                    this.storeAcc(tempAddr);
                }
                else if (var2Node.value == "true") {
                    this.loadRegConst(this.trueAddr, this.ACC[0]);
                    tempAddr = this.addToStatic(var2Node.value + "" + this.tempNum, "bool");
                    this.storeAcc(tempAddr);
                }
                else if (var2Node.value == "false") {
                    this.loadRegConst(this.falseAddr, this.ACC[0]);
                    tempAddr = this.addToStatic(var2Node.value + "" + this.tempNum, "bool");
                    this.storeAcc(tempAddr);
                }
                else if (isId.test(var2Node.value)) {
                    tempAddr = this.findTempAddr(var2Node.value);
                }
                else if (isDigit.test(var2Node.value)) {
                    var intValue = parseInt(var2Node.value);
                    this.loadRegConst(intValue, this.ACC[0]);
                    tempAddr = this.addToStatic(var2Node.value + "" + this.tempNum, "int");
                    this.storeAcc(tempAddr);
                }
                else if (var2Node.value == "Add") {
                    tempAddr = this.calculateSum(var2Node);
                }
                this.compareX(tempAddr);
            }
        };
        CodeGen.prototype.createExpr = function (exprNode, register) {
            var isId = /^[a-z]$/;
            var isDigit = /^[0-9]$/;
            var isString = /^\"([a-zA-Z]|\s)*\"$/;
            // identify value to be loaded
            var value = exprNode.value;
            if (isString.test(value)) {
                var stringPointer = void 0;
                var stringVal = value.substring(1, value.length - 1);
                // add to heap if string does not already exist
                if (this.stringTable.get(stringVal) == null) {
                    this.addString(stringVal); // ignore the quotes
                    stringPointer = 255 - this.heap.length;
                    this.stringTable.set(stringVal, stringPointer);
                }
                else {
                    stringPointer = this.stringTable.get(stringVal);
                }
                this.loadRegConst(stringPointer, register[0]); // pointer to string
                return "string";
            }
            else if (value == "true") {
                this.loadRegConst(this.trueAddr, register[0]);
                return "boolean";
            }
            else if (value == "false") {
                this.loadRegConst(this.falseAddr, register[0]);
                return "boolean";
            }
            else if (isId.test(value)) {
                var varAddr = this.findTempAddr(value);
                this.loadRegMem(varAddr, register[1]);
                return this.findType(value);
            }
            else if (isDigit.test(value)) {
                var intValue = parseInt(value);
                this.loadRegConst(intValue, register[0]);
                return "int";
            }
            else if (value == "Add") {
                var sumAddr = this.calculateSum(exprNode);
                // sumAddr is where the result of the addtion is
                this.loadRegMem(sumAddr, register[1]);
                return "int";
            }
        };
        CodeGen.prototype.handleBackpatch = function (tempCodeLen) {
            var staticKeys = this.staticTable.keys();
            var key = staticKeys.next();
            var tempTable = new Map();
            // make table with just TXXX and offset
            while (!key.done) {
                var locInfo = this.staticTable.get(key.value);
                tempTable.set(locInfo[1], locInfo[2] + tempCodeLen);
                key = staticKeys.next();
            }
            this.backpatch(tempTable, tempCodeLen);
        };
        CodeGen.prototype.backpatch = function (tempTable, tempCodeLen) {
            var isTemp = /^T/;
            for (var i = 0; i < tempCodeLen; i++) {
                // walkthrough the code and replace with correct addresses
                if (isTemp.test(this.code[i])) {
                    var staticKeys = this.code[i] + " " + this.code[i + 1];
                    var index = tempTable.get(staticKeys);
                    this.code[i] = this.decimalToHex(index);
                    this.code[i + 1] = "00";
                    _OutputLog += "\n   CODEGEN --> Backpatching memory location for  [" + staticKeys + "] to [" + this.code[i] + this.code[i + 1] + "] ...";
                }
            }
        };
        CodeGen.prototype.decimalToHex = function (value) {
            if (value < 16) {
                return "0" + value.toString(16).toUpperCase();
            }
            else {
                return value.toString(16).toUpperCase();
            }
        };
        CodeGen.prototype.pushByte = function (value) {
            this.code.push(value);
            _OutputLog += "\n   CODEGEN --> Pushing byte [" + value + "] to memory...";
        };
        CodeGen.prototype.loadRegConst = function (value, register) {
            this.pushByte(register);
            this.pushByte(this.decimalToHex(value));
        };
        CodeGen.prototype.loadRegMem = function (tempAddr, register) {
            this.pushByte(register);
            var memAddr = tempAddr.split(" ");
            this.pushByte(memAddr[0]);
            this.pushByte(memAddr[1]);
        };
        CodeGen.prototype.storeAcc = function (tempAddr) {
            this.pushByte("8D");
            var memAddr = tempAddr.split(" ");
            this.pushByte(memAddr[0]);
            this.pushByte(memAddr[1]);
        };
        CodeGen.prototype.addAcc = function (tempAddr) {
            this.pushByte("6D");
            var memAddr = tempAddr.split(" ");
            this.pushByte(memAddr[0]);
            this.pushByte(memAddr[1]);
        };
        CodeGen.prototype.addBreak = function () {
            this.pushByte("00");
        };
        CodeGen.prototype.compareX = function (tempAddr) {
            this.pushByte("EC");
            var memAddr = tempAddr.split(" ");
            this.pushByte(memAddr[0]);
            this.pushByte(memAddr[1]);
        };
        return CodeGen;
    }());
    Compiler.CodeGen = CodeGen;
})(Compiler || (Compiler = {}));
