///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="scopeTree.ts" />
///<reference path="symbol.ts" />
/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */
var Compiler;
(function (Compiler) {
    var SAnalyzer = /** @class */ (function () {
        function SAnalyzer() {
        }
        SAnalyzer.prototype.start = function (csTree) {
            console.log("SA Start");
            this.warnings = 0;
            // buildAST first
            if (this.buildAST(csTree)) {
                // AST built, start scope and type checking
                if (this.scopeTypeCheck()) {
                    // this.checkForUnused();
                    return [this.asTree, this.symbolTable, this.warnings];
                }
                else {
                    return [this.asTree, null, this.warnings];
                }
            }
            else {
                return null;
            }
        };
        SAnalyzer.prototype.buildAST = function (csTree) {
            this.printStage("Constructing AST...");
            this.asTree = new Compiler.Tree("Block", csTree.root.childrenNodes[0].location);
            // Start from initial StatementList
            // tree-program-block-statementlist
            this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]);
            return true;
        };
        SAnalyzer.prototype.scopeTypeCheck = function () {
            this.printStage("Starting scope and type checking...");
            this.symbolTable = new Array();
            var currentNode = this.asTree.root;
            this.scopeTree = new Compiler.ScopeTree();
            // start from first node
            return this.checkNode(currentNode);
        };
        // Start of functions used for scope and type checking
        SAnalyzer.prototype.checkNode = function (currentNode) {
            console.log("checking " + currentNode.value);
            switch (currentNode.value) {
                // block means new scope
                case "Block":
                    this.scopeTree.addScopeNode();
                    for (var i = 0; i < currentNode.childrenNodes.length; i++) {
                        if (this.checkNode(currentNode.childrenNodes[i])) {
                            // continue checking rest of the code
                        }
                        else {
                            return false; // error found, will be reported later
                        }
                    }
                    // return to previous block after all childrenNodes validated
                    this.scopeTree.moveUp();
                    return true;
                // add symbol to current scope
                case "VarDecl":
                    var type = currentNode.childrenNodes[0];
                    var key = currentNode.childrenNodes[1];
                    var newSymbol = new Compiler.Symbol(key.value, type.value, key.location);
                    var updatedSymbol = this.scopeTree.currentScope.addSymbol(newSymbol);
                    if (updatedSymbol != null) {
                        this.printStage("Adding new symbol [" + updatedSymbol.key + "]...");
                    }
                    else {
                        // redeclaration error
                        this.printError("Redeclared identifier [" + key.value + "] in the same scope", key.location);
                        return false;
                    }
                    return true; // no errors
                // assignment
                case "=":
                    // first check scope
                    var identifier = currentNode.childrenNodes[0];
                    var foundSymbol = this.checkScope(identifier);
                    if (foundSymbol != null) {
                        var valueNode = currentNode.childrenNodes[1];
                        if (valueNode.value == "+") {
                            // special case of intexpr
                            if (foundSymbol.type == "int") {
                                // make sure added id is also int
                                return this.checkAddition(valueNode);
                            }
                            else {
                                // type mismatched error
                                this.printError("Type mismatched error. " + foundSymbol.type + " [" + foundSymbol.key
                                    + "] cannot be assign to int", identifier.location);
                                return false;
                            }
                        }
                        else {
                            // check type of the assigned value
                            return this.checkType(valueNode, foundSymbol);
                        }
                    }
                    else {
                        return false; // undeclared/out-of-scope error already printed
                    }
                default:
                    // won't get here, but always need a default statement
                    return true;
            }
        };
        SAnalyzer.prototype.checkScope = function (identifier) {
            this.printStage("Checking scope of [" + identifier.value + "]...");
            var placeholder = this.scopeTree.currentScope;
            var foundSymbol;
            while (this.scopeTree.currentScope != null) {
                // look up until root scope for symbol
                foundSymbol = this.scopeTree.currentScope.getSymbol(identifier.value);
                if (foundSymbol != null) {
                    if (foundSymbol.accessed == 0) {
                        foundSymbol.accessed++; // 1 means initialized only
                    }
                    this.scopeTree.currentScope.updateSymbol(foundSymbol);
                    this.scopeTree.currentScope = placeholder; // return to original scope
                    return foundSymbol; // found symbol
                }
                this.scopeTree.moveUp();
            }
            // no symbol found
            // undeclared/out-of-scope error
            this.printError("Use of undeclared/out-of-scope identifier", identifier.location);
            return null; // undeclared/out-of-scope
        };
        SAnalyzer.prototype.checkType = function (valueNode, foundSymbol) {
            this.printStage("Checking type of [" + foundSymbol.key + "]...");
            var digit = /^\d$/;
            var boolval = /^true|false$/;
            var valueType;
            // find the type of assingment value
            if (digit.test(valueNode.value)) {
                // type is int
                valueType = "int";
            }
            else if (boolval.test(valueNode.value)) {
                // type is boolean
                valueType = "boolean";
            }
            else {
                // type is string
                valueType = "string";
            }
            // check if it matches type of symbol
            if (valueType == foundSymbol.type) {
                return true;
            }
            else {
                // type mismatched error
                this.printError("Type mismatched error. " + foundSymbol.type + " [" + foundSymbol.key
                    + "] cannot be assign to " + valueType, valueNode.location);
                return false;
            }
        };
        SAnalyzer.prototype.checkAddition = function (valueNode) {
            // special case of intexpr in assignment
            while (valueNode.value == "+") {
                // find the id operand
                valueNode = valueNode.childrenNodes[1]; // id would be left operand
            }
            // found the id operand, check its scope
            var addedSymbol = this.checkScope(valueNode);
            if (addedSymbol != null) {
                // type of symbol must be int
                this.printStage("Checking type of [" + addedSymbol.key + "]...");
                if (addedSymbol.type == "int") {
                    return true;
                }
                else {
                    // type mismatched error
                    this.printError("Type mismatched error. Addition operand [" + addedSymbol.key
                        + "] must be type int", valueNode.location);
                    return false;
                }
            }
            else {
                return false; // undeclared/out-of-scope error already printed
            }
        };
        /*
        // check the two children for =, !=, and ==
        public checkChildren(currentNode): boolean{
          let boolval: RegExp = /^true|false$/;
    
          // first child can also be boolval for boolops
          if(boolval.test(currentNode.childrenNodes[0].value)){
            // if second
            let boolop: RegExp = /^!=|==$/;
            if(boolval.test(currentNode.childrenNodes[1].value)){
              return true;
            } else if(boolop.test(currentNode.childrenNodes[1].value)){
              return this.checkNode(currentNode.childrenNodes[1]);
            } else{
              let symbol: Symbol = this.checkScope(currentNode.childrenNodes[1].value);
              if(symbol != null){
                if(!symbol.initialized){
                  // warning
                  this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[1].line);
                }
        
                // then check type
                this.printStage("Checking type of [" + symbol.key + "]");
                // type should be boolean
                if(symbol.type == "boolean"){
                  return true;
                } else{
                  // type mismatched error
                  this.printError("Type mismatched error", currentNode.childrenNodes[1].line);
                }
              } else{
                // no symbol found
                // undeclared/out-of-scope error
                this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[1].line);
              }
            }
          } else{
            // first check scope
            let symbol: Symbol = this.checkScope(currentNode.childrenNodes[0].value);
            if(symbol != null){
    
              // for == and !=, check for uninitialized warning
              if(currentNode.value == "==" || currentNode.value == "!="){
                if(!symbol.initialized){
                  // warning
                  this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[0].line);
                }
              }
    
              // then check type
              this.printStage("Checking type of [" + symbol.key + "]");
              let valueType:string;
    
              // special case for != and ==, second child is "+"
              if(currentNode.childrenNodes[1].value == "+"){
                valueType = this.checkAddition(currentNode.childrenNodes[1]);
              } else{
                // case for all
                valueType = this.findType(currentNode.childrenNodes[1].value);
              }
    
              // if type matches symbol's type
              if(valueType == symbol.type){
                
                // special case for =, set symbol to be initialized
                if(currentNode.value == "="){
                  symbol.initializeSymbol();
                  this.scopeTree.currentScope.updateSymbol(symbol);
                }
                return true;
    
              } else{
                if(valueType == "error"){ // occurred when checking "+"
                  this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[1].line);
                } else{
                  // type mismatched error
                  this.printError("Type mismatched error", currentNode.childrenNodes[1].line);
                }
              }
            } else{
              // no symbol found
              // undeclared/out-of-scope error
              this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[0].line);
            }
          }
          return false;
        }
    
        // check for symbol in current and all previous scopes
        public checkScope(symbolKey: string): Symbol{
          this.printStage("Checking scope of [" + symbolKey + "]");
          let bookmarkScope = this.scopeTree.currentScope;
          let symbol:Symbol;
          while(this.scopeTree.currentScope != null){
            symbol = this.scopeTree.currentScope.getSymbol(symbolKey);
            if(symbol != null){
              // found symbol, so stop searching
              this.scopeTree.currentScope = bookmarkScope;
              break;
            }
            this.scopeTree.moveUp();
          }
          return symbol;
        }
    
        // type not in AST so we have to tell what it is
        // type -> int | boolean | string
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
    
        // special case of nested additions
        public checkAddition(plusNode: TreeNode): string{
          let id:RegExp = /^[a-z]$/;
          let plus:RegExp = /^\+$/;
    
          // first child always digit
          // if second child is id, check its scope, type will be checked later
          if(id.test(plusNode.childrenNodes[1].value)){
            let symbol = this.checkScope(plusNode.childrenNodes[1].value);
            if(symbol != null){
              if(!symbol.initialized){
                // uninitialized variable warning
                this.printWarning("Use of uninitialized variable", plusNode.childrenNodes[1].line);
              }
              return symbol.type;
            } else{
              return "error";
            }
          } else if(plus.test(plusNode.childrenNodes[1].value)){
            // if second child is still "+", check its children
            return this.checkAddition(plusNode.childrenNodes[1]);
          } else{
            return "notInt";
          }
        }
    
        */
        // Start of functions used to build AST
        // blockChildrens: [ { , StatementList, } ]
        SAnalyzer.prototype.analyzeBlock = function (blockNode) {
            this.asTree.addBranchNode("Block", blockNode.location);
            this.analyzeStmtList(blockNode.childrenNodes[1]);
        };
        // stmtListChildrens: [0] or [Statement, StatementList]
        SAnalyzer.prototype.analyzeStmtList = function (stmtList) {
            if (stmtList.childrenNodes.length == 0) {
                if (this.asTree.current != this.asTree.root) {
                    this.asTree.moveUp(); // to parent of block
                }
                // epsilon
            }
            else {
                // has two children: stmt and stmtlist
                this.analyzeStmt(stmtList.childrenNodes[0]); // the statement
                // asTree.current = Block
                this.analyzeStmtList(stmtList.childrenNodes[1]); // the child stmt list
            }
        };
        // stmtChildrens: [PrintStatement | AssignmentStatement | VarDecl |
        //                 WhileStatement | IfStatement         | Block    ]
        SAnalyzer.prototype.analyzeStmt = function (stmt) {
            var stmtType = stmt.childrenNodes[0];
            switch (stmtType.value) {
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
            }
        };
        // PrintChildren: [print, ( , Expr, ) ]
        SAnalyzer.prototype.analyzePrint = function (printChildren) {
            this.asTree.addBranchNode(printChildren[0].value, printChildren[0].location); // print
            this.analyzeExpr(printChildren[2]);
            // asTree.current = print
        };
        SAnalyzer.prototype.analyzeAssignment = function (AssignChildren) {
            this.asTree.addBranchNode(AssignChildren[1].value, AssignChildren[1].location); // =
            this.asTree.addLeafNode(this.analyzeId(AssignChildren[0]), AssignChildren[0].location); // id
            this.analyzeExpr(AssignChildren[2]); // Expr's child
            // asTree.current = AssignmentOp
        };
        // VarDeclChildren: [type, Id]
        SAnalyzer.prototype.analyzeVarDecl = function (VarDeclChildren) {
            var type = VarDeclChildren[0];
            this.asTree.addLeafNode(this.analyzeType(VarDeclChildren[0]), VarDeclChildren[0].location); // type
            this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1]), VarDeclChildren[1].location); // id
            // asTree.current = VarDecl
        };
        // WhileChildren: [while, BooleanExpr, Block]
        SAnalyzer.prototype.analyzeWhile = function (whileChildren) {
            this.asTree.addBranchNode(whileChildren[0].value, whileChildren[0].location);
            this.analyzeBoolExpr(whileChildren[1].childrenNodes);
            this.analyzeBlock(whileChildren[2]);
            // asTree.current = while
        };
        // IfChildren: [if, BooleanExpr, Block]
        SAnalyzer.prototype.analyzeIf = function (ifChildren) {
            this.asTree.addBranchNode(ifChildren[0].value, ifChildren[0].location);
            this.analyzeBoolExpr(ifChildren[1].childrenNodes);
            this.analyzeBlock(ifChildren[2]);
            // asTree.current = if
        };
        // ExprChildren: [IntExpr | StringExpr | BooleanExpr | Id]
        SAnalyzer.prototype.analyzeExpr = function (expr) {
            var exprType = expr.childrenNodes[0];
            switch (exprType.value) {
                case "IntExpr":
                    this.analyzeIntExpr(exprType.childrenNodes); // currentNode: parent of Expr
                    break;
                case "StringExpr":// really analyze the CharList
                    var stringVal = this.analyzeCharList(exprType.childrenNodes[1], "");
                    this.asTree.addLeafNode(stringVal, exprType.childrenNodes[1].location); // currentNode: parent of Expr
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
        };
        SAnalyzer.prototype.analyzeType = function (typeNode) {
            return typeNode.childrenNodes[0].value;
        };
        SAnalyzer.prototype.analyzeId = function (idNode) {
            return idNode.childrenNodes[0].value;
        };
        // CharListChildren: [0] or [char | space , CharList]
        SAnalyzer.prototype.analyzeCharList = function (node, stringVal) {
            if (node.childrenNodes.length == 0) {
                return stringVal;
            }
            else {
                stringVal = stringVal + node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
                return this.analyzeCharList(node.childrenNodes[1], stringVal); // CharList's CharList
            }
        };
        // IntExprChildren: [digit] or [digit, intop, Expr]
        SAnalyzer.prototype.analyzeIntExpr = function (IntChildren) {
            if (IntChildren.length == 1) {
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].location); // the digit
                // asTree.current = parent of digit
            }
            else {
                this.asTree.addBranchNode(IntChildren[1].value, IntChildren[1].location); // intop
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].location); // the first digit
                this.analyzeExpr(IntChildren[2]); // expr's children
                this.asTree.moveUp();
                // asTree.current = parent of IntExpr
            }
        };
        // BooleanExprChildren: [boolval] or [ ( , Expr, boolop, Expr, ) ]
        SAnalyzer.prototype.analyzeBoolExpr = function (BoolChildren) {
            if (BoolChildren.length == 1) {
                this.asTree.addLeafNode(BoolChildren[0].childrenNodes[0].value, BoolChildren[0].childrenNodes[0].location); // the boolval
                // asTree.current = while
            }
            else {
                this.asTree.addBranchNode(BoolChildren[2].childrenNodes[0].value, BoolChildren[2].childrenNodes[0].location); // the boolop
                this.analyzeExpr(BoolChildren[1]); // asTree.current = boolop
                this.analyzeExpr(BoolChildren[3]);
                this.asTree.moveUp(); // to while
                // asTree.current = while
            }
        };
        // Start of functions for outputs
        // prints error to log
        SAnalyzer.prototype.printError = function (errorType, location) {
            var log = document.getElementById("log");
            log.value += "\n   SEMANTIC ANALYZER --> ERROR! " + errorType + " on line " + location[0] + ", column " + location[1];
            log.value += "\n   SEMANTIC ANALYZER --> Semantic analysis failed with 1 error... Symbol table is not generated for it";
            log.scrollTop = log.scrollHeight;
        };
        // prints warning to log
        SAnalyzer.prototype.printWarning = function (warningType, location) {
            this.warnings++;
            var log = document.getElementById("log");
            log.value += "\n   SEMANTIC ANALYZER --> WARNING! " + warningType + " on line " + location[0] + ", column " + location[1];
            // log.value += "\n   SEMANTIC ANALYZER --> Semantic analysis completed with 1 warning";                
            log.scrollTop = log.scrollHeight;
        };
        // print current state
        SAnalyzer.prototype.printStage = function (stage) {
            if (_VerboseMode) {
                var log = document.getElementById("log");
                log.value += "\n   SEMANTIC ANALYZER --> " + stage;
                log.scrollTop = log.scrollHeight;
            }
        };
        return SAnalyzer;
    }());
    Compiler.SAnalyzer = SAnalyzer;
})(Compiler || (Compiler = {}));
