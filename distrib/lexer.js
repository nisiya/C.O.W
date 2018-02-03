///<reference path="globals.ts" />
/* ------------
Lexer.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Lexer = /** @class */ (function () {
        function Lexer() {
        }
        Lexer.prototype.init = function () {
            this.currentLine = 0;
            this.currentColumn = 0;
        };
        Lexer.getInput = function (btn) {
            // var userPrg = editor.getValue();
            var input = document.getElementById("input");
            /* method 1
            let userPrg = new Array<string>();
            userPrg = input.value.split('');
            let userPrgClean:string[] = this.removeComments(userPrg);
            */
            var userPrg = input.value;
            var userPrgClean = this.removeComments(userPrg);
        };
        /* Removes comments in code by replacing them with whitespace
        *  for new line to maintain the format of the code for
        *  other parts.
        */
        Lexer.removeComments = function (userPrg) {
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
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
