/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */
var Compiler;
(function (Compiler) {
    var Tree = /** @class */ (function () {
        function Tree(value) {
            this.root = new TreeNode(value, null);
            this.output = "<" + value + ">";
            this.current = this.root;
            this.level = "";
        }
        Tree.prototype.addBranchNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNode.push(node);
            this.current = node;
            this.level += "-";
            value = this.level + "<" + value + ">";
            this.output += "\n" + value;
        };
        Tree.prototype.addLeafNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNode.push(node);
            value = this.level + "-[" + value + "]";
            this.output += "\n" + value;
        };
        Tree.prototype.moveUp = function () {
            this.current = this.current.parentNode;
            this.level = this.level.substr(0, (this.level.length - 1));
        };
        Tree.prototype.printTree = function () {
            var output = document.getElementById("csTree");
            output.value += this.output + "\n\n";
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
