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
            if (this.parsePrintStmt()) {
                this.parseStmtList();
            }
            else if (this.parseAssignStmt()) {
                this.parseStmtList();
            }
            else if (this.parseVarDecl()) {
                this.parseStmtList();
            }
            else if (this.parseWhileStmt()) {
                this.parseStmtList();
            }
            else if (this.parseIfStmt()) {
                this.parseStmtList();
            }
            else if (this.parseBlock()) {
                this.parseStmtList();
            }
            else {
                return true;
            }
        };
        Parser.prototype.parsePrintStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Print")) {
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_OpenParen")) {
                    if (this.parseExpr()) {
                    }
                }
                else {
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseAssignStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Id")) {
                currToken = this.tokenBank.pop();
                if (currToken.isEqual("T_Assignment")) {
                    if (this.parseExpr()) {
                    }
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseVarDecl = function () {
            return this.parseType();
        };
        Parser.prototype.parseWhileStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_While")) {
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseIfStmt = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_If")) {
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseExpr = function () {
            if (this.parseIntExpr()) {
            }
            else if (this.parseStrExpr()) {
            }
            else if (this.parseBoolExpr()) {
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
                    return true;
                }
                else {
                    //error
                    return false;
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
                    return true;
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseBoolExpr = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_OpenParen")) {
                return true;
            }
            else if (currToken.isEqual("T_BoolVal")) {
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
                if (this.parseCharList()) {
                }
                else {
                }
            }
            else {
                return false;
            }
        };
        Parser.prototype.parseType = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_VarType")) {
                if (this.parseId()) {
                }
            }
            else {
                this.tokenBank.push(currToken);
                return false;
            }
        };
        Parser.prototype.parseId = function () {
            var currToken = this.tokenBank.pop();
            if (currToken.isEqual("T_Id")) {
            }
            return false;
        };
        Parser.prototype.printError = function () {
        };
        return Parser;
    }());
    Compiler.Parser = Parser;
})(Compiler || (Compiler = {}));
