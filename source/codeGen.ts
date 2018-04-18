///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
///<reference path="staticEntry.ts" />

/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */

module Compiler {
    
  export class CodeGen {
    public asTree: Tree;
    public symbolTable: Symbol[];
    public staticTable: StaticEntry[];
    public warnings: number;
    public code: string[];
    public codeIndex: number;
    public tempNum: number;
    public jumpNum: number;

    public start(asTree:Tree, symbolTable:Symbol[]): string[]{
      this.asTree = asTree;
      this.symbolTable = symbolTable;
      this.code = new Array<string>();
      for(var i=0; i<256; i++){
        this.code.push("00");
      }
      this.codeIndex = 0;
      this.tempNum = 0;
      this.createCode(asTree.root);
      

      return this.code;
    }

    public createCode(node: TreeNode): void{
      switch(node.value){
        case "Block":
          this.createCode(node.childrenNodes[0]);
          break;
        case "VarDecl":
          this.createVarDecl(node);
        case "Assign":
        case "print":
        case "while":
        case "if":
        case "Add":
        case "NotEqual":
        case "Equal":
      }
    }

    public createVarDecl(node:TreeNode): void{
      let varType:string = node.childrenNodes[0].value;
      let id:string = node.childrenNodes[1].value;
      this.addByte("A9");
      this.addByte("00");
      this.addByte("T" + this.tempNum);
      this.addByte("XX");
      let staticVar = new StaticEntry("T" + this.tempNum, "XX", "+0");
      if(varType == "int" || varType == "bool"){

      } else{

      }
      this.tempNum++;
    }

    public addByte(value:string): void{
      this.code[this.codeIndex] = value;
      this.codeIndex++;
    }

  }
}