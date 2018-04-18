/* ------------
ScopeTree.ts

ScopeTree - ScopeTree created by Semantic Analyzer
ScopeNode - Has a scope level number, map of symbols in current scope, Parent Scope, and array of Children Scopes
------------ */

module Compiler {
    
  export class StaticEntry {
    public temp: string;
    public var: string;
    public address: string;

    constructor(tempNum:string, varName:string, addr:string ) {
      this.temp = tempNum;
      this.var = varName;
      this.address = addr;
    }

  }

}