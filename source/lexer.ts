///<reference path="globals.ts" />

/* ------------
Lexer.ts

Requires global.ts.
------------ */

module Compiler {

  export class Lexer {
    public currentLine;
    public currentColumn;

    public init(): void {
      this.currentLine = 0;
      this.currentColumn = 0;
    }
    public static getInput(btn): void {
      // var userPrg = editor.getValue();
      let input = <HTMLInputElement> document.getElementById("input"); 
      /* method 1
      let userPrg = new Array<string>();
      userPrg = input.value.split('');
      let userPrgClean:string[] = this.removeComments(userPrg);
      */
      let userPrg:string = input.value;
      let userPrgClean:string = this.removeComments(userPrg);
    }

    /* Removes comments in code by replacing them with whitespace
    *  for new line to maintain the format of the code for
    *  other parts.
    */
    public static removeComments(userPrg): string {
      // locate the comment
      let commentStart:RegExp = /(\/\*)/;
      let commentEnd:RegExp = /(\*\/)/;
      let start:number = userPrg.search(commentStart);
      let end:number = userPrg.search(commentEnd);

      // need to remove all comments
      while (start != -1 && end != -1){
        // leave other areas
        let beforeComment = userPrg.slice(0,start);
        let afterComment = userPrg.slice(end+2, userPrg.length);
        // cannot change character in string so use an array
        let fillComment = new Array<string>();
        fillComment = userPrg.slice(start, end+1).split('');
        for(var i=0; i<fillComment.length; i++){
          // need to keep line feeds for line numbering
          if(fillComment[i] != '\n'){
            fillComment[i] = '  ';
          }
        }
        // put the code back together
        userPrg = beforeComment + fillComment.join('') + afterComment;
        start = userPrg.search(commentStart);
        end = userPrg.search(commentEnd);
      }
      var output = <HTMLInputElement> document.getElementById("test"); 
      output.value = userPrg.toString();
      return userPrg;
    }
  }
}