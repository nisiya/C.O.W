/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */

module Compiler {
    
  export class Tree {
    public root:TreeNode;
    public current:TreeNode;
    public outputTree:string;

    constructor(value:string, token:Token) {
      this.root = new TreeNode(value, token, null);
      this.outputTree = "";
      this.current = this.root;
    }
    
    public addBranchNode(value:string, token:Token): void{
      let node:TreeNode = new TreeNode(value, token, this.current);
      this.current.childrenNodes.push(node);
      this.current = node;
    }

    public addLeafNode(value:string, token:Token): void{
      let node:TreeNode = new TreeNode(value, token, this.current);
      this.current.childrenNodes.push(node);
    }

    public removeCurrentNode(): void{
      // only used for epsilon in statement and charlist
      let parentNode = this.current.parentNode;
      // would always be the first child
      parentNode.childrenNodes.pop();
      this.current = parentNode;
    }

    public addSubTree(node: TreeNode): void{
      this.current.childrenNodes.push(node);
    }
    
    public moveUp(): void{
      this.current = this.current.parentNode;
    }

    public displayTree(treeType:string): void{
      let treeId:string = "#visual-" + treeType;
      var jsonTree = {
        chart: {
            container: treeId
        },
        
        nodeStructure: {
          text: { name: this.root.value },
          children: [
          ]
        }
      };
      this.buildTree(this.root, jsonTree.nodeStructure.children);
      let visualTree = new Treant(jsonTree);
    }

    public buildTree(node: TreeNode, jsonLevel:Object): void{
      // for the pretty cst
      if(node != this.root){
        let jsonNode = {
          text: { name: node.value },
          children: [
          ]
        }
        jsonLevel.push(jsonNode);
        jsonLevel = jsonNode.children;
      }

      let children = node.childrenNodes;

      // print tree in preorder
      if(children.length == 0){
        return;
      } else {
        for(let i=0; i<children.length; i++){
          this.buildTree(children[i], jsonLevel);
        }
        return;
      }
    }

    public printTree(treeType:string): void{
      this.walkTree(this.root, "");
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById(treeType);
      output.value += this.outputTree + "\n\n";
    }

    public walkTree(node: TreeNode, indent:String): void{
      // for the normal cst
      this.outputTree += indent + "<" + node.value + ">\n";
      let children = node.childrenNodes;

      // print tree in preorder
      if(children.length == 0){
        return;
      } else {
        for(let i=0; i<children.length; i++){
          this.walkTree(children[i], indent+"-");
        }
        return;
      }
    }
  }

  export class TreeNode {
    public value: string;
    // public location: [number, number]; // line and column
    public token:Token;
    public parentNode:TreeNode;
    public childrenNodes:Array<TreeNode>;

    constructor(value:string, 
                token:Token,
                parentNode:TreeNode){
      this.value = value;
      // this.location = location;
      this.token = token;
      this.parentNode = parentNode;
      this.childrenNodes = new Array<TreeNode>();
    }
  }

}