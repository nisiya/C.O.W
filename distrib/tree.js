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
            this.jsonTree = {
                chart: {
                    container: "#pretty-tree"
                },
                nodeStructure: {}
            };
        }
        Tree.prototype.addBranchNode = function (value) {
            var node = new TreeNode(value, this.current);
            this.current.childrenNodes.push(node);
            this.current = node;
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
        };
        Tree.prototype.moveUp = function () {
            this.current = this.current.parentNode;
        };
        Tree.prototype.printTree = function () {
            this.walkTree(this.root, "", this.jsonTree.nodeStructure);
            var output = document.getElementById("csTree");
            output.value += this.outputTree + "\n\n";
        };
        /*
        public displayTree(): void{
          var treeData =
            {
              "name": "Top Level",
              "children": [
                {
              "name": "Level 2: A",
                  "children": [
                    { "name": "Son of A" },
                    { "name": "Daughter of A" }
                  ]
                },
                {
              "name": "Level 2: B",
                "children": [
                  { "name": "Son of B" },
                  { "name": "Daughter of B",
                  "children": [
                    { "name": "Son of A" },
                    { "name": "Daughter of A",
                    "children": [
                      { "name": "Son of A" },
                      { "name": "Daughter of A",
                      "children": [
                        { "name": "Son of A" },
                        { "name": "Daughter of A",
                        "children": [
                          { "name": "Son of A" },
                          { "name": "Daughter of A" }
                        ] }
                      ] }
                    ] }
                  ] }
                ]
               },
               {
                "name": "Level 2: A",
                    "children": [
                      { "name": "Son of A" },
                      { "name": "Daughter of A" }
                    ]
                  },
                  {
                    "name": "Level 2: A",
                        "children": [
                          { "name": "Son of A" },
                          { "name": "Daughter of A" }
                        ]
                      },
                      {
                        "name": "Level 2: A",
                            "children": [
                              { "name": "Son of A" },
                              { "name": "Daughter of A" }
                            ]
                          },
                          {
                            "name": "Level 2: A",
                                "children": [
                                  { "name": "Son of A" },
                                  { "name": "Daughter of A" }
                                ]
                              },
                              {
                                "name": "Level 2: A",
                                    "children": [
                                      { "name": "Son of A" },
                                      { "name": "Daughter of A" }
                                    ]
                                  }
              ]
            };
    
          // set the dimensions and margins of the diagram
          var margin = {top: 40, right: 90, bottom: 50, left: 90},
              width = 660 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;
    
          // declares a tree layout and assigns the size
          var treemap = d3.tree()
              .size([width, height]);
    
          //  assigns the data to a hierarchy using parent-child relationships
          var nodes = d3.hierarchy(treeData);
    
          // maps the node data to the tree layout
          nodes = treemap(nodes);
    
          // append the svg obgect to the body of the page
          // appends a 'group' element to 'svg'
          // moves the 'group' element to the top left margin
          var prettyTree = d3.select("div#prettyTree").select("svg").remove();
          var svg = d3.select("div#prettyTree").append("svg")
                //responsive SVG needs these 2 attributes and no width and height attr
                // .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox","0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom)),
              g = svg.append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");
    
          // adds the links between the nodes
          var link = g.selectAll(".link")
              .data( nodes.descendants().slice(1))
            .enter().append("path")
              .attr("class", "link")
              .attr("d", function(d) {
                return "M" + d.x + "," + d.y
                  + "C" + d.x + "," + (d.y + d.parent.y) / 2
                  + " " + d.parent.x + "," +  (d.y + d.parent.y) / 2
                  + " " + d.parent.x + "," + d.parent.y;
                });
    
          // adds each node as a group
          var node = g.selectAll(".node")
              .data(nodes.descendants())
            .enter().append("g")
              .attr("class", function(d) {
                return "node" +
                  (d.children ? " node--internal" : " node--leaf"); })
              .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"; });
    
          // adds the circle to the node
          node.append("circle")
            .attr("r", 10);
    
          // adds the text to the node
          node.append("text")
            .attr("dy", ".35em")
            .attr("y", function(d) { return d.children ? -20 : 20; })
            .style("text-anchor", "middle")
            .text(function(d) { return d.data.name; });
        }
        */
        Tree.prototype.displayTree = function () {
            var my_chart = new Treant(this.jsonTree);
        };
        Tree.prototype.walkTree = function (node, indent, jsonLevel) {
            var temp = {
                text: { name: node.value },
                children: []
            };
            console.log(jsonLevel);
            // jsonLevel.push(temp);
            this.outputTree += indent + "<" + node.value + ">\n";
            var children = node.childrenNodes;
            if (children.length == 0) {
                return;
            }
            else {
                for (var i = 0; i < children.length; i++) {
                    this.walkTree(children[i], indent + "-", jsonLevel.children);
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
