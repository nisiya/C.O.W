///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
///<reference path="token.ts" />
/* ------------
Parser.ts

Requires global.ts, tree.ts, symbol.ts, and token.ts
------------ */
var Compiler;
(function (Compiler) {
    var Parser = /** @class */ (function () {
        function Parser() {
        }
        // 1. <Program> -> <Block> $
        Parser.prototype.start = function (tokenBank) {
            // need to start with first token
            this.tokenBank = tokenBank.reverse();
            this.error = false;
            this.printStage("parse()");
            this.csTree = new Compiler.Tree("Program", [0, 0]);
            // this.symbolTable = new Array<Symbol>();
            this.printStage("parseProgram()");
            if (this.parseBlock(false)) {
                if (this.error) {
                    // Program was found but there were errors in it
                    return null;
                }
                // true = finished parsing body of program
                this.csTree.moveUp(); // to Program
                this.currentToken = this.tokenBank.pop();
                // check for [$]
                if (this.currentToken.isEqual("T_EOP")) {
                    this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                    return this.csTree;
                }
                else {
                    // Expected [$]
                    this.printError("T_EOP", this.currentToken);
                    return null;
                }
            }
            else {
                // Expected start of block [{]
                var errorToken = this.tokenBank.pop();
                this.printError("T_OpenBracket", errorToken);
                return null;
            }
        };
        // 2. <Block> -> { <StatementList> }
        Parser.prototype.parseBlock = function (isAfterStmt) {
            this.currentToken = this.tokenBank.pop();
            // check for [{]
            if (this.currentToken.isEqual("T_OpenBracket")) {
                // Block found
                if (isAfterStmt) {
                    this.printStage("parseStatement");
                    this.csTree.addBranchNode("Statement", [this.currentToken.tLine, this.currentToken.tColumn]);
                }
                this.printStage("parseBlock()");
                this.csTree.addBranchNode("Block", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                if (this.parseStmtList()) {
                    if (this.error) {
                        // Block was found but there were errors inside
                        return true;
                    }
                    // true = finished parsing body of block
                    this.currentToken = this.tokenBank.pop();
                    //check for [}]
                    if (this.currentToken.isEqual("T_CloseBracket")) {
                        this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                        return true;
                    }
                    else {
                        // Expected [}]
                        this.printError("T_CloseBracket", this.currentToken);
                        return false;
                    }
                }
                else {
                    return true; // means statement list is epsilon
                }
            }
            else {
                // Block not found, error depends on previous function
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 3. <StatementList> -> <Statement> <StatementList>
        // 4.                 -> end
        Parser.prototype.parseStmtList = function () {
            this.csTree.addBranchNode("StatementList", [this.currentToken.tLine, this.currentToken.tColumn]);
            this.printStage("parseStatementList()");
            if (this.parseStatement()) {
                this.csTree.moveUp(); // to StatementList
                return this.parseStmtList();
            }
            else {
                while (this.csTree.current.value == "StatementList") {
                    this.csTree.moveUp();
                }
                return true;
            }
        };
        /*
        * 5. <Statement> -> <PrintStatement>
        * 6.             -> <AssignmentStatement>
        * 7.             -> <VarDecl>
        * 8.             -> <WhileStatement>
        * 9.             -> <IfStatement>
        * 10.            -> <Block>
        */
        Parser.prototype.parseStatement = function () {
            if (this.parseBlock(true) || this.parsePrintStmt() || this.parseAssignStmt()
                || this.parseVarDecl() || this.parseWhileStmt() || this.parseIfStmt()) {
                if (this.error) {
                    // Statement was found but there were errors inside
                    return false;
                }
                else {
                    this.csTree.moveUp(); // to Statement
                    return true;
                }
            }
            else {
                // can be epsilon
                return false;
            }
        };
        // 11. <PrintStatement> -> print (<Expr>)
        Parser.prototype.parsePrintStmt = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_Print")) {
                // PrintStatement found
                this.printStage("parseStatement");
                this.csTree.addBranchNode("Statement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parsePrintStatement()");
                this.csTree.addBranchNode("PrintStatement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.currentToken = this.tokenBank.pop();
                // check for [(]
                if (this.currentToken.isEqual("T_OpenParen")) {
                    this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                    if (this.parseExpr()) {
                        this.csTree.moveUp(); // to PrintExpr
                        this.currentToken = this.tokenBank.pop();
                        // check for [)]
                        if (this.currentToken.isEqual("T_CloseParen")) {
                            this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                            return true;
                        }
                        else {
                            // Expected [])]
                            this.tokenBank.push(this.currentToken);
                            this.printError("T_CloseParen", this.currentToken);
                            return true;
                        }
                    }
                    else {
                        // Expected [Expr]
                        this.printError("Expr", this.currentToken);
                        return true;
                    }
                }
                else {
                    // Expected [(]
                    this.printError("T_OpenParen", this.currentToken);
                    return true;
                }
            }
            else {
                // go back to parseStmtList to check other production
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 12. <AssignmentStatement> -> <Id> = <Expr>
        Parser.prototype.parseAssignStmt = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_Id")) {
                // AssignmentStatement found
                this.printStage("parseStatement");
                this.csTree.addBranchNode("Statement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addBranchNode("AssignmentStatement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseAssignmentStatement()");
                this.csTree.addBranchNode("Id", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseId()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.moveUp(); // to AssignmentStatement
                this.currentToken = this.tokenBank.pop();
                if (this.currentToken.isEqual("T_Assignment")) {
                    this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                    if (this.parseExpr()) {
                        this.csTree.moveUp(); // to AssignmentStatement
                        // this.csTree.moveUp(); // to stmt list
                        return true;
                    }
                    else {
                        // Expected [Expr]
                        this.printError("Expr", this.currentToken);
                        return true;
                    }
                }
                else {
                    // Expected [=]
                    this.printError("T_Assignment", this.currentToken);
                    return true;
                }
            }
            else {
                // go back to parseStmtList to check other productions
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 13. <VarDecl> -> type Id
        Parser.prototype.parseVarDecl = function () {
            this.currentToken = this.tokenBank.pop();
            // 29. <type> -> <int> | <string> | <boolean>
            if (this.currentToken.isEqual("T_VarType")) {
                this.printStage("parseStatement");
                this.csTree.addBranchNode("Statement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addBranchNode("VarDecl", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseVarDecl()");
                this.csTree.addBranchNode("type", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.moveUp(); // to VarDecl
                if (this.parseId()) {
                    this.csTree.moveUp(); // to VarDecl
                    var currentNode = this.csTree.current;
                    // let symbol: Symbol = new Symbol(this.currentToken.tValue, currentNode.childrenNodes[0].childrenNodes[0].value, this.currentToken.tLine);
                    // this.symbolTable.push(symbol);
                    return true;
                }
                else {
                    this.printError("T_Id", this.currentToken);
                    return true;
                }
            }
            else {
                // return to parseStmtList to evaluate other production
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 14. <WhileStatement> -> while <BooleanExpr> <Block>
        Parser.prototype.parseWhileStmt = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_While")) {
                this.printStage("parseStatement");
                this.csTree.addBranchNode("Statement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addBranchNode("WhileStatement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseWhileStatement()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                if (this.parseBoolExpr()) {
                    this.csTree.moveUp(); // to WhileStatement
                    if (this.parseBlock(false)) {
                        this.csTree.moveUp(); // to WhileStatement
                        return true;
                    }
                    else {
                        // Expected block
                        this.printError("Block", this.currentToken);
                        return true;
                    }
                }
                else {
                    // Expected boolexpr
                    this.printError("BoolExpr", this.currentToken);
                    return true;
                }
            }
            else {
                // return to parseStmtList to evaluate other productions
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 15. <IfStatement> -> if <BooleanExpr> <Block>
        Parser.prototype.parseIfStmt = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_If")) {
                this.printStage("parseStatement");
                this.csTree.addBranchNode("Statement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addBranchNode("IfStatement", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseIfStatement()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                if (this.parseBoolExpr()) {
                    this.csTree.moveUp(); // to IfStatement
                    if (this.parseBlock(false)) {
                        this.csTree.moveUp(); // to IfStatement
                        return true; // current = IfStatement
                    }
                    else {
                        // Expected block
                        this.printError("Block", this.currentToken);
                        return true;
                    }
                }
                else {
                    // Expected boolexpr
                    this.printError("BoolExpr", this.currentToken);
                    return true;
                }
            }
            else {
                // return to parseStmtList to evaluate other productions
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        /*
         * 16. <Expr> -> <IntExpr>
         * 17.        -> <StringExpr>
         * 18.        -> <BooleanExpr>
         * 19.        -> <Id>
         */
        Parser.prototype.parseExpr = function () {
            this.csTree.addBranchNode("Expr", [this.currentToken.tLine, this.currentToken.tColumn]);
            if (this.parseIntExpr() || this.parseStrExpr()
                || this.parseBoolExpr() || this.parseId()) {
                this.printStage("parseExpr()");
                this.csTree.moveUp(); // to Expr
                return true;
            }
            else {
                // previous function decides error
                return false;
            }
        };
        // 20. <IntExpr> -> <digit> <intop> <Expr>
        // 21.           -> <digit>
        Parser.prototype.parseIntExpr = function () {
            this.currentToken = this.tokenBank.pop();
            // 32. <digit> -> <0> | <1> | ...
            if (this.currentToken.isEqual("T_Digit")) {
                // IntExpr found
                this.csTree.addBranchNode("IntExpr", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseIntExpr()");
                this.csTree.addBranchNode("digit", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.moveUp(); // to IntExpr
                this.currentToken = this.tokenBank.pop();
                // 35. <intop> -> <+>
                if (this.currentToken.isEqual("T_Addition")) {
                    this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                    if (this.parseExpr()) {
                        this.csTree.moveUp(); // to IntExpr
                        return true;
                    }
                    else {
                        // Expected Expr
                        this.printError("Expr", this.currentToken);
                        return false;
                    }
                }
                else {
                    // just digit, still valid
                    this.tokenBank.push(this.currentToken);
                    return true;
                }
            }
            else {
                // return to parseExpr to evaluate other production
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 22. <StringExpr> -> " <CharList> "
        Parser.prototype.parseStrExpr = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_OpenQuote")) {
                // StringExpr found
                this.csTree.addBranchNode("StringExpr", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseStringExpr()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                if (this.parseCharList()) {
                    this.currentToken = this.tokenBank.pop();
                    if (this.currentToken.isEqual("T_CloseQuote")) {
                        this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                        return true;
                    }
                    else {
                        this.printError("T_CloseQuote", this.currentToken);
                        this.tokenBank.push(this.currentToken);
                        return false;
                    }
                } // will always return true, empty char returns true
            }
            else {
                // return to parseExpr to evaluate other productions
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 23. <BooleanExpr> -> (<Expr> <boolop> <Expr>)
        // 24.               -> <boolval>
        Parser.prototype.parseBoolExpr = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_OpenParen")) {
                this.csTree.addBranchNode("BooleanExpr", [this.currentToken.tLine, this.currentToken.tColumn]);
                ;
                this.printStage("parseBooleanExpr()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                if (this.parseExpr()) {
                    this.csTree.moveUp(); // to BoolExpr
                    this.currentToken = this.tokenBank.pop();
                    // 33. <boolop> -> <==> | <!=>
                    if (this.currentToken.isEqual("T_NotEqual") || this.currentToken.isEqual("T_Equal")) {
                        this.csTree.addBranchNode("boolop", [this.currentToken.tLine, this.currentToken.tColumn]);
                        this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                        this.csTree.moveUp(); // to BoolExpr
                        if (this.parseExpr()) {
                            this.csTree.moveUp(); // to BoolExpr
                            this.currentToken = this.tokenBank.pop();
                            if (this.currentToken.isEqual("T_CloseParen")) {
                                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                                return true;
                            }
                            else {
                                // Expected [)]
                                this.printError("T_CloseParen", this.currentToken);
                                this.tokenBank.push(this.currentToken);
                                return false;
                            }
                        }
                        //Expected expr
                        this.printError("Expr", this.currentToken);
                        return false;
                    }
                    else {
                        this.tokenBank.push(this.currentToken);
                        this.printError("BoolOp", this.currentToken);
                        return false;
                    }
                }
                // Expected expr
                this.printError("Expr", this.currentToken);
                return false;
            }
            else if (this.currentToken.isEqual("T_BoolVal")) {
                // 34. <boolval> -> <false> | <true>
                this.csTree.addBranchNode("BooleanExpr", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addBranchNode("boolval", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.moveUp(); // to BoolExpr
                return true;
            }
            else {
                // previous function will handle errors
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        /*
         * 26. <CharList> -> <char> <CharList>
         * 27.            -> <space> <CharList>
         * 28.            -> end
         */
        Parser.prototype.parseCharList = function () {
            this.csTree.addBranchNode("CharList", [this.currentToken.tLine, this.currentToken.tColumn]);
            this.printStage("parseCharList()");
            var space = /[ ]/;
            if (this.parseSpace() || this.parseChar()) {
                return this.parseCharList();
            }
            else {
                while (this.csTree.current.value == "CharList") {
                    this.csTree.moveUp();
                }
                return true;
            }
        };
        // 30. <char> -> a | b | ...
        Parser.prototype.parseChar = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_Char")) {
                this.csTree.addBranchNode("char", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseChar()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.moveUp(); // to CharList
                return true;
            }
            else {
                // can be empty string
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 31. <space> -> the space character
        Parser.prototype.parseSpace = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_Space")) {
                this.csTree.addBranchNode("space", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseSpace()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                this.csTree.moveUp(); // to CharList
                return true;
            }
            else {
                // can be empty string
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        // 25. <Id> -> <char>
        Parser.prototype.parseId = function () {
            this.currentToken = this.tokenBank.pop();
            if (this.currentToken.isEqual("T_Id")) {
                this.csTree.addBranchNode("Id", [this.currentToken.tLine, this.currentToken.tColumn]);
                this.printStage("parseId()");
                this.csTree.addLeafNode(this.currentToken.tValue, [this.currentToken.tLine, this.currentToken.tColumn]);
                return true;
            }
            else {
                // previous function will report error
                this.tokenBank.push(this.currentToken);
                return false;
            }
        };
        Parser.prototype.printError = function (expectedVal, token) {
            if (!this.error) {
                var log = document.getElementById("log");
                log.value += "\n   PARSER --> ERROR! Expected [" + expectedVal + "] got [" + token.tid + "] with value '"
                    + token.tValue + "' on line " + token.tLine + ", column " + token.tColumn;
                log.value += "\n   PARSER --> Parse failed with 1 error";
                log.scrollTop = log.scrollHeight;
                this.error = true;
            }
        };
        Parser.prototype.printStage = function (stage) {
            if (_VerboseMode) {
                var log = document.getElementById("log");
                log.value += "\n   PARSER --> " + stage;
                log.scrollTop = log.scrollHeight;
            }
        };
        return Parser;
    }());
    Compiler.Parser = Parser;
})(Compiler || (Compiler = {}));
