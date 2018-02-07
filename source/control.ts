///<reference path="globals.ts" />

/* ------------
Control.ts

Requires global.ts.
------------ */

module Compiler {
  
  export class Control {

    public static startCompile(btn): void {
      let lexer: Compiler.Lexer = new Lexer();
      lexer.start();
    }

  }

}