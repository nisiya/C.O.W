/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */

module Compiler {

  export class Symbol {
    public key: string;
    public type: string;
    public scope: number;
    public line: number;
    public used: boolean;

    constructor(key:string, 
                type:string,
                line:number){
      this.key = key;
      this.type = type;
      this.scope = -1;
      this.line = line;
      this.used = false;
                  
    }
  }
}