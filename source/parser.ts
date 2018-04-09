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
        this.csTree.addBranchNode("Block", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        if(this.parseStmtList()){
          currentToken = this.tokenBank.pop();
          if(this.match(currentToken, "T_CloseBracket")){
            this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
            currentToken = this.tokenBank.pop();
            if(this.match(currentToken, "T_EOP")){
              this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
              return this.csTree;
            } else{
              this.printError(currentToken, "T_EOP");
              return null;
            }
          } else{
            console.log("hello");
            this.printError(currentToken, "T_CloseBracket");
            return null;
          }
        }
      } else{
        this.printError(currentToken, "T_OpenBracket");
        return null;
      }
    }

    public parseStmtList(): boolean{
      this.printStage("parseStatementList()");
      this.csTree.addBranchNode("StatementList", [0,0]);
      
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
      this.csTree.addBranchNode("Statement", [0,0]);
      
      if(this.parseBlock() || this.parsePrintStmt() || this.parseAssignStmt()
        || this.parseVarDecl() || this.parseWhileIfStmt()){
        if(this.error){
          // Statement was found but there were errors inside
          return false;
        } else{
          console.log(this.csTree.current.value + " um");
          this.csTree.moveUp(); // to Statement
          console.log(this.csTree.current.value + "now?");
          return true;
        }
      } else{
        // can be epsilon
        console.log(this.csTree.current.value + " um");
        this.csTree.removeCurrentNode();
        console.log(this.csTree.current.value + "now?");
        return false;
      }
    }

    public parseBlock(): boolean{
      console.log("Block");
      let currentToken:Token = this.tokenBank.pop();

      // check for [{]
      if(this.match(currentToken, "T_OpenBracket")){
        // found <Block>
        this.printStage("parseBlock()");
        this.csTree.addBranchNode("Block", [currentToken.tLine,currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);

        // check for StatementList
        if(this.parseStmtList()){
          // returning from parseStmtList, current node: Block
          // check for [}]
          currentToken = this.tokenBank.pop();
          if(this.match(currentToken, "T_CloseBracket")){
            this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
          } else{
            this.printError(currentToken, "T_CloseBracket");
          }
        }
        return true; // still a <Block> with or without error

      } else{
        // not <Block>
        return false;
      }
    }

    public parsePrintStmt(): boolean{
      console.log("Print");
      let currentToken:Token = this.tokenBank.pop();

      // check for [print]
      if(this.match(currentToken, "T_Print")){
        this.printStage("parsePrintStatement()");
        this.csTree.addBranchNode("PrintStatement", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);

        // check for [(]
        currentToken = this.tokenBank.pop();
        if(this.match(currentToken, "T_OpenParen")){
          this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);

          // check for <Expr>
          if(this.parseExpr()){
            this.csTree.moveUp(); // to PrintStatement

            // check for [)]
            currentToken = this.tokenBank.pop();
            if(this.match(currentToken, "T_CloseParen")){
              this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
            } else{
              this.printError(currentToken, "T_CloseParen");
            }

          } else{
            this.printError(currentToken, "Expr");
          }
          
        } else{
          this.printError(currentToken, "T_OpenParen");
        }
        return true; // still a <PrintStatement> with or without error

      } else{
        // not <PrintStatement>
        return false;
      }
    }

    public parseAssignStmt(): boolean{
      console.log("Assign");
      let currentToken:Token = this.tokenBank.pop();
      
      // check for <Id>
      if(this.match(currentToken, "T_Id")){
        this.printStage("parseAssignmentStatement()");
        this.csTree.addBranchNode("AssignmentStatement", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addBranchNode("Id", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        this.csTree.moveUp(); // to Assignment Statement

        // check for [=]
        currentToken = this.tokenBank.pop();
        if(this.match(currentToken, "T_Assignment")){
          
          // check for <Expr>
          if(!this.parseExpr()){
            this.printError(currentToken, "Expr");
            console.log(this.csTree.current.value + " why");
          }
          this.csTree.moveUp(); // to AssignmentStatement
        } else{
          this.printError(currentToken, "T_Assignemnt");
        }
        console.log(this.csTree.current.value + " how");
        return true; // still a <AssignmentStatement> with or without error

      } else{
        // not <AssignmentStatement>
        return false; 
      }
    }

    public parseVarDecl(): boolean{
      console.log("VarDecl");
      let currentToken:Token = this.tokenBank.pop();
      
      // check for <type>
      if(this.match(currentToken, "T_VarType")){
        this.printStage("parseVarDecl()");
        this.csTree.addBranchNode("VarDecl", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addBranchNode("type", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        this.csTree.moveUp(); // to VarDecl

        // check for <Id>
        currentToken = this.tokenBank.pop();
        if(this.match(currentToken, "T_Id")){
          this.csTree.addBranchNode("Id", [currentToken.tLine, currentToken.tColumn]);
          this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
          this.csTree.moveUp(); // to VarDecl
        } else{
          this.printError(currentToken, "T_Id");
        }
        return true; // still a <VarDecl> with or without error

      } else{
        // not <VarDecl>
        return false; 
      }
    }

    public parseWhileIfStmt(): boolean{
      console.log("While");
      let currentToken:Token = this.tokenBank.pop();
      console.log(currentToken);
      if(currentToken.tid == "T_While" || currentToken.tid == "T_If"){
        let index:number = currentToken.tid.search(/\_/) + 1;
        let stmtType:string = currentToken.tid.substring(index, currentToken.tid.length);
        this.printStage("parse" + stmtType + "Statement()");
        this.csTree.addBranchNode(stmtType + "Statement", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);

        // check for <BooleanExpr>
        if(this.parseBoolExpr()){
          this.csTree.moveUp(); // to While|If Statement
          
          // check for <Block>
          if(!this.parseBlock()){
            this.printError(currentToken, "Block");
          }
          this.csTree.moveUp(); // to While|If Statement
          
        } else{
          this.printError(currentToken, "BoolExpr");
        }
        return true; // still a <WhileStatement>|<IfStatement> with or without error

      } else{
        this.tokenBank.push(currentToken);
        // not <While> or <If>
        return false;
      }
    }

    public parseExpr(): boolean{
      console.log("Expr");
      this.printStage("parseExpr()");
      this.csTree.addBranchNode("Expr", [0,0]);

      // check <Id> first
      let currentToken:Token = this.tokenBank.pop();
      if(this.match(currentToken, "T_Id")){
        // found <Expr>
        // found <Id>
        this.csTree.addBranchNode("Id", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        this.csTree.moveUp(); // to Expr
        return true;

      } else if(this.parseIntExpr() || this.parseStringExpr() || this.parseBoolExpr() ){
        // found <Expr>
        this.csTree.moveUp(); // to Expr
        return true;

      } else{
        // not <Expr>
        return false;
      }
    }

    public parseIntExpr(): boolean{
      console.log("IntExpr");
      let currentToken:Token = this.tokenBank.pop();

      if(this.match(currentToken, "T_Digit")){
        this.printStage("parseIntExpr()");
        this.csTree.addBranchNode("IntExpr", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addBranchNode("Digit", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        this.csTree.moveUp(); // to IntExpr
        
        // check for [+]
        currentToken = this.tokenBank.pop();
        if(this.match(currentToken, "T_Addition")){
          this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
          
          // check for more <Expr>
          if(!this.parseExpr()){
            this.printError(currentToken, "Expr");
          }
          this.csTree.moveUp(); // to IntExpr
        } else{
          // digit alone is still valid as IntExpr
          this.error = false;
        }
        return true; // still a <IntExpr> with or without error

      } else{
        // not <IntExpr>
        return false;
      }
    }

    public parseStringExpr(): boolean{
      console.log("StringExpr");
      let currentToken:Token = this.tokenBank.pop();

      // check for ["]
      if(this.match(currentToken, "T_OpenQuote")){
        this.printStage("parseStringExpr()");
        this.csTree.addBranchNode("StringExpr", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);

        // check for <CharList>
        if(this.parseCharList()){
          // returning from parseCharList(), current node: StringExpr
          // check for ["]
          currentToken = this.tokenBank.pop();
          if(this.match(currentToken, "T_CloseQuote")){
            this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
          } else{
            this.printError(currentToken, "T_CloseQuote");
          }
        }
        return true; // still a <StringExpr> with or without error

      } else{
        // not StringExpr
        return false;
      }
    }

    public parseBoolExpr(): boolean{
      console.log("BoolExpr");
      let currentToken:Token = this.tokenBank.pop();

      // check for boolVal first
      if(this.match(currentToken, "T_BoolVal")){
        this.printStage("parseBoolExpr()");
        this.csTree.addBranchNode("BoolExpr", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addBranchNode("BoolVal", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        this.csTree.moveUp(); // to BoolExpr
        return true;

      } else{
        currentToken = this.tokenBank.pop();
        // check for [(]
        if(this.match(currentToken, "T_OpenParen")){
          this.printStage("parseBoolExpr()");
          this.csTree.addBranchNode("BoolExpr", [currentToken.tLine, currentToken.tColumn]);
          this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);

          // check for <Expr>
          if(this.parseExpr()){
            this.csTree.moveUp(); // to BoolExpr

            // check for <BoolOp>
            currentToken = this.tokenBank.pop();
            if(this.match(currentToken, "T_BoolOp")){
              this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
              
              // check for <Expr>
              if(this.parseExpr()){
                this.csTree.moveUp(); // to BoolExpr
                // check for [)]
                currentToken = this.tokenBank.pop();
                if(this.match(currentToken, "T_CloseParen")){
                  this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
                } else{
                  this.printError(currentToken, "T_CloseParen");
                }

              } else{
                this.printError(currentToken, "Expr");
              }

            } else{
              this.printError(currentToken, "T_BoolOp");
            }

          } else{
            this.printError(currentToken, "Expr");
          }
          return true; // still a <BoolExpr> with or without error
        } else{
          // not <BoolExpr>
          return false;
        }
      }
    }

    public parseCharList(): boolean{
      console.log("CharList");
      this.printStage("parseCharList");
      this.csTree.addBranchNode("CharList", [0,0]);
      
      let currentToken:Token = this.tokenBank.pop();
      if(currentToken.tid == "T_Char" || currentToken.tid == "T_Space"){
        this.csTree.addBranchNode("char", [currentToken.tLine, currentToken.tColumn]);
        this.csTree.addLeafNode(currentToken.tValue, [currentToken.tLine, currentToken.tColumn]);
        this.csTree.moveUp(); // to CharList
        return this.parseCharList();
      } else{
        this.tokenBank.push(currentToken);
        this.csTree.removeCurrentNode();
        while(this.csTree.current.value == "CharList"){
          this.csTree.moveUp();
        }
        return true; // to StringExpr
      }
    }

    public match(token:Token, expectedToken:string): boolean{
      if(token.isEqual(expectedToken)){
        return true;
      } else{
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