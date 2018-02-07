///<reference path="globals.ts" />
///<reference path="token.ts" />
/* ------------
Lexer.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Lexer = /** @class */ (function () {
        function Lexer() {
        }
        Lexer.prototype.start = function () {
            this.currentLine = 1;
            this.currentColumn = 0;
            this.tokenBank = new Array();
            this.performLex();
        };
        Lexer.prototype.performLex = function () {
            var userPrg = editor.getValue();
            var userPrgClean = this.removeComments(userPrg);
            var firstPointer = 0;
            var secondPointer = 0;
            var buffer = '';
            var currentChar;
            var alphaNumeric = /[a-z0-9]/;
            var charList = /^[a-z" "]*$/;
            var singleSymbol = /\(|\)|\{|\}|\$|\+/;
            var notSymbol = /\!/;
            var equal = /\=/;
            var quote = /\"/;
            var newLine = /\n/;
            var space = /[ ]/;
            var eop = /\$/;
            var token;
            var counter = 0;
            while (secondPointer <= userPrgClean.length) {
                counter++;
                currentChar = userPrgClean.charAt(secondPointer);
                console.log("value " + userPrgClean.charCodeAt(secondPointer));
                buffer = userPrgClean.slice(firstPointer, secondPointer);
                console.log("buf " + buffer);
                if (!alphaNumeric.test(currentChar)) {
                    if (buffer.length > 0) {
                        this.evaluateSegment(buffer);
                    }
                    console.log("is quote: " + quote.test(currentChar));
                    if (eop.test(currentChar)) {
                        token = new Compiler.Token("T_EOP", "$", this.currentLine, this.currentColumn);
                        this.tokenBank.push(token);
                        console.log(this.tokenBank);
                        console.log("finish");
                        break;
                    }
                    else if (space.test(currentChar)) {
                        // do nothing
                        console.log("space HERE");
                    }
                    else if (newLine.test(currentChar)) {
                        console.log("new line");
                        this.currentLine++;
                        this.currentColumn = -1;
                    }
                    else if (quote.test(currentChar)) {
                        var tempSegment = userPrgClean.substring(secondPointer + 1);
                        var closeQuote = tempSegment.search(quote);
                        if (closeQuote == -1) {
                            this.createQuoteToken();
                        }
                        else {
                            closeQuote = secondPointer + closeQuote + 1; // change to original
                            var quoteContent = userPrgClean.slice(secondPointer + 1, closeQuote);
                            if (!charList.test(quoteContent)) {
                                console.log('invalid token: ' + userPrgClean.slice(secondPointer, closeQuote + 1));
                                break;
                            }
                            else {
                                this.createQuoteToken();
                                secondPointer++;
                                this.currentColumn++;
                                while (secondPointer < closeQuote) {
                                    token = new Compiler.Token("T_Char", userPrgClean.charAt(secondPointer), this.currentLine, this.currentColumn);
                                    this.tokenBank.push(token);
                                    secondPointer++;
                                    this.currentColumn++;
                                }
                                this.createQuoteToken();
                            }
                        }
                    }
                    else if (singleSymbol.test(currentChar)) {
                        this.createSymbolToken(currentChar);
                    }
                    else if (equal.test(currentChar)) {
                        if (equal.test(userPrgClean.charAt(secondPointer + 1))) {
                            console.log("equal token");
                            token = new Compiler.Token("T_Equals", currentChar + userPrgClean.charAt(secondPointer + 1), this.currentLine, this.currentColumn);
                            this.tokenBank.push(token);
                            this.currentColumn++;
                            secondPointer++;
                        }
                        else {
                            console.log("assignment token");
                            token = new Compiler.Token("T_Assignment", currentChar, this.currentLine, this.currentColumn);
                            this.tokenBank.push(token);
                        }
                    }
                    else if (notSymbol.test(currentChar)) {
                        console.log("not token");
                        if (equal.test(userPrgClean.charAt(secondPointer + 1))) {
                            token = new Compiler.Token("T_NotEqual", currentChar + userPrgClean.charAt(secondPointer + 1), this.currentLine, this.currentColumn);
                            this.tokenBank.push(token);
                            this.currentColumn++;
                            secondPointer++;
                        }
                        else {
                            console.log("not what");
                            break;
                        }
                    }
                    else {
                        // error
                        break;
                    }
                    secondPointer++;
                    firstPointer = secondPointer;
                }
                else {
                    secondPointer++;
                }
                // else if alphanumeric, continue looking at the next charactor
                console.log(this.tokenBank);
                this.currentColumn++;
                console.log("counter" + counter);
            }
            // stop lexing
        };
        /* Removes comments in code by replacing them with whitespace
        *  for new line to maintain the format of the code for
        *  other parts.
        */
        Lexer.prototype.removeComments = function (userPrg) {
            // locate the comment
            var commentStart = /(\/\*)/;
            var commentEnd = /(\*\/)/;
            var start = userPrg.search(commentStart);
            var end = userPrg.search(commentEnd);
            // need to remove all comments
            while (start != -1 && end != -1) {
                // leave other areas
                var beforeComment = userPrg.slice(0, start);
                var afterComment = userPrg.slice(end + 2, userPrg.length);
                // cannot change character in string so use an array
                var fillComment = new Array();
                fillComment = userPrg.slice(start, end + 1).split('');
                for (var i = 0; i < fillComment.length; i++) {
                    // need to keep line feeds for line numbering
                    if (fillComment[i] != '\n') {
                        fillComment[i] = '  ';
                    }
                }
                // put the code back together
                userPrg = beforeComment + fillComment.join('') + afterComment;
                start = userPrg.search(commentStart);
                end = userPrg.search(commentEnd);
            }
            // var output = <HTMLInputElement> document.getElementById("test"); 
            // output.value = userPrg.toString();
            return userPrg;
        };
        Lexer.prototype.createSymbolToken = function (symbol) {
            console.log("single symbol: " + symbol);
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
                case 36:// $
                    tid = "T_EOP";
                    break;
                default:
                    // won't happen
                    break;
            }
            var token = new Compiler.Token(tid, symbol, this.currentLine, this.currentColumn);
            this.tokenBank.push(token);
        };
        Lexer.prototype.createQuoteToken = function () {
            var token = new Compiler.Token("T_Quote", '\"', this.currentLine, this.currentColumn);
            this.tokenBank.push(token);
        };
        Lexer.prototype.evaluateSegment = function (segment) {
            console.log("yes: " + segment);
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
            var tempColumn = this.currentColumn - segment.length;
            while (segment.length > 0) {
                if (booleanKey.test(segment)) {
                    tid = "T_VarType";
                    tval = "boolean";
                }
                else if (printKey.test(segment)) {
                    tid = "T_Print";
                    tval = "print";
                }
                else if (whileKey.test(segment)) {
                    console.log("hel");
                    tid = "T_While";
                    tval = "while";
                }
                else if (stringKey.test(segment)) {
                    tid = "T_VarType";
                    tval = "string";
                }
                else if (falseKey.test(segment)) {
                    tid = "T_Boolean";
                    tval = "false";
                }
                else if (trueKey.test(segment)) {
                    tid = "T_Boolean";
                    tval = "true";
                }
                else if (intKey.test(segment)) {
                    tid = "T_VarType";
                    tval = "int";
                }
                else if (ifKey.test(segment)) {
                    tid = "T_If";
                    tval = "if";
                }
                else if (digit.test(segment)) {
                    tid = "T_Digit";
                    tval = segment.charAt(0);
                }
                else if (idKey.test(segment)) {
                    tid = "T_Id";
                    tval = segment.charAt(0);
                }
                token = new Compiler.Token(tid, tval, this.currentLine, tempColumn);
                console.log(token);
                this.tokenBank.push(token);
                console.log(this.tokenBank);
                tempColumn += tval.length;
                segment = segment.substring(tval.length);
                console.log("length" + segment.length);
            }
        };
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
