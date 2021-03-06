///<reference path="globals.ts" />
///<reference path="token.ts" />
///<reference path="parser.ts" />
/* ------------
Lexer.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Lexer = /** @class */ (function () {
        function Lexer() {
        }
        Lexer.prototype.start = function (userPrg) {
            _OutputLog = "";
            // RegExp
            var alphaNumeric = /[a-z0-9]/;
            var charKey = /[a-z]/;
            var singleSymbol = /\(|\)|\{|\}|\$|\+/;
            var notSymbol = /\!/;
            var equal = /\=/;
            var quote = /\"/;
            var isOpenQuote = false;
            var newLine = /\n|\r/;
            var space = /[ ]|\t/;
            var eop = /\$/;
            var commentSlash = /\//;
            var commentStar = /\*/;
            this.currentLine = 1;
            this.currentColumn = 0;
            this.tokenBank = new Array();
            this.errorFound = false;
            var firstPointer = 0;
            var secondPointer = 0;
            var buffer;
            var currentChar;
            var token;
            while (secondPointer <= userPrg.length) {
                currentChar = userPrg.charAt(secondPointer);
                buffer = userPrg.slice(firstPointer, secondPointer);
                if (!alphaNumeric.test(currentChar)) {
                    if (buffer.length > 0) {
                        /* wild non-alphanumeric appeared!
                        * *------------------------------*
                        * |    > LEX          CHEESE     |
                        * |      PARSER       RUN AWAY   |
                        * *------------------------------*
                        */
                        //        
                        if (this.evaluateBuffer(buffer)) {
                            // stop lexing and return nothing
                            this.errorFound = true;
                            break;
                        } // else continue
                    }
                    if (currentChar == '') {
                        // end of input
                        break;
                    }
                    else if (eop.test(currentChar)) {
                        this.createToken("T_EOP", "$");
                        break;
                    }
                    else if (space.test(currentChar)) {
                        // lexer ignores whitespace
                    }
                    else if (newLine.test(currentChar)) {
                        // lexer ignores whitespace
                        // need to increment line and reset column indices
                        this.currentLine++;
                        this.currentColumn = -1;
                    }
                    else if (quote.test(currentChar)) {
                        this.createToken("T_OpenQuote", '\"');
                        isOpenQuote = true;
                        secondPointer++;
                        this.currentColumn++;
                        currentChar = userPrg.charAt(secondPointer);
                        /* if a quote appears, everything after that is valid is added as T_Char
                        *   until the close quote
                        * valid = lowercase letters and spaces
                        * invalid characters after open quotes will stop lexer and report error
                        *   along with current tokens
                        */
                        while (isOpenQuote) {
                            if (quote.test(currentChar)) {
                                this.createToken("T_CloseQuote", '\"');
                                isOpenQuote = false;
                            }
                            else if (charKey.test(currentChar)) {
                                this.createToken("T_Char", currentChar);
                                secondPointer++;
                                this.currentColumn++;
                                currentChar = userPrg.charAt(secondPointer);
                            }
                            else if (space.test(currentChar)) {
                                this.createToken("T_Space", currentChar);
                                secondPointer++;
                                this.currentColumn++;
                                currentChar = userPrg.charAt(secondPointer);
                            }
                            else {
                                // error token created
                                this.createToken("T_Invalid", currentChar);
                                this.errorFound = true;
                                break;
                            }
                        }
                        if (this.errorFound) {
                            break;
                        }
                    }
                    else if (commentSlash.test(currentChar)) {
                        var commentEnd = /(\*\/)/;
                        var end = userPrg.search(commentEnd);
                        if (commentStar.test(userPrg.charAt(secondPointer + 1)) && end != -1) {
                            // comments are not allowed in quotes so its evaluated after
                            userPrg = this.removeComments(end, userPrg);
                            secondPointer++;
                            this.currentColumn++;
                        }
                        else {
                            // error token created
                            this.createToken("T_Invalid", currentChar);
                            this.errorFound = true;
                            break;
                        }
                    }
                    else if (singleSymbol.test(currentChar)) {
                        // for symbols that are one character only
                        this.createSymbolToken(currentChar);
                    }
                    else if (equal.test(currentChar)) {
                        // special case of == or =
                        if (equal.test(userPrg.charAt(secondPointer + 1))) {
                            // boolop ==
                            this.createToken("T_BoolOp", "==");
                            // since we look at next char..
                            this.currentColumn++;
                            secondPointer++;
                        }
                        else {
                            // assignment ==
                            this.createToken("T_Assignment", "=");
                        }
                    }
                    else if (notSymbol.test(currentChar)) {
                        // special case of != or !, which is invalid
                        if (equal.test(userPrg.charAt(secondPointer + 1))) {
                            this.createToken("T_BoolOp", "!=");
                            // again since we looked at next char..
                            this.currentColumn++;
                            secondPointer++;
                        }
                        else {
                            // ! is invalid, stop lexer and return error with current tokens
                            this.createToken("T_Invalid", currentChar);
                            this.errorFound = true;
                            break;
                        }
                    }
                    else {
                        // character is not in grammar, stop lexer and report error with current tokens
                        this.createToken("T_Invalid", currentChar);
                        this.errorFound = true;
                        break;
                    }
                    // move onto next char and reset first pointer
                    secondPointer++;
                    firstPointer = secondPointer;
                }
                else {
                    // no non-alphanumerics encountered.. continue reading for longest match
                    secondPointer++;
                }
                // make sure to keep track of column index
                this.currentColumn++;
            }
            if (this.errorFound) {
                // error encountered, return empty token bank and rest of the program(s)  
                this.displayTokens();
                var index = userPrg.search(eop) == -1 ? userPrg.length : userPrg.search(eop);
                userPrg = userPrg.slice(index + 1, userPrg.length);
                return [new Array(), userPrg];
            }
            else {
                // end of lex because eop or no more user input
                // success or has warning
                this.displayTokens();
                userPrg = userPrg.slice(secondPointer + 1, userPrg.length);
                return [this.tokenBank, userPrg];
            }
        };
        /* Removes comments in code by replacing them with whitespace
        *  for new line to maintain the format of the code for
        *  other parts.
        */
        Lexer.prototype.removeComments = function (end, userPrg) {
            var commentEnd = /(\/\*)/;
            var start = userPrg.search(commentEnd);
            // divide the input into before comment and after comment
            // in order to replace the comment area with whitespace
            var beforeComment = userPrg.slice(0, start);
            var afterComment = userPrg.slice(end + 2, userPrg.length);
            // cannot change character in string so use an array
            var fillComment = new Array();
            fillComment = userPrg.slice(start, end + 2).split('');
            for (var i = 0; i < fillComment.length; i++) {
                // need to keep line feeds for line numbering
                if (fillComment[i] != '\n') {
                    fillComment[i] = ' ';
                }
            }
            // put the code back together
            userPrg = beforeComment + fillComment.join('') + afterComment;
            return userPrg;
        };
        /* Creates tokens for following single character symbols:
        *  ['(', ')', '{', '}', '+']
        */
        Lexer.prototype.createSymbolToken = function (symbol) {
            var tid;
            switch (symbol.charCodeAt(0)) {
                case 40:// (
                    tid = "T_OpenParen";
                    break;
                case 41:// )
                    tid = "T_CloseParen";
                    break;
                case 123:// {
                    tid = "T_OpenBracket";
                    break;
                case 125:// }
                    tid = "T_CloseBracket";
                    break;
                case 43:// +
                    tid = "T_Addition";
                    break;
                default:
                    // won't happen
                    break;
            }
            this.createToken(tid, symbol);
        };
        // Creates a token for given character and id
        Lexer.prototype.createToken = function (tid, tValue) {
            var token = new Compiler.Token(tid, tValue, this.currentLine, this.currentColumn);
            this.tokenBank.push(token);
        };
        // finds longest match tokens and errors in a buffer
        Lexer.prototype.evaluateBuffer = function (buffer) {
            // RegExp matches order by length
            var booleanKey = /^boolean/;
            var printKey = /^print/;
            var whileKey = /^while/;
            var stringKey = /^string/;
            var falseKey = /^false/;
            var trueKey = /^true/;
            var intKey = /^int/;
            var ifKey = /^if/;
            var digit = /^\d/;
            var idKey = /^[a-z]/;
            var token;
            var tid;
            var tval;
            // current column index on symbol, not the buffer before it so..
            var tempColumn = this.currentColumn - buffer.length;
            while (buffer.length > 0) {
                // test for longest match first
                if (booleanKey.test(buffer)) {
                    tid = "T_VarType";
                    tval = "boolean";
                }
                else if (printKey.test(buffer)) {
                    tid = "T_Print";
                    tval = "print";
                }
                else if (whileKey.test(buffer)) {
                    tid = "T_While";
                    tval = "while";
                }
                else if (stringKey.test(buffer)) {
                    tid = "T_VarType";
                    tval = "string";
                }
                else if (falseKey.test(buffer)) {
                    tid = "T_BoolVal";
                    tval = "false";
                }
                else if (trueKey.test(buffer)) {
                    tid = "T_BoolVal";
                    tval = "true";
                }
                else if (intKey.test(buffer)) {
                    tid = "T_VarType";
                    tval = "int";
                }
                else if (ifKey.test(buffer)) {
                    tid = "T_If";
                    tval = "if";
                }
                else if (digit.test(buffer)) {
                    tid = "T_Digit";
                    tval = buffer.charAt(0);
                }
                else if (idKey.test(buffer)) {
                    tid = "T_Id";
                    tval = buffer.charAt(0);
                }
                // cannot use create token here because column is not this.currentColumn
                token = new Compiler.Token(tid, tval, this.currentLine, tempColumn);
                this.tokenBank.push(token);
                tempColumn += tval.length;
                buffer = buffer.substring(tval.length);
            }
            // means no error occurred
            return false;
        };
        Lexer.prototype.displayTokens = function () {
            var lexError = 0;
            var lexWarning = 0;
            var index = 0;
            var token = this.tokenBank[index];
            if (this.tokenBank.length == 0) {
                _OutputLog += "\n   LEXER --> ERROR! No program(s) found";
                _OutputLog += "\n ============= \n Lexer Failed... 0 Warning(s) ... 1 Error(s)";
                return;
            }
            // print all tokens
            if (_VerboseMode) {
                while (index < this.tokenBank.length - 1) {
                    _OutputLog += "\n   LEXER --> " + token.toString();
                    index++;
                    token = this.tokenBank[index];
                }
            }
            else {
                index = this.tokenBank.length - 1;
                token = this.tokenBank[index];
            }
            // reached the last token
            if (token.isEqual("T_Invalid")) {
                _OutputLog += "\n   LEXER --> ERROR! Invalid token"
                    + " [ " + token.tValue + " ] on line " + token.tLine
                    + ", column " + token.tColumn;
                lexError++;
            }
            else {
                if (_VerboseMode) {
                    _OutputLog += "\n   LEXER --> " + token.toString();
                }
                if (!token.isEqual("T_EOP")) {
                    _OutputLog += "\n   LEXER --> WARNING! No End Of Program [$] found."
                        + "\n Inserted at line " + token.tLine + ", column " + (token.tColumn + 1);
                    var eopToken = new Compiler.Token("T_EOP", "$", token.tLine, token.tColumn + 1);
                    this.tokenBank.push(eopToken);
                    lexWarning++;
                }
            }
            if (lexError == 0) {
                _OutputLog += "\n ============= \n Lexer completed... " + lexWarning + " Warning(s) ... " + lexError + " Error(s)";
                _OutputLog += "\n Token bank loaded... \n =============";
            }
            else {
                _OutputLog += "\n ============= \n Lexer Failed... " + lexWarning + " Warning(s) ... " + lexError + " Error(s)";
            }
        };
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
