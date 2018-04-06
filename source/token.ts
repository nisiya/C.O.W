/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token
------------ */

module Compiler {
    
  export class Token {
    public tid: string;
    public tValue: string;
    public tLine: number;
    public tColumn: number;

    constructor(tid:string, 
                tValue:string, 
                tLine:number, 
                tColumn:number) {
      this.tid = tid;
      this.tValue = tValue;
      this.tLine = tLine;
      this.tColumn = tColumn;
    }

    public isEqual(tid: string): boolean{
      return this.tid == tid;
    }

    public toString(): string{
      return this.tid + " [ " + this.tValue + " ] on line " + this.tLine + ", column " + this.tColumn;
    }
  }
}