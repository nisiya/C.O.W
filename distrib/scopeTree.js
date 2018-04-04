/* ------------
ScopeTree.ts

ScopeTree - ScopeTree created by Semantic Analyzer
ScopeNode - Has a scope level number, map of symbols in current scope, Parent Scope, and array of Children Scopes
------------ */
var Compiler;
(function (Compiler) {
    var ScopeTree = /** @class */ (function () {
        function ScopeTree() {
            this.root = null;
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
        // to the parent scope
        ScopeTree.prototype.moveUp = function () {
            this.currentScope = this.currentScope.parentScope;
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
            // check if symbol key already exist
            if (this.symbolMap.get(symbol.key) != null) {
                return null; // redeclaration error
            }
            else {
                // add symbol
                symbol.scope = this.level; // set scope level
                this.symbolMap.set(symbol.key, symbol);
                return symbol;
            }
        };
        // to set symbol to be initialized
        ScopeNode.prototype.updateSymbol = function (symbol) {
            this.symbolMap.set(symbol.key, symbol); // overwrites
        };
        // to find the symbol if exists
        ScopeNode.prototype.getSymbol = function (symbolKey) {
            return this.symbolMap.get(symbolKey);
        };
        return ScopeNode;
    }());
    Compiler.ScopeNode = ScopeNode;
})(Compiler || (Compiler = {}));
