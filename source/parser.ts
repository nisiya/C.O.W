///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="token.ts" />

/* ------------
Parser.ts

Requires global.ts.
------------ */

module Compiler {
    
  export class Parser {
    public csTree: Tree;
    public tokenBank: Token[];
    
    /*
    1. <Program> -> <Block> $
    2. <Block> -> <StatementList>
    3. <StatementList> -> <Statement> <StatementList>
    4.                 -> end
    5. <Statement> -> <PrintStatement>
    6.             -> <AssignmentStatement>
    7.             -> <VarDecl>
    8.             -> <WhileStatement>
    9.             -> <IfStatement>
    10.            -> <Block>
    11. <PrintStatement> -> print (<Expr>)
    12. <AssignmentStatement> -> <Id> = <Expr>
    13. <VarDecl> -> type Id
    14. <WhileStatement> -> while <BooleanExpr> <Block>
    15. <IfStatement> -> if <BooleanExpr> <Block>
    16. <Expr> -> <IntExpr>
    17.        -> <StringExpr>
    18.        -> <BooleanExpr>
    19.        -> <Id>
    20. <IntExpr> -> <digit> <intop> <Expr>
    21.           -> <digit>
    22. <StringExpr> -> " <CharList> "
    23. <BooleanExpr> -> (<Expr> <boolop> <Expr>)
    24.               -> <boolval>
    25. <Id> -> <char>
    26. <CharList> -> <char> <CharList>
    27.            -> <space> <CharList>
    28.            -> end
    29. <type> -> <int> | <string> | <boolean>
    30. <char> -> <a> | <b> | ...
    31. <space> -> space
    32. <digit> -> <0> | <1> | ...
    33. <boolop> -> <==> | <!=>
    34. <boolval> -> <false> | <true>
    35. <intop> -> <+>
    */

    public start(tokenBank:Array<Token>): Tree{
      this.tokenBank = tokenBank.reverse();
      // let currToken = tokenBank.pop();
      this.csTree = new Tree();
      this.csTree.addBranchNode("Program");
      if(this.parseBlock()){
        let currToken = this.tokenBank.pop();
        if(currToken.isEqual("T_EOP")){
          return this.csTree;
        }
      }
      return null;
    }

    public parseBlock(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_OpenBracket")){
        if(this.parseStmtList()){
          currToken = this.tokenBank.pop();
          if(currToken.isEqual("T_CloseBracket")){
            return true;
          }
        }
      } 
      return false;
    }

    public parseStmtList(): boolean{
      let currToken = this.tokenBank.pop();
      if(this.parsePrintStmt()){
        this.parseStmtList();
      } else if(this.parseAssignStmt()){
        this.parseStmtList();  
      } else if(this.parseVarDecl()){
        this.parseStmtList();
      } else if(this.parseWhileStmt()){
        this.parseStmtList();
      } else if(this.parseIfStmt()){
        this.parseStmtList();
      } else if(this.parseBlock()){
        this.parseStmtList();
      } else{
        return true;
      }
    }

    public parsePrintStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Print")){
        currToken = this.tokenBank.pop();
        if(currToken.isEqual("T_OpenParen")){
          if(this.parseExpr()){

          }
        } else{

        }
      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseAssignStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Id")){
        currToken = this.tokenBank.pop();
        if(currToken.isEqual("T_Assignment")){
          if(this.parseExpr()){

          }
        }
      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseVarDecl(): boolean{
      return this.parseType();
    }

    public parseWhileStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_While")){

      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseIfStmt(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_If")){

      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseExpr(): boolean{
      if(this.parseIntExpr()){

      } else if(this.parseStrExpr()){

      } else if(this.parseBoolExpr()){

      } else{
        return false;
      }
    }

    public parseIntExpr(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Digit")){
        currToken = this.tokenBank.pop();
        if(currToken.isEqual("T_Addition")){
          return true;
        } else{
          //error
          return false;
        }
      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseStrExpr(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Quote")){
        if(this.parseCharList()){
          return true;
        }
      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseBoolExpr(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_OpenParen")){
        return true;
      } else if(currToken.isEqual("T_BoolVal")){
        return true;
      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseCharList(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Char") || currToken.isEqual("T_Space")){
        if(this.parseCharList()){
          
        } else{

        }
      } else{
        return false;
      }
    }
    
    public parseType(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_VarType")){
        if(this.parseId()){
          
        }
      } else{
        this.tokenBank.push(currToken);
        return false;
      }
    }

    public parseId(): boolean{
      let currToken = this.tokenBank.pop();
      if(currToken.isEqual("T_Id")){

      }

      return false;
    }
    public printError(): void{

    }
  }
}