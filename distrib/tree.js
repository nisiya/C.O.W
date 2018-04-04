/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */
var Compiler;
(function (Compiler) {
    var Tree = /** @class */ (function () {
        function Tree(value, line) {
            this.root = new TreeNode(value, line, null);
            this.outputTree = "";
            this.current = this.root;
        }
        Tree.prototype.addBranchNode = function (value, line) {
            var node = new TreeNode(value, line, this.current);
            this.current.childrenNodes.push(node);
            this.current = node;
        };
        Tree.prototype.addLeafNode = function (value, line) {
            var node = new TreeNode(value, line, this.current);
            this.current.childrenNodes.push(node);
        };
        Tree.prototype.moveUp = function () {
            this.current = this.current.parentNode;
        };
        Tree.prototype.removeNode = function () {
            var parent = this.current.parentNode;
            parent.childrenNodes.pop();
        };
        Tree.prototype.printTree = function (treeType) {
            var treeId = "#visual-" + treeType;
            console.log("printing " + treeType);
            var jsonTree = {
                chart: {
                    container: treeId
                },
                nodeStructure: {
                    text: { name: this.root.value },
                    children: []
                }
            };
            this.walkTree(this.root, "", jsonTree.nodeStructure.children);
            var output = document.getElementById(treeType);
            output.value += this.outputTree + "\n\n";
            // let visualTree = new Treant(jsonTree);
        };
        Tree.prototype.walkTree = function (node, indent, jsonLevel) {
            // for the pretty cst
            if (node != this.root) {
                var jsonNode = {
                    text: { name: node.value },
                    children: []
                };
                jsonLevel.push(jsonNode);
                jsonLevel = jsonNode.children;
            }
            // for the normal cst
            this.outputTree += indent + "<" + node.value + ">\n";
            var children = node.childrenNodes;
            // print tree in preorder
            if (children.length == 0) {
                return;
            }
            else {
                for (var i = 0; i < children.length; i++) {
                    this.walkTree(children[i], indent + "-", jsonLevel);
                }
                return;
            }
        };
        return Tree;
    }());
    Compiler.Tree = Tree;
    var TreeNode = /** @class */ (function () {
        function TreeNode(value, line, parentNode) {
            this.value = value;
            this.line = line;
            this.parentNode = parentNode;
            this.childrenNodes = new Array();
        }
        return TreeNode;
    }());
    Compiler.TreeNode = TreeNode;
})(Compiler || (Compiler = {}));
