///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="symbol.ts" />

/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */

module Compiler {
    
  export class CodeGen {
    public asTree:Tree;
    public code:string[];
    public tempNum;
    public staticTable: Map<string, [string, number]>;
    public currentScope;
    public varOffset;
    public stringOffset;


    public start(asTree:Tree): void{
      this.asTree = asTree;
      this.code = new Array<string>();
      this.tempNum = 0;
      this.staticTable = new Map<string, [string, number]>();
      this.currentScope = 0;
      this.varOffset = 1;
      this.stringOffset = -1;

      this.createCode(this.asTree.root);
      console.log(this.code);
    }

    public createCode(currentNode:TreeNode): void{
      switch(currentNode.value){
        case "Block":
          for (var i=0; i<currentNode.childrenNodes.length; i++){
            this.createCode(currentNode.childrenNodes[i]);
          }
          break;
        case "VarDecl":
          this.createVarDecl(currentNode);
          break;
        case "Assign":
          this.createAssign(currentNode);
          break;
        case "while":
          break;
        case "if":
          break;
        case "print":
          break;
        case "Add":
          break;
        case "NotEqual":
          break;
        case "Equal":
          break;
      }
    }

    public createVarDecl(varDeclNode:TreeNode): void{
      let id:string = varDeclNode.childrenNodes[1].value;
      let type:string = varDeclNode.childrenNodes[0].value;
      let tempAddr = "T" + this.tempNum + " XX";
      this.loadAccConst("00");
      this.storeAcc(tempAddr);
      let offset:number;
      if (type == "string"){
        offset = this.stringOffset;
        this.stringOffset -= id.length;
      } else{
        offset = this.varOffset;
        this.varOffset++;
      }
      this.staticTable.set(id + "@" + this.currentScope, 
                           [tempAddr, offset]);
      this.tempNum++;
    }

    public createAssign(assignNode:TreeNode): void{
      let isId:RegExp = /^[a-z]$/;
      let isDigit:RegExp = /^[0-9]$/;

      // identify value to be loaded
      let value:string = assignNode.childrenNodes[1].value;
      if (isId.test(value)){
        let varAddr:string = this.findTempAddr(value);
        this.loadAccMem(varAddr);

      } else if (isDigit){
        // convert value to hex
        let intValue = parseInt(value);
        if(intValue < 10){
          this.loadAccConst("0" + intValue.toString(16));
        } else{
          this.loadAccConst(intValue.toString(16));
        }

      } else if(value == "Add"){
        this.calculateSum(assignNode.childrenNodes[1]);

      } else if(value == "true"){
        this.loadAccConst("01");

      } else if(value == "false"){
        this.loadAccConst("00");

      } else{
        // handle string...
      }

      // find temp address
      let id:string = assignNode.childrenNodes[0].value;
      let tempAddr:string = this.findTempAddr(id);

      // store value to temp address
      this.storeAcc(tempAddr);
    }

    public calculateSum(node:TreeNode): number{
      let sum:number = 0;
      // while()
      return sum;
    }
    public findTempAddr(id:string): string{
      let locInfo:[string, number] = this.staticTable.get(id + "@" + this.currentScope);
      if (locInfo == null){
        let tempScope = this.currentScope - 1;
        while (locInfo == null){
          locInfo = this.staticTable.get(id + "@" + tempScope);
          tempScope--;
        }
      }
      return locInfo[0];
    }


    public loadAccConst(value:string): void{
      this.code.push("A9");
      this.code.push(value);
    }

    public loadAccMem(tempAddr:string): void{
      this.code.push("AD");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public storeAcc(tempAddr:string): void{
      this.code.push("8D");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public addAcc(tempAddr:string): void{
      this.code.push("6D");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public loadXConst(value:string): void{
      this.code.push("A2");
      this.code.push(value);
    }

    public loadXMem(tempAddr:string): void{
      this.code.push("AE");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public loadYConst(value:string): void{
      this.code.push("A0");
      this.code.push(value);
    }

    public loadYMem(tempAddr:string): void{
      this.code.push("AC");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public noOperation(): void{
      this.code.push("EA");
    }

    public addBreak(): void{
      this.code.push("00");
    }

    public compareX(tempAddr:string): void{
      this.code.push("EC");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public branchByte(value:string): void{
      this.code.push("D0");
      this.code.push(value);
    }

    public incrementByte(tempAddr:string): void{
      this.code.push("EE");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public systemCall(): void{
      this.code.push("FF");
    }
  }
}