///<reference path="globals.ts" />
///<reference path="token.ts" />
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
            var output = document.getElementById("output");
            output.value = " Compiler Activated... \n ============= \n Lexer Start... \n =============";
            output.scrollTop = output.scrollHeight;
            var tokenBank = lexer.start();
            var token;
        };
        return Control;
    }());
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
