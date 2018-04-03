///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
///<reference path="token.ts" />

/* ------------
SAnalyzer.ts

Requires global.ts, tree.ts, symbol.ts, and token.ts
------------ */

module Compiler {
    
  export class SAnalyzer {
    public asTree: Tree;
    public symbolTable: Symbol[];
    public error: boolean;

    public start(csTree:Tree): Tree{
      let buffer:TreeNode[] = new Array<TreeNode>();
      this.asTree = new Tree("Block");
      this.analyzeStmt(csTree.root.childrenNodes[0]); // Start from initial StatementList
      return this.asTree;
    }

    public analyzeStmt(node: TreeNode): void{
      let stmt:TreeNode = node.childrenNodes[0];
      switch(stmt.value){
        case("Block"):
          this.asTree.addBranchNode("Block");
          break;
        case("PrintStatement"):
          this.analyzePrint(node.childrenNodes);
          break;
        case("AssignmentStatement"):
          this.analyzeAssignment(node.childrenNodes);
          break;
        case("VarDecl"):
          this.asTree.addBranchNode(node.value);
          this.analyzeVarDecl(node.childrenNodes);
          this.asTree.moveUp(); // currentNode = block
          break;
        case("WhileStatement"):
          break;
        case("IfStatement"):
          break;
        default:
          break;
      }
      this.analyzeStmt(node.childrenNodes[1]); // the child StatementList
    }

    public analyzePrint(childrenNodes: TreeNode[]): void{
      this.asTree.addBranchNode(childrenNodes[0].value); // print
      this.analyzeExpr(childrenNodes[2].childrenNodes);
    }

    public analyzeAssignment(childrenNodes:  TreeNode[]): void{
      this.asTree.addBranchNode(childrenNodes[1]); // =
      this.asTree.addLeafNode(childrenNodes[0]); // id
      this.analyzeExpr(childrenNodes[2].childrenNodes) // Expr's children
    }

    public analyzeVarDecl(childrenNodes: TreeNode[]): void{
      let type: TreeNode = childrenNodes[0];
      this.asTree.addLeafNode(type.childrenNodes[0].value);
      this.asTree.addLeafNode(this.analyzeId(childrenNodes[1])) // id
    }

    public analyzeExpr(childrenNodes: TreeNode[]): void{
      let exprType:TreeNode = childrenNodes[0]; //Expr only has one child
      switch(exprType.value){
        case("IntExpr"):
          this.analyzeInt(exprType.childrenNodes); // currentNode: parent of Expr
          break;
        case("StringExpr"):
          let stringVal:string = this.analyzeString(exprType.childrenNodes[1], ""); // CharList
          this.asTree.addLeafNode(stringVal); // currentNode: parent of Expr
          break;
        case("BooleanExpr"):
          break;
        case("Id"):
          let id:string = this.analyzeId(exprType.childrenNodes[0]);
          this.asTree.addLeafNode(id); // currentNode: parent of Expr
          break;
        default:
          break;
      }
    }

    public analyzeId(node): string{
      return node.childrenNodes[0].value;
    }

    public analyzeString(node, stringVal): string{
      if(node.childrenNodes.length == 0){
        return stringVal;
      }
      stringVal += node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
      this.analyzeString(node.childrenNodes[1], stringVal); // CharList's CharList
    }
    
    public analyzeInt(childrenNodes:TreeNode[]): void{
      if(childrenNodes.length == 1){
        this.asTree.addLeafNode(childrenNodes[0].value); // digit
        return;
      }
      this.asTree.addBranchNode(childrenNodes[1].value); // intop
      this.asTree.addLeafNode(childrenNodes[0].value); // digit
      this.analyzeExpr(childrenNodes[2].childrenNodes); // expr's children
      this.asTree.moveUp(); // // currentNode: parent of intop
    }
  
  }
}