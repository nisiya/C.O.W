/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */

module Compiler {
    
  export class Tree {
    public root: TreeNode;
    public current: TreeNode;
    public outputTree: string;

    constructor(value, line) {
      this.root = new TreeNode(value, line, null);
      this.outputTree = "";
      this.current = this.root;
    }
    
    public addBranchNode(value, line): void{
      let node:TreeNode = new TreeNode(value, line, this.current);
      this.current.childrenNodes.push(node);
      this.current = node;
    }

    public addLeafNode(value, line): void{
      let node:TreeNode = new TreeNode(value, line, this.current);
      this.current.childrenNodes.push(node);
    }

    public moveUp(): void{
      this.current = this.current.parentNode;
    }

    public removeNode(): void{
      let parent:TreeNode = this.current.parentNode;
      parent.childrenNodes.pop();
    }

    public printTree(treeType:string): void{
      let treeId:string = "#visual-" + treeType;
      console.log("printing " + treeType);
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
      this.walkTree(this.root, "", jsonTree.nodeStructure.children);
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById(treeType);
      output.value += this.outputTree + "\n\n";
      // let visualTree = new Treant(jsonTree);
    }

    public walkTree(node: TreeNode, indent:String, jsonLevel:Object): void{
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

      // for the normal cst
      this.outputTree += indent + "<" + node.value + ">\n";
      let children = node.childrenNodes;

      // print tree in preorder
      if(children.length == 0){
        return;
      } else {
        for(let i=0; i<children.length; i++){
          this.walkTree(children[i], indent+"-", jsonLevel);
        }
        return;
      }
    }
  }

  export class TreeNode {
    public value: string;
    public line: number;
    public parentNode: TreeNode;
    public childrenNodes: Array<TreeNode>;

    constructor(value:string, 
                line:number,
                parentNode:TreeNode){
      this.value = value;
      this.line = line;
      this. parentNode = parentNode;
      this.childrenNodes = new Array<TreeNode>();
    }
  }

}