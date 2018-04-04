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
        SAnalyzer.prototype.start = function (csTree, symbols) {
            console.log("SA Start");
            this.warnings = 0;
            // buildAST first
            if (this.buildAST(csTree)) {
                // reverse it to the order it appears in the code
                this.symbols = symbols.reverse();
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
            this.printStage("Constructing AST");
            this.asTree = new Compiler.Tree("Block", 0);
            // Start from initial StatementList
            // tree-program-block-statementlist
            this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]);
            return true;
        };
        SAnalyzer.prototype.scopeTypeCheck = function () {
            this.printStage("Starting scope and type checking");
            this.symbolTable = new Array();
            var currentNode = this.asTree.root;
            this.scopeTree = new Compiler.ScopeTree();
            // start from first node
            return this.checkNode(currentNode);
        };
        // Start of functions used for scope and type checking
        SAnalyzer.prototype.checkNode = function (currentNode) {
            var currentSymbol;
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
                // only time to add symbol to final symbol table
                case "VarDecl":
                    currentSymbol = this.symbols.pop();
                    if (currentNode.childrenNodes[0].value == currentSymbol.type
                        && currentNode.childrenNodes[1].value == currentSymbol.key) {
                        var updatedSymbol = this.scopeTree.currentScope.addSymbol(currentSymbol);
                        if (updatedSymbol != null) {
                            this.printStage("Adding new symbol [" + updatedSymbol.key + "]");
                            this.symbolTable.push(updatedSymbol);
                        }
                        else {
                            // redeclaration error
                            this.printError("Redeclared identifier in the same scope", currentSymbol.line);
                            return false;
                        }
                    }
                    else {
                        // won't get here. condition checked just to make sure
                    }
                    return true; // no errors
                // almost same subtree layout for ones below
                case "=":
                    return this.checkChildren(currentNode);
                case "!=":
                    return this.checkChildren(currentNode);
                case "==":
                    return this.checkChildren(currentNode);
                // print only has one child
                case "print":
                    // if id, do scope check
                    var id = /^[a-z]$/;
                    if (id.test(currentNode.childrenNodes[0].value)) {
                        var symbol = this.checkScope(currentNode.childrenNodes[0].value);
                        if (symbol != null) {
                            if (!symbol.initialized) {
                                // warning
                                this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[0].line);
                            }
                        }
                        else {
                            // error!
                            this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[0].line);
                            return false;
                        }
                    }
                    return true; // else no need to check for string
                // while and if have same subtree layout
                case "while":
                    if (this.checkNode(currentNode.childrenNodes[0])) {
                        return this.checkNode(currentNode.childrenNodes[1]); // the block
                    }
                    return false; // not successful, error printed in previous checks
                case "if":
                    if (this.checkNode(currentNode.childrenNodes[0])) {
                        return this.checkNode(currentNode.childrenNodes[1]); // the block
                    }
                    return false; // not successful, error printed in previous checks
                default:
                    // won't get here, but always need a default statement
                    return true;
            }
        };
        // check the two children for =, !=, and ==
        SAnalyzer.prototype.checkChildren = function (currentNode) {
            var boolval = /^true|false$/;
            // first child can also be boolval for boolops
            if (boolval.test(currentNode.childrenNodes[0].value)) {
                // if second
                var boolop = /^!=|==$/;
                if (boolval.test(currentNode.childrenNodes[1].value)) {
                    return true;
                }
                else if (boolop.test(currentNode.childrenNodes[1].value)) {
                    return this.checkNode(currentNode.childrenNodes[1]);
                }
                else {
                    var symbol = this.checkScope(currentNode.childrenNodes[1].value);
                    if (symbol != null) {
                        if (!symbol.initialized) {
                            // warning
                            this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[1].line);
                        }
                        // then check type
                        this.printStage("Checking type of [" + symbol.key + "]");
                        // type should be boolean
                        if (symbol.type == "boolean") {
                            return true;
                        }
                        else {
                            // type mismatched error
                            this.printError("Type mismatched error", currentNode.childrenNodes[1].line);
                        }
                    }
                    else {
                        // no symbol found
                        // undeclared/out-of-scope error
                        this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[1].line);
                    }
                }
            }
            else {
                // first check scope
                var symbol = this.checkScope(currentNode.childrenNodes[0].value);
                if (symbol != null) {
                    // for == and !=, check for uninitialized warning
                    if (currentNode.value == "==" || currentNode.value == "!=") {
                        if (!symbol.initialized) {
                            // warning
                            this.printWarning("Use of uninitialized variable", currentNode.childrenNodes[0].line);
                        }
                    }
                    // then check type
                    this.printStage("Checking type of [" + symbol.key + "]");
                    var valueType = void 0;
                    // special case for != and ==, second child is "+"
                    if (currentNode.childrenNodes[1].value == "+") {
                        valueType = this.checkAddition(currentNode.childrenNodes[1]);
                    }
                    else {
                        // case for all
                        valueType = this.findType(currentNode.childrenNodes[1].value);
                    }
                    // if type matches symbol's type
                    if (valueType == symbol.type) {
                        // special case for =, set symbol to be initialized
                        if (currentNode.value == "=") {
                            symbol.initializeSymbol();
                            this.scopeTree.currentScope.updateSymbol(symbol);
                        }
                        return true;
                    }
                    else {
                        if (valueType == "error") {
                            this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[1].line);
                        }
                        else {
                            // type mismatched error
                            this.printError("Type mismatched error", currentNode.childrenNodes[1].line);
                        }
                    }
                }
                else {
                    // no symbol found
                    // undeclared/out-of-scope error
                    this.printError("Use of undeclared/out-of-scope identifier", currentNode.childrenNodes[0].line);
                }
            }
            return false;
        };
        // check for symbol in current and all previous scopes
        SAnalyzer.prototype.checkScope = function (symbolKey) {
            this.printStage("Checking scope of [" + symbolKey + "]");
            var bookmarkScope = this.scopeTree.currentScope;
            var symbol;
            while (this.scopeTree.currentScope != null) {
                symbol = this.scopeTree.currentScope.getSymbol(symbolKey);
                if (symbol != null) {
                    // found symbol, so stop searching
                    this.scopeTree.currentScope = bookmarkScope;
                    break;
                }
                this.scopeTree.moveUp();
            }
            return symbol;
        };
        // type not in AST so we have to tell what it is
        // type -> int | boolean | string
        SAnalyzer.prototype.findType = function (value) {
            var digit = /^\d/;
            var boolval = /^true|false$/;
            if (digit.test(value)) {
                return "int";
            }
            else if (boolval.test(value)) {
                return "boolean";
            }
            else {
                return "string";
            }
        };
        // special case of nested additions
        SAnalyzer.prototype.checkAddition = function (plusNode) {
            var id = /^[a-z]$/;
            var plus = /^\+$/;
            // first child always digit
            // if second child is id, check its scope, type will be checked later
            if (id.test(plusNode.childrenNodes[1].value)) {
                var symbol = this.checkScope(plusNode.childrenNodes[1].value);
                if (symbol != null) {
                    if (!symbol.initialized) {
                        // uninitialized variable warning
                        this.printWarning("Use of uninitialized variable", plusNode.childrenNodes[1].line);
                    }
                    return symbol.type;
                }
                else {
                    return "error";
                }
            }
            else if (plus.test(plusNode.childrenNodes[1].value)) {
                // if second child is still "+", check its children
                return this.checkAddition(plusNode.childrenNodes[1]);
            }
            else {
                return "notInt";
            }
        };
        // Start of functions used to build AST
        // blockChildrens: [ { , StatementList, } ]
        SAnalyzer.prototype.analyzeBlock = function (blockNode) {
            this.asTree.addBranchNode("Block", blockNode.line);
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
            }
        };
        // PrintChildren: [print, ( , Expr, ) ]
        SAnalyzer.prototype.analyzePrint = function (printChildren) {
            this.asTree.addBranchNode(printChildren[0].value, printChildren[0].line); // print
            this.analyzeExpr(printChildren[2]);
            // asTree.current = print
        };
        SAnalyzer.prototype.analyzeAssignment = function (AssignChildren) {
            this.asTree.addBranchNode(AssignChildren[1].value, AssignChildren[1].line); // =
            this.asTree.addLeafNode(this.analyzeId(AssignChildren[0]), AssignChildren[0].line); // id
            this.analyzeExpr(AssignChildren[2]); // Expr's child
            // asTree.current = AssignmentOp
        };
        // VarDeclChildren: [type, Id]
        SAnalyzer.prototype.analyzeVarDecl = function (VarDeclChildren) {
            var type = VarDeclChildren[0];
            this.asTree.addLeafNode(this.analyzeType(VarDeclChildren[0]), VarDeclChildren[0].line); // type
            this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1]), VarDeclChildren[1].line); // id
            // asTree.current = VarDecl
        };
        // WhileChildren: [while, BooleanExpr, Block]
        SAnalyzer.prototype.analyzeWhile = function (whileChildren) {
            this.asTree.addBranchNode(whileChildren[0].value, whileChildren[0].line);
            this.analyzeBoolExpr(whileChildren[1].childrenNodes);
            this.analyzeBlock(whileChildren[2]);
            // asTree.current = while
        };
        // IfChildren: [if, BooleanExpr, Block]
        SAnalyzer.prototype.analyzeIf = function (ifChildren) {
            this.asTree.addBranchNode(ifChildren[0].value, ifChildren[0].line);
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
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].line); // the digit
                // asTree.current = parent of digit
            }
            else {
                this.asTree.addBranchNode(IntChildren[1].value, IntChildren[1].line); // intop
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value, IntChildren[0].childrenNodes[0].line); // the first digit
                this.analyzeExpr(IntChildren[2]); // expr's children
                this.asTree.moveUp();
                // asTree.current = parent of IntExpr
            }
        };
        // BooleanExprChildren: [boolval] or [ ( , Expr, boolop, Expr, ) ]
        SAnalyzer.prototype.analyzeBoolExpr = function (BoolChildren) {
            if (BoolChildren.length == 1) {
                this.asTree.addLeafNode(BoolChildren[0].childrenNodes[0].value, BoolChildren[0].childrenNodes[0].line); // the boolval
                // asTree.current = while
            }
            else {
                this.asTree.addBranchNode(BoolChildren[2].childrenNodes[0].value, BoolChildren[2].childrenNodes[0].line); // the boolop
                this.analyzeExpr(BoolChildren[1]); // asTree.current = boolop
                this.analyzeExpr(BoolChildren[3]);
                this.asTree.moveUp(); // to while
                // asTree.current = while
            }
        };
        // Start of functions for outputs
        // prints error to log
        SAnalyzer.prototype.printError = function (errorType, line) {
            var log = document.getElementById("log");
            log.value += "\n   SEMANTIC ANALYZER --> ERROR! " + errorType + " on line " + line;
            log.value += "\n   SEMANTIC ANALYZER --> Semantic analysis failed with 1 error... Symbol table is not generated for it";
            log.scrollTop = log.scrollHeight;
        };
        // prints warning to log
        SAnalyzer.prototype.printWarning = function (warningType, line) {
            this.warnings++;
            var log = document.getElementById("log");
            log.value += "\n   SEMANTIC ANALYZER --> WARNING! " + warningType + " on line " + line;
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
