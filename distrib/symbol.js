/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */
var Compiler;
(function (Compiler) {
    var Symbol = /** @class */ (function () {
        function Symbol(key, type, location) {
            this.key = key;
            this.type = type;
            this.scope = -1;
            this.location = location;
            this.accessed = 0;
        }
        return Symbol;
    }());
    Compiler.Symbol = Symbol;
})(Compiler || (Compiler = {}));
