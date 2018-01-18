///<reference path="globals.ts" />
/* ------------
CPU.ts

Requires global.ts.
------------ */
var Compiler;
(function (Compiler) {
    var Console = /** @class */ (function () {
        function Console() {
        }
        // constructor(public content: string = "") {
        // }
        Console.consoleInit = function () {
            /* clear console */
        };
        return Console;
    }());
    Compiler.Console = Console;
})(Compiler || (Compiler = {}));
