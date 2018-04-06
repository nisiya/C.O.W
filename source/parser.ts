///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
///<reference path="token.ts" />

/* ------------
Parser.ts

Requires global.ts, tree.ts, symbol.ts, and token.ts
------------ */

module Compiler {
    
  export class Parser {
    public csTree: Tree;
    public tokenBank: Token[];
    public error: boolean;

    // 1. <Program> -> <Block> $
    public start(tokenBank:Array<Token>): Tree{
      // need to start with first token
      this.tokenBank = tokenBank.reverse(); 
      this.error = false;
      this.printStage("parse()");
      this.csTree = new Tree("Program", [0,0]);
      this.printStage("parseProgram()");

      // first block handled differently
      this.printStage("parseBlock()");
      let currentToken:Token = this.tokenBank.pop();
      if(this.match(currentToken, "T_OpenBracket")){
        let parsing = this.parseStmtList();
        currentToken = this.tokenBank.pop();
        if(this.match(currentToken, "T_CloseBracket")){
          currentToken = this.tokenBank.pop();
          if(this.match(currentToken, "T_EOP")){
            return this.csTree;
          } else{
            return null;
          }
        } else{
          return null;
        }
      } else{
        return null;
      }
    }

    public parseStmtList(): boolean{
      this.csTree.addBranchNode("StatementList", [0,0]);
      this.printStage("parseStatementList()");
      if(this.parseStatement()){
        this.csTree.moveUp(); // to StatementList
        return this.parseStmtList();
      } else {
        while (this.csTree.current.value == "StatementList"){
          this.csTree.moveUp(); // to Block
        }
        return true; // epsilon
      }
    }

    public parseStatement(): boolean{
      this.printStage("parseStatement()");
      this.csTree.addBranchNode("Statement");
      
      if(this.parseBlock() || this.parsePrintStmt() || this.parseAssignStmt()
        || this.parseVarDecl() || this.parseWhileStmt() || this.parseIfStmt()){
        if(this.error){
          // Statement was found but there were errors inside
          return false;
        } else{
          this.csTree.moveUp(); // to Statement
          return true;
        }
      } else{
        // can be epsilon
        this.csTree.removeCurrentNode();
        return false;
      }
    }

    public match(token:Token, expectedToken:string): boolean{
      if(token.isEqual(expectedToken)){
        this.csTree.addLeafNode(token.tValue, [token.tLine, token.tColumn]);
        return true;
      } else{
        this.printError(token, expectedToken);
        this.tokenBank.push(token);
        return false;
      }
    }

    public printError(token: Token, expectedValue: string): void{
      if(!this.error){
        let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
        log.value += "\n   PARSER --> ERROR! Expected [" + expectedValue + "] got [" + token.tid + "] with value '" 
                  + token.tValue + "' on line " + token.tLine + ", column " + token.tColumn;
        log.value += "\n   PARSER --> Parse failed with 1 error";                
        log.scrollTop = log.scrollHeight;
        this.error = true;
      }
    }
    
    public printStage(stage: string){
      if(_VerboseMode){
        let log: HTMLInputElement = <HTMLInputElement> document.getElementById("log");
        log.value += "\n   PARSER --> " + stage;
        log.scrollTop = log.scrollHeight;
      }
    }
  }
}