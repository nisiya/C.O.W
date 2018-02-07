///<reference path="globals.ts" />
/* ------------
Control.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Control = /** @class */ (function () {
        function Control() {
        }
        Control.startCompile = function (btn) {
            var lexer = new Compiler.Lexer();
            lexer.start();
        };
        return Control;
    }());
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
