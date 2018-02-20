/* ------------
Token.ts

Token produced by the lexer will have these properties:
tid - Token ID
tValue - the value of the token
tLine - the number of the line it is on
tColumn - the column index of the token
------------ */
var Compiler;
(function (Compiler) {
    var Tree = /** @class */ (function () {
        function Tree() {
            this.root = null;
            this.current = null;
        }
        Tree.prototype.addBranchNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNode.push(node);
            this.current = node;
        };
        return Tree;
    }());
    Compiler.Tree = Tree;
    var TreeNode = /** @class */ (function () {
        function TreeNode(value, parentNode) {
            this.value = value;
            this.parentNode = parentNode;
            this.childrenNode = new Array();
        }
        return TreeNode;
    }());
    Compiler.TreeNode = TreeNode;
})(Compiler || (Compiler = {}));
