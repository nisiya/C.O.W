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
    public warnings: number;

    public start(csTree:Tree, symbols:Symbol[]): [Tree, Symbol[], number]{
      console.log("SA Start");
      this.warnings = 0;
      if(this.buildAST(csTree)){
        this.symbols = symbols.reverse();
        if(this.scopeTypeCheck()){
          return [this.asTree, this.symbolTable, this.warnings];
        } else{
          return [this.asTree, null, this.warnings];
        }
      } else{
        return null;
      }
    }

    public buildAST(csTree): boolean{
      this.printStage("Constructing AST");
      this.asTree = new Tree("Block", 0);
      // Start from initial StatementList
      // tree-program-block-statementlist
      this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]); 
      return true;
    }

    public scopeTypeCheck(): boolean{
      this.printStage("Starting scope and type checking");
      this.symbolTable = new Array<Symbol>();
      let currentNode: TreeNode = this.asTree.root;
      this.scopeTree = new ScopeTree();
      return this.checkNode(currentNode);
    }

    public checkNode(currentNode): boolean{
      let currentSymbol: Symbol;
      switch(currentNode.value){
        case "Block":
          this.scopeTree.addScopeNode();
          for(var i = 0; i < currentNode.childrenNodes.length; i++){
            if(this.checkNode(currentNode.childrenNodes[i])){
              // continue checking rest of the code
            } else{
              return false; // error found, will be reported later
            }
          }
          this.scopeTree.moveUp();
          return true;
        case "VarDecl":
          currentSymbol = this.symbols.pop();
          if(currentNode.childrenNodes[0].value == currentSymbol.type
            && currentNode.childrenNodes[1].value == currentSymbol.key){
            let updatedSymbol = this.scopeTree.currentScope.addSymbol(currentSymbol);
            if(updatedSymbol != null){
              this.printStage("Adding new symbol [" + updatedSymbol.key + "]");
              this.symbolTable.push(updatedSymbol);
            } else{
              // redeclaration error
              this.printError("Redeclared identifier in the same scope", currentSymbol.line);
              return false;
            }
          } else{
            // won't go here, just if else to make sure
          }
          return true;
        case "=":
          return this.checkChildren(currentNode);
        case "!=":
          return this.checkChildren(currentNode);
        case "==":
          return this.checkChildren(currentNode);
        case "print":
          let id: RegExp = /^[a-z]$/;
          if(id.test(currentNode.childrenNodes[0].value)){
            let symbol: Symbol = this.checkScope(currentNode.childrenNodes[0].value);
            if(symbol != null){
              if(!symbol.initialized){
                // warning
                this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[0].line);
              }
            } else{
              // error!
              this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[0].line);
              return false;
            }
          }
          return true; // no need to check for string
        case "while":
          if(this.checkNode(currentNode.childrenNodes[0])){ // the boolexpr
            return this.checkNode(currentNode.childrenNodes[1]); // the block
          }
          return false;    
        case "if":
          if(this.checkNode(currentNode.childrenNodes[0])){ // the boolexpr
            return this.checkNode(currentNode.childrenNodes[1]); // the block
          }
          return false;  
        default:
          return true;
      }
    }

    public checkChildren(currentNode): boolean{
      let symbol: Symbol = this.checkScope(currentNode.childrenNodes[0].value);
      if(symbol != null){
        if(currentNode.value == "==" || currentNode.value == "!="){
          if(!symbol.initialized){
            // warning
            this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[0].line);
          }
        }
        this.printStage("Checking type of [" + symbol.key + "]");
        let valueType:string;
        if(currentNode.childrenNodes[1].value == "+"){
          valueType = this.checkAddition(currentNode.childrenNodes[1]);
        } else{
          valueType = this.findType(currentNode.childrenNodes[1].value);
        }
        if(valueType == symbol.type){
          if(currentNode.value == "="){
            symbol.initializeSymbol();
            this.scopeTree.currentScope.updateSymbol(symbol);
          }
          return true;
        } else{
          if(valueType == "error"){
            this.printError("Use of undeclared/out-of-scope identifier", symbol.line);
          } else{
            // error!
            this.printError("Type mismatched error", symbol.line);
          }
        }
      } else{
        // error!
        this.printError("Use of undeclared/out-of-scope identifier", currentNode.line);
      }
      return false;
    }

    public checkScope(symbolKey: string): Symbol{
      this.printStage("Checking scope of [" + symbolKey + "]");
      let bookmarkScope = this.scopeTree.currentScope;
      let symbol:Symbol;
      while(this.scopeTree.currentScope != null){
        symbol = this.scopeTree.currentScope.getSymbol(symbolKey);
        if(symbol != null){
          this.scopeTree.currentScope = bookmarkScope;
          break;
        }
        this.scopeTree.moveUp();
      }
      return symbol;
    }

    public findType(value: string): string{
      let digit:RegExp = /^\d/;
      let boolval: RegExp = /^true|false$/;
      if(digit.test(value)){
        return "int";
      } else if(boolval.test(value)){
        return "boolean";
      } else{
        return "string";
      }
    }

    public checkAddition(plusNode: TreeNode): string{
      let digit:RegExp = /^\d/;
      let id:RegExp = /^[a-z]$/;
      let plus:RegExp = /^\+$/;
      if(digit.test(plusNode.childrenNodes[0].value)){
        if(id.test(plusNode.childrenNodes[1].value)){
          let symbol = this.checkScope(plusNode.childrenNodes[1].value);
          if(symbol != null){
            if(!symbol.initialized){
              // warning
              this.printWarning("Use of uninitialized variable", plusNode.childrenNodes[1].line);
            }
            return symbol.type;
          } else{
            return "error";
          }
        } else if(plus.test(plusNode.childrenNodes[1].value)){
          return this.checkAddition(plusNode.childrenNodes[1]);
        } else{
          return "notInt";
        }
      } else{
        return "notInt";
      }
    }

    // blockChildrens: [ { , StatementList, } ]
    public analyzeBlock(blockNode: TreeNode): void{
      this.asTree.addBranchNode("Block", blockNode.line);
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
          this.asTree.addBranchNode(stmtType.value, stmtType.line);
          this.analyzeVarDecl(stmtType.childrenNodes);
          this.asTree.moveUp(); // to Block
          break;
        case "WhileStatement":
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
      this.asTree.addBranchNode(printChildren[0].value, printChildren[0].line); // print
      this.analyzeExpr(printChildren[2]);

      // asTree.current = print
    }

    public analyzeAssignment(AssignChildren:  TreeNode[]): void{
      this.asTree.addBranchNode(AssignChildren[1].value, AssignChildren[1].line); // =
      this.asTree.addLeafNode(this.analyzeId(AssignChildren[0]), AssignChildren[0].line); // id
      this.analyzeExpr(AssignChildren[2]); // Expr's child
      
      // asTree.current = AssignmentOp
    }
      
    // VarDeclChildren: [type, Id]
    public analyzeVarDecl(VarDeclChildren: TreeNode[]): void{
      let type: TreeNode = VarDeclChildren[0];
      this.asTree.addLeafNode(this.analyzeType(VarDeclChildren[0]), VarDeclChildren[0].line); // type
      this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1]), VarDeclChildren[1].line); // id

      // asTree.current = VarDecl
    }

    // WhileChildren: [while, BooleanExpr, Block]
    public analyzeWhile(whileChildren: TreeNode[]): void{
      this.asTree.addBranchNode(whileChildren[0].value, whileChildren[0].line);
      this.analyzeBoolExpr(whileChildren[1].childrenNodes);
      this.analyzeBlock(whileChildren[2]);

      // asTree.current = while
    } 

    // IfChildren: [if, BooleanExpr, Block]
    public analyzeIf(ifChildren: TreeNode[]): void{
      this.asTree.addBranchNode(ifChildren[0].value, ifChildren[0].line);
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
          this.asTree.addLeafNode(stringVal, exprType.childrenNodes[1].line); // currentNode: parent of Expr
          break;
        case "BooleanExpr":
          this.analyzeBoolExpr(exprType.childrenNodes);
          break;
        case "Id":
          this.asTree.addLeafNode(this.analyzeId(exprType), exprType.line); // currentNode: parent of Expr
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
        return stringVal;
      } else{
        stringVal = stringVal + node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
        return this.analyzeCharList(node.childrenNodes[1], stringVal); // CharList's CharList
      }
    }
    
    // IntExprChildren: [digit] or [digit, intop, Expr]
    public analyzeIntExpr(IntChildren: TreeNode[]): void{
      if(IntChildren.length == 1){
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].line); // the digit
        // asTree.current = parent of digit
      } else{
        this.asTree.addBranchNode(IntChildren[1].value, IntChildren[1].line); // intop
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].line); // the first digit
        this.analyzeExpr(IntChildren[2]); // expr's children
        this.asTree.moveUp();
        // asTree.current = parent of IntExpr
      }
    }

    // BooleanExprChildren: [boolval] or [ ( , Expr, boolop, Expr, ) ]
    public analyzeBoolExpr(BoolChildren: TreeNode[]): void{
      if(BoolChildren.length == 1){
        this.asTree.addLeafNode(BoolChildren[0].childrenNodes[0].value, BoolChildren[0].childrenNodes[0].line); // the boolval
        // asTree.current = while
      } else{
        this.asTree.addBranchNode(BoolChildren[2].childrenNodes[0].value, BoolChildren[2].childrenNodes[0].line); // the boolop
        this.analyzeExpr(BoolChildren[1]); // asTree.current = boolop
        this.analyzeExpr(BoolChildren[3]); 
        this.asTree.moveUp(); // to while
        // asTree.current = while
      }
    }

    // prints error to log
    public printError(errorType, line): void{
      let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
      log.value += "\n   SEMANTIC ANALYZER --> ERROR! " + errorType + " on line " + line;
      log.value += "\n   SEMANTIC ANALYZER --> Semantic analysis failed with 1 error... Symbol table is not generated for it";
      log.scrollTop = log.scrollHeight;
    }

    // prints warning to log
    public printWarning(warningType, line): void{
      this.warnings++;
      let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
      log.value += "\n   SEMANTIC ANALYZER --> WARNING! " + warningType + " on line " + line;
      // log.value += "\n   SEMANTIC ANALYZER --> Semantic analysis completed with 1 warning";                
      log.scrollTop = log.scrollHeight;
    }

    // print current state
    public printStage(stage: string){
      if(_VerboseMode){
        let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
        log.value += "\n   SEMANTIC ANALYZER --> " + stage;
        log.scrollTop = log.scrollHeight;
      }
    }
  }
}