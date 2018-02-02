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
            var userPrg = new Array();
            userPrg = input.value.split('');
            var userPrgClean = this.removeComments(userPrg);
        };
        Lexer.removeComments = function (userPrg) {
            // let commentStart:RegExp = /(\/\*)/;
            // let commentEnd:RegExp = /(\*\/)/;
            // let start:number = userPrg.search(commentStart);
            // console.log("start " + start);
            // let end:number = userPrg.search(commentEnd);
            // let beforeComment = userPrg.slice(0,start);
            // let afterComment = userPrg.slice(end+1, userPrg.length);
            // while (start != -1){
            //   while (start <= end){
            //     if(userPrg.charCodeAt(start) == 10){
            //       start++;
            //     } else{
            //       userPrg[start] = ' ';
            //       start++;
            //     }
            //   }
            //   userPrg.search(commentStart);
            // }
            // var commentRegEx = /(\/\*)(\s|\S)*(\*\/)/;
            // var commentRegEx2 = /(\*\/)/;
            // var userPrgClean = userPrg.search(commentRegEx);
            // var userPrgClean = userPrg.search(commentRegEx2);
            // var output = <HTMLInputElement> document.getElementById("test"); 
            // output.value = userPrg.toString();
            // return userPrg.toString();
            for (var i = 0; i < userPrg.length - 1; i++) {
                if (userPrg[i] == '/' && userPrg[i + 1] == '*') {
                    userPrg[i] = ' ';
                    userPrg[i + 1] = ' ';
                    i += 2;
                    while (userPrg[i] != '*' && userPrg[i + 1] != '/') {
                        userPrg[i] = ' ';
                        i++;
                    }
                    userPrg[i] = ' ';
                    userPrg[i + 1] = ' ';
                    i += 2;
                }
            }
            console.log(userPrg);
            return userPrg;
        };
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
