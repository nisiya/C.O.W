///<reference path="globals.ts" />
///<reference path="tree.ts" />

/* ------------
Parser.ts

Requires global.ts.
------------ */

module Compiler {
    
  export class Parser {
    public csTree:Tree;
    
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
      tokenBank = tokenBank.reverse();
      this.csTree = new Tree();
      csTree.addBranchNode("Program");

    }

  }
}