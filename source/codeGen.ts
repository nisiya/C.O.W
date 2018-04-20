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

      for (var i=0; i<this.asTree.root.childrenNodes.length; i++){
        this.createCode(this.asTree.root.childrenNodes[i]);
      }
      console.log(this.code);
    }

    public createCode(currentNode:TreeNode): void{
      switch(currentNode.value){
        case "Block":
          this.currentScope++;
          for (var i=0; i<currentNode.childrenNodes.length; i++){
            this.createCode(currentNode.childrenNodes[i]);
          }
          this.currentScope--;
          break;
        case "VarDecl":
          this.createVarDecl(currentNode);
          break;
        case "Assign":
          this.createAssign(currentNode);
          break;
        case "while":
          // this.createWhile(currentNode);
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
      this.loadAccConst(0);
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
      let isString:RegExp = /^\"[a-zA-Z]*\"$/;

      // find temp address
      let id:string = assignNode.childrenNodes[0].value;
      let tempAddr:string = this.findTempAddr(id);

      // identify value to be loaded
      let value:string = assignNode.childrenNodes[1].value;
      if (isString.test(value)){
        this.createString(assignNode);
      } else{
        if (isId.test(value)){
          let varAddr:string = this.findTempAddr(value);
          this.loadAccMem(varAddr);

        } else if (isDigit.test(value)){
          // convert value to hex
          let intValue = parseInt(value);
          this.loadAccConst(intValue);
        } else if(value == "Add"){
          this.calculateSum(assignNode.childrenNodes[1]);
          // upon return, Acc will be loaded with appropriate value

        } else if(value == "true"){
          this.loadAccConst(1);

        } else if(value == "false"){
          this.loadAccConst(0);

        }

        // store value to temp address
        this.storeAcc(tempAddr);
    }

    public calculateSum(additionNode:TreeNode): void{
      let isDigit:RegExp = /^[0-9]$/;
      // load Acc with value
      let digit:string = additionNode.childrenNodes[0].value;
      this.loadAccConst(parseInt(digit));
      // store at temp address
      let tempAddr:string = "T" + this.tempNum + " XX";
      this.storeAcc(tempAddr);
      this.staticTable.set("Temp" + this.tempNum, [tempAddr, this.varOffset]);
      this.tempNum++;
      this.varOffset++;
      let sumAddr:string = tempAddr;
      let rightOperand:TreeNode = additionNode.childrenNodes[1];

      // check for more addition
      while(rightOperand.value == "Add"){
        console.log("Add");
        // load Acc with value
        digit = rightOperand.childrenNodes[0].value;
        this.loadAccConst(parseInt(digit));
        // add value from sum storage
        this.addAcc(sumAddr);
        // store value back to sum storage
        this.storeAcc(sumAddr);
        rightOperand = rightOperand.childrenNodes[1];
      }
      // the last value in IntExpr
      if(isDigit.test(rightOperand.value)){
        // load Acc with value
        digit = rightOperand.childrenNodes[0].value;
        this.loadAccConst(parseInt(digit));
        // add value from sum storage
        this.addAcc(sumAddr);
      } else{
        let varAddr = this.findTempAddr(rightOperand.value);
        this.addAcc(varAddr);
      }

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


    public loadAccConst(value:number): void{
      this.code.push("A9");
      if(value < 10){
        this.code.push("0" + value.toString(16));
      } else{
        this.code.push(value.toString(16));
      }
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