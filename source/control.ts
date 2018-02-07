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
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById("output");
      output.value = " Compiler Activated... \n ============= \n Lexer Start... \n =============";
      output.scrollTop = output.scrollHeight;
      let tokenBank: Token[] = lexer.start();
      let token:Token;
    }

  }

}