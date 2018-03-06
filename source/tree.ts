/* ------------
Tree.ts

Tree - Concrete Syntax Tree created by Parser
       and Abstract Syntax Tree created by Semantic Analyzer
Tree Node - Has a Value, Parent Node, and array of Children Nodes
------------ */

module Compiler {
    
  export class Tree {
    public root: TreeNode;
    public current: TreeNode;
    public level: string;
    public output: string;
    public jsonTree;

    constructor(value) {
      this.root = new TreeNode(value, null);
      this.output = "<" + value + ">";
      this.current = this.root;
      this.level = "";
      this.jsonTree = {
        chart: {
            container: "#pretty-tree"
        },
        
        nodeStructure: {
            text: { name: value },
            children: [
            ]
        }
      };
    }
    
    public addBranchNode(value): void{
      let node:TreeNode = new TreeNode(value, this.current);
      this.current.childrenNodes.push(node);
      this.current = node;
      // pretty tree out
      // let tmp = {
      //   text: {name: value},
      //   children:[

      //   ]
      // }
      // this.jsonTree.nodeStructure.children.push(tmp);
      // outputs
      this.level += "-";
      value = this.level + "<" + value + ">";
      this.output += "\n" + value;

    }

    public addLeafNode(value): void{
      let node:TreeNode = new TreeNode(value, this.current);
      this.current.childrenNodes.push(node);
      // outputs
      value = this.level + "-[" + value + "]";
      this.output += "\n" + value;
    }

    public moveUp(): void{
      this.current = this.current.parentNode;
      this.level = this.level.substr(0,(this.level.length-1));
    }

    public printTree(): void{
      let output: HTMLInputElement = <HTMLInputElement> document.getElementById("csTree");
      output.value += this.output + "\n\n";
    }

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
    public displayTree(): void{
      let my_chart = new Treant(this.jsonTree);
    }

    public walkTree(): void{
      let node = this.root;
      let children = node.childrenNodes;
    }

  }

  export class TreeNode {
    public value: string;
    public parentNode: TreeNode;
    public childrenNodes: Array<TreeNode>;

    constructor(value:string, 
                parentNode:TreeNode){
      this.value = value;
      this. parentNode = parentNode;
      this.childrenNodes = new Array<TreeNode>();
    }
  }
}