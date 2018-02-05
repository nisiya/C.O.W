///<reference path="globals.ts" />
/* ------------
Lexer.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Lexer = /** @class */ (function () {
        function Lexer() {
            this.tokenBank = new Array();
        }
        Lexer.prototype.init = function () {
            this.currentLine = 1;
            this.currentColumn = 0;
        };
        Lexer.prototype.performLex = function (btn) {
            var userPrg = editor.getValue();
            var userPrgClean = this.removeComments(userPrg);
            var firstPointer = 0;
            var secondPointer = 0;
            var currentSegment = '';
            var currentChar;
            var alphaNumeric = /[a-z0-9]/;
            var notSymbol = /\!/;
            var equal = /\=!/;
            while (secondPointer < userPrgClean.length) {
                currentChar = userPrgClean.charAt(secondPointer);
                if (alphaNumeric.test(currentChar)) {
                    currentSegment = currentSegment + currentChar;
                    this.currentColumn++;
                    secondPointer++;
                }
                else {
                    if (currentSegment.length > 1) {
                        this.evaluateSegment(currentSegment);
                    }
                    if (equal.test(currentChar) || notSymbol.test(currentChar)) {
                    }
                    else {
                        this.createSymbolToken(currentChar);
                    }
                }
            }
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
            var output = document.getElementById("test");
            output.value = userPrg.toString();
            return userPrg;
        };
        Lexer.prototype.createSymbolToken = function (symbol) {
            // let openParen:RegExp = /\(/;
            // let closeParen:RegExp = /\)/;
            // let openBracket:RegExp = /\{/;
            // let closeBracket:RegExp = /\(/;
            // let plus:RegExp = /\+/;
            // let eop:RegExp = /\$/;
            // let quote:RegExp = /\"/;
            // let newLine:RegExp = /\n/;
            // let space:RegExp = /\s/;
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
                case 34:// "
                    tid = "T_Quote";
                    break;
                case 43:// +
                    tid = "T_Addition";
                    break;
                case 36:// $
                    tid = "T_EOP";
                    break;
                default:
                    alert("Should have been symbol");
                    break;
            }
            var token = new Compiler.Token(tid, symbol, this.currentLine, this.currentLine);
            this.tokenBank.push(token);
        };
        Lexer.prototype.evaluateSegment = function (symbol) {
        };
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
