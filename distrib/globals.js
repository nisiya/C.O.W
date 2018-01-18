/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */
//
// Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
//
var APP_NAME = "Compiler"; // need a better name...
var APP_VERSION = "0.07"; // uhhhh
//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
// UI
var _Console; // Utilize TypeScript's type annotation system to ensure that _Console is an instance of the Console class.
// Components
var _Lexer;
var _Parser;
var onDocumentLoad = function () {
    Compiler.Console.consoleInit();
};
