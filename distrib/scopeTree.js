/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */
var Compiler;
(function (Compiler) {
    var ScopeTree = /** @class */ (function () {
        // public outputTree: string;
        function ScopeTree() {
            this.root = null;
            // this.outputTree = "";
            this.currentScope = null;
            this.currentLevel = -1;
        }
        ScopeTree.prototype.addScopeNode = function () {
            this.currentLevel++;
            if (this.root == null) {
                var newScope = new ScopeNode(this.currentLevel, null);
                this.root = newScope;
                this.currentScope = this.root;
            }
            else {
                var newScope = new ScopeNode(this.currentLevel, this.currentScope);
                this.currentScope.childrenScopes.push(newScope);
                this.currentScope = newScope;
            }
        };
        ScopeTree.prototype.moveUp = function () {
            this.currentScope = this.currentScope.parentScope;
            // this.currentLevel = this.currentScope.level; //hmmmm
        };
        return ScopeTree;
    }());
    Compiler.ScopeTree = ScopeTree;
    var ScopeNode = /** @class */ (function () {
        function ScopeNode(level, parentNode) {
            this.level = level;
            this.symbolMap = new Map();
            this.parentScope = parentNode;
            this.childrenScopes = new Array();
        }
        ScopeNode.prototype.addSymbol = function (symbol) {
            if (this.symbolMap.get(symbol.key) != null) {
                return null; // redeclaration 
            }
            else {
                symbol.scope = this.level; // set scope level
                this.symbolMap.set(symbol.key, symbol);
                return symbol;
            }
        };
        ScopeNode.prototype.updateSymbol = function (symbol) {
            this.symbolMap.set(symbol.key, symbol); // overwrites
        };
        ScopeNode.prototype.getSymbol = function (symbolKey) {
            return this.symbolMap.get(symbolKey);
        };
        return ScopeNode;
    }());
    Compiler.ScopeNode = ScopeNode;
})(Compiler || (Compiler = {}));
