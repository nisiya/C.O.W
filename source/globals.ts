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
const APP_NAME: string    = "Compiler";   // need a better name...
const APP_VERSION: string = "0.07";   // uhhhh

//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.

// UI
let _Console: Compiler.Console;  // Utilize TypeScript's type annotation system to ensure that _Console is an instance of the Console class.

// Components
let _Lexer: Compiler.Lexer;
let _Parser: Compiler.Parser;

// Global vars
let _VerboseMode: boolean;


var onDocumentLoad = function() {
    _VerboseMode = true;
	// Compiler.Console.consoleInit();
};
