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
    public level: string;
    public output: string;

    constructor(value) {
      this.root = new TreeNode(value, null);
      this.output = "<" + value + ">";
      this.current = this.root;
      this.level = "";
    }
    
    public addBranchNode(value): void{
      let node:TreeNode = new TreeNode(value, this.current);
      this.current.childrenNode.push(node);
      this.current = node;
      this.level += "-";
      value = this.level + "<" + value + ">";
      this.output += "\n" + value;
      console.log(node);
    }

    public addLeafNode(value): void{
      let node:TreeNode = new TreeNode(value, this.current);
      this.current.childrenNode.push(node);
      this.current = node;
      value = this.level + "-[" + value + "]";
      this.output += "\n" + value;
    }

    public moveUp(): void{
      this.current = this.current.parentNode;
      this.level = this.level.substr(0,(this.level.length-1));
    }

    public printTree(): void{
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById("csTree");
      output.value += this.output + "\n\n";
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