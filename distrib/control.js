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
            var parser = new Compiler.Parser();
            var output = document.getElementById("output");
            output.value = " Compiler Activated... \n ============= \n Lexer Start... \n =============";
            output.scrollTop = output.scrollHeight;
            var tokenBank = lexer.start();
            if (tokenBank != null) {
                output.value = " Parser Start... \n =============";
                output.scrollTop = output.scrollHeight;
                parser.start();
            }
        };
        Control.verboseMode = function (btn) {
            _VerboseMode = !_VerboseMode;
            var verboseBtn = document.getElementById("verboseBtn");
            if (_VerboseMode) {
                verboseBtn.innerText = "Moo Mode: On";
                verboseBtn.style.backgroundColor = "#5c6bc0";
                verboseBtn.style.color = "#ffffff";
            }
            else {
                verboseBtn.innerText = "Moo Mode: Off";
                verboseBtn.style.backgroundColor = "#e8eaf6";
                verboseBtn.style.color = "#000000";
            }
        };
        Control.flush = function (btn) {
            editor.setValue("");
            var audio = new Audio('distrib/audio/meow.mp3');
            audio.play();
        };
        return Control;
    }());
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
