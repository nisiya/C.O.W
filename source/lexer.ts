///<reference path="globals.ts" />
///<reference path="token.ts" />

/* ------------
Lexer.ts

Requires global.ts.
------------ */

module Compiler {

  export class Lexer {
    public currentLine: number;
    public currentColumn: number;
    public tokenBank: Token[];

    public start(): void {
      this.currentLine = 1;
      this.currentColumn = 0;
      this.tokenBank = new Array<Token>();
      this.performLex();
    }

    public performLex(): void {
      let userPrg:string = editor.getValue();
      let userPrgClean:string = this.removeComments(userPrg);
      let firstPointer:number = 0;
      let secondPointer:number = 0;
      let buffer:string = '';
      let currentChar:string;
      let alphaNumeric:RegExp = /[a-z0-9]/;
      let charKey = /[a-z" "]/;
      let singleSymbol:RegExp = /\(|\)|\{|\}|\$|\+/;
      let notSymbol:RegExp = /\!/;
      let equal:RegExp = /\=/;
      let quote:RegExp = /\"/;
      let isOpenQuote:boolean = false;
      let newLine:RegExp = /\n/;
      let space:RegExp = /[ ]/;
      let eop:RegExp = /\$/;
      let token:Token;
      let counter:number = 0;

      while (secondPointer <= userPrgClean.length){
        counter++;
        currentChar = userPrgClean.charAt(secondPointer);
        console.log("value " + userPrgClean.charCodeAt(secondPointer));
        buffer = userPrgClean.slice(firstPointer, secondPointer);
        console.log("buf " + buffer);

        if (!alphaNumeric.test(currentChar)){
          if (buffer.length > 0){
            this.evaluateSegment(buffer);
          }
          console.log("is quote: " + quote.test(currentChar));
          if (eop.test(currentChar)){
            token = new Token("T_EOP", "$", this.currentLine, this.currentColumn);
            this.tokenBank.push(token); 
            console.log(this.tokenBank);
            console.log("finish");
            break;
          } else if (space.test(currentChar)){
            // do nothing
            console.log("space HERE");

          } else if (newLine.test(currentChar)){
            console.log("new line");
            this.currentLine++;
            this.currentColumn = -1;
          } else if (quote.test(currentChar)){
            this.createQuoteToken();
            isOpenQuote = true;
            secondPointer++;
            this.currentColumn++;
            currentChar = userPrgClean.charAt(secondPointer);
            while (isOpenQuote){
              console.log("yes open");
              if(quote.test(currentChar)){
                this.createQuoteToken();
                isOpenQuote = false;
              } else if(charKey.test(currentChar)){
                token = new Token("T_Char", currentChar, this.currentLine, this.currentColumn);
                this.tokenBank.push(token);
                secondPointer++;
                this.currentColumn++;
                currentChar = userPrgClean.charAt(secondPointer);           
              } else {
                alert("error");
              }
            }

            // let tempSegment:string = userPrgClean.substring(secondPointer+1);
            // let closeQuote:number = tempSegment.search(quote);
            // if (closeQuote == -1){
            //   this.createQuoteToken();
            // } else {
            //   closeQuote = secondPointer+closeQuote+1; // change to original
            //   let quoteContent = userPrgClean.slice(secondPointer+1, closeQuote);
            //   if (!charList.test(quoteContent)){
            //     console.log('invalid token: ' + userPrgClean.slice(secondPointer, closeQuote+1));
            //     break;
            //   } else {
            //     this.createQuoteToken();
            //     secondPointer++;
            //     this.currentColumn++;
            //     while (secondPointer < closeQuote){
            //       token = new Token("T_Char",
            //                         userPrgClean.charAt(secondPointer),
            //                         this.currentLine,
            //                         this.currentColumn);
            //       this.tokenBank.push(token);
            //       secondPointer++;
            //       this.currentColumn++;
            //     }
            //     this.createQuoteToken();
            //   }
            // }
          } else if (singleSymbol.test(currentChar)){
            this.createSymbolToken(currentChar);
          } else if (equal.test(currentChar)){
            if (equal.test(userPrgClean.charAt(secondPointer+1))){
              console.log("equal token");
              token = new Token("T_Equals", 
                                currentChar + userPrgClean.charAt(secondPointer+1),
                                this.currentLine, 
                                this.currentColumn);
              this.tokenBank.push(token);
              this.currentColumn++;
              secondPointer++;
            } else{
              console.log("assignment token");
              token = new Token("T_Assignment", 
                                currentChar, 
                                this.currentLine, 
                                this.currentColumn);
              this.tokenBank.push(token);
            }
          } else if (notSymbol.test(currentChar)){
            console.log("not token");
            if (equal.test(userPrgClean.charAt(secondPointer+1))){
              token = new Token("T_NotEqual", 
                                currentChar + userPrgClean.charAt(secondPointer+1), 
                                this.currentLine, 
                                this.currentColumn);
              this.tokenBank.push(token);
              this.currentColumn++;
              secondPointer++;
            } else{
              console.log("not what");
              break;
            }
          } else {
            // error
            break;
          }
          secondPointer++;
          firstPointer = secondPointer;
        } else{
          secondPointer++;
        }
        // else if alphanumeric, continue looking at the next charactor
        
        console.log(this.tokenBank);
        this.currentColumn++;
        console.log("counter" + counter);
      }


      // stop lexing
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
      console.log("userlength before: " + userPrg.length);
      // need to remove all comments
      while (start != -1 && end != -1){
        // leave other areas
        let beforeComment = userPrg.slice(0,start);
        let afterComment = userPrg.slice(end+2, userPrg.length);
        // cannot change character in string so use an array
        let fillComment = new Array<string>();
        console.log("======comment: "+ userPrg.slice(start, end+2) + "===========");
        fillComment = userPrg.slice(start, end+2).split('');
        for(var i=0; i<fillComment.length; i++){
          // need to keep line feeds for line numbering
          if(fillComment[i] != '\n'){
            fillComment[i] = ' ';
          }
        }
        // put the code back together
        userPrg = beforeComment + fillComment.join('') + afterComment;
        start = userPrg.search(commentStart);
        end = userPrg.search(commentEnd);
      }
      // var output = <HTMLInputElement> document.getElementById("test"); 
      // output.value = userPrg.toString();
      console.log("userlength after: " + userPrg.length);
      return userPrg;
    }

    public createSymbolToken(symbol): void{
      console.log("single symbol: " + symbol);
      
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
        case 43: // +
          tid = "T_Addition";
          break;
        case 36: // $
          tid = "T_EOP";
          break;
        default:
          // won't happen
          break;
      }

      let token = new Token(tid, symbol, this.currentLine, this.currentColumn);
      this.tokenBank.push(token);
    }

    public createQuoteToken(): void{
      let token:Token = new Token("T_Quote", '\"', this.currentLine, this.currentColumn);
      this.tokenBank.push(token);
    }

    public evaluateSegment(segment): void{
      console.log("yes: " +segment);
      let booleanKey:RegExp = /^boolean/;
      let printKey:RegExp = /^print/;
      let whileKey:RegExp = /^while/;
      let stringKey:RegExp = /^string/;
      let falseKey:RegExp = /^false/;
      let trueKey:RegExp = /^true/;
      let intKey:RegExp = /^int/;
      let ifKey:RegExp = /^if/;
      let digit:RegExp = /^\d/;
      let idKey:RegExp = /^[a-z]/;
      let token:Token;
      let tid: string;
      let tval:string;
      let tempColumn:number = this.currentColumn - segment.length;

      while (segment.length > 0){
        if (booleanKey.test(segment)){
          tid = "T_VarType";
          tval = "boolean";
        } else if (printKey.test(segment)){
          tid = "T_Print";
          tval = "print";
        } else if (whileKey.test(segment)){
          console.log("hel");
          tid = "T_While";
          tval = "while";
        } else if (stringKey.test(segment)){
          tid = "T_VarType";
          tval = "string";
        } else if (falseKey.test(segment)){
          tid = "T_Boolean";
          tval = "false";
        } else if (trueKey.test(segment)){
          tid = "T_Boolean";
          tval = "true";
        } else if (intKey.test(segment)){
          tid = "T_VarType";
          tval = "int";
        } else if (ifKey.test(segment)){
          tid = "T_If";
          tval = "if";
        } else if (digit.test(segment)){
          tid = "T_Digit"
          tval = segment.charAt(0);
        } else if (idKey.test(segment)){
          tid = "T_Id";
          tval = segment.charAt(0);
        } 
        token = new Token(tid, tval, this.currentLine, tempColumn);
        console.log(token);
        this.tokenBank.push(token);
        console.log(this.tokenBank);
        tempColumn += tval.length;
        segment = segment.substring(tval.length);
        console.log("length" + segment.length);  
      }
    }
  }
}