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
        }
        CodeGen.prototype.start = function (asTree, scopeTree) {
            this.asTree = asTree;
            this.code = new Array();
            this.tempStringMem = new Array();
            this.tempNum = 0;
            this.staticTable = new Map();
            this.currentScope = scopeTree.root;
            this.varOffset = 0;
            // front load the true and false values
            this.addString("'false'");
            this.falseAddr = 255 - this.tempStringMem.length;
            this.addString("'true'");
            this.trueAddr = 255 - this.tempStringMem.length;
            this.handleBlock(asTree.root);
            this.addBreak();
            this.handleBackpatch();
            // add 00s
            while (this.code.length + this.tempStringMem.length < 255) {
                this.code.push("00");
            }
            // append strings to the end
            while (this.tempStringMem.length > 0) {
                this.code.push(this.tempStringMem.pop());
            }
            console.log(this.staticTable);
            if (this.code.length > 256) {
                return null;
            }
            else {
                return this.code;
            }
        };
        CodeGen.prototype.handleBlock = function (blockNode) {
            var childScopeIndex = 0;
            var tempScope = this.currentScope;
            for (var i = 0; i < blockNode.childrenNodes.length; i++) {
                var childNode = blockNode.childrenNodes[i];
                if (childNode.value == "Block") {
                    this.currentScope = tempScope.childrenScopes[childScopeIndex];
                    this.handleBlock(childNode);
                    childScopeIndex++;
                }
                else {
                    this.createCode(childNode);
                }
            }
            this.currentScope = tempScope;
        };
        CodeGen.prototype.createCode = function (currentNode) {
            switch (currentNode.value) {
                case "VarDecl":
                    this.createVarDecl(currentNode);
                    break;
                case "Assign":
                    this.createAssign(currentNode);
                    break;
                case "while":
                    // this.createWhile(currentNode);
                    break;
                case "if":
                    break;
                case "print":
                    this.createPrint(currentNode);
                    break;
                case "Add":
                    break;
                case "NotEqual":
                    break;
                case "Equal":
                    break;
            }
        };
        CodeGen.prototype.addToStatic = function (id, type) {
            var tempAddr = "T" + this.tempNum + " XX";
            this.staticTable.set(id + "@" + this.currentScope.level, [type, tempAddr, this.varOffset]);
            this.tempNum++;
            this.varOffset++;
            return tempAddr;
        };
        CodeGen.prototype.createVarDecl = function (varDeclNode) {
            var id = varDeclNode.childrenNodes[1].value;
            var type = varDeclNode.childrenNodes[0].value;
            var tempAddr = this.addToStatic(id, type);
            if (type != "string") {
                this.loadAccConst(0);
                this.storeAcc(tempAddr);
            } // else load the string pointer when initialized
        };
        CodeGen.prototype.addString = function (value) {
            this.tempStringMem.push("00"); // will add to code at the end
            for (var i = value.length - 2; i > 0; i--) {
                // ignore the quotes
                var asciiVal = value.charCodeAt(i);
                this.tempStringMem.push(asciiVal.toString(16).toUpperCase());
            }
        };
        CodeGen.prototype.createAssign = function (assignNode) {
            var isId = /^[a-z]$/;
            var isDigit = /^[0-9]$/;
            var isString = /^\"[a-zA-Z]*\"$/;
            // identify value to be loaded
            var id = assignNode.childrenNodes[0].value;
            var value = assignNode.childrenNodes[1].value;
            var tempAddr;
            if (isString.test(value)) {
                this.addString(value);
                var stringPointer = 255 - this.tempStringMem.length;
                this.loadAccConst(stringPointer); // pointer to string
                // add to Static table and get temp address
                tempAddr = this.addToStatic(id, "string");
            }
            else {
                if (isId.test(value)) {
                    var varAddr = this.findTempAddr(value);
                    this.loadAccMem(varAddr);
                }
                else if (isDigit.test(value)) {
                    // convert value to hex
                    var intValue = parseInt(value);
                    this.loadAccConst(intValue);
                }
                else if (value == "Add") {
                    var sumAddr = this.calculateSum(assignNode.childrenNodes[1]);
                    // upon return, Acc will be loaded with appropriate value
                }
                else if (value == "true") {
                    this.loadAccConst(this.trueAddr);
                }
                else if (value == "false") {
                    this.loadAccConst(this.trueAddr);
                }
                // find temp address
                tempAddr = this.findTempAddr(id);
            }
            // store value to temp address
            this.storeAcc(tempAddr);
        };
        CodeGen.prototype.createPrint = function (printNode) {
            var isId = /^[a-z]$/;
            var isDigit = /^[0-9]$/;
            var isString = /^\"[a-zA-Z]*\"$/;
            // identify value to be loaded
            var value = printNode.childrenNodes[0].value;
            if (isString.test(value)) {
                this.addString(value);
                var stringPointer = 255 - this.tempStringMem.length;
                this.loadYConst(stringPointer); // pointer to string
                this.loadXConst(2);
            }
            else if (value == "true") {
                this.loadYConst(this.trueAddr);
                this.loadXConst(2);
            }
            else if (value == "false") {
                this.loadYConst(this.falseAddr);
                this.loadXConst(2);
            }
            else if (isId.test(value)) {
                var varAddr = this.findTempAddr(value);
                this.loadYMem(varAddr);
                if (this.findType(value) == "int") {
                    this.loadXConst(1);
                }
                else {
                    this.loadXConst(2);
                }
            }
            else if (isDigit.test(value)) {
                // convert value to hex
                var intValue = parseInt(value);
                this.loadYConst(intValue);
                this.loadXConst(1);
            }
            else if (value == "Add") {
                var sumAddr = this.calculateSum(printNode.childrenNodes[0]);
                // sumAddr is where the result of the addtion is
                this.loadYMem(sumAddr);
                this.loadXConst(1);
            }
            this.systemCall();
        };
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
        CodeGen.prototype.calculateSum = function (additionNode) {
            var isDigit = /^[0-9]$/;
            // load Acc with value
            var digit = additionNode.childrenNodes[0].value;
            this.loadAccConst(parseInt(digit));
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
                console.log("Add");
                // load Acc with value
                digit = rightOperand.childrenNodes[0].value;
                this.loadAccConst(parseInt(digit));
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
                this.loadAccConst(parseInt(digit));
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
        CodeGen.prototype.findTempAddr = function (id) {
            console.log(this.currentScope);
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
        CodeGen.prototype.handleBackpatch = function () {
            console.log(this.code);
            var staticKeys = this.staticTable.keys();
            var key = staticKeys.next();
            var tempTable = new Map();
            while (!key.done) {
                var locInfo = this.staticTable.get(key.value);
                tempTable.set(locInfo[1], locInfo[2] + this.code.length);
                key = staticKeys.next();
            }
            console.log(tempTable);
            this.backpatch(tempTable);
        };
        CodeGen.prototype.backpatch = function (tempTable) {
            var isTemp = /^T/;
            for (var i = 0; i < this.code.length; i++) {
                console.log("code " + this.code[i]);
                if (isTemp.test(this.code[i])) {
                    console.log("replace " + this.code[i]);
                    var staticKeys = this.code[i] + " " + this.code[i + 1];
                    var index = tempTable.get(staticKeys);
                    this.code[i] = this.decimalToHex(index);
                    this.code[i + 1] = "00";
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
        CodeGen.prototype.loadAccConst = function (value) {
            this.code.push("A9");
            if (value < 16) {
                this.code.push("0" + value.toString(16).toUpperCase());
            }
            else {
                this.code.push(value.toString(16).toUpperCase());
            }
        };
        CodeGen.prototype.loadAccMem = function (tempAddr) {
            this.code.push("AD");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.storeAcc = function (tempAddr) {
            this.code.push("8D");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.addAcc = function (tempAddr) {
            this.code.push("6D");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.loadXConst = function (value) {
            this.code.push("A2");
            if (value < 16) {
                this.code.push("0" + value.toString(16).toUpperCase());
            }
            else {
                this.code.push(value.toString(16).toUpperCase());
            }
        };
        CodeGen.prototype.loadXMem = function (tempAddr) {
            this.code.push("AE");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.loadYConst = function (value) {
            this.code.push("A0");
            if (value < 16) {
                this.code.push("0" + value.toString(16).toUpperCase());
            }
            else {
                this.code.push(value.toString(16).toUpperCase());
            }
        };
        CodeGen.prototype.loadYMem = function (tempAddr) {
            this.code.push("AC");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.noOperation = function () {
            this.code.push("EA");
        };
        CodeGen.prototype.addBreak = function () {
            this.code.push("00");
        };
        CodeGen.prototype.compareX = function (tempAddr) {
            this.code.push("EC");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.branchByte = function (value) {
            this.code.push("D0");
            this.code.push(value);
        };
        CodeGen.prototype.incrementByte = function (tempAddr) {
            this.code.push("EE");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.systemCall = function () {
            this.code.push("FF");
        };
        return CodeGen;
    }());
    Compiler.CodeGen = CodeGen;
})(Compiler || (Compiler = {}));
