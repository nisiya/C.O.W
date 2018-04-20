///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */
var Compiler;
(function (Compiler) {
    var CodeGen = /** @class */ (function () {
        function CodeGen() {
        }
        CodeGen.prototype.start = function (asTree) {
            this.asTree = asTree;
            this.code = new Array();
            this.tempStringMem = new Array();
            this.tempNum = 0;
            this.staticTable = new Map();
            this.currentScope = 0;
            this.varOffset = 1;
            for (var i = 0; i < this.asTree.root.childrenNodes.length; i++) {
                this.createCode(this.asTree.root.childrenNodes[i]);
            }
            // append strings to the end
            while (this.tempStringMem.length > 0) {
                this.code.push(this.tempStringMem.pop());
            }
            console.log(this.staticTable);
            console.log(this.code);
        };
        CodeGen.prototype.createCode = function (currentNode) {
            switch (currentNode.value) {
                case "Block":
                    this.currentScope++;
                    for (var i = 0; i < currentNode.childrenNodes.length; i++) {
                        this.createCode(currentNode.childrenNodes[i]);
                    }
                    this.currentScope--;
                    break;
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
                    break;
                case "Add":
                    break;
                case "NotEqual":
                    break;
                case "Equal":
                    break;
            }
        };
        CodeGen.prototype.addToStatic = function (id) {
            var tempAddr = "T" + this.tempNum + " XX";
            this.staticTable.set(id + "@" + this.currentScope, [tempAddr, this.varOffset]);
            this.tempNum++;
            this.varOffset++;
            return tempAddr;
        };
        CodeGen.prototype.createVarDecl = function (varDeclNode) {
            var id = varDeclNode.childrenNodes[1].value;
            var type = varDeclNode.childrenNodes[0].value;
            var tempAddr = this.addToStatic(id);
            if (type != "string") {
                this.loadAccConst(0);
                this.storeAcc(tempAddr);
            } // else load the string pointer when initialized
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
                this.tempStringMem.push("00"); // will add to code at the end
                for (var i = value.length - 2; i > 0; i--) {
                    // ignore the quotes
                    var asciiVal = value.charCodeAt(i);
                    this.tempStringMem.push(asciiVal.toString(16).toUpperCase());
                }
                var stringOffset = 256 - this.tempStringMem.length;
                this.loadAccConst(stringOffset); // pointer to string
                // add to Static table and get temp address
                tempAddr = this.addToStatic(id);
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
                    this.calculateSum(assignNode.childrenNodes[1]);
                    // upon return, Acc will be loaded with appropriate value
                }
                else if (value == "true") {
                    this.loadAccConst(1);
                }
                else if (value == "false") {
                    this.loadAccConst(0);
                }
                // find temp address
                tempAddr = this.findTempAddr(id);
            }
            // store value to temp address
            this.storeAcc(tempAddr);
        };
        CodeGen.prototype.calculateSum = function (additionNode) {
            var isDigit = /^[0-9]$/;
            // load Acc with value
            var digit = additionNode.childrenNodes[0].value;
            this.loadAccConst(parseInt(digit));
            // store at temp address
            var tempAddr = "T" + this.tempNum + " XX";
            this.storeAcc(tempAddr);
            this.staticTable.set("Temp" + this.tempNum, [tempAddr, this.varOffset]);
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
        };
        CodeGen.prototype.findTempAddr = function (id) {
            var locInfo = this.staticTable.get(id + "@" + this.currentScope);
            if (locInfo == null) {
                var tempScope = this.currentScope - 1;
                while (locInfo == null) {
                    locInfo = this.staticTable.get(id + "@" + tempScope);
                    tempScope--;
                }
            }
            return locInfo[0];
        };
        CodeGen.prototype.loadAccConst = function (value) {
            this.code.push("A9");
            if (value < 10) {
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
            this.code.push(value);
        };
        CodeGen.prototype.loadXMem = function (tempAddr) {
            this.code.push("AE");
            var memAddr = tempAddr.split(" ");
            this.code.push(memAddr[0]);
            this.code.push(memAddr[1]);
        };
        CodeGen.prototype.loadYConst = function (value) {
            this.code.push("A0");
            this.code.push(value);
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
