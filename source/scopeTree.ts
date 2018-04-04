/* ------------
ScopeTree.ts

ScopeTree - ScopeTree created by Semantic Analyzer
ScopeNode - Has a scope level number, map of symbols in current scope, Parent Scope, and array of Children Scopes
------------ */

module Compiler {
    
  export class ScopeTree {
    public root: ScopeNode;
    public currentScope: ScopeNode;
    public currentLevel: number;

    constructor() {
      this.root = null;
      this.currentScope = null;
      this.currentLevel = -1;
    }

    public addScopeNode(): void{
      this.currentLevel++;
      if(this.root == null){
        let newScope:ScopeNode = new ScopeNode(this.currentLevel, null);
        this.root = newScope;
        this.currentScope = this.root;
      } else{
        let newScope:ScopeNode = new ScopeNode(this.currentLevel, this.currentScope);
        this.currentScope.childrenScopes.push(newScope);
        this.currentScope = newScope;
      }
    }

    // to the parent scope
    public moveUp(): void{ 
      this.currentScope = this.currentScope.parentScope;
    }

  }

  export class ScopeNode {
    public level: number;
    public symbolMap: Map<string, Symbol>;
    public parentScope: ScopeNode;
    public childrenScopes: Array<ScopeNode>;

    constructor(level, parentNode:ScopeNode){
      this.level = level;
      this.symbolMap = new Map<string, Symbol>();
      this. parentScope = parentNode;
      this.childrenScopes = new Array<ScopeNode>();
    }

    public addSymbol(symbol: Symbol): Symbol{
      // check if symbol key already exist
      if(this.symbolMap.get(symbol.key) != null){
        return null; // redeclaration error
      } else{
        // add symbol
        symbol.scope = this.level; // set scope level
        this.symbolMap.set(symbol.key, symbol);
        return symbol;
      }
    }

    // to set symbol to be initialized
    public updateSymbol(symbol: Symbol): void{
      this.symbolMap.set(symbol.key, symbol); // overwrites
    }

    // to find the symbol if exists
    public getSymbol(symbolKey: string): Symbol{
      return this.symbolMap.get(symbolKey);
    }
  }

}