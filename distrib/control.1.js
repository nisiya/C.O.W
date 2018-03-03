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
            var log = document.getElementById("log");
            log.value = " Compiler Activated... \n ============= \n Lexer Start... \n =============";
            log.scrollTop = log.scrollHeight;
            var tokenBank = lexer.start();
            if (tokenBank != null) {
                log.value += "\n Parser Start... \n =============";
                log.scrollTop = log.scrollHeight;
                var csTree = parser.start(tokenBank);
                console.log(csTree);
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
        Control.changeInput = function (btn) {
            switch (btn.id) {
                case "fugly":
                    editor.setValue("{intaintbintxa=1b=2x=aprint(x)}$");
                    break;
                case "simple":
                    editor.setValue("{}$");
                    break;
                case "warningLex":
                    editor.setValue("{intaintbintxa=1b=2x=a+bprint(x)}");
                    break;
                case "lexSymbol":
                    editor.setValue("@int a\nint b}$");
                    break;
                case "lexString":
                    editor.setValue("{\n  \"i am\n  the cheese\"\n}$");
                    break;
                case "parsePrint":
                    editor.setValue("{\n  int a\n  a = 0\n  print(a+1)\n}$");
                default:
                    editor.setValue("clearing");
                    break;
            }
        };
        return Control;
    }());
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
