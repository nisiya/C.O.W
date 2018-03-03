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
      csTreeOut.value = "";
      log.value = " Compiler Activated... \n ============= ";
      let input = editor.getValue();
      let prgNum = 1;
      let whitespace:RegExp = /^\s*$/;
      let eop:RegExp = /\$/;
      // check if input is not null or just whitespace first
      if(whitespace.test(input)){
        log.value += "\n   COMPILER --> ERROR! Missing input or only contains whitespaces";
        return;
      }
      while(!whitespace.test(input)){
          log.value += "\n\n ============= \n   COMPILER --> START OF PROGRAM "+ prgNum +" \n ============= ";
          let index = input.search(eop) == -1 ? input.length : input.search(eop);
          let userPrg = input.slice(0, index+1);
          input = input.slice(index+1, input.length);
          let lexer: Compiler.Lexer = new Lexer();
          let parser: Compiler.Parser = new Parser();
          log.value += "\n Lexer Start... \n ============= \n   LEXER --> Lexing Program " + prgNum + "...";
          log.scrollTop = log.scrollHeight;
          let tokenBank: Token[] = lexer.start(userPrg);
          if(tokenBank != null){
            log.value += "\n Parser Start... \n ============= \n   PARSER --> Parsing Program " + prgNum + "...";
            log.scrollTop = log.scrollHeight;
            let csTree: Tree = parser.start(tokenBank);
            console.log(csTree);
          }
          prgNum++;
      }
    }

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

    public static flush(btn): void {
      editor.setValue("");
      var audio = new Audio('distrib/audio/meow.mp3');
      audio.play();
    }

    public static changeInput(btn): void{
      switch(btn.id){
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
    }

  }

}