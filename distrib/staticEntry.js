/* ------------
ScopeTree.ts

ScopeTree - ScopeTree created by Semantic Analyzer
ScopeNode - Has a scope level number, map of symbols in current scope, Parent Scope, and array of Children Scopes
------------ */
var Compiler;
(function (Compiler) {
    var StaticEntry = /** @class */ (function () {
        function StaticEntry(tempNum, varName, addr) {
            this.temp = tempNum;
            this["var"] = varName;
            this.address = addr;
        }
        return StaticEntry;
    }());
    Compiler.StaticEntry = StaticEntry;
})(Compiler || (Compiler = {}));
