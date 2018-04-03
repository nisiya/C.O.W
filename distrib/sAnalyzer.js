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
            // Start from initial StatementList
            // tree-program-block-statementlist
            this.analyzeStmtList(csTree.root.childrenNodes[0].childrenNodes[1]);
            console.log(this.asTree);
            return this.asTree;
        };
        SAnalyzer.prototype.analyzeStmtList = function (stmtList) {
            if (stmtList.childrenNodes[0] == null) {
                // epsilon
                return;
            }
            else {
                this.analyzeStmt(stmtList.childrenNodes[0]); // the statement
                this.analyzeStmtList(stmtList.childrenNodes[1]); // the child stmt list
            }
        };
        SAnalyzer.prototype.analyzeStmt = function (stmt) {
            var stmtType = stmt.childrenNodes[0];
            console.log(stmtType.value + "hello");
            switch (stmtType.value) {
                case "Block":
                    this.asTree.addBranchNode("Block");
                    break;
                case "PrintStatement":
                    this.analyzePrint(stmtType.childrenNodes);
                    break;
                case "AssignmentStatement":
                    this.analyzeAssignment(stmtType.childrenNodes);
                    break;
                case "VarDecl":
                    this.asTree.addBranchNode(stmtType.value);
                    this.analyzeVarDecl(stmtType.childrenNodes);
                    this.asTree.moveUp(); // currentNode = block
                    break;
                case "WhileStatement":
                    break;
                case "IfStatement":
                    break;
                default:
            }
        };
        SAnalyzer.prototype.analyzePrint = function (printChildren) {
            this.asTree.addBranchNode(printChildren[0].value); // print
            this.analyzeExpr(printChildren[2].childrenNodes[0]);
        };
        SAnalyzer.prototype.analyzeAssignment = function (AssignChildren) {
            console.log(AssignChildren);
            this.asTree.addBranchNode(AssignChildren[1].value); // =
            this.asTree.addLeafNode(this.analyzeId(AssignChildren[0])); // id
            this.analyzeExpr(AssignChildren[2].childrenNodes[0]); // Expr's child
        };
        SAnalyzer.prototype.analyzeVarDecl = function (VarDeclChildren) {
            var type = VarDeclChildren[0];
            this.asTree.addLeafNode(type.childrenNodes[0].value);
            this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1])); // id
        };
        SAnalyzer.prototype.analyzeExpr = function (exprType) {
            console.log(exprType);
            switch (exprType.value) {
                case "IntExpr":
                    this.analyzeInt(exprType.childrenNodes); // currentNode: parent of Expr
                    break;
                case "StringExpr":
                    console.log(exprType.childrenNodes[1].value + " string");
                    this.asTree.addLeafNode(this.analyzeString(exprType.childrenNodes[1], "")); // currentNode: parent of Expr
                    break;
                case "BooleanExpr":
                    break;
                case "Id":
                    var id = this.analyzeId(exprType); //char
                    this.asTree.addLeafNode(id); // currentNode: parent of Expr
                    break;
                default:
            }
        };
        SAnalyzer.prototype.analyzeId = function (id) {
            return id.childrenNodes[0].value;
        };
        SAnalyzer.prototype.analyzeString = function (node, stringVal) {
            if (node.childrenNodes.length == 0) {
                console.log(stringVal + "why");
                return stringVal;
            }
            console.log(stringVal + "value");
            stringVal = stringVal + node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
            this.analyzeString(node.childrenNodes[1], stringVal); // CharList's CharList
        };
        SAnalyzer.prototype.analyzeInt = function (IntChildren) {
            if (IntChildren.length == 1) {
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the digit
                this.asTree.moveUp();
                return;
            }
            this.asTree.addBranchNode(IntChildren[1].value); // intop
            this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the digit
            this.analyzeExpr(IntChildren[2].childrenNodes[2]); // expr's children
            this.asTree.moveUp(); // // currentNode: parent of intop
            console.log(this.asTree.current.value + " um");
        };
        return SAnalyzer;
    }());
    Compiler.SAnalyzer = SAnalyzer;
})(Compiler || (Compiler = {}));
