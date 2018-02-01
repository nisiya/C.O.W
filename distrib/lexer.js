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
        // public init(): void {
        // }
        Lexer.getInput = function (btn) {
            var userPrg = editor.getValue();
            var charCode = new Array();
            // var commentRegEx = /\/\*a/;
            // var userPrgClean = commentRegEx.test(userPrg);
            // var output = <HTMLInputElement> document.getElementById("test"); 
            // output.value = userPrgClean.toString();
            // for (var i=0; i<userPrg.length; i++){
            //   charCode.push(userPrg.charCodeAt(i));
            // }
            this.removeComments(userPrg);
        };
        Lexer.removeComments = function (userPrg) {
            var commentRegEx = /\/\*(.*?(\r\n)*?)\*\//;
            var userPrgClean = userPrg.replace(commentRegEx, ' ');
            var output = document.getElementById("test");
            output.value = userPrgClean.toString();
        };
        return Lexer;
    }());
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
