/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */

module Compiler {
    
  export class ScopeTree {
    public root: ScopeNode;
    public currentScope: ScopeNode;
    public currentLevel: number;
    // public outputTree: string;

    constructor() {
      this.root = null;
      // this.outputTree = "";
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

    public moveUp(): void{
      this.currentScope = this.currentScope.parentScope;
      // this.currentLevel = this.currentScope.level; //hmmmm
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
      if(this.symbolMap.get(symbol.key) != null){
        return null; // redeclaration 
      } else{
        symbol.scope = this.level; // set scope level
        this.symbolMap.set(symbol.key, symbol);
        return symbol;
      }
    }

    public usedSymbol(symbol: Symbol): void{
      if(!symbol.used){
        symbol.used = true;
        this.symbolMap.set(symbol.key, symbol); // overwrites
      }
    }

    public getSymbol(symbolKey: string): Symbol{
      return this.symbolMap.get(symbolKey);
    }
  }

}