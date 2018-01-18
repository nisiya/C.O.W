///<reference path="globals.ts" />
/* ------------
Lexer.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Lexer = /** @class */ (function () {
        function Lexer() {
        }
        // constructor(public content: string = "") {
        // }
        Lexer.prototype.init = function () {
        };
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
