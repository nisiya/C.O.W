/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */

module Compiler {

  export class Symbol {
    public key: string;
    public type: string;

    constructor(key:string, 
                type:string){
      this.key = key;
      this.type = type;
    }
  }
}