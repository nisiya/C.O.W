/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */

module Compiler {

  export class Symbol {
    public key: string;
    public type: string;
    public line: number;

    constructor(key:string, 
                type:string,
                line:number){
      this.key = key;
      this.type = type;
      this.line = line;
    }
  }
}