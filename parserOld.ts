///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="token.ts" />

/* ------------
Parser.ts

Requires global.ts.
------------ */

module Compiler {
    
  export class ParserOld {
    public csTree: Tree;
    public tokenBank: Token[];

    // 1. <Program> -> <Block> $
    public start(tokenBank:Array<Token>): Tree{
      console.log(tokenBank);
      this.tokenBank = tokenBank.reverse();
      console.log(this.tokenBank);
      this.csTree = new Tree("Program");
      // if(this.parseBlock()){
      //   let currToken = this.tokenBank.pop();
      //   if(currToken.isEqual("T_EOP")){
      //     this.csTree.addBranchNode(currToken.tValue);
      //     // finished
      //     console.log("yay");
      //     return this.csTree;
      //   } // no need for error bc EOP token always theres
      // } else{
      //   let errorToken = this.tokenBank.pop();
      //   this.printError("{", errorToken.tValue);
      //   console.log("oh no");
      //   return this.csTree;
      // }
      return this.csTree;
    }

    // 2. <Block> -> { <StatementList> }
    public parseBlock(): boolean{
      // console.log(currToken);
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_OpenBracket")){
        this.csTree.addBranchNode("Block");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        if(this.parseStmtList()){
          currToken = this.tokenBank.pop();
          if(currToken.isEqual("T_CloseBracket")){
            this.csTree.addBranchNode(currToken.tValue);
            this.csTree.moveUp(); // return to prg
            return true;
          } else{
            // expected } error
            this.printError("}", currToken.tValue);
            return false;
          }
        } else{
          // error will already be handled in recursion
          return false;
        }
      } else{
        // expected { error
        // this.printError("{", currToken.tValue);
        this.tokenBank.push();
        console.log(this.tokenBank);
        return false;
      }
    }

    // 3. <StatementList> -> <Statement> <StatementList>
    // 4.                 -> end
    public parseStmtList(): boolean{
      this.csTree.addBranchNode("StatementList");
      /*
       * 5. <Statement> -> <PrintStatement>
       * 6.             -> <AssignmentStatement>
       * 7.             -> <VarDecl>
       * 8.             -> <WhileStatement>
       * 9.             -> <IfStatement>
       * 10.            -> <Block>
       */
      if(this.parsePrintStmt() || this.parseAssignStmt() 
        || this.parseVarDecl() || this.parseWhileStmt()
        || this.parseIfStmt() || this.parseBlock()){
          this.csTree.moveUp(); // to Statement
          this.csTree.moveUp(); // to StatementList
          return this.parseStmtList();
      } else{
        // can be empty
        this.csTree.moveUp(); // back to Block
        return true;
      }
    }

    // done?
    // 11. <PrintStatement> -> print (<Expr>)
    public parsePrintStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Print")){
        // start of print statement
        this.csTree.addBranchNode("Statement");
        this.csTree.addBranchNode("PrintStatement");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        currToken = this.tokenBank.pop();
        if(currToken.isEqual("T_OpenParen")){
          this.csTree.addBranchNode(currToken.tValue);
          this.csTree.moveUp();
          if(this.parseExpr()){
            currToken = this.tokenBank.pop();
            if(currToken.isEqual("T_CloseParen")){
              this.csTree.addBranchNode(currToken.tValue);
              this.csTree.moveUp(); // to PrintStatement
              return true; // current = PrintStatement
            } else{
              // expected )
              this.printError(")", currToken.tValue);
              return false;
            }
          } else{
            // expected expr
            this.printError("Expr", currToken.tValue);
            return false;
          }
        } else{
          // expected (
          this.printError("(", currToken.tValue);
          return false;
        }
      } else{
        // go back to parseStmtList to check other conditions
        this.tokenBank.push(currToken);
        return false;
      }
    }

    // done?
    // 12. <AssignmentStatement> -> <Id> = <Expr>
    public parseAssignStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Id")){ // confliction!! temp fix
        // start of AssignmentStatement
        this.csTree.addBranchNode("Statement");
        this.csTree.addBranchNode("AssignmentStatement");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        currToken = this.tokenBank.pop();
        if(currToken.isEqual("T_Assignment")){
          this.csTree.addBranchNode(currToken.tValue);
          this.csTree.moveUp(); // to AssignmentStatementS
          if(this.parseExpr()){
            return true; // current = AssignmentStatements
          } else{
            // expected expr
            this.printError("Expr", currToken.tValue);
            return false;
          }
        } else{
          // expected =
          this.printError("=", currToken.tValue);
          return false;
        }
      } else{
        // go back to parseStmtList to check other conditions
        this.tokenBank.push(currToken);
        return false;
      }
    }

    // done?
    // 13. <VarDecl> -> type Id
    public parseVarDecl(): boolean{
      let currToken = this.tokenBank.pop();
      // 29. <type> -> <int> | <string> | <boolean>
      if(currToken.isEqual("T_VarType")){
        console.log("vardecl");
        this.csTree.addBranchNode("Statement");
        this.csTree.addBranchNode("VarDecl");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        if(this.parseId()){
          return true; // current = VarDecl
        } else{
          this.printError("Id", currToken.tValue);
          return false;
        }
      } else{
        // return to parseStmtList to evaluate other production
        this.tokenBank.push(currToken);
        console.log("apple");
        console.log(this.tokenBank);
        return false;
      }
    }

    // done?
    // 14. <WhileStatement> -> while <BooleanExpr> <Block>
    public parseWhileStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_While")){
        this.csTree.addBranchNode("Statement");
        this.csTree.addBranchNode("WhileStatement");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        if(this.parseBoolExpr()){
          if(this.parseBlock()){
            return true; // current = WhileStatement
          } else{
            // expected block
            this.printError("Block", currToken.tValue);
            return false;
          }
        } else{
          // expected boolexpr
          this.printError("BoolExpr", currToken.tValue);
          return false;
        }
      } else{
        // return to parseStmtList to evaluate other productions
        this.tokenBank.push(currToken);
        return false;
      }
    }

    // done?
    // 15. <IfStatement> -> if <BooleanExpr> <Block>
    public parseIfStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_If")){
        this.csTree.addBranchNode("Statement");
        this.csTree.addBranchNode("IfStatement");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        if(this.parseBoolExpr()){
          if(this.parseBlock()){
            return true; // current = IfStatement
          } else{
            // expected block
            this.printError("Block", currToken.tValue);
            return false;
          }
        } else{
          // expected boolexpr
          this.printError("BoolExpr", currToken.tValue);
          return false;
        }
      } else{
        // return to parseStmtList to evaluate other productions
        this.tokenBank.push(currToken);
        return false;
      }
    }

    // done?
    /*  
     * 16. <Expr> -> <IntExpr>
     * 17.        -> <StringExpr>
     * 18.        -> <BooleanExpr>
     * 19.        -> <Id>
     */ 
    public parseExpr(): boolean{
      this.csTree.addBranchNode("Expr");
      if(this.parseIntExpr() || this.parseStrExpr() 
        || this.parseBoolExpr() || this.parseId()){
        this.csTree.moveUp(); // to Expr
        this.csTree.moveUp(); // before Expr
        return true;
      } else{
        // parent decide error
        return false;
      }
    }

    // 20. <IntExpr> -> <digit> <intop> <Expr>
    // 21.           -> <digit>
    public parseIntExpr(): boolean{
      let currToken = this.tokenBank.pop();
      // 32. <digit> -> <0> | <1> | ...
      if(currToken.isEqual("T_Digit")){
        // start of IntExpr
        this.csTree.addBranchNode("IntExpr");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        currToken = this.tokenBank.pop();
        // 35. <intop> -> <+>
        if(currToken.isEqual("T_Addition")){
          this.csTree.addBranchNode(currToken.tValue);
          this.csTree.moveUp();
          if(this.parseExpr()){
            return true;
          } else{
            // expected Expr
            this.printError("Expr", currToken.tValue);
            return false;
          }
        } else {
          // just digit, still valid
          this.tokenBank.push(currToken);
          return true;
        } 
      } else{
        // return to parseExpr to evaluate other production
        this.tokenBank.push(currToken);
        return false;
      }
    }

    // 22. <StringExpr> -> " <CharList> "
    public parseStrExpr(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Quote")){
        // start of StringExpr
        this.csTree.addBranchNode("StringExpr");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        if(this.parseCharList()){
          let currToken = this.tokenBank.pop();
          if(currToken.isEqual("T_CloseQuote")){
            this.csTree.addBranchNode(currToken.tValue);
            this.csTree.moveUp(); // back to StringExpr
            return true;
          } else{
            this.printError("\"", currToken.tValue);
            this.tokenBank.push(currToken);
            return false;
          }
        } // will always return true, empty char returns true
      } else{
        // return to parseExpr to evaluate other productions
        this.tokenBank.push(currToken);
        return false;
      }
    }

    // done ?
    // 23. <BooleanExpr> -> (<Expr> <boolop> <Expr>)
    // 24.               -> <boolval>
    public parseBoolExpr(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_OpenParen")){
        this.csTree.addBranchNode("BooleanExpr");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        if(this.parseExpr()){
          currToken = this.tokenBank.pop();
          // 33. <boolop> -> <==> | <!=>
          if(currToken.isEqual("T_NotEqual") || currToken.isEqual("T_Equal")){
            this.csTree.addBranchNode(currToken.tValue);
            this.csTree.moveUp();
            if(this.parseExpr()){
              currToken = this.tokenBank.pop();
              if(currToken.isEqual("T_CloseParen")){
                this.csTree.addBranchNode(currToken.tValue);
                this.csTree.moveUp(); // BooleanExpr
                return true;
              } else{
                // expected )
                this.printError(")", currToken.tValue);
                this.tokenBank.push(currToken);
                return false;
              }
            }
            // expected expr
            this.printError("Expr", currToken.tValue);
            return false;
          } else{
            this.printError("== | !=", currToken.tValue);
            this.tokenBank.push(currToken);
            return false;
          }
        } 
        // expected expr
        this.printError("Expr", currToken.tValue);
        return false;
      } else if(currToken.isEqual("T_BoolVal")){
        // 34. <boolval> -> <false> | <true>
        this.csTree.addBranchNode("BooleanExpr");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp(); // BooleanExpr
        return true; // 
      } else{
        // parent will handle errors
        this.tokenBank.push(currToken);
        return false;
      }
    }
    
    /* 
     * 26. <CharList> -> <char> <CharList>
     * 27.            -> <space> <CharList>
     * 28.            -> end
     */
    public parseCharList(): boolean{
      let currToken = this.tokenBank.pop();
      // 30. <char> -> <a> | <b> | ...
      // 31. <space> -> space
      if(currToken.isEqual("T_Char") || currToken.isEqual("T_Space")){
        this.csTree.addBranchNode("CharList");
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp();
        return this.parseCharList();
      } else{
        // can be empty string
        this.csTree.moveUp(); // back to StringExpr
        this.tokenBank.push(currToken);
        return true;
      }
    }

    // 25. <Id> -> <char>
    public parseId(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Id")){
        this.csTree.addBranchNode(currToken.tValue);
        this.csTree.moveUp(); // VarDecl, Expr, or AssignmentStatement 
        return true;
      } else{
        // parent will report error
        this.tokenBank.push(currToken);
        return false;
      }
    }


    public printError(expectedVal: String, foundVal: String): void{
      console.log("error");
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById("output");
      output.value += "Expected [" + expectedVal + "]. Found [" + foundVal + "].";
    }
  }
}