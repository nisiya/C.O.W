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

    public start(): Token[] {
      this.currentLine = 1;
      this.currentColumn = 0;
      this.tokenBank = new Array<Token>();

      let userPrg:string = editor.getValue();
      let userPrgClean:string = this.removeComments(userPrg);
      let firstPointer:number = 0;
      let secondPointer:number = 0;
      let buffer:string;
      let currentChar:string;
      let token:Token;

      // RegExp
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
    
      while (secondPointer <= userPrgClean.length){
        currentChar = userPrgClean.charAt(secondPointer);
        buffer = userPrgClean.slice(firstPointer, secondPointer);

        if (!alphaNumeric.test(currentChar)){
          if (buffer.length > 0){
            /* wild non-alphanumeric appeared! 
            * *------------------------------*
            * |    > LEX          CHEESE     |
            * |      PARSER       RUN AWAY   |
            * *------------------------------*
            */
            //        
            let hasError = this.evaluateBuffer(buffer);
            if (hasError){
              // stop lexing and return error with current tokens
              return this.tokenBank;
            } // else continue
          }

          if (currentChar == ''){
            // end of input
            break;
          }          
          else if (eop.test(currentChar)){
            token = new Token("T_EOP", "$", this.currentLine, this.currentColumn);
            this.tokenBank.push(token);
          } else if (space.test(currentChar)){
            // lexer ignores whitespace
          } else if (newLine.test(currentChar)){
            // lexer ignores whitespace
            // need to increment line and reset column indices
            this.currentLine++;
            this.currentColumn = -1;
          } else if (quote.test(currentChar)){
            this.createQuoteToken();
            isOpenQuote = true;
            secondPointer++;
            this.currentColumn++;
            currentChar = userPrgClean.charAt(secondPointer);

            /* if a quote appears, everything after that is valid is added as T_Char
            *   until the close quote
            * valid = lowercase letters and spaces
            * invalid characters after open quotes will stop lexer and report error
            *   along with current tokens
            */
            while (isOpenQuote){
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
                token = new Token("T_Invalid", currentChar, this.currentLine, this.currentColumn);
                this.tokenBank.push(token);
                return this.tokenBank;
              }
            }
          } else if (singleSymbol.test(currentChar)){
            // for symbols that are one character only
            this.createSymbolToken(currentChar);
          } else if (equal.test(currentChar)){
            // special case of == or =
            if (equal.test(userPrgClean.charAt(secondPointer+1))){
              // boolop ==
              token = new Token("T_Equals", "==", this.currentLine, this.currentColumn);
              this.tokenBank.push(token);
              // since we look at next char..
              this.currentColumn++;
              secondPointer++;
            } else{
              // assignment ==
              token = new Token("T_Assignment", "=", this.currentLine, this.currentColumn);
              this.tokenBank.push(token);
            }
          } else if (notSymbol.test(currentChar)){
            // special case of != or !, which is invalid
            if (equal.test(userPrgClean.charAt(secondPointer+1))){
              token = new Token("T_NotEqual", "!=", this.currentLine, this.currentColumn);
              this.tokenBank.push(token);
              // again since we looked at next char..
              this.currentColumn++;
              secondPointer++;
            } else{
              // ! is invalid, stop lexer and return error with current tokens
              token = new Token("T_Invalid", currentChar, this.currentLine, this.currentColumn);
              this.tokenBank.push(token);
              return this.tokenBank;
            }
          } else {
            // character is not in grammar, stop lexer and report error with current tokens
            token = new Token("T_Invalid", currentChar, this.currentLine, this.currentColumn);
            this.tokenBank.push(token);
            return this.tokenBank;
          }
          // move onto next char and reset first pointer
          secondPointer++;
          firstPointer = secondPointer;
        } else{
          // no non-alphanumerics encountered.. continue reading for longest match
          secondPointer++;
        }        
        // make sure to keep track of column index
        this.currentColumn++;
      }
      // end of lex because no more user input
      this.displayTokens();
      return this.tokenBank;
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
      return userPrg;
    }

    /* Creates tokens for following single character symbols:
    *  ['(', ')', '{', '}', '+']
    */
    public createSymbolToken(symbol): void{      
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
        default:
          // won't happen
          break;
      }
      let token = new Token(tid, symbol, this.currentLine, this.currentColumn);
      this.tokenBank.push(token);
    }

    // Creates a token for quote character
    public createQuoteToken(): void{
      let token:Token = new Token("T_Quote", '\"', this.currentLine, this.currentColumn);
      this.tokenBank.push(token);
    }

    // finds longest match tokens and errors in a buffer
    public evaluateBuffer(buffer): boolean{
      // RegExp matches order by length
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
      // current column index on symbol, not the buffer before it so..
      let tempColumn:number = this.currentColumn - buffer.length;

      while (buffer.length > 0){
        // test for longest match first
        if (booleanKey.test(buffer)){
          tid = "T_VarType";
          tval = "boolean";
        } else if (printKey.test(buffer)){
          tid = "T_Print";
          tval = "print";
        } else if (whileKey.test(buffer)){
          tid = "T_While";
          tval = "while";
        } else if (stringKey.test(buffer)){
          tid = "T_VarType";
          tval = "string";
        } else if (falseKey.test(buffer)){
          tid = "T_Boolean";
          tval = "false";
        } else if (trueKey.test(buffer)){
          tid = "T_Boolean";
          tval = "true";
        } else if (intKey.test(buffer)){
          tid = "T_VarType";
          tval = "int";
        } else if (ifKey.test(buffer)){
          tid = "T_If";
          tval = "if";
        } else if (digit.test(buffer)){
          if (digit.test(buffer.charAt(1))){
            // only single digit allowed
            // report invalid token and stop lexing buffer
            let notDigit = buffer.search(/[^\d]/);
            token = new Token("T_Invalid", buffer.slice(0,notDigit), this.currentLine, tempColumn);
            this.tokenBank.push(token);
            return true;
          } else {
            tid = "T_Digit";
            tval = buffer.charAt(0);
          }
        } else if (idKey.test(buffer)){
          tid = "T_Id";
          tval = buffer.charAt(0);
        }
        token = new Token(tid, tval, this.currentLine, tempColumn);
        this.tokenBank.push(token);
        tempColumn += tval.length;
        buffer = buffer.substring(tval.length);
      }
      // means no erro occurred
      return false;
    }

    public displayTokens(): void{
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById("output");
      let lexError: number = 0;
      let lexWarning: number = 0;
      let index: number = 0;
      let token = this.tokenBank[index];

      while (index < this.tokenBank.length - 1 && _VerboseMode){
        output.value += "\n   LEXER --> " + token.tid
                      + " [ " + token.tValue + " ] on line " + token.tLine
                      + ", column " + token.tColumn;
        index++; 
        token = this.tokenBank[index];
      }
      if (token.tid == "T_Invalid"){
        output.value += "\n   LEXER --> ERROR! Invalid token"
                      + " [ " + token.tValue + " ] on line " + token.tLine
                      + ", column " + token.tColumn;
        lexError++;
      } else {
        if (_VerboseMode){
          output.value += "\n   LEXER --> " + token.tid
                        + " [ " + token.tValue + " ] on line " + token.tLine
                        + ", column " + token.tColumn;
        }
        if(token.tid != "T_EOP"){
          output.value += "\n   LEXER --> WARNING! No End Of Program [$] found."
                      + "\n Inserted at line " + token.tLine + ", column " + (token.tColumn+1);
          let eopToken: Token = new Token("T_EOP", "$", token.tLine, token.tColumn+1);
          this.tokenBank.push(eopToken);
          console.log(this.tokenBank);
          lexWarning++;
        }
      }
      output.value += "\n ============= \n Lexer Completed... " + lexWarning + " Warning(s) ... " + lexError + " Error(s)";
      output.value += "\n Token bank loaded... \n =============";
      output.scrollTop = output.scrollHeight;
    }
  }
}