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

    public start(csTree:Tree): [Tree, Symbol[], number]{
      console.log("SA Start");
      this.warnings = 0;
      // buildAST first
      if(this.buildAST(csTree)){
        // AST built, start scope and type checking
        if(this.scopeTypeCheck()){
          console.log(this.scopeTree);
          this.buildSymbolTable();
          return [this.asTree, this.symbolTable, this.warnings];
        } else{
          return [this.asTree, null, this.warnings];
        }
      } else{
        return null;
      }
    }

    public buildAST(csTree): boolean{
      this.printStage("Constructing AST...");
      this.asTree = new Tree("Block", csTree.root.childrenNodes[0].location);

      // Start from initial StatementList
      // tree-program-block-statementlist
      this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]); 
      return true;
    }

    public scopeTypeCheck(): boolean{
      this.printStage("Starting scope and type checking...");
      this.symbolTable = new Array<Symbol>();
      let currentNode: TreeNode = this.asTree.root;
      this.scopeTree = new ScopeTree();

      // start from first node
      return this.checkStatement(currentNode);
    }

    public buildSymbolTable(): void{
      let currentScope: ScopeNode = this.scopeTree.root;
      this.transferSymbols(currentScope);
    }

    public transferSymbols(scope: ScopeNode): void{
      let symbolKeys = scope.symbolMap.keys();
      let key = symbolKeys.next();
      while(!key.done){
        let symbol:Symbol = scope.symbolMap.get(key.value);
        this.symbolTable.push(symbol);
        // if(symbol.accessed == 0){
        //   // declared, not initialized, not used
        //   this.printWarning("[" + symbol.key + "] declared, but never initialized or used", symbol.location);
        // } else if(symbol.accessed == 1){
        //   this.printWarning("[" + symbol.key + "] declared and initialized, but never used", symbol.location);
        // }
        key = symbolKeys.next();
      }
      for(var i = 0; i<scope.childrenScopes.length; i++){
        this.transferSymbols(scope.childrenScopes[i]);
      }
    }

    public checkStatement(currentNode): boolean{
      let varType:TreeNode;
      let varId:TreeNode;
      let expr:TreeNode;
      let exprType:string;
      let symbol:Symbol;

      switch(currentNode.value){
        case "Block":
          this.scopeTree.addScopeNode();
          for(var i = 0; i < currentNode.childrenNodes.length; i++){
            if(this.checkStatement(currentNode.childrenNodes[i])){
              // continue checking rest of the code
            } else{
              return false; // error found, will be reported later
            }
          }
          // return to previous block after all childrenNodes validated
          this.scopeTree.moveUp();
          return true;
        case "VarDecl":
          varType = currentNode.childrenNodes[0];
          varId = currentNode.childrenNodes[1];
          symbol = new Symbol(varId.value, varType.value, varId.location);
          if(this.scopeTree.currentScope.addSymbol(symbol)){
            return true;
          } else{
            // redeclaration error
            this.printError("Redeclared identifier [" + varId.value + "] in the same scope", varId.location);
            return false;
          }
        case "=":
          varId = currentNode.childrenNodes[0];
          expr = currentNode.childrenNodes[1];
          symbol = this.checkScope(varId);
          if(symbol != null){
            exprType = this.checkExprType(expr);
            if(exprType == "invalid"){
              return false; // error already handled
            } else{
              if(symbol.type == exprType){
                return true;
              } else{
                // type mismatched error
                this.printError("Type mismatched error. " + symbol.type + " [" + symbol.key
                                + "] cannot be assign to " + exprType, symbol.location);
                return false;
              }
            }
          } else{
            // undeclared/out-of-scope error handled already
            return false;
          }
        case "print":
          expr = currentNode.childrenNodes[0];
          exprType = this.checkExprType(expr);
          if(exprType == "invalid"){
            return false; // error already handled
          }
          return true;
        case "while":
          expr = currentNode.childrenNodes[0];
          if(this.checkBoolExpr(expr)){
            expr = currentNode.childrenNodes[1];
            return this.checkStatement(expr); // error already handled, if exist
          } else{
            return false; // error already handled
          }
        case "if":
          expr = currentNode.childrenNodes[0];
          if(this.checkBoolExpr(expr)){
            expr = currentNode.childrenNodes[1];
            return this.checkStatement(expr); // error already handled, if exist
          } else{
            return false; // error already handled
          }
        default:
          return true;
      }
    }

    public checkScope(varId:TreeNode): Symbol{
      this.printStage("Checking scope of [" + varId.value + "]...");
      let placeholder = this.scopeTree.currentScope;
      let foundSymbol:Symbol;
      while (this.scopeTree.currentScope != null){
        // look up until root scope for symbol
        foundSymbol = this.scopeTree.currentScope.getSymbol(varId.value);
        if(foundSymbol != null){
          this.scopeTree.currentScope = placeholder;
          return foundSymbol; // found symbol
        }
        this.scopeTree.moveUp();
      }
      // no symbol found
      // undeclared/out-of-scope 
      this.printError("Use of undeclared/out-of-scope identifier [" + varId.value + "]", varId.location);
      return null; 
    }

    public checkExprType(expr:TreeNode): string{
      let exprType:string;
      let isDigit:RegExp = /^\d$/;
      let isPlus:RegExp = /^\+$/;
      let isId:RegExp = /^[a-z]$/;
      let isBoolVal:RegExp = /^true|false$/;
      let isBoolOp:RegExp = /^!=|==$/;

      if(isDigit.test(expr.value)){
        return "int";
      } else if(isPlus.test(expr.value)){
        // make sure intExpr valid
        if(this.checkIntExpr(expr)){
          return "int";
        } else{
          return "invalid"; // error handled in intexpr
        }
      } else if(isId.test(expr.value)){
        // check scope of id
        let symbol:Symbol = this.checkScope(expr);
        if(symbol != null){
          return symbol.type;
        } else{
          // undeclared/out-of-scope error handled already
          return "invalid";
        }
      } else if(isBoolVal.test(expr.value)){
          return "boolean";
      } else if(isBoolOp.test(expr.value)){
        if(this.checkBoolExpr(expr)){
          return "boolean";
        } else{
          return "invalid"; // error handled in boolexpr
        }
      } else{
        // last is string
        return "string";
      }
    }

    public checkIntExpr(expr:TreeNode): boolean{
      let isPlus:RegExp = /^\+$/;
      let isDigit:RegExp = /^\d$/;
      // find the last operand
      while(isPlus.test(expr.value)){
        expr = expr.childrenNodes[1];
      }
      if(isDigit.test(expr.value)){
        return true; // addition of int only
      }
      // check scope of id
      let symbol:Symbol = this.checkScope(expr);
      if(symbol != null){
        if(symbol.type == "int"){
          return true;
        } else{
          // type mismatched error
          this.printError("Type mismatched error. Addition invalid for " + symbol.type + " [" + symbol.key + "]", symbol.location);
          return false;
        }
      } else{
        // undeclared/out-of-scope error already handled
        return false;
      }
    }

    public checkBoolExpr(expr: TreeNode): boolean{
      let rightType = this.checkExprType(expr.childrenNodes[0]);
      let leftType = this.checkExprType(expr.childrenNodes[1]);
      if(rightType == "invalid" || leftType == "invalid"){
        // error already handled
        return false;
      } else{
        if (rightType == leftType){
          return true;
        } else{
          // type mismatch
          this.printError("Type mismatched error. Cannot compare " + rightType + " with " + leftType, expr.location);
          return false;
        }
      }
    }
  
    
    // Start of functions used to build AST

    // blockChildrens: [ { , StatementList, } ]
    public analyzeBlock(blockNode: TreeNode): void{
      this.asTree.addBranchNode("Block", blockNode.location);
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
          this.asTree.addBranchNode(stmtType.value, stmtType.location);
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
      this.asTree.addBranchNode(printChildren[0].value, printChildren[0].location); // print
      this.analyzeExpr(printChildren[2]);

      // asTree.current = print
    }

    public analyzeAssignment(AssignChildren:  TreeNode[]): void{
      this.asTree.addBranchNode(AssignChildren[1].value, AssignChildren[1].location); // =
      this.asTree.addLeafNode(this.analyzeId(AssignChildren[0]), AssignChildren[0].location); // id
      this.analyzeExpr(AssignChildren[2]); // Expr's child
      
      // asTree.current = AssignmentOp
    }
      
    // VarDeclChildren: [type, Id]
    public analyzeVarDecl(VarDeclChildren: TreeNode[]): void{
      let type: TreeNode = VarDeclChildren[0];
      this.asTree.addLeafNode(this.analyzeType(VarDeclChildren[0]), VarDeclChildren[0].location); // type
      this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1]), VarDeclChildren[1].location); // id

      // asTree.current = VarDecl
    }

    // WhileChildren: [while, BooleanExpr, Block]
    public analyzeWhile(whileChildren: TreeNode[]): void{
      this.asTree.addBranchNode(whileChildren[0].value, whileChildren[0].location);
      this.analyzeBoolExpr(whileChildren[1].childrenNodes);
      this.analyzeBlock(whileChildren[2]);

      // asTree.current = while
    } 

    // IfChildren: [if, BooleanExpr, Block]
    public analyzeIf(ifChildren: TreeNode[]): void{
      this.asTree.addBranchNode(ifChildren[0].value, ifChildren[0].location);
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
          let stringVal:string = this.analyzeCharList(exprType.childrenNodes[1], "\"");
          this.asTree.addLeafNode(stringVal + "\"", exprType.childrenNodes[1].location); // currentNode: parent of Expr
          break;
        case "BooleanExpr":
          this.analyzeBoolExpr(exprType.childrenNodes);
          break;
        case "Id":
          this.asTree.addLeafNode(this.analyzeId(exprType), exprType.location); // currentNode: parent of Expr
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
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].location); // the digit
        // asTree.current = parent of digit
      } else{
        this.asTree.addBranchNode(IntChildren[1].value, IntChildren[1].location); // intop
        this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].location); // the first digit
        this.analyzeExpr(IntChildren[2]); // expr's children
        this.asTree.moveUp();
        // asTree.current = parent of IntExpr
      }
    }

    // BooleanExprChildren: [boolval] or [ ( , Expr, boolop, Expr, ) ]
    public analyzeBoolExpr(BoolChildren: TreeNode[]): void{
      if(BoolChildren.length == 1){
        this.asTree.addLeafNode(BoolChildren[0].childrenNodes[0].value, BoolChildren[0].childrenNodes[0].location); // the boolval
        // asTree.current = while
      } else{
        this.asTree.addBranchNode(BoolChildren[2].childrenNodes[0].value, BoolChildren[2].childrenNodes[0].location); // the boolop
        this.analyzeExpr(BoolChildren[1]); // asTree.current = boolop
        this.analyzeExpr(BoolChildren[3]); 
        this.asTree.moveUp(); // to while
        // asTree.current = while
      }
    }

    // Start of functions for outputs
    // prints error to log
    public printError(errorType: string, location: [number, number]): void{
      let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
      log.value += "\n   SEMANTIC ANALYZER --> ERROR! " + errorType + " on line " + location[0] + ", column " + location[1];
      log.value += "\n   SEMANTIC ANALYZER --> Semantic analysis failed with 1 error... Symbol table is not generated for it";
      log.scrollTop = log.scrollHeight;
    }

    // prints warning to log
    public printWarning(warningType: string, location: [number, number]): void{
      this.warnings++;
      let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
      log.value += "\n   SEMANTIC ANALYZER --> WARNING! " + warningType + " on line " + location[0] + ", column " + location[1];
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