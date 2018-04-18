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
                    this.buildSymbolTable();
                    return [this.asTree, this.symbolTable, this.scopeTree, this.warnings];
                }
                else {
                    return [this.asTree, null, null, this.warnings];
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
            return this.checkStatement(currentNode);
        };
        SAnalyzer.prototype.buildSymbolTable = function () {
            var currentScope = this.scopeTree.root;
            this.transferSymbols(currentScope);
        };
        SAnalyzer.prototype.transferSymbols = function (scope) {
            var symbolKeys = scope.symbolMap.keys();
            var key = symbolKeys.next();
            while (!key.done) {
                var symbol = scope.symbolMap.get(key.value);
                this.symbolTable.push(symbol);
                if (symbol.accessed == 0) {
                    // declared, not initialized, not used
                    this.printWarning("[" + symbol.key + "] declared, but never initialized or used", symbol.location);
                }
                else if (symbol.accessed == 1) {
                    this.printWarning("[" + symbol.key + "] declared and initialized, but never used after", symbol.location);
                }
                key = symbolKeys.next();
            }
            for (var i = 0; i < scope.childrenScopes.length; i++) {
                this.transferSymbols(scope.childrenScopes[i]);
            }
        };
        SAnalyzer.prototype.checkStatement = function (currentNode) {
            var varType;
            var varId;
            var expr;
            var exprType;
            var symbol;
            switch (currentNode.value) {
                case "Block":
                    this.scopeTree.addScopeNode();
                    for (var i = 0; i < currentNode.childrenNodes.length; i++) {
                        if (this.checkStatement(currentNode.childrenNodes[i])) {
                            // continue checking rest of the code
                        }
                        else {
                            return false; // error found, will be reported later
                        }
                    }
                    // return to previous block after all childrenNodes validated
                    this.scopeTree.moveUp();
                    return true;
                case "VarDecl":
                    varType = currentNode.childrenNodes[0];
                    varId = currentNode.childrenNodes[1];
                    symbol = new Compiler.Symbol(varId.value, varType.value, varId.location);
                    if (this.scopeTree.currentScope.addSymbol(symbol)) {
                        return true;
                    }
                    else {
                        // redeclaration error
                        this.printError("Redeclared identifier [" + varId.value + "] in the same scope", varId.location);
                        return false;
                    }
                case "Assign":
                    varId = currentNode.childrenNodes[0];
                    expr = currentNode.childrenNodes[1];
                    symbol = this.checkScope(varId, false);
                    if (symbol != null) {
                        exprType = this.checkExprType(expr);
                        if (exprType == "invalid") {
                            return false; // error already handled
                        }
                        else {
                            if (symbol.type == exprType) {
                                return true;
                            }
                            else {
                                // type mismatched error
                                this.printError("Type mismatched error. " + symbol.type + " [" + symbol.key
                                    + "] cannot be assign to " + exprType, symbol.location);
                                return false;
                            }
                        }
                    }
                    else {
                        // undeclared/out-of-scope error handled already
                        return false;
                    }
                case "print":
                    expr = currentNode.childrenNodes[0];
                    exprType = this.checkExprType(expr);
                    if (exprType == "invalid") {
                        return false; // error already handled
                    }
                    return true;
                case "while":
                    expr = currentNode.childrenNodes[0];
                    if (expr.value == "true" || expr.value == "false" || this.checkBoolExpr(expr)) {
                        expr = currentNode.childrenNodes[1];
                        return this.checkStatement(expr); // error already handled, if exist
                    }
                    else {
                        return false; // error already handled
                    }
                case "if":
                    expr = currentNode.childrenNodes[0];
                    if (expr.value == "true" || expr.value == "false" || this.checkBoolExpr(expr)) {
                        expr = currentNode.childrenNodes[1];
                        return this.checkStatement(expr); // error already handled, if exist
                    }
                    else {
                        return false; // error already handled
                    }
                default:
                    return true;
            }
        };
        SAnalyzer.prototype.checkScope = function (varId, beingUsed) {
            this.printStage("Checking scope of [" + varId.value + "] on line " + varId.location[0] + ", column " + varId.location[1] + "...");
            var placeholder = this.scopeTree.currentScope;
            var symbol;
            while (this.scopeTree.currentScope != null) {
                // look up until root scope for symbol
                symbol = this.scopeTree.currentScope.getSymbol(varId.value);
                if (symbol != null) {
                    // update symbol access for checking warnings later
                    if (beingUsed) {
                        // check if initialized
                        if (symbol.accessed > 0) {
                            // yes
                            symbol.accessed++;
                        }
                        else {
                            // zero or negative means not initialized
                            symbol.accessed--;
                            this.printWarning("[" + symbol.key + "] used but was not initialized yet", symbol.location);
                        }
                    }
                    else {
                        if (symbol.accessed <= 0) {
                            // initialzed for the first time
                            symbol.accessed = 1;
                        }
                    }
                    this.scopeTree.currentScope.updateSymbol(symbol);
                    this.scopeTree.currentScope = placeholder;
                    return symbol; // found symbol
                }
                this.scopeTree.moveUp();
            }
            // no symbol found
            // undeclared/out-of-scope 
            this.printError("Use of undeclared/out-of-scope identifier [" + varId.value + "]", varId.location);
            return null;
        };
        SAnalyzer.prototype.checkExprType = function (expr) {
            this.printStage("Checking for type mismatch in the statement...");
            var exprType;
            var isDigit = /^\d$/;
            var isPlus = /^Add$/;
            var isId = /^[a-z]$/;
            var isBoolVal = /^true|false$/;
            var isBoolOp = /^Equal|Not Equal$/;
            if (isDigit.test(expr.value)) {
                return "int";
            }
            else if (isPlus.test(expr.value)) {
                // make sure intExpr valid
                if (this.checkIntExpr(expr)) {
                    return "int";
                }
                else {
                    return "invalid"; // error handled in intexpr
                }
            }
            else if (isId.test(expr.value)) {
                // check scope of id
                var symbol = this.checkScope(expr, true);
                if (symbol != null) {
                    return symbol.type;
                }
                else {
                    // undeclared/out-of-scope error handled already
                    return "invalid";
                }
            }
            else if (isBoolVal.test(expr.value)) {
                return "boolean";
            }
            else if (isBoolOp.test(expr.value)) {
                if (this.checkBoolExpr(expr)) {
                    return "boolean";
                }
                else {
                    return "invalid"; // error handled in boolexpr
                }
            }
            else {
                // last is string
                return "string";
            }
        };
        SAnalyzer.prototype.checkIntExpr = function (expr) {
            var isPlus = /^Add$/;
            var isDigit = /^\d$/;
            // find the last operand
            while (isPlus.test(expr.value)) {
                expr = expr.childrenNodes[1];
            }
            var exprType = this.checkExprType(expr);
            if (exprType == "invalid") {
                // undeclare/out-of-scope error handled already
                return false;
            }
            else if (exprType == "int") {
                return true;
            }
            else {
                // type mismatched error
                this.printError("Type mismatched error. Addition invalid for " + exprType + " [" + expr.value + "]", expr.location);
                return false;
            }
        };
        SAnalyzer.prototype.checkBoolExpr = function (expr) {
            var rightType = this.checkExprType(expr.childrenNodes[0]);
            if (rightType == "invalid") {
                return false; // error already handled
            }
            else {
                var leftType = this.checkExprType(expr.childrenNodes[1]);
                if (leftType == "invalid") {
                    return false; // error already handled
                }
                else {
                    if (rightType == leftType) {
                        return true;
                    }
                    else {
                        // type mismatch
                        this.printError("Type mismatched error. Cannot compare " + rightType + " with " + leftType, expr.location);
                        return false;
                    }
                }
            }
        };
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
            this.asTree.addBranchNode("Assign", AssignChildren[1].location); // =
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
                    var stringVal = this.analyzeCharList(exprType.childrenNodes[1], "\"");
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
                this.asTree.addBranchNode("Add", IntChildren[1].childrenNodes[0].location); // intop
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
                var boolop = (BoolChildren[2].childrenNodes[0].value == "==") ? "Equal" : "NotEqual";
                this.asTree.addBranchNode(boolop, BoolChildren[2].childrenNodes[0].location); // the boolop
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
