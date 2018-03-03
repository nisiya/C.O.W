/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token 
------------ */

module Compiler {
    
  export class SymbolTable {


  }

  export class Symbol {
    public value: string;
    public parentNode: TreeNode;
    public childrenNode: Array<TreeNode>;

    constructor(value:string, 
                parentNode:TreeNode){
      this.value = value;
      this. parentNode = parentNode;
      this.childrenNode = new Array<TreeNode>();
    }
  }
}