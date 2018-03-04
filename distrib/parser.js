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
            this.tokenBank = tokenBank.reverse();
            this.error = false;
            this.printStage("parse()");
            this.csTree = new Compiler.Tree("Program");
            this.symbolTable = new Array();
            this.printStage("parseProgram()");
            if (this.parseBlock()) {
                var currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_EOP")) {
                    this.csTree.addLeafNode(currToken.tValue);
                    // finished
                    this.printStage("Parse completed successfully");
                    var symbolTable = this.symbolTable;
                    return [this.csTree, symbolTable];
                }
                else {
                    this.printError("T_EOP", currToken);
                    return null;
                }
            }
            else {
                var errorToken = this.tokenBank.pop();
                if (!this.error) {
                    this.printError("T_OpenBracket", errorToken);
                    this.error = true;
                }
                return null;
            }
        };
        // 2. <Block> -> { <StatementList> }
        Parser.prototype.parseBlock = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_OpenBracket")) {
                // this.print("{", currToken.tValue);
                this.printStage("parseBlock()");
                this.csTree.addBranchNode("Block");
                this.csTree.addLeafNode(currToken.tValue);
                if (this.parseStmtList()) {
                    currToken = this.tokenBank.pop();
                    if (currToken.isEqual("T_CloseBracket")) {
                        // this.print("}", currToken.tValue);
                        this.csTree.addLeafNode(currToken.tValue);
                        return true;
                    }
                    else {
                        // expected } error
                        if (!this.error) {
                            this.printError("T_CloseBracket", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                }
                else {
                    // error will already be handled in recursion
                    return false;
                }
            }
            else {
                // expected { error
                // this.printError("{", currToken.tValue);
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // 3. <StatementList> -> <Statement> <StatementList>
        // 4.                 -> end
        Parser.prototype.parseStmtList = function () {
            this.csTree.addBranchNode("StatementList");
            this.printStage("parseStatementList()");
            /*
             * 5. <Statement> -> <PrintStatement>
             * 6.             -> <AssignmentStatement>
             * 7.             -> <VarDecl>
             * 8.             -> <WhileStatement>
             * 9.             -> <IfStatement>
             * 10.            -> <Block>
             */
            if (this.parsePrintStmt() || this.parseAssignStmt()
                || this.parseVarDecl() || this.parseWhileStmt()
                || this.parseIfStmt() || this.parseBlock()) {
                this.printStage("parseStatement()");
                this.csTree.moveUp(); // to Statement
                this.csTree.moveUp(); // to StatementList
                return this.parseStmtList();
            }
            else {
                // can be empty
                this.csTree.moveUp(); // back to Block
                return true;
            }
        };
        // done?
        // 11. <PrintStatement> -> print (<Expr>)
        Parser.prototype.parsePrintStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Print")) {
                // start of print statement
                this.csTree.addBranchNode("Statement");
                this.csTree.addBranchNode("PrintStatement");
                this.printStage("parsePrintStatement()");
                this.csTree.addLeafNode(currToken.tValue);
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_OpenParen")) {
                    this.csTree.addLeafNode(currToken.tValue);
                    if (this.parseExpr()) {
                        currToken = this.tokenBank.pop();
                        if (currToken.isEqual("T_CloseParen")) {
                            this.csTree.addLeafNode(currToken.tValue);
                            return true; // current = PrintStatement
                        }
                        else {
                            // expected )
                            if (!this.error) {
                                this.printError("T_CloseParen", currToken);
                                this.error = true;
                            }
                            return false;
                        }
                    }
                    else {
                        // expected expr
                        if (!this.error) {
                            this.printError("Expr", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                }
                else {
                    // expected (
                    if (!this.error) {
                        this.printError("T_OpenParen", currToken);
                        this.error = true;
                    }
                    return false;
                }
            }
            else {
                // go back to parseStmtList to check other conditions
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        // 12. <AssignmentStatement> -> <Id> = <Expr>
        Parser.prototype.parseAssignStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Id")) {
                // start of AssignmentStatement
                this.csTree.addBranchNode("Statement");
                this.csTree.addBranchNode("AssignmentStatement");
                this.printStage("parseAssignmentStatement()");
                this.csTree.addBranchNode("Id");
                this.printStage("parseId()");
                this.csTree.addLeafNode(currToken.tValue);
                this.csTree.moveUp();
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_Assignment")) {
                    this.csTree.addLeafNode(currToken.tValue);
                    if (this.parseExpr()) {
                        return true; // current = AssignmentStatements
                    }
                    else {
                        // expected expr
                        if (!this.error) {
                            this.printError("Expr", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                }
                else {
                    // expected =
                    if (!this.error) {
                        this.printError("T_Assignment", currToken);
                        this.error = true;
                    }
                    return false;
                }
            }
            else {
                // go back to parseStmtList to check other conditions
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        // 13. <VarDecl> -> type Id
        Parser.prototype.parseVarDecl = function () {
            var currToken = this.tokenBank.pop();
            // 29. <type> -> <int> | <string> | <boolean>
            if (currToken.isEqual("T_VarType")) {
                // this.print("T_VarType", currToken.tValue);
                this.csTree.addBranchNode("Statement");
                this.csTree.addBranchNode("VarDecl");
                this.printStage("parseVarDecl()");
                this.csTree.addBranchNode("type");
                this.csTree.addLeafNode(currToken.tValue);
                this.csTree.moveUp();
                if (this.parseId()) {
                    var currentNode = this.csTree.current;
                    var symbol = new Compiler.Symbol(currentNode.childrenNode[1].childrenNode[0].value, currentNode.childrenNode[0].childrenNode[0].value);
                    this.symbolTable.push(symbol);
                    return true; // current = VarDecl
                }
                else {
                    if (!this.error) {
                        this.printError("T_Id", currToken);
                        this.error = true;
                    }
                    return false;
                }
            }
            else {
                // return to parseStmtList to evaluate other production
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        // 14. <WhileStatement> -> while <BooleanExpr> <Block>
        Parser.prototype.parseWhileStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_While")) {
                this.csTree.addBranchNode("Statement");
                this.csTree.addBranchNode("WhileStatement");
                this.printStage("parseWhileStatement()");
                this.csTree.addLeafNode(currToken.tValue);
                if (this.parseBoolExpr()) {
                    if (this.parseBlock()) {
                        return true; // current = WhileStatement
                    }
                    else {
                        // expected block
                        if (!this.error) {
                            this.printError("Block", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                }
                else {
                    // expected boolexpr
                    if (!this.error) {
                        this.printError("BoolExpr", currToken);
                        this.error = true;
                    }
                    return false;
                }
            }
            else {
                // return to parseStmtList to evaluate other productions
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        // 15. <IfStatement> -> if <BooleanExpr> <Block>
        Parser.prototype.parseIfStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_If")) {
                this.csTree.addBranchNode("Statement");
                this.csTree.addBranchNode("IfStatement");
                this.printStage("parseIfStatement()");
                this.csTree.addLeafNode(currToken.tValue);
                if (this.parseBoolExpr()) {
                    if (this.parseBlock()) {
                        return true; // current = IfStatement
                    }
                    else {
                        // expected block
                        if (!this.error) {
                            this.printError("Block", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                }
                else {
                    // expected boolexpr
                    if (!this.error) {
                        this.printError("BoolExpr", currToken);
                        this.error = true;
                    }
                    return false;
                }
            }
            else {
                // return to parseStmtList to evaluate other productions
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        /*
         * 16. <Expr> -> <IntExpr>
         * 17.        -> <StringExpr>
         * 18.        -> <BooleanExpr>
         * 19.        -> <Id>
         */
        Parser.prototype.parseExpr = function () {
            this.csTree.addBranchNode("Expr");
            if (this.parseIntExpr() || this.parseStrExpr()
                || this.parseBoolExpr() || this.parseId()) {
                this.printStage("parseExpr()");
                this.csTree.moveUp(); // before Expr
                return true;
            }
            else {
                // parent decide error
                return false;
            }
        };
        // 20. <IntExpr> -> <digit> <intop> <Expr>
        // 21.           -> <digit>
        Parser.prototype.parseIntExpr = function () {
            var currToken = this.tokenBank.pop();
            // 32. <digit> -> <0> | <1> | ...
            if (currToken.isEqual("T_Digit")) {
                // start of IntExpr
                this.csTree.addBranchNode("IntExpr");
                this.printStage("parseIntExpr()");
                this.csTree.addBranchNode("digit");
                this.csTree.addLeafNode(currToken.tValue);
                this.csTree.moveUp();
                currToken = this.tokenBank.pop();
                // 35. <intop> -> <+>
                if (currToken.isEqual("T_Addition")) {
                    this.csTree.addLeafNode(currToken.tValue);
                    if (this.parseExpr()) {
                        return true;
                    }
                    else {
                        // expected Expr
                        if (!this.error) {
                            this.printError("Expr", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                }
                else {
                    // just digit, still valid
                    this.tokenBank.push(currToken);
                    return true;
                }
            }
            else {
                // return to parseExpr to evaluate other production
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // 22. <StringExpr> -> " <CharList> "
        Parser.prototype.parseStrExpr = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_OpenQuote")) {
                // start of StringExpr
                this.csTree.addBranchNode("StringExpr");
                this.printStage("parseStringExpr()");
                this.csTree.addLeafNode(currToken.tValue);
                if (this.parseCharList()) {
                    var currToken_1 = this.tokenBank.pop();
                    if (currToken_1.isEqual("T_CloseQuote")) {
                        this.csTree.addLeafNode(currToken_1.tValue);
                        return true;
                    }
                    else {
                        if (!this.error) {
                            this.printError("T_CloseQuote", currToken_1);
                            this.error = true;
                        }
                        this.tokenBank.push(currToken_1);
                        return false;
                    }
                } // will always return true, empty char returns true
            }
            else {
                // return to parseExpr to evaluate other productions
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done ?
        // 23. <BooleanExpr> -> (<Expr> <boolop> <Expr>)
        // 24.               -> <boolval>
        Parser.prototype.parseBoolExpr = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_OpenParen")) {
                this.csTree.addBranchNode("BooleanExpr");
                this.printStage("parseBooleanExpr()");
                this.csTree.addLeafNode(currToken.tValue);
                if (this.parseExpr()) {
                    currToken = this.tokenBank.pop();
                    // 33. <boolop> -> <==> | <!=>
                    if (currToken.isEqual("T_NotEqual") || currToken.isEqual("T_Equal")) {
                        this.csTree.addBranchNode("boolop");
                        this.csTree.addLeafNode(currToken.tValue);
                        this.csTree.moveUp();
                        if (this.parseExpr()) {
                            currToken = this.tokenBank.pop();
                            if (currToken.isEqual("T_CloseParen")) {
                                this.csTree.addLeafNode(currToken.tValue);
                                return true;
                            }
                            else {
                                // expected )
                                if (!this.error) {
                                    this.printError("T_CloseParen", currToken);
                                    this.error = true;
                                }
                                this.tokenBank.push(currToken);
                                return false;
                            }
                        }
                        // expected expr
                        if (!this.error) {
                            this.printError("Expr", currToken);
                            this.error = true;
                        }
                        return false;
                    }
                    else {
                        if (!this.error) {
                            this.printError("BoolOp", currToken);
                            this.error = true;
                        }
                        this.tokenBank.push(currToken);
                        return false;
                    }
                }
                // expected expr
                if (!this.error) {
                    this.printError("Expr", currToken);
                    this.error = true;
                }
                return false;
            }
            else if (currToken.isEqual("T_BoolVal")) {
                // 34. <boolval> -> <false> | <true>
                this.csTree.addBranchNode("BooleanExpr");
                this.csTree.addBranchNode("boolval");
                this.csTree.addLeafNode(currToken.tValue);
                this.csTree.moveUp();
                return true; // 
            }
            else {
                // parent will handle errors
                this.tokenBank.push(currToken);
                return false;
            }
        };
        /*
         * 26. <CharList> -> <char> <CharList>
         * 27.            -> <space> <CharList>
         * 28.            -> end
         */
        Parser.prototype.parseCharList = function () {
            var currToken = this.tokenBank.pop();
            // 30. <char> -> <a> | <b> | ...
            // 31. <space> -> space
            if (currToken.isEqual("T_Char") || currToken.isEqual("T_Space")) {
                this.csTree.addBranchNode("CharList");
                this.printStage("parseCharList()");
                this.csTree.addBranchNode("char");
                this.csTree.addLeafNode(currToken.tValue);
                this.csTree.moveUp();
                return this.parseCharList();
            }
            else {
                // can be empty string
                this.csTree.moveUp(); // back to StringExpr
                this.tokenBank.push(currToken);
                return true;
            }
        };
        // 25. <Id> -> <char>
        Parser.prototype.parseId = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Id")) {
                // this.print("T_Id", currToken.tValue);
                this.csTree.addBranchNode("Id");
                this.printStage("parseId()");
                this.csTree.addLeafNode(currToken.tValue);
                this.csTree.moveUp();
                return true;
            }
            else {
                // parent will report error
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.printError = function (expectedVal, token) {
            var log = document.getElementById("log");
            log.value += "\n   PARSER --> ERROR! Expected [" + expectedVal + "] got [" + token.tid + "] with value '"
                + token.tValue + "' on line " + token.tLine + ", column " + token.tColumn;
            log.value += "\n   PARSER --> Parse failed with 1 error";
            log.scrollTop = log.scrollHeight;
        };
        // public print(expectedVal: string, foundVal: string): void{
        //   let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
        //   log.value += "\n   PARSER --> PASSED! Expected [" + expectedVal + "]. Found [" + foundVal + "].";
        //   log.scrollTop = log.scrollHeight;
        // }
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
