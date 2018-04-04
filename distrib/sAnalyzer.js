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
            return this.asTree;
        };
        // blockChildrens: [ { , StatementList, } ]
        SAnalyzer.prototype.analyzeBlock = function (blockNode) {
            this.asTree.addBranchNode("Block");
            this.analyzeStmtList(blockNode.childrenNodes[1]);
        };
        // stmtListChildrens: [0] or [Statement, StatementList]
        SAnalyzer.prototype.analyzeStmtList = function (stmtList) {
            if (stmtList.childrenNodes.length == 0) {
                if (this.asTree.current != this.asTree.root) {
                    this.asTree.moveUp(); // to parent of block
                }
                // epsilon
            }
            else {
                // has two children: stmt and stmtlist
                this.analyzeStmt(stmtList.childrenNodes[0]); // the statement
                // asTree.current = Block
                this.analyzeStmtList(stmtList.childrenNodes[1]); // the child stmt list
            }
        };
        // stmtChildrens: [PrintStatement | AssignmentStatement | VarDecl |
        //                 WhileStatement | IfStatement         | Block    ]
        SAnalyzer.prototype.analyzeStmt = function (stmt) {
            var stmtType = stmt.childrenNodes[0];
            switch (stmtType.value) {
                case "Block":
                    this.analyzeBlock(stmtType);
                    break;
                case "PrintStatement":
                    this.analyzePrint(stmtType.childrenNodes);
                    this.asTree.moveUp(); // to Block
                    break;
                case "AssignmentStatement":
                    this.analyzeAssignment(stmtType.childrenNodes);
                    this.asTree.moveUp(); // to Block
                    break;
                case "VarDecl":
                    this.asTree.addBranchNode(stmtType.value);
                    this.analyzeVarDecl(stmtType.childrenNodes);
                    this.asTree.moveUp(); // to Block
                    break;
                case "WhileStatement":
                    // console.log(stmtType.childrenNodes);
                    this.analyzeWhile(stmtType.childrenNodes);
                    this.asTree.moveUp(); // to Block
                    break;
                case "IfStatement":
                    this.analyzeIf(stmtType.childrenNodes);
                    this.asTree.moveUp(); // to Block
                    break;
                default:
                    break;
            }
        };
        // PrintChildren: [print, ( , Expr, ) ]
        SAnalyzer.prototype.analyzePrint = function (printChildren) {
            this.asTree.addBranchNode(printChildren[0].value); // print
            this.analyzeExpr(printChildren[2]);
            // asTree.current = print
        };
        SAnalyzer.prototype.analyzeAssignment = function (AssignChildren) {
            this.asTree.addBranchNode(AssignChildren[1].value); // =
            this.asTree.addLeafNode(this.analyzeId(AssignChildren[0])); // id
            this.analyzeExpr(AssignChildren[2]); // Expr's child
            // asTree.current = AssignmentOp
        };
        // VarDeclChildren: [type, Id]
        SAnalyzer.prototype.analyzeVarDecl = function (VarDeclChildren) {
            var type = VarDeclChildren[0];
            this.asTree.addLeafNode(this.analyzeType(VarDeclChildren[0])); // type
            this.asTree.addLeafNode(this.analyzeId(VarDeclChildren[1])); // id
            // asTree.current = VarDecl
        };
        // WhileChildren: [while, BooleanExpr, Block]
        SAnalyzer.prototype.analyzeWhile = function (whileChildren) {
            this.asTree.addBranchNode(whileChildren[0].value);
            this.analyzeBoolExpr(whileChildren[1].childrenNodes);
            this.analyzeBlock(whileChildren[2]);
            // asTree.current = while
        };
        // IfChildren: [if, BooleanExpr, Block]
        SAnalyzer.prototype.analyzeIf = function (ifChildren) {
            this.asTree.addBranchNode(ifChildren[0].value);
            this.analyzeBoolExpr(ifChildren[1].childrenNodes);
            this.analyzeBlock(ifChildren[2]);
            // asTree.current = if
        };
        // ExprChildren: [IntExpr | StringExpr | BooleanExpr | Id]
        SAnalyzer.prototype.analyzeExpr = function (expr) {
            var exprType = expr.childrenNodes[0];
            switch (exprType.value) {
                case "IntExpr":
                    this.analyzeIntExpr(exprType.childrenNodes); // currentNode: parent of Expr
                    break;
                case "StringExpr":
                    this.asTree.addLeafNode(this.analyzeStringExpr(exprType.childrenNodes[1], "")); // currentNode: parent of Expr
                    break;
                case "BooleanExpr":
                    this.analyzeIntExpr(exprType.childrenNodes);
                    break;
                case "Id":
                    this.asTree.addLeafNode(this.analyzeId(exprType)); // currentNode: parent of Expr
                    break;
                default:
                    // nothing
                    break;
            }
        };
        SAnalyzer.prototype.analyzeType = function (typeNode) {
            return typeNode.childrenNodes[0].value;
        };
        SAnalyzer.prototype.analyzeId = function (idNode) {
            return idNode.childrenNodes[0].value;
        };
        SAnalyzer.prototype.analyzeStringExpr = function (node, stringVal) {
            if (node.childrenNodes.length == 0) {
                return stringVal;
            }
            stringVal = stringVal + node.childrenNodes[0].childrenNodes[0].value; // CharList's char's child's value
            this.analyzeStringExpr(node.childrenNodes[1], stringVal); // CharList's CharList
        };
        // IntExprChildren: [digit] or [digit, intop, Expr]
        SAnalyzer.prototype.analyzeIntExpr = function (IntChildren) {
            if (IntChildren.length == 1) {
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the digit
                // asTree.current = parent of digit
            }
            else {
                this.asTree.addBranchNode(IntChildren[1].value); // intop
                this.asTree.addLeafNode(IntChildren[0].childrenNodes[0].value); // the first digit
                this.analyzeExpr(IntChildren[2]); // expr's children
                this.asTree.moveUp();
                // asTree.current = parent of IntExpr
            }
        };
        // BooleanExprChildren: [boolval] or [ ( , Expr, boolop, Expr, ) ]
        SAnalyzer.prototype.analyzeBoolExpr = function (BoolChildren) {
            if (BoolChildren.length == 1) {
                this.asTree.addLeafNode(BoolChildren[0].childrenNodes[0].value); // the boolval
                // asTree.current = while
            }
            else {
                this.asTree.addBranchNode(BoolChildren[2].childrenNodes[0].value); // the boolop
                this.analyzeExpr(BoolChildren[1]); // asTree.current = boolop
                this.analyzeExpr(BoolChildren[3]);
                this.asTree.moveUp(); // to while
                // asTree.current = while
            }
        };
        return SAnalyzer;
    }());
    Compiler.SAnalyzer = SAnalyzer;
})(Compiler || (Compiler = {}));
