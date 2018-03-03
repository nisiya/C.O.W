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
            var log = document.getElementById("log");
            var csTreeOut = document.getElementById("csTree");
            csTreeOut.value = "";
            log.value = " Compiler Activated... \n ============= ";
            var input = editor.getValue();
            var prgNum = 1;
            var whitespace = /^\s*$/;
            var eop = /\$/;
            // check if input is not null or just whitespace first
            if (whitespace.test(input)) {
                log.value += "\n   COMPILER --> ERROR! Missing input or only contains whitespaces";
                return;
            }
            while (!whitespace.test(input)) {
                log.value += "\n\n ============= \n   COMPILER --> START OF PROGRAM " + prgNum + " \n ============= ";
                var index = input.search(eop) == -1 ? input.length : input.search(eop);
                var userPrg = input.slice(0, index + 1);
                input = input.slice(index + 1, input.length);
                var lexer = new Compiler.Lexer();
                var parser = new Compiler.Parser();
                log.value += "\n Lexer Start... \n ============= \n   LEXER --> Lexing Program " + prgNum + "...";
                log.scrollTop = log.scrollHeight;
                var tokenBank = lexer.start(userPrg);
                if (tokenBank != null) {
                    log.value += "\n Parser Start... \n ============= \n   PARSER --> Parsing Program " + prgNum + "...";
                    log.scrollTop = log.scrollHeight;
                    var csTree = parser.start(tokenBank);
                    console.log(csTree);
                }
                prgNum++;
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
