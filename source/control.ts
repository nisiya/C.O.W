///<reference path="globals.ts" />
///<reference path="token.ts" />

/* ------------
Control.ts

Requires global.ts.
------------ */

module Compiler {
  
  export class Control {

    public static startCompile(btn): void {
      let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
      let csTreeOut: HTMLInputElement = <HTMLInputElement> document.getElementById("csTree");
      let symbolTableBody: HTMLTableSectionElement = <HTMLTableSectionElement> document.getElementById("symbolTableBody");
      let lexer: Compiler.Lexer = new Lexer();
      let parser: Compiler.Parser = new Parser();

      // reset outputs
      csTreeOut.value = "";
      while(symbolTableBody.hasChildNodes()){
        symbolTableBody.removeChild(symbolTableBody.firstChild);
      }
      log.value = " Compiler Activated... \n ============= ";
      
      let input:string = editor.getValue();
      let prgNum:number = 1;
      let whitespace:RegExp = /^\s*$/;
      // check if input is not null or just whitespace first
      if(whitespace.test(input)){
        log.value += "\n   COMPILER --> ERROR! Missing input or only contains whitespaces";
        return;
      }

      // input found
      // lexer lexes one program and returns the token bank and rest of user input
      // allows mulitiple programs to be lexed and parsed
      while(!whitespace.test(input)){
        log.value += "\n\n ============= \n   COMPILER --> START OF PROGRAM "+ prgNum +" \n ============= ";
        log.value += "\n Lexer start for Program " + prgNum + "... \n ============= \n   LEXER --> Lexing Program " + prgNum + "...";
        let lexerReturn = lexer.start(input);
        let tokenBank: Token[];
        [tokenBank, input] = lexerReturn;
        if(tokenBank.length != 0){
          // Lex passed
          log.value += "\n Parser start for Program " + prgNum + "... \n ============= \n   PARSER --> Parsing Program " + prgNum + "...";            
          let csTree: Tree;
          let symbolTable: Array<Symbol>;

          let parseReturn = parser.start(tokenBank);
          if(parseReturn){
            // Parse passed
            [csTree, symbolTable] = parseReturn;
            // print CST
            csTree.printTree();
            log.value += "\n Parse completed successfully";

            // update symbol table
            for(let i=0; i<symbolTable.length; i++){
              var row: HTMLTableRowElement = <HTMLTableRowElement> document.createElement("tr");
              var cell: HTMLTableCellElement = <HTMLTableCellElement> document.createElement("td");
              let symbol: Symbol = symbolTable[i];
              var cellText = document.createTextNode(symbol.key);
              cell.appendChild(cellText);
              row.appendChild(cell);
              cell = document.createElement("td");
              cellText = document.createTextNode(symbol.type);
              cell.appendChild(cellText);
              row.appendChild(cell);
              cell = document.createElement("td");
              cellText = document.createTextNode(""+symbol.line);
              cell.appendChild(cellText);
              row.appendChild(cell);
              symbolTableBody.appendChild(row);
            }
          } else{
            // Parse failed
            csTreeOut.value += "\nCST for Program " + prgNum + ": Skipped due to PARSER error(s) \n\n";
          }
        } else {
          // Lex failed
          if(whitespace.test(input)){
            "\n   LEXER --> ERROR! Invalid token"
          }
          log.value += "\n =============\n Parser skipped due to LEXER error(s) \n ============= ";
          csTreeOut.value += "\nCST for Program " + prgNum + ": Skipped due to LEXER error(s) \n\n";
        }
        prgNum++;
        console.log(input);
      }
    }

    // detailed log will be generated
    public static verboseMode(btn): void {
      _VerboseMode = !_VerboseMode;
      let verboseBtn: HTMLButtonElement = <HTMLButtonElement> document.getElementById("verboseBtn");
      if (_VerboseMode){
        verboseBtn.innerText = "Moo Mode: On";
        verboseBtn.style.backgroundColor = "#5c6bc0";
        verboseBtn.style.color = "#ffffff";
      } else{
        verboseBtn.innerText = "Moo Mode: Off";
        verboseBtn.style.backgroundColor = "#e8eaf6";
        verboseBtn.style.color = "#000000";
      }
    }

    // clear console
    public static flush(btn): void {
      let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
      let csTreeOut: HTMLInputElement = <HTMLInputElement> document.getElementById("csTree");
      let symbolTableBody: HTMLTableSectionElement = <HTMLTableSectionElement> document.getElementById("symbolTableBody");
      // reset outputs
      log.value = "";
      csTreeOut.value = "";
      while(symbolTableBody.hasChildNodes()){
        symbolTableBody.removeChild(symbolTableBody.firstChild);
      }
      let prettyTree = new Treant(null);
      editor.setValue("");
      var audio = new Audio('distrib/audio/meow.mp3');
      audio.play();
    }

    // change test case in console
    public static changeInput(btn): void{
      switch(btn.id){
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
        default:
          editor.setValue("clearing");
          break;
      }
    }

  }

}