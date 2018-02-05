///<reference path="globals.ts" />

/* ------------
Lexer.ts

Requires global.ts.
------------ */

module Compiler {

  export class Lexer {
    public currentLine: number;
    public currentColumn: number;
    public tokenBank = new Array<Token>();

    public init(): void {
      this.currentLine = 1;
      this.currentColumn = 0;
    }

    public performLex(btn): void {
      let userPrg:string = editor.getValue();
      let userPrgClean:string = this.removeComments(userPrg);
      let firstPointer:number = 0;
      let secondPointer:number = 0;
      let currentSegment:string = '';
      let currentChar:string;
      let alphaNumeric:RegExp = /[a-z0-9]/;
      let notSymbol:RegExp = /\!/;
      let equal:RegExp = /\=!/;

      while (secondPointer < userPrgClean.length){
        currentChar = userPrgClean.charAt(secondPointer);

        if (alphaNumeric.test(currentChar)){
          currentSegment = currentSegment + currentChar;
          this.currentColumn++;
          secondPointer++;
        } else{
          if (currentSegment.length > 1){
            this.evaluateSegment(currentSegment); 
          }
          if (equal.test(currentChar) || notSymbol.test(currentChar)){
            
          } else{
            this.createSymbolToken(currentChar);
          }
        }
      }
    }

    /* Removes comments in code by replacing them with whitespace
    *  for new line to maintain the format of the code for
    *  other parts.
    */
    public removeComments(userPrg): string {
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

    public createSymbolToken(symbol): void{
      // let openParen:RegExp = /\(/;
      // let closeParen:RegExp = /\)/;
      // let openBracket:RegExp = /\{/;
      // let closeBracket:RegExp = /\(/;
      // let plus:RegExp = /\+/;
      // let eop:RegExp = /\$/;
      // let quote:RegExp = /\"/;
      // let newLine:RegExp = /\n/;
      // let space:RegExp = /\s/;
      let tid:string;

      switch (symbol.charCodeAt(0)){
        case 40: // (
          tid = "T_OpenParen";
          break;
        case 41: // )
          tid = "T_CloseParen";
          break;
        case 123: // {
          tid = "T_OpenBracket";
          break;
        case 125: // }
          tid = "T_CloseBracket";
          break;
        case 34: // "
          tid = "T_Quote";
          break;
        case 43: // +
          tid = "T_Addition";
          break;
        case 36: // $
          tid = "T_EOP";
          break;
        default:
          alert("Should have been symbol");
          break;
      }

      let token = new Token(tid, symbol, this.currentLine, this.currentLine);
      this.tokenBank.push(token);
    }

    public evaluateSegment(symbol): void{

    }
  }
}