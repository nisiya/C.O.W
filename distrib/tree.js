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
            this.outputTree = "";
            this.current = this.root;
        }
        Tree.prototype.addBranchNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNodes.push(node);
            this.current = node;
            console.log("branch" + value);
            // pretty tree out
            // let tmp = {
            //   text: {name: value},
            //   children:[
            //   ]
            // }
            // this.jsonTree.nodeStructure.children.push(tmp);
        };
        Tree.prototype.addLeafNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNodes.push(node);
            console.log("leaf" + value);
        };
        Tree.prototype.moveUp = function () {
            this.current = this.current.parentNode;
            console.log("current" + this.current.value);
        };
        Tree.prototype.printTree = function () {
            var jsonTree = {
                chart: {
                    container: "#pretty-tree"
                },
                nodeStructure: {
                    text: { name: this.root.value },
                    children: []
                }
            };
            this.walkTree(this.root, "", jsonTree.nodeStructure.children);
            var output = document.getElementById("csTree");
            output.value += this.outputTree + "\n\n";
            var my_chart = new Treant(jsonTree);
        };
        // public displayTree(jsonTree): void{
        //   let my_chart = new Treant(this.jsonTree);
        // }
        Tree.prototype.walkTree = function (node, indent, jsonLevel) {
            if (node != this.root) {
                var jsonNode = {
                    text: { name: node.value },
                    children: []
                };
                jsonLevel.push(jsonNode);
                jsonLevel = jsonNode.children;
            }
            this.outputTree += indent + "<" + node.value + ">\n";
            var children = node.childrenNodes;
            if (children.length == 0) {
                return;
            }
            else {
                for (var i = 0; i < children.length; i++) {
                    // console.log(children[i]);
                    this.walkTree(children[i], indent + "-", jsonLevel);
                }
                return;
            }
        };
        return Tree;
    }());
    Compiler.Tree = Tree;
    var TreeNode = /** @class */ (function () {
        function TreeNode(value, parentNode) {
            this.value = value;
            this.parentNode = parentNode;
            this.childrenNodes = new Array();
        }
        return TreeNode;
    }());
    Compiler.TreeNode = TreeNode;
})(Compiler || (Compiler = {}));
