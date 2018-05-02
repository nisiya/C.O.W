///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="scopeTree.ts" />
///<reference path="symbol.ts" />
/* ------------
SAnalyzer.ts
Requires global.ts, tree.ts, symbol.ts
------------ */

module Compiler {
    
  export class CodeGen {
    public asTree:Tree;
    public code:string[];
    public tempNum:number;
    public staticTable: Map<string, [string, number]>;
    public currentScope:ScopeNode;
    public varOffset:number;
    public tempStringMem:string[];


    public start(asTree:Tree, scopeTree:ScopeTree): string[]{
      this.asTree = asTree;
      this.code = new Array<string>();
      this.tempStringMem = new Array<string>();
      this.tempNum = 0;
      this.staticTable = new Map<string, [string, number]>();
      this.currentScope = scopeTree.root;
      this.varOffset = 0;

      this.handleBlock(asTree.root);
      this.addBreak();
      this.handleBackpatch();
      // append strings to the end
      while (this.tempStringMem.length > 0){
        this.code.push(this.tempStringMem.pop());
      }

      console.log(this.staticTable);
      if(this.code.length > 256){
        return null;
      } else {
        return this.code;
      }
    }

    public handleBlock(blockNode:TreeNode): void{
      let childScopeIndex:number = 0;
      let tempScope:ScopeNode = this.currentScope;
      for (var i=0; i<blockNode.childrenNodes.length; i++){
        let childNode:TreeNode = blockNode.childrenNodes[i];
        if (childNode.value == "Block"){
          this.currentScope = tempScope.childrenScopes[childScopeIndex]; 
          this.handleBlock(childNode);
          childScopeIndex++;
        } else{
          this.createCode(childNode);
        }
      }
      this.currentScope = tempScope;
    }

    public createCode(currentNode:TreeNode): void{
      switch(currentNode.value){
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
          this.createPrint(currentNode);
          break;
        case "Add":
          break;
        case "NotEqual":
          break;
        case "Equal":
          break;
      }
    }

    public addToStatic(id:string): string{
      let tempAddr = "T" + this.tempNum + " XX";
      this.staticTable.set(id + "@" + this.currentScope.level, 
                           [tempAddr, this.varOffset]);
      this.tempNum++;
      this.varOffset++;
      return tempAddr;
    }

    public createVarDecl(varDeclNode:TreeNode): void{
      let id:string = varDeclNode.childrenNodes[1].value;
      let type:string = varDeclNode.childrenNodes[0].value;
      let tempAddr:string = this.addToStatic(id);
      if (type != "string"){
        this.loadAccConst(0);
        this.storeAcc(tempAddr);
      } // else load the string pointer when initialized
    }


    public addString(value:string): void{
      this.tempStringMem.push("00"); // will add to code at the end
      for(var i=value.length-2; i>0; i--){
        // ignore the quotes
        let asciiVal:number = value.charCodeAt(i);
        this.tempStringMem.push(asciiVal.toString(16).toUpperCase());
      }
    }


    public createAssign(assignNode:TreeNode): void{
      let isId:RegExp = /^[a-z]$/;
      let isDigit:RegExp = /^[0-9]$/;
      let isString:RegExp = /^\"[a-zA-Z]*\"$/;

      // identify value to be loaded
      let id:string = assignNode.childrenNodes[0].value;
      let value:string = assignNode.childrenNodes[1].value;
      let tempAddr:string;

      if(isString.test(value)){
        this.addString(value);
        let stringPointer:number = 256 - this.tempStringMem.length;
        this.loadAccConst(stringPointer); // pointer to string
        // add to Static table and get temp address
        tempAddr = this.addToStatic(id);
      } else {
        if (isId.test(value)){
          let varAddr:string = this.findTempAddr(value);
          this.loadAccMem(varAddr);

        } else if (isDigit.test(value)){
          // convert value to hex
          let intValue = parseInt(value);
          this.loadAccConst(intValue);

        } else if(value == "Add"){
          let sumAddr:string = this.calculateSum(assignNode.childrenNodes[1]);
          // upon return, Acc will be loaded with appropriate value

        } else if(value == "true"){
          this.loadAccConst(1);

        } else if(value == "false"){
          this.loadAccConst(0);

        }
        // find temp address
        tempAddr = this.findTempAddr(id);
      }

      // store value to temp address
      this.storeAcc(tempAddr);
    }

    public createPrint(printNode:TreeNode): void{
      let isId:RegExp = /^[a-z]$/;
      let isDigit:RegExp = /^[0-9]$/;
      let isString:RegExp = /^\"[a-zA-Z]*\"$/;

      // identify value to be loaded
      let value:string = printNode.childrenNodes[0].value;

      if(isString.test(value)){
        this.addString(value);
        let stringPointer:number = 256 - this.tempStringMem.length;
        this.loadYConst(stringPointer); // pointer to string
        this.loadXConst(2);
      } else {
        if (isId.test(value)){
          let varAddr:string = this.findTempAddr(value);
          this.loadYMem(varAddr);

        } else if (isDigit.test(value)){
          // convert value to hex
          let intValue = parseInt(value);
          this.loadYConst(intValue);

        } else if(value == "Add"){
          let sumAddr:string = this.calculateSum(printNode.childrenNodes[0]);
          // sumAddr is where the result of the addtion is
          this.loadYMem(sumAddr); 

        } else if(value == "true"){
          this.loadYConst(1);

        } else if(value == "false"){
          this.loadYConst(0);

        }
        
        this.loadXConst(1);
      }      
      this.systemCall();
    }

    public calculateSum(additionNode:TreeNode): string{
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

      this.storeAcc(sumAddr);

      return sumAddr;
    }

    public findTempAddr(id:string): string{
      console.log(this.currentScope);
      let locInfo:[string, number] = this.staticTable.get(id + "@" + this.currentScope.level);
      if (locInfo == null){
        let tempScope = this.currentScope.parentScope;
        while (locInfo == null){
          locInfo = this.staticTable.get(id + "@" + tempScope.level);
          tempScope = tempScope.parentScope;
        }
      }
      return locInfo[0];
    }

    public handleBackpatch(): void{
      console.log(this.code);
      let staticKeys = this.staticTable.keys();
      let key = staticKeys.next();
      let tempTable = new Map<string, number>();
      while(!key.done){
        let locInfo = this.staticTable.get(key.value);
        tempTable.set(locInfo[0], locInfo[1]+this.code.length);
        key = staticKeys.next();
      }
      console.log(tempTable);
      this.backpatch(tempTable);
    }

    public backpatch(tempTable:Map<string, number>): void{
      let isTemp:RegExp = /^T/;
      for(var i=0; i<this.code.length; i++){
        console.log("code " + this.code[i]);
        if(isTemp.test(this.code[i])){
          console.log("replace " + this.code[i]);
          let staticKeys = this.code[i] + " "+ this.code[i+1];
          let index = tempTable.get(staticKeys);
          this.code[i] = index.toString(16).toUpperCase();
          this.code[i+1] = "00";
        }
      }
    }

    public loadAccConst(value:number): void{
      this.code.push("A9");
      if(value < 10){
        this.code.push("0" + value.toString(16).toUpperCase());
      } else{
        this.code.push(value.toString(16).toUpperCase());
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

    public loadXConst(value:number): void{
      this.code.push("A2");
      if(value < 10){
        this.code.push("0" + value.toString(16).toUpperCase());
      } else{
        this.code.push(value.toString(16).toUpperCase());
      }    }

    public loadXMem(tempAddr:string): void{
      this.code.push("AE");
      let memAddr:string[] = tempAddr.split(" ");
      this.code.push(memAddr[0]);
      this.code.push(memAddr[1]);
    }

    public loadYConst(value:number): void{
      this.code.push("A0");
      if(value < 10){
        this.code.push("0" + value.toString(16).toUpperCase());
      } else{
        this.code.push(value.toString(16).toUpperCase());
      }
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