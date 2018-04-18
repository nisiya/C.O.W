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
            this.tempNum = 0;
            this.staticTable = new Map();
            this.currentScope = 0;
            this.varOffset = 1;
            this.stringOffset = -1;
            this.createCode(this.asTree.root);
            console.log(this.code);
        };
        CodeGen.prototype.createCode = function (currentNode) {
            switch (currentNode.value) {
                case "Block":
                    for (var i = 0; i < currentNode.childrenNodes.length; i++) {
                        this.createCode(currentNode.childrenNodes[i]);
                    }
                    break;
                case "VarDecl":
                    this.createVarDecl(currentNode);
                    break;
                case "Assign":
                    this.createAssign(currentNode);
                    break;
                case "while":
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
        CodeGen.prototype.createVarDecl = function (varDeclNode) {
            var id = varDeclNode.childrenNodes[1].value;
            var type = varDeclNode.childrenNodes[0].value;
            var tempAddr = "T" + this.tempNum + " XX";
            this.loadAccConst("00");
            this.storeAcc(tempAddr);
            var offset;
            if (type == "string") {
                offset = this.stringOffset;
                this.stringOffset -= id.length;
            }
            else {
                offset = this.varOffset;
                this.varOffset++;
            }
            this.staticTable.set(id + "@" + this.currentScope, [tempAddr, offset]);
            this.tempNum++;
        };
        CodeGen.prototype.createAssign = function (assignNode) {
            var isId = /^[a-z]$/;
            var isDigit = /^[0-9]$/;
            // identify value to be loaded
            var value = assignNode.childrenNodes[1].value;
            if (isId.test(value)) {
                var varAddr = this.findTempAddr(value);
                this.loadAccMem(varAddr);
            }
            else if (isDigit) {
                // convert value to hex
                var intValue = parseInt(value);
                if (intValue < 10) {
                    this.loadAccConst("0" + intValue.toString(16));
                }
                else {
                    this.loadAccConst(intValue.toString(16));
                }
            }
            else if (value == "Add") {
                this.calculateSum(assignNode.childrenNodes[1]);
            }
            else if (value == "true") {
                this.loadAccConst("01");
            }
            else if (value == "false") {
                this.loadAccConst("00");
            }
            else {
                // handle string...
            }
            // find temp address
            var id = assignNode.childrenNodes[0].value;
            var tempAddr = this.findTempAddr(id);
            // store value to temp address
            this.storeAcc(tempAddr);
        };
        CodeGen.prototype.calculateSum = function (node) {
            var sum = 0;
            // while()
            return sum;
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
            this.code.push(value);
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
