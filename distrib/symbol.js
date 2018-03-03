/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token
------------ */
var Compiler;
(function (Compiler) {
    var SymbolTable = /** @class */ (function () {
        function SymbolTable() {
        }
        return SymbolTable;
    }());
    Compiler.SymbolTable = SymbolTable;
    var Symbol = /** @class */ (function () {
        function Symbol(value, parentNode) {
            this.value = value;
            this.parentNode = parentNode;
            this.childrenNode = new Array();
        }
        return Symbol;
    }());
    Compiler.Symbol = Symbol;
})(Compiler || (Compiler = {}));
