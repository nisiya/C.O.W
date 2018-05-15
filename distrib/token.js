/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token
------------ */
var Compiler;
(function (Compiler) {
    var TokenKind;
    (function (TokenKind) {
        TokenKind["OPEN_BRACKET"] = "OpenBracket";
        TokenKind["CLOSE_BRACKET"] = "CloseBraket";
        TokenKind["EOP"] = "EOP";
        TokenKind["OPEN_PAREN"] = "OpenParen";
        TokenKind["CLOSE_PAREN"] = "CloseParen";
        TokenKind["PRINT"] = "Print";
    })(TokenKind = Compiler.TokenKind || (Compiler.TokenKind = {}));
    var Token = /** @class */ (function () {
        function Token(tid, tValue, tType, tLine, tColumn) {
            this.tid = tid;
            this.tValue = tValue;
            this.tType = tType;
            this.tLine = tLine;
            this.tColumn = tColumn;
        }
        Token.prototype.setType = function (tType) {
            this.tType = tType;
        };
        Token.prototype.isEqual = function (tid) {
            return this.tid == tid;
        };
        Token.prototype.toString = function () {
            return this.tid + " [ " + this.tValue + " ] on line " + this.tLine + ", column " + this.tColumn;
        };
        return Token;
    }());
    Compiler.Token = Token;
})(Compiler || (Compiler = {}));
