///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
///<reference path="staticEntry.ts" />
/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */
var Compiler;
(function (Compiler) {
    var CodeGen = /** @class */ (function () {
        function CodeGen() {
        }
        CodeGen.prototype.start = function (asTree, symbolTable) {
            this.asTree = asTree;
            this.symbolTable = symbolTable;
            this.code = new Array();
            for (var i = 0; i < 256; i++) {
                this.code.push("00");
            }
            this.codeIndex = 0;
            this.tempNum = 0;
            this.createCode(asTree.root);
            return this.code;
        };
        CodeGen.prototype.createCode = function (node) {
            switch (node.value) {
                case "Block":
                    this.createCode(node.childrenNodes[0]);
                    break;
                case "VarDecl":
                    this.createVarDecl(node);
                case "Assign":
                case "print":
                case "while":
                case "if":
                case "Add":
                case "NotEqual":
                case "Equal":
            }
        };
        CodeGen.prototype.createVarDecl = function (node) {
            var varType = node.childrenNodes[0].value;
            var id = node.childrenNodes[1].value;
            this.addByte("A9");
            this.addByte("00");
            if (varType == "int" || varType == "bool") {
            }
            else {
            }
            this.addByte("T" + this.tempNum);
            this.addByte("XX");
            var staticVar = new Compiler.StaticEntry("T" + this.tempNum + "XX");
            this.tempNum++;
        };
        CodeGen.prototype.addByte = function (value) {
            this.code[this.codeIndex] = value;
            this.codeIndex++;
        };
        return CodeGen;
    }());
    Compiler.CodeGen = CodeGen;
})(Compiler || (Compiler = {}));
