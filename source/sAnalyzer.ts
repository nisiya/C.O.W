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
      console.log("sstart");
      let buffer:TreeNode[] = new Array<TreeNode>();
      this.asTree = new Tree("Block");
      // Start from initial StatementList
      // tree-program-block-statementlist
      this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]); 
      return this.asTree;
    }

    public analyzeStmtList(stmtList: TreeNode): void{
      if (stmtList.childrenNodes[0] == null){
        // epsilon
        return;
      } else{
        this.analyzeStmt(stmtList.childrenNodes[0]); // the statement
        this.analyzeStmtList(stmtList.childrenNodes[1]); // the child stmt list
      }
    }

    public analyzeStmt(stmt: TreeNode): void{
      let stmtType:TreeNode = stmt.childrenNodes[0];
      console.log(stmtType.value + "hello");
      switch(stmtType.value){
        case "Block":
          this.asTree.addBranchNode("Block");
          break;
        case "PrintStatement":
          this.analyzePrint(stmtType.childrenNodes);
          break;
        case "AssignmentStatement":
          this.analyzeAssignment(stmtType.childrenNodes);
          break;
        case "VarDecl":
          this.asTree.addBranchNode(stmtType.value);
          this.analyzeVarDecl(stmtType.childrenNodes);
          this.asTree.moveUp(); // currentNode = block
          break;
        case "WhileStatement":
          break;
        case "IfStatement":
          break;
        default:
          // nothing
      }
    }

    public analyzePrint(printChildren: TreeNode[]): void{
      this.asTree.addBranchNode(printChildren[0].value); // print
      this.analyzeExpr(printChildren[2].childrenNodes[0]);
    }

    public analyzeAssignment(AssignChildren:  TreeNode[]): void{
      console.log(AssignChildren);
      this.asTree.addBranchNode(AssignChildren[1].value); // =
      this.asTree.addLeafNode(this.analyzeId(AssignChildren[0])); // id
      this.analyzeExpr(AssignChildren[2].childrenNodes[0]); // Expr's child
    }

    public analyzeVarDecl(VarDeclChildren: TreeNode[]): void{
      let type: TreeNode = VarDeclChildren[0];
      this.asTree.addLeafNode(type.childrenNodes[0].value);
      this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1])); // id
    }

    public analyzeExpr(exprType: TreeNode): void{
      console.log(exprType);
      switch(exprType.value){
        case "IntExpr":
          this.analyzeInt(exprType.childrenNodes); // currentNode: parent of Expr
          break;
        case "StringExpr":
          let stringVal:string = this.analyzeString(exprType.childrenNodes[1], ""); // CharList
          this.asTree.addLeafNode(stringVal); // currentNode: parent of Expr
          break;
        case "BooleanExpr":
          break;
        case "Id":
          let id:string = this.analyzeId(exprType); //char
          this.asTree.addLeafNode(id); // currentNode: parent of Expr
          break;
        default:
          // nothing
      }
    }

    public analyzeId(id: TreeNode): string{
      return id.childrenNodes[0].value;
    }

    public analyzeString(node, stringVal): string{
      if(node.childrenNodes.length == 0){
        return stringVal;
      }
      stringVal += node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
      this.analyzeString(node.childrenNodes[1], stringVal); // CharList's CharList
    }
    
    public analyzeInt(IntChildren:TreeNode[]): void{
      if(IntChildren.length == 1){
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the digit
        this.asTree.moveUp();
        return;
      }
      this.asTree.addBranchNode(IntChildren[1].value); // intop
      this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the digit
      this.analyzeExpr(IntChildren[2].childrenNodes[2]); // expr's children
      this.asTree.moveUp(); // // currentNode: parent of intop
      console.log(this.asTree.current.value + " um");
    }
  
  }
}