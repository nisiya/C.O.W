///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />
///<reference path="token.ts" />
/* ------------
SAnalyzer.ts

Requires global.ts, tree.ts, symbol.ts, and token.ts
------------ */
var Compiler;
(function (Compiler) {
    var SAnalyzer = /** @class */ (function () {
        function SAnalyzer() {
        }
        SAnalyzer.prototype.start = function (csTree) {
            console.log("sstart");
            var buffer = new Array();
            this.asTree = new Compiler.Tree("Block");
            console.log(csTree.root.value);
            this.analyzeStmt(csTree.root.childrenNodes[0].childrenNodes[1]); // Start from initial StatementList
            return this.asTree;
        };
        SAnalyzer.prototype.analyzeStmt = function (node) {
            console.log(node.value + " value");
            if (node.childrenNodes[0] == null) {
                return;
            }
            else {
                var stmt = node.childrenNodes[0];
                console.log(stmt.childrenNodes[0].value);
                switch (stmt.value) {
                    case ("Block"):
                        this.asTree.addBranchNode("Block");
                        break;
                    case ("PrintStatement"):
                        this.analyzePrint(node.childrenNodes);
                        break;
                    case ("AssignmentStatement"):
                        this.analyzeAssignment(node.childrenNodes);
                        break;
                    case ("VarDecl"):
                        this.asTree.addBranchNode(node.value);
                        console.log("hello");
                        console.log(this.asTree);
                        this.analyzeVarDecl(node.childrenNodes);
                        this.asTree.moveUp(); // currentNode = block
                        break;
                    case ("WhileStatement"):
                        break;
                    case ("IfStatement"):
                        break;
                    default:
                        break;
                }
                this.analyzeStmt(node.childrenNodes[1]); // the child StatementList
            }
        };
        SAnalyzer.prototype.analyzePrint = function (childrenNodes) {
            this.asTree.addBranchNode(childrenNodes[0].value); // print
            console.log(this.asTree);
            this.analyzeExpr(childrenNodes[2].childrenNodes);
        };
        SAnalyzer.prototype.analyzeAssignment = function (childrenNodes) {
            this.asTree.addBranchNode(childrenNodes[1]); // =
            this.asTree.addLeafNode(childrenNodes[0]); // id
            this.analyzeExpr(childrenNodes[2].childrenNodes); // Expr's children
        };
        SAnalyzer.prototype.analyzeVarDecl = function (childrenNodes) {
            var type = childrenNodes[0];
            this.asTree.addLeafNode(type.childrenNodes[0].value);
            this.asTree.addLeafNode(this.analyzeId(childrenNodes[1])); // id
        };
        SAnalyzer.prototype.analyzeExpr = function (childrenNodes) {
            var exprType = childrenNodes[0]; //Expr only has one child
            switch (exprType.value) {
                case ("IntExpr"):
                    this.analyzeInt(exprType.childrenNodes); // currentNode: parent of Expr
                    break;
                case ("StringExpr"):
                    var stringVal = this.analyzeString(exprType.childrenNodes[1], ""); // CharList
                    this.asTree.addLeafNode(stringVal); // currentNode: parent of Expr
                    break;
                case ("BooleanExpr"):
                    break;
                case ("Id"):
                    var id = this.analyzeId(exprType.childrenNodes[0]);
                    this.asTree.addLeafNode(id); // currentNode: parent of Expr
                    break;
                default:
                    break;
            }
        };
        SAnalyzer.prototype.analyzeId = function (node) {
            return node.childrenNodes[0].value;
        };
        SAnalyzer.prototype.analyzeString = function (node, stringVal) {
            if (node.childrenNodes.length == 0) {
                return stringVal;
            }
            stringVal += node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
            this.analyzeString(node.childrenNodes[1], stringVal); // CharList's CharList
        };
        SAnalyzer.prototype.analyzeInt = function (childrenNodes) {
            if (childrenNodes.length == 1) {
                this.asTree.addLeafNode(childrenNodes[0].value); // digit
                return;
            }
            this.asTree.addBranchNode(childrenNodes[1].value); // intop
            this.asTree.addLeafNode(childrenNodes[0].value); // digit
            this.analyzeExpr(childrenNodes[2].childrenNodes); // expr's children
            this.asTree.moveUp(); // // currentNode: parent of intop
        };
        return SAnalyzer;
    }());
    Compiler.SAnalyzer = SAnalyzer;
})(Compiler || (Compiler = {}));
