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
            this.printStage("parseProgram()");
            // first block handled differently
            this.printStage("parseBlock()");
            var currentToken = this.tokenBank.pop();
            if (this.match(currentToken, "T_OpenBracket")) {
                var parsing = this.parseStmtList();
                currentToken = this.tokenBank.pop();
                if (this.match(currentToken, "T_CloseBracket")) {
                    currentToken = this.tokenBank.pop();
                    if (this.match(currentToken, "T_EOP")) {
                        return this.csTree;
                    }
                    else {
                        return null;
                    }
                }
                else {
                    return null;
                }
            }
            else {
                return null;
            }
        };
        Parser.prototype.parseStmtList = function () {
            this.csTree.addBranchNode("StatementList", [0, 0]);
            this.printStage("parseStatementList()");
            if (this.parseStatement()) {
                this.csTree.moveUp(); // to StatementList
                return this.parseStmtList();
            }
            else {
                while (this.csTree.current.value == "StatementList") {
                    this.csTree.moveUp(); // to Block
                }
                return true; // epsilon
            }
        };
        Parser.prototype.parseStatement = function () {
            this.printStage("parseStatement()");
            this.csTree.addBranchNode("Statement");
            if (this.parseBlock() || this.parsePrintStmt() || this.parseAssignStmt()
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
                this.csTree.removeCurrentNode();
                return false;
            }
        };
        Parser.prototype.match = function (token, expectedToken) {
            if (token.isEqual(expectedToken)) {
                this.csTree.addLeafNode(token.tValue, [token.tLine, token.tColumn]);
                return true;
            }
            else {
                this.printError(token, expectedToken);
                this.tokenBank.push(token);
                return false;
            }
        };
        Parser.prototype.printError = function (token, expectedValue) {
            if (!this.error) {
                var log = document.getElementById("log");
                log.value += "\n   PARSER --> ERROR! Expected [" + expectedValue + "] got [" + token.tid + "] with value '"
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
