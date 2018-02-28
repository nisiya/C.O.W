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
        function Tree(value) {
            this.root = new TreeNode(value, null);
            this.current = this.root;
        }
        Tree.prototype.addBranchNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNode.push(node);
            this.current = node;
        };
        Tree.prototype.addLeafNode = function (value) {
        };
        Tree.prototype.moveUp = function () {
            this.current = this.current.parentNode;
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
