///<reference path="globals.ts" />
///<reference path="token.ts" />

/* ------------
Control.ts

Requires global.ts.
------------ */

module Compiler {
  
  export class Control {

    public static startCompile(btn): void {
      let lexer: Compiler.Lexer = new Lexer();
      let parser: Compiler.Parser = new Parser();
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById("output");
      output.value = " Compiler Activated... \n ============= \n Lexer Start... \n =============";
      output.scrollTop = output.scrollHeight;
      let tokenBank: Token[] = lexer.start();
      if(tokenBank != null){
        output.value += "\n Parser Start... \n =============";
        output.scrollTop = output.scrollHeight;
        let csTree: Tree = parser.start(tokenBank);
        console.log(csTree);
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

  }

}