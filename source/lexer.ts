///<reference path="globals.ts" />

/* ------------
Lexer.ts

Requires global.ts.
------------ */

module Compiler {

  export class Lexer {
    // public init(): void {
      // }
    public static getInput(btn): void {
      var userPrg = editor.getValue();
      var charCode = new Array<number>();
      // var commentRegEx = /\/\*a/;
      // var userPrgClean = commentRegEx.test(userPrg);
      // var output = <HTMLInputElement> document.getElementById("test"); 
      // output.value = userPrgClean.toString();
      // for (var i=0; i<userPrg.length; i++){
      //   charCode.push(userPrg.charCodeAt(i));
      // }
      this.removeComments(userPrg);
    }
    public static removeComments(userPrg): void {
      var commentRegEx = /\/\*(.*?(\r\n)*?)\*\//;
      var userPrgClean = userPrg.replace(commentRegEx, ' ');
      var output = <HTMLInputElement> document.getElementById("test"); 
      output.value = userPrgClean.toString();
    }
  }
}