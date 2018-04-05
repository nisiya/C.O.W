/* ------------
Symbol.ts

Symbol - Has a key (id) and type of a variable
------------ */

module Compiler {

  export class Symbol {
    public key: string;
    public type: string;
    public scope: number;
    public location: [number, number];
    public accessed: number;

    constructor(key:string, 
                type:string,
                location:[number, number]){
      this.key = key;
      this.type = type;
      this.scope = -1;
      this.location = location;
      this.accessed = 0;
                  
    }
  }
}