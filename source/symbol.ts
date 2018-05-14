/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */

module Compiler {

  export class Symbol {
    public key:string;
    public type:string;
    public scope:number;
    public token:Token;
    public accessed:number;

    constructor(key:string, 
                type:string,
                token:Token){
      this.key = key;
      this.type = type;
      this.scope = -1;
      this.token = token;
      this.accessed = 0;
                  
    }
  }
}