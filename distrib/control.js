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
            // let compileBtnLbl: HTMLDivElement = <HTMLDivElement> document.getElementById("compileBtnLbl");
            // compileBtnLbl.innerHTML = "";
            // compileBtnLbl.className = "spinner-1";
            console.time('someFunction1');
            var log = document.getElementById("log");
            var csTreeOut = document.getElementById("cst");
            var asTreeOut = document.getElementById("ast");
            var lexer = new Compiler.Lexer();
            var parser = new Compiler.Parser();
            var sAnalyzer = new Compiler.SAnalyzer();
            var codeGen = new Compiler.CodeGen();
            _GrandCST = new Compiler.Tree("All Programs", [0, 0]);
            _GrandAST = new Compiler.Tree("All Programs", [0, 0]);
            // reset outputs
            this.clearOutputs();
            log.value = " Compiler Activated... \n ============= ";
            var input = editor.getValue();
            var prgNum = 1;
            var whitespace = /^\s*$/;
            // check if input is not null or just whitespace first
            if (whitespace.test(input)) {
                log.value += "\n   COMPILER --> ERROR! Missing input or only contains whitespaces";
                return;
            }
            // input found
            // lexer lexes one program and returns the token bank and rest of user input
            // allows mulitiple programs to be lexed and parsed
            while (!whitespace.test(input)) {
                log.value += "\n\n ============= \n   COMPILER --> START OF PROGRAM " + prgNum + " \n ============= ";
                log.value += "\n Lexer start for Program " + prgNum + "... \n ============= \n   LEXER --> Lexing Program " + prgNum + "...";
                var lexerReturn = lexer.start(input);
                var tokenBank = void 0;
                tokenBank = lexerReturn[0], input = lexerReturn[1];
                if (tokenBank.length != 0) {
                    // Lex passed
                    log.value += "\n Parser start for Program " + prgNum + "... \n ============= \n   PARSER --> Parsing Program " + prgNum + "...";
                    var csTree = parser.start(tokenBank);
                    if (csTree != null) {
                        // Parse passed
                        // add to CST containing all programs
                        _GrandCST.addSubTree(csTree.root);
                        // print CST
                        csTree.printTree("cst");
                        // csTree.displayTree("cst");
                        log.value += "\n ============= \n Parse completed successfully \n =============";
                        log.value += "\n Semantic Analyzer start for Program " + prgNum
                            + "... \n ============= \n   SEMANTIC ANALYZER --> Analyzing Program " + prgNum + "...";
                        var asTree = void 0;
                        var symbolTable = void 0;
                        var warningSA = void 0;
                        // start semantic analyzer
                        var sAnalyzeReturn = sAnalyzer.start(csTree);
                        var scopeTree = void 0;
                        if (sAnalyzeReturn) {
                            // AST generation passed
                            asTree = sAnalyzeReturn[0], symbolTable = sAnalyzeReturn[1], scopeTree = sAnalyzeReturn[2], warningSA = sAnalyzeReturn[3];
                            _GrandAST.addSubTree(asTree.root);
                            asTree.printTree("ast");
                            // asTree.displayTree("ast");
                            if (symbolTable) {
                                // scope and type checking also passed
                                this.updateSymbolTable(symbolTable, prgNum);
                                log.value += "\n =============\n Semantic Anaylsis completed successfully with " + warningSA + " warnings \n =============";
                                log.value += "\n Code Generation start for Program " + prgNum
                                    + "... \n ============= \n   CODE GEN --> Generating machine code for Program " + prgNum + "...";
                                // start code generation
                                var code = codeGen.start(asTree, scopeTree);
                                if (code != null) {
                                    this.printCode(code);
                                }
                                else {
                                    log.value += "\n   CODEGEN --> ERROR! Program " + prgNum + " is too large for 256 bytes";
                                    log.value += "\n   CODEGEN --> Code generation failed with 1 error";
                                }
                            }
                            else {
                                // Semantic Analyzer Failed
                            }
                        }
                        else {
                            // AST generation failed
                            _GrandAST.addLeafNode("Prg " + prgNum + " Failed", [0, 0]);
                            asTreeOut.value += "\nAST for Program " + prgNum + ": Skipped due to SEMANTIC ANALYSIS error(s) \n\n";
                        }
                    }
                    else {
                        // Parse failed
                        _GrandCST.addLeafNode("Prg " + prgNum + " Failed", [0, 0]);
                        _GrandAST.addLeafNode("Prg " + prgNum + " Failed", [0, 0]);
                        csTreeOut.value += "\nCST for Program " + prgNum + ": Skipped due to PARSER error(s) \n\n";
                    }
                }
                else {
                    // Lex failed
                    _GrandCST.addLeafNode("Prg " + prgNum + " Failed", [0, 0]);
                    _GrandAST.addLeafNode("Prg " + prgNum + " Failed", [0, 0]);
                    if (whitespace.test(input)) {
                        "\n   LEXER --> ERROR! Invalid token";
                    }
                    log.value += "\n =============\n Parser skipped due to LEXER error(s) \n ============= ";
                    csTreeOut.value += "\nCST for Program " + prgNum + ": Skipped due to LEXER error(s) \n\n";
                }
                prgNum++;
                log.scrollTop = log.scrollHeight;
            }
            _GrandCST.displayTree("cst");
            _GrandAST.displayTree("ast");
            // compileBtnLbl.innerHTML = "Compile";
            // compileBtnLbl.className = "";
            console.timeEnd('someFunction1');
        };
        Control.printCode = function (code) {
            var machineCode = document.getElementById("machineCode");
            for (var i = 0; i < code.length; i++) {
                machineCode.value += code[i] + " ";
            }
        };
        // update symbol table output
        Control.updateSymbolTable = function (symbolTable, prgNum) {
            var symbolTableBody = document.getElementById("symbolTableBody");
            for (var i = 0; i < symbolTable.length; i++) {
                var row = document.createElement("tr");
                var cell = document.createElement("td");
                var symbol = symbolTable[i];
                // Program Number
                var cellText = document.createTextNode(prgNum);
                cell.appendChild(cellText);
                row.appendChild(cell);
                // Name
                cell = document.createElement("td");
                cellText = document.createTextNode(symbol.key);
                cell.appendChild(cellText);
                row.appendChild(cell);
                // Type
                cell = document.createElement("td");
                cellText = document.createTextNode(symbol.type);
                cell.appendChild(cellText);
                row.appendChild(cell);
                // Scope
                cell = document.createElement("td");
                cellText = document.createTextNode("" + symbol.scope);
                cell.appendChild(cellText);
                row.appendChild(cell);
                // Line
                cell = document.createElement("td");
                cellText = document.createTextNode("" + symbol.location[0]);
                cell.appendChild(cellText);
                row.appendChild(cell);
                // Column
                cell = document.createElement("td");
                cellText = document.createTextNode("" + symbol.location[1]);
                cell.appendChild(cellText);
                row.appendChild(cell);
                symbolTableBody.appendChild(row);
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
        // clear all input and outputs
        Control.flush = function (btn) {
            this.clearOutputs();
            editor.setValue("");
            var audio = new Audio('distrib/audio/meow.mp3');
            audio.play();
        };
        // clear outputs only
        Control.clearOutputs = function () {
            var log = document.getElementById("log");
            var csTreeOut = document.getElementById("cst");
            var asTreeOut = document.getElementById("ast");
            var symbolTableBody = document.getElementById("symbolTableBody");
            // reset outputs
            log.value = "";
            csTreeOut.value = "";
            asTreeOut.value = "";
            while (symbolTableBody.hasChildNodes()) {
                symbolTableBody.removeChild(symbolTableBody.firstChild);
            }
            // save pretty tree for later
            var emptyCST = {
                chart: {
                    container: "#visual-cst"
                },
                nodeStructure: {}
            };
            var emptyAST = {
                chart: {
                    container: "#visual-ast"
                },
                nodeStructure: {}
            };
            var visualCST = new Treant(emptyCST);
            var visualAST = new Treant(emptyAST);
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
                case "parseValid":
                    editor.setValue("{\n    while(b == true){\n    print(\"hello there\")\n    }\n    \n    if(b != false){\n     b = 2\n    }\n    }$");
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
                case "saNested":
                    editor.setValue("{ int a \n int b \n a = 0 \n b = 0 \n if(false != (true == (a == 2))) \n { print(a)}}$");
                    break;
                case "saScope":
                    editor.setValue("{int a a=0 {int b} b=0}$");
                    break;
                case "saType":
                    editor.setValue("{int a a=\"hello\"}$");
                    break;
                case "saRedeclare":
                    editor.setValue("{int a string a}$");
                    break;
                default:
                    editor.setValue("clearing");
                    break;
            }
        };
        // reload tree display
        Control.reloadTree = function (btn) {
            if (btn.id == "tab-cst") {
                var emptyCST = {
                    chart: {
                        container: "#visual-cst"
                    },
                    nodeStructure: {}
                };
                var visualCST = new Treant(emptyCST);
                _GrandCST.displayTree("cst");
            }
            else {
                var emptyAST = {
                    chart: {
                        container: "#visual-ast"
                    },
                    nodeStructure: {}
                };
                var visualCST = new Treant(emptyAST);
                _GrandAST.displayTree("ast");
            }
        };
        return Control;
    }());
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
