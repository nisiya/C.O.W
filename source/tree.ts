/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token
------------ */

module Compiler {
    
  export class Tree {
    public root: TreeNode;
    public current: TreeNode;

    constructor() {
      this.root = null;
      this.current = null;
    }
    
    public addBranchNode(value): void{
      let node:TreeNode = new TreeNode(value, this.current);
      this.current.childrenNode.push(node);
      this.current = node;
    }
  }

  export class TreeNode {
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