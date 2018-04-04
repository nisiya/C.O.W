///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="scopeTree.ts" />
///<reference path="symbol.ts" />
/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */

module Compiler {
    
  export class SAnalyzer {
    public asTree: Tree;
    public symbols: Symbol[];
    public symbolTable: Symbol[];
    public scopeTree: ScopeTree;
    public error: boolean;

    public start(csTree:Tree, symbols:Symbol[]): [Tree, Symbol[]]{
      console.log("sstart");
      if(this.buildAST(csTree)){
        this.symbols = symbols.reverse();
        if(this.scopeTypeCheck()){
          // this.symbolTable.push(symbols.pop());
          return [this.asTree, symbols];
        } else{
          return [this.asTree, null];
        }
      } else{
        return null;
      }
    }

    public buildAST(csTree): boolean{
      this.asTree = new Tree("Block");
      // Start from initial StatementList
      // tree-program-block-statementlist
      this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]); 
      return true;
    }

    public scopeTypeCheck(): boolean{
      this.symbolTable = new Array<Symbol>();
      let currentNode: TreeNode = this.asTree.root;
      this.scopeTree = new ScopeTree();
      // while(currentNode != null){
      return this.checkNode(currentNode);
      // }
    }

    public checkNode(currentNode): boolean{
      let error: boolean = false;
      let currentSymbol: Symbol;
      switch(currentNode.value){
        case "Block":
          this.scopeTree.addScopeNode();
          for(var i = 0; i < currentNode.length; i++){
            if(this.checkNode(currentNode.childrenNodes[i])){
              // continue
            } else{
              return false; // error found
            }
          }
          return true;
        case "VarDecl":
          currentSymbol = this.symbols.pop();
          console.log(currentSymbol);
          if(currentNode.childrenNodes[0].value == currentSymbol.type
            && currentNode.childrenNodes[1].value == currentSymbol.key){
            let updatedSymbol = this.scopeTree.currentScope.addSymbol(currentSymbol);
            if(updatedSymbol != null){
              this.symbolTable.push(updatedSymbol);
            } else{
              console.log("redeclare error");
              return false;
            }
          } else{
            // won't go here, just if else to make sure
          }
          return true;
        case "=":
          currentSymbol = this.symbols.pop();
          console.log(currentSymbol);
          let updatedSymbol = this.scopeTree.currentScope.usedSymbol(currentSymbol);
          if(updatedSymbol == null){
            // error!
            console.log("redeclare error");
            return false;
          }
          break;
        default:
          break;
      }
    }

    // blockChildrens: [ { , StatementList, } ]
    public analyzeBlock(blockNode: TreeNode): void{
      this.asTree.addBranchNode("Block");
      this.analyzeStmtList(blockNode.childrenNodes[1]);
    }

    // stmtListChildrens: [0] or [Statement, StatementList]
    public analyzeStmtList(stmtList: TreeNode): void{
      if (stmtList.childrenNodes.length == 0){
        if(this.asTree.current != this.asTree.root){
          this.asTree.moveUp(); // to parent of block
        }
        // epsilon
      } else{
        // has two children: stmt and stmtlist
        this.analyzeStmt(stmtList.childrenNodes[0]); // the statement
        // asTree.current = Block
        this.analyzeStmtList(stmtList.childrenNodes[1]); // the child stmt list
      }
    }

    // stmtChildrens: [PrintStatement | AssignmentStatement | VarDecl |
    //                 WhileStatement | IfStatement         | Block    ]
    public analyzeStmt(stmt: TreeNode): void{
      let stmtType:TreeNode = stmt.childrenNodes[0];
      switch(stmtType.value){
        case "Block":
          this.analyzeBlock(stmtType);
          break;
        case "PrintStatement":
          this.analyzePrint(stmtType.childrenNodes);
          this.asTree.moveUp(); // to Block
          break;
        case "AssignmentStatement":
          this.analyzeAssignment(stmtType.childrenNodes);
          this.asTree.moveUp(); // to Block
          break;
        case "VarDecl":
          this.asTree.addBranchNode(stmtType.value);
          this.analyzeVarDecl(stmtType.childrenNodes);
          this.asTree.moveUp(); // to Block
          break;
        case "WhileStatement":
          // console.log(stmtType.childrenNodes);
          this.analyzeWhile(stmtType.childrenNodes);
          this.asTree.moveUp(); // to Block
          break;
        case "IfStatement":
          this.analyzeIf(stmtType.childrenNodes);
          this.asTree.moveUp(); // to Block
          break;
        default:
          break;
          // nothing
      }
    }

    // PrintChildren: [print, ( , Expr, ) ]
    public analyzePrint(printChildren: TreeNode[]): void{
      this.asTree.addBranchNode(printChildren[0].value); // print
      this.analyzeExpr(printChildren[2]);

      // asTree.current = print
    }

    public analyzeAssignment(AssignChildren:  TreeNode[]): void{
      this.asTree.addBranchNode(AssignChildren[1].value); // =
      this.asTree.addLeafNode(this.analyzeId(AssignChildren[0])); // id
      this.analyzeExpr(AssignChildren[2]); // Expr's child
      
      // asTree.current = AssignmentOp
    }
      
    // VarDeclChildren: [type, Id]
    public analyzeVarDecl(VarDeclChildren: TreeNode[]): void{
      let type: TreeNode = VarDeclChildren[0];
      this.asTree.addLeafNode(this.analyzeType(VarDeclChildren[0])); // type
      this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1])); // id

      // asTree.current = VarDecl
    }

    // WhileChildren: [while, BooleanExpr, Block]
    public analyzeWhile(whileChildren: TreeNode[]): void{
      this.asTree.addBranchNode(whileChildren[0].value);
      this.analyzeBoolExpr(whileChildren[1].childrenNodes);
      this.analyzeBlock(whileChildren[2]);

      // asTree.current = while
    } 

    // IfChildren: [if, BooleanExpr, Block]
    public analyzeIf(ifChildren: TreeNode[]): void{
      this.asTree.addBranchNode(ifChildren[0].value);
      this.analyzeBoolExpr(ifChildren[1].childrenNodes);
      this.analyzeBlock(ifChildren[2]);

      // asTree.current = if
    } 

    // ExprChildren: [IntExpr | StringExpr | BooleanExpr | Id]
    public analyzeExpr(expr: TreeNode): void{
      let exprType = expr.childrenNodes[0];
      switch(exprType.value){
        case "IntExpr":
          this.analyzeIntExpr(exprType.childrenNodes); // currentNode: parent of Expr
          break;
        case "StringExpr": // really analyze the CharList
          let stringVal:string = this.analyzeCharList(exprType.childrenNodes[1], "");
          console.log("pls string " + stringVal);
          this.asTree.addLeafNode(stringVal); // currentNode: parent of Expr
          break;
        case "BooleanExpr":
          this.analyzeBoolExpr(exprType.childrenNodes);
          break;
        case "Id":
          this.asTree.addLeafNode(this.analyzeId(exprType)); // currentNode: parent of Expr
          break;
        default:
          // nothing
          break;
      }
    }

    public analyzeType(typeNode: TreeNode): string{
      return typeNode.childrenNodes[0].value;
    }

    public analyzeId(idNode: TreeNode): string{
      return idNode.childrenNodes[0].value;
    }

    // CharListChildren: [0] or [char | space , CharList]
    public analyzeCharList(node: TreeNode, stringVal: string): string{
      if(node.childrenNodes.length == 0){
        console.log("string " + stringVal);
        return stringVal;
      } else{
        stringVal = stringVal + node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
        return this.analyzeCharList(node.childrenNodes[1], stringVal); // CharList's CharList
      }
    }
    
    // IntExprChildren: [digit] or [digit, intop, Expr]
    public analyzeIntExpr(IntChildren: TreeNode[]): void{
      if(IntChildren.length == 1){
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the digit
        // asTree.current = parent of digit
      } else{
        this.asTree.addBranchNode(IntChildren[1].value); // intop
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the first digit
        this.analyzeExpr(IntChildren[2]); // expr's children
        this.asTree.moveUp();
        // asTree.current = parent of IntExpr
      }
    }

    // BooleanExprChildren: [boolval] or [ ( , Expr, boolop, Expr, ) ]
    public analyzeBoolExpr(BoolChildren: TreeNode[]): void{
      console.log(BoolChildren);
      if(BoolChildren.length == 1){
        this.asTree.addLeafNode(BoolChildren[0].childrenNodes[0].value); // the boolval
        // asTree.current = while
      } else{
        this.asTree.addBranchNode(BoolChildren[2].childrenNodes[0].value); // the boolop
        this.analyzeExpr(BoolChildren[1]); // asTree.current = boolop
        this.analyzeExpr(BoolChildren[3]); 
        this.asTree.moveUp(); // to while
        // asTree.current = while
      }
    }
  
  }
}