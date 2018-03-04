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
            var symbolTableBody = document.getElementById("symbolTableBody");
            var lexer = new Compiler.Lexer();
            var parser = new Compiler.Parser();
            // reset outputs
            csTreeOut.value = "";
            while (symbolTableBody.hasChildNodes()) {
                symbolTableBody.removeChild(symbolTableBody.firstChild);
            }
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
            // input found
            while (!whitespace.test(input)) {
                log.value += "\n\n ============= \n   COMPILER --> START OF PROGRAM " + prgNum + " \n ============= ";
                // get one program from input to compile
                var index = input.search(eop) == -1 ? input.length : input.search(eop);
                var userPrg = input.slice(0, index + 1);
                input = input.slice(index + 1, input.length);
                log.value += "\n Lexer start for Program " + prgNum + "... \n ============= \n   LEXER --> Lexing Program " + prgNum + "...";
                var tokenBank = lexer.start(userPrg);
                if (tokenBank != null) {
                    // Lex passed
                    log.value += "\n Parser start for Program " + prgNum + "... \n ============= \n   PARSER --> Parsing Program " + prgNum + "...";
                    var csTree = void 0;
                    var symbolTable = void 0;
                    var parseReturn = parser.start(tokenBank);
                    if (parseReturn) {
                        // Parse passed
                        csTree = parseReturn[0], symbolTable = parseReturn[1];
                        // print CST
                        csTree.printTree();
                        // update symbol table
                        symbolTable.reverse();
                        for (var i = 0; i < symbolTable.length; i++) {
                            var row = document.createElement("tr");
                            var cell = document.createElement("td");
                            var symbol = symbolTable[i];
                            var cellText = document.createTextNode(symbol.key);
                            cell.appendChild(cellText);
                            row.appendChild(cell);
                            cell = document.createElement("td");
                            cellText = document.createTextNode(symbol.type);
                            cell.appendChild(cellText);
                            row.appendChild(cell);
                            symbolTableBody.appendChild(row);
                        }
                    }
                    else {
                        // Parse failed
                        csTreeOut.value += "\nCST for Program " + prgNum + ": Skipped due to PARSER error(s) \n";
                    }
                }
                else {
                    // Lex failed
                    log.value += "\n =============\n Parser skipped due to LEXER error(s) \n ============= ";
                    csTreeOut.value += "\nCST for Program " + prgNum + ": Skipped due to LEXER error(s) \n";
                }
                prgNum++;
            }
        };
        // detailed log will be generated
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
        // clear console
        Control.flush = function (btn) {
            editor.setValue("");
            var audio = new Audio('distrib/audio/meow.mp3');
            audio.play();
        };
        // change test case in console
        Control.changeInput = function (btn) {
            switch (btn.id) {
                case "fugly":
                    editor.setValue("{/*ValidOneLineCode*/intaintbintxa=1b=2x=aprint(x)}$");
                    break;
                case "simple":
                    editor.setValue("{/*Simpliest program is an empty block*/}$");
                    break;
                case "warningLex":
                    editor.setValue("{intaintbintxa=1b=2x=a+bprint(x) /*Gives missing EOP warning*/}");
                    break;
                case "lexSpaces":
                    editor.setValue("{/*Lexer ignores whitespace*/\n    while\n               (true){\n      print(\"this is true\")\n            }\n        inta=         0\n        print (a         )\n}$");
                    break;
                case "lexSymbol":
                    editor.setValue("{/*Invalid symbol error*/ @int a\nint b}$");
                    break;
                case "lexString":
                    editor.setValue("{/*Broken string error*/ \n  \"i am\n  the cheese\"\n}$");
                    break;
                case "lexUppercase":
                    editor.setValue("{/*Uppercase not allowed*/ int A\n  a = 1}$");
                    break;
                case "parseIntExpr":
                    editor.setValue("{\n  int a\n /*digit should be before id in Int Expr*/ a = a+1\n}$");
                    break;
                case "parseBoolop":
                    editor.setValue("{/*Boolop on its own should have no parenthesis */\n while(true){ \n print (a) \n}$");
                    break;
                case "parseMultiple":
                    editor.setValue("{}$	\n{{{{{{}}}}}}$	\n{{{{{{}}}	/*	comments	are	ignored	*/	}}}}$	\n{	/*	comments	are	still	ignored	*/	int	@}$");
                    break;
                default:
                    editor.setValue("clearing");
                    break;
            }
        };
        return Control;
    }());
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
