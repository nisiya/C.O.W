/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token
------------ */

module Compiler {
  
  export enum TokenKind {
    OPEN_BRACKET = "OpenBracket",
    CLOSE_BRACKET = "CloseBraket",
    EOP = "EOP",
    OPEN_PAREN = "OpenParen",
    CLOSE_PAREN = "CloseParen",
    PRINT = "Print",
    

  }

  export class Token {
    public tid:string;
    public tValue:string;
    public tType:string;
    public tLine:number;
    public tColumn:number;

    constructor(tid:string, 
                tValue:string,
                tType:string, 
                tLine:number, 
                tColumn:number) {
      this.tid = tid;
      this.tValue = tValue;
      this.tType = tType;
      this.tLine = tLine;
      this.tColumn = tColumn;
    }

    public setType(tType:string){
      this.tType = tType;
    }

    public isEqual(tid: string): boolean{
      return this.tid == tid;
    }

    public toString(): string{
      return this.tid + " [ " + this.tValue + " ] on line " + this.tLine + ", column " + this.tColumn;
    }
  }
}