///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="token.ts" />
/* ------------
Parser.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Parser = /** @class */ (function () {
        function Parser() {
        }
        /*
        1. <Program> -> <Block> $
        2. <Block> -> <StatementList>
        3. <StatementList> -> <Statement> <StatementList>
        4.                 -> end
        5. <Statement> -> <PrintStatement>
        6.             -> <AssignmentStatement>
        7.             -> <VarDecl>
        8.             -> <WhileStatement>
        9.             -> <IfStatement>
        10.            -> <Block>
        11. <PrintStatement> -> print (<Expr>)
        12. <AssignmentStatement> -> <Id> = <Expr>
        13. <VarDecl> -> type Id
        14. <WhileStatement> -> while <BooleanExpr> <Block>
        15. <IfStatement> -> if <BooleanExpr> <Block>
        16. <Expr> -> <IntExpr>
        17.        -> <StringExpr>
        18.        -> <BooleanExpr>
        19.        -> <Id>
        20. <IntExpr> -> <digit> <intop> <Expr>
        21.           -> <digit>
        22. <StringExpr> -> " <CharList> "
        23. <BooleanExpr> -> (<Expr> <boolop> <Expr>)
        24.               -> <boolval>
        25. <Id> -> <char>
        26. <CharList> -> <char> <CharList>
        27.            -> <space> <CharList>
        28.            -> end
        29. <type> -> <int> | <string> | <boolean>
        30. <char> -> <a> | <b> | ...
        31. <space> -> space
        32. <digit> -> <0> | <1> | ...
        33. <boolop> -> <==> | <!=>
        34. <boolval> -> <false> | <true>
        35. <intop> -> <+>
        */
        Parser.prototype.start = function (tokenBank) {
            this.tokenBank = tokenBank.reverse();
            // let currToken = tokenBank.pop();
            this.csTree = new Compiler.Tree();
            this.csTree.addBranchNode("Program");
            if (this.parseBlock()) {
                var currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_EOP")) {
                    return this.csTree;
                }
            }
            return null;
        };
        Parser.prototype.parseBlock = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_OpenBracket")) {
                if (this.parseStmtList()) {
                    currToken = this.tokenBank.pop();
                    if (currToken.isEqual("T_CloseBracket")) {
                        return true;
                    }
                }
            }
            return false;
        };
        Parser.prototype.parseStmtList = function () {
            var currToken = this.tokenBank.pop();
            if (this.parsePrintStmt() || this.parseAssignStmt()
                || this.parseVarDecl() || this.parseWhileStmt()
                || this.parseIfStmt() || this.parseBlock()) {
                if (this.parseStmtList()) {
                    // umm...
                }
                else {
                    return false;
                }
            }
            else {
                // can be empty
                return true;
            }
        };
        // done?
        Parser.prototype.parsePrintStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Print")) {
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_OpenParen")) {
                    if (this.parseExpr()) {
                        currToken = this.tokenBank.pop();
                        if (currToken.isEqual("T_CloseParen")) {
                            return true;
                        }
                        else {
                            // expected )
                            return false;
                        }
                    }
                    else {
                        // expected expr
                        return false;
                    }
                }
                else {
                    // expected open paren
                    return false;
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        Parser.prototype.parseAssignStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Id")) {
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_Assignment")) {
                    if (this.parseExpr()) {
                        return true;
                    }
                    else {
                        // expected expr
                        return false;
                    }
                }
                else {
                    // expected assignment
                    return false;
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        Parser.prototype.parseVarDecl = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_VarType")) {
                this.csTree.addBranchNode(currToken.tValue);
                if (this.parseId()) {
                    return true;
                }
                else {
                    //error, expected id
                    return false;
                }
            }
            else {
                // no error
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        Parser.prototype.parseWhileStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_While")) {
                this.csTree.addBranchNode(currToken.tValue);
                if (this.parseBoolExpr()) {
                    if (this.parseBlock()) {
                        return true;
                    }
                    else {
                        // expected block
                        return false;
                    }
                }
                else {
                    // expected boolexpr
                    return false;
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        Parser.prototype.parseIfStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_If")) {
                this.csTree.addBranchNode(currToken.tValue);
                if (this.parseBoolExpr()) {
                    if (this.parseBlock()) {
                        return true;
                    }
                    else {
                        // expected block
                        return false;
                    }
                }
                else {
                    // expected boolexpr
                    return false;
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done?
        Parser.prototype.parseExpr = function () {
            if (this.parseIntExpr() || this.parseStrExpr()
                || this.parseBoolExpr() || this.parseId()) {
                return true;
            }
            else {
                return false;
            }
        };
        Parser.prototype.parseIntExpr = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Digit")) {
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_Addition")) {
                    if (this.parseExpr()) {
                        return true;
                    }
                    else {
                        // expected parseExpr
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
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseStrExpr = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Quote")) {
                if (this.parseCharList()) {
                    var currToken_1 = this.tokenBank.pop();
                    if (currToken_1.isEqual("T_CloseQuote")) {
                        return true;
                    }
                    else {
                        // throuw error
                        this.tokenBank.push(currToken_1);
                        return false;
                    }
                }
            }
            else {
                // dont throw error
                this.tokenBank.push(currToken);
                return false;
            }
        };
        // done ?
        Parser.prototype.parseBoolExpr = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_OpenParen")) {
                this.csTree.addBranchNode(currToken.tValue);
                if (this.parseExpr()) {
                    currToken = this.tokenBank.pop();
                    if (currToken.isEqual("T_NotEqual") || currToken.isEqual("T_Equal")) {
                        this.csTree.addBranchNode(currToken.tValue);
                        if (this.parseExpr()) {
                            currToken = this.tokenBank.pop();
                            if (currToken.isEqual("T_CloseParen")) {
                                this.csTree.addBranchNode(currToken.tValue);
                                return true;
                            }
                            else {
                                // expected close paren
                                this.tokenBank.push(currToken);
                                return false;
                            }
                        }
                        // expected expr
                        return false;
                    }
                    else {
                        // expected boolop
                        this.tokenBank.push(currToken);
                        return false;
                    }
                }
                // expected expr
                return false;
            }
            else if (currToken.isEqual("T_BoolVal")) {
                this.csTree.addBranchNode(currToken.tValue);
                return true;
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseCharList = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Char") || currToken.isEqual("T_Space")) {
                this.csTree.addBranchNode(currToken.tValue);
                return this.parseCharList();
            }
            else {
                // add node or no?
                this.tokenBank.push(currToken);
                return true;
                // can be empty string
            }
        };
        Parser.prototype.parseId = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Id")) {
                this.csTree.addBranchNode(currToken.tValue);
                return true;
            }
            else {
                this.tokenBank.push(currToken);
                return false;
                // no need to report error
            }
        };
        Parser.prototype.printError = function () {
        };
        return Parser;
    }());
    Compiler.Parser = Parser;
})(Compiler || (Compiler = {}));
