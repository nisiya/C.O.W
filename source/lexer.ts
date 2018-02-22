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
      // RegExp
      let alphaNumeric:RegExp = /[a-z0-9]/;
      let charKey = /[a-z]/;
      let singleSymbol:RegExp = /\(|\)|\{|\}|\$|\+/;
      let notSymbol:RegExp = /\!/;
      let equal:RegExp = /\=/;
      let quote:RegExp = /\"/;
      let isOpenQuote:boolean = false;
      let newLine:RegExp = /\n|\r/;
      let space:RegExp = /[ ]/;
      let whitespace:RegExp = /^\s*$/;
      let eop:RegExp = /\$/;
      let commentSlash:RegExp = /\//;
      let commentStar:RegExp = /\*/;

      this.currentLine = 1;
      this.currentColumn = 0;
      this.tokenBank = new Array<Token>();

      let userPrg:string = editor.getValue();
      // check if input is not null or just whitespace first
      if(whitespace.test(userPrg)){
        let output: HTMLInputElement = <HTMLInputElement> document.getElementById("output");
        output.value += "\n   LEXER --> ABORTED! Missing input or only contains whitespaces"
                     + "\n ============= \n Lexer Failed... 0 Warning(s) ... 1 Error(s)";
        return this.tokenBank; 
      }
      // let userPrg:string = this.removeComments(userPrg);
      let firstPointer:number = 0;
      let secondPointer:number = 0;
      let buffer:string;
      let currentChar:string;
      let token:Token;
    
      while(secondPointer <= userPrg.length){
        currentChar = userPrg.charAt(secondPointer);
        buffer = userPrg.slice(firstPointer, secondPointer);

        if(!alphaNumeric.test(currentChar)){
          if(buffer.length > 0){
            /* wild non-alphanumeric appeared! 
            * *------------------------------*
            * |    > LEX          CHEESE     |
            * |      PARSER       RUN AWAY   |
            * *------------------------------*
            */
            //        
            let hasError = this.evaluateBuffer(buffer);
            if(hasError){
              // stop lexing and return error with current tokens
              this.displayTokens();
              return this.tokenBank;
            } // else continue
          }
          if(currentChar == ''){
            // end of input
            break;
          } else if(eop.test(currentChar)){
            this.createToken("T_EOP", "$");
          } else if(space.test(currentChar)){
            // lexer ignores whitespace
          } else if(newLine.test(currentChar)){
            // lexer ignores whitespace
            // need to increment line and reset column indices
            this.currentLine++;
            this.currentColumn = -1;
          } else if(quote.test(currentChar)){
            this.createToken("T_OpenQuote", '\"');
            isOpenQuote = true;
            secondPointer++;
            this.currentColumn++;
            currentChar = userPrg.charAt(secondPointer);

            /* if a quote appears, everything after that is valid is added as T_Char
            *   until the close quote
            * valid = lowercase letters and spaces
            * invalid characters after open quotes will stop lexer and report error
            *   along with current tokens
            */
            while(isOpenQuote){
              if(quote.test(currentChar)){
                this.createToken("T_CloseQuote", '\"');
                isOpenQuote = false;
              } else if(charKey.test(currentChar)){
                this.createToken("T_Char", currentChar);
                secondPointer++;
                this.currentColumn++;
                currentChar = userPrg.charAt(secondPointer);           
              } else if(space.test(currentChar)){
                this.createToken("T_Space", currentChar);
                secondPointer++;
                this.currentColumn++;
                currentChar = userPrg.charAt(secondPointer);
              } else {
                // error token created
                this.createToken("T_Invalid", currentChar);
                this.displayTokens();
                return this.tokenBank;
              }
            }
          } else if(commentSlash.test(currentChar)){
            if(commentStar.test(userPrg.charAt(secondPointer+1))){
              // comments are not allowed in quotes so its evaluated after
              // start of a comment
              userPrg = this.removeComments(userPrg);
              secondPointer++;
              this.currentColumn++;
            } else{
              // error token created
              this.createToken("T_Invalid", currentChar);
              this.displayTokens();
              return this.tokenBank;
            }
          }else if(singleSymbol.test(currentChar)){
            // for symbols that are one character only
            this.createSymbolToken(currentChar);
          } else if(equal.test(currentChar)){
            // special case of == or =
            if(equal.test(userPrg.charAt(secondPointer+1))){
              // boolop ==
              this.createToken("T_Equals", "==");
              // since we look at next char..
              this.currentColumn++;
              secondPointer++;
            } else{
              // assignment ==
              this.createToken("T_Assignment", "=");
            }
          } else if(notSymbol.test(currentChar)){
            // special case of != or !, which is invalid
            if(equal.test(userPrg.charAt(secondPointer+1))){
              this.createToken("T_NotEqual", "!=");
              // again since we looked at next char..
              this.currentColumn++;
              secondPointer++;
            } else{
              // ! is invalid, stop lexer and return error with current tokens
              this.createToken("T_Invalid", currentChar);
              this.displayTokens();
              return this.tokenBank;
            }
          } else {
            // character is not in grammar, stop lexer and report error with current tokens
            this.createToken("T_Invalid", currentChar);
            this.displayTokens();
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
    public removeComments(userPrg:string): string {
      // locate the start and end of comment
      let commentStart:RegExp = /(\/\*)/;
      let commentEnd:RegExp = /(\*\/)/;
      let start:number = userPrg.search(commentStart);
      let end:number = userPrg.search(commentEnd);

      // divide the input into before comment and after comment
      // in order to replace the comment area with whitespace
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
      this.createToken(tid, symbol);
    }

    // Creates a token for given character and id
    public createToken(tid, tValue): void{
      let token:Token = new Token(tid, tValue, this.currentLine, this.currentColumn);
      this.tokenBank.push(token);
    }

    // finds longest match tokens and errors in a buffer
    public evaluateBuffer(buffer:string): boolean{
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

      while(buffer.length > 0){
        // test for longest match first
        if(booleanKey.test(buffer)){
          tid = "T_VarType";
          tval = "boolean";
        } else if(printKey.test(buffer)){
          tid = "T_Print";
          tval = "print";
        } else if(whileKey.test(buffer)){
          tid = "T_While";
          tval = "while";
        } else if(stringKey.test(buffer)){
          tid = "T_VarType";
          tval = "string";
        } else if(falseKey.test(buffer)){
          tid = "T_BoolVal";
          tval = "false";
        } else if(trueKey.test(buffer)){
          tid = "T_BoolVal";
          tval = "true";
        } else if(intKey.test(buffer)){
          tid = "T_VarType";
          tval = "int";
        } else if(ifKey.test(buffer)){
          tid = "T_If";
          tval = "if";
        } else if(digit.test(buffer)){
          tid = "T_Digit";
          tval = buffer.charAt(0);
        } else if(idKey.test(buffer)){
          tid = "T_Id";
          tval = buffer.charAt(0);
        }
        // cannot use create token here because column is not this.currentColumn
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
      
      // print all tokens
      if(_VerboseMode){
        while(index < this.tokenBank.length-1){
          output.value += "\n   LEXER --> " + token.toString();
          if(token.isEqual("T_EOP")){
            output.value += "\n ============= \n   LEXER --> START OF NEW PROGRAM \n ============= ";
          }
          index++; 
          token = this.tokenBank[index];
        }
      } else {
        index = this.tokenBank.length-1;
        token = this.tokenBank[index];
      }
      // reached the last token
      if(token.isEqual("T_Invalid")){
        output.value += "\n   LEXER --> ERROR! Invalid token"
                      + " [ " + token.tValue + " ] on line " + token.tLine
                      + ", column " + token.tColumn;
        lexError++;
      } else {
        if(_VerboseMode){
          output.value += "\n   LEXER --> " + token.toString();
        }
        if(!token.isEqual("T_EOP")){
          output.value += "\n   LEXER --> WARNING! No End Of Program [$] found."
                      + "\n Inserted at line " + token.tLine + ", column " + (token.tColumn+1);
          let eopToken: Token = new Token("T_EOP", "$", token.tLine, token.tColumn+1);
          this.tokenBank.push(eopToken);
          console.log(this.tokenBank);
          lexWarning++;
        }
      }
      if(lexError == 0){
        output.value += "\n ============= \n Lexer Completed... " + lexWarning + " Warning(s) ... " + lexError + " Error(s)";
        output.value += "\n Token bank loaded... \n =============";
      } else {
        output.value += "\n ============= \n Lexer Failed... " + lexWarning + " Warning(s) ... " + lexError + " Error(s)";
      }
      output.scrollTop = output.scrollHeight;
    }
  }
}