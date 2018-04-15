///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="scopeTree.ts" />
///<reference path="symbol.ts" />
/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */

module Compiler {
    
  export class CodeGen {
    public asTree: Tree;
    public symbols: Symbol[];
    public symbolTable: Symbol[];
    public scopeTree: ScopeTree;
    public warnings: number;
    public code: string[];

    public start(asTree:Tree): string[]{
      this.asTree = asTree;
      this.code = new Array<string>();

      return this.code;
    }
  }
}