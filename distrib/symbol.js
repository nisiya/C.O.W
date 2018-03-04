/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */
var Compiler;
(function (Compiler) {
    var Symbol = /** @class */ (function () {
        function Symbol(key, type) {
            this.key = key;
            this.type = type;
        }
        return Symbol;
    }());
    Compiler.Symbol = Symbol;
})(Compiler || (Compiler = {}));
