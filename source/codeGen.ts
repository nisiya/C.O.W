///<reference path="globals.ts" />
///<reference path="tree.ts" />
///<reference path="scopeTree.ts" />
/* ------------
codeGen.ts
Requires global.ts, tree.ts, scopeTree.ts
------------ */

module Compiler {
    
  export class CodeGen {
    public asTree:Tree;
    public code:string[];
    public tempNum:number;
    public jumpNum:number;
    public staticTable: Map<string, [string, string, number]>;
    public jumpTable: Map<string, number>;
    public stringTable: Map<string, number>;
    public currentScope:ScopeNode;
    public varOffset:number;
    public tempStringMem:string[];
    public trueAddr:number; // where string true and false
    public falseAddr:number; // are stored for printing boolean

    readonly ACC:[string,string] = ["A9","AD"];
    readonly XREG:[string,string] = ["A2","AE"];
    readonly YREG:[string,string] = ["A0","AC"];

    public start(asTree:Tree, scopeTree:ScopeTree): string[]{
      this.asTree = asTree;
      this.code = new Array<string>();
      this.tempStringMem = new Array<string>();
      this.tempNum = 0;
      this.jumpNum = 0;
      this.staticTable = new Map<string, [string, string, number]>();
      this.jumpTable = new Map<string, number>();
      this.stringTable = new Map<string, number>();
      this.currentScope = scopeTree.root;
      this.varOffset = 0;

      // front load the true and false values
      this.addString("false");
      this.falseAddr = 255 - this.tempStringMem.length;
      this.addString("true");     
      this.trueAddr = 255 - this.tempStringMem.length;

      this.handleBlock(asTree.root);
      this.addBreak();
      this.handleBackpatch();

      // add 00s
      while (this.code.length + this.tempStringMem.length < 255){
        this.code.push("00");
      }

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
          this.createWhile(currentNode);
          break;
        case "if":
          this.createIf(currentNode);
          break;
        case "print":
          this.createPrint(currentNode);
          break;
        case "NotEqual":
          break;
        case "Equal":
          break;
      }
    }

    public addToStatic(id:string, type:string): string{
      let tempAddr = "T" + this.tempNum + " XX";
      this.staticTable.set(id + "@" + this.currentScope.level, 
                           [type, tempAddr, this.varOffset]);
      this.tempNum++;
      this.varOffset++;
      return tempAddr;
    }

    public addToJump(): number{
      let jumpKey:string = "J" + this.jumpNum;
      this.jumpTable.set(jumpKey, 0);
      this.code.push("D0");
      this.code.push(jumpKey);
      this.jumpNum++;

      return this.code.length-1;
    }

    public createVarDecl(varDeclNode:TreeNode): void{
      let id:string = varDeclNode.childrenNodes[1].value;
      let type:string = varDeclNode.childrenNodes[0].value;
      let tempAddr:string = this.addToStatic(id, type);
      if (type != "string"){
        this.loadRegConst(0, this.ACC[0]);
        this.storeAcc(tempAddr);
      } // else load the string pointer when initialized
    }

    public addString(value:string): void{
        this.tempStringMem.push("00"); // will add to code at the end
        for(var i=value.length-1; i>=0; i--){
          let asciiVal:number = value.charCodeAt(i);
          this.tempStringMem.push(asciiVal.toString(16).toUpperCase());
        }
    }

    public createAssign(assignNode:TreeNode): void{
      // identify value to be loaded
      let id:string = assignNode.childrenNodes[0].value;
      let varType:string = this.createExpr(assignNode.childrenNodes[1], this.ACC);
      let tempAddr:string;

      if (varType == "string"){
        tempAddr = this.findTempAddr(id);
        if(tempAddr == null){
          tempAddr = this.addToStatic(id, "string");
        }
      } else{
        // find temp address
        tempAddr = this.findTempAddr(id);
      }

      // store value to temp address
      this.storeAcc(tempAddr);
    }

    public createPrint(printNode:TreeNode): void{
      let varType:string = this.createExpr(printNode.childrenNodes[0], this.YREG);
      console.log(varType);
      if(varType == "int"){
        this.loadRegConst(1, this.XREG[0])
      } else{
        this.loadRegConst(2, this.XREG[0])
      }

      this.systemCall();
    }

    public findType(id:string): string{
      let locInfo:[string, string, number] = this.staticTable.get(id + "@" + this.currentScope.level);
      if (locInfo == null){
        let tempScope = this.currentScope.parentScope;
        while (locInfo == null){
          locInfo = this.staticTable.get(id + "@" + tempScope.level);
          tempScope = tempScope.parentScope;
        }
      }
      return locInfo[0];
    }

    public calculateSum(additionNode:TreeNode): string{
      let isDigit:RegExp = /^[0-9]$/;
      // load Acc with value
      let digit:string = additionNode.childrenNodes[0].value;
      this.loadRegConst(parseInt(digit), this.ACC[0]);
      // store at temp address
      let tempAddr:string = "T" + this.tempNum + " XX";
      this.storeAcc(tempAddr);
      this.staticTable.set("Temp" + this.tempNum, ["int", tempAddr, this.varOffset]);
      this.tempNum++;
      this.varOffset++;
      let sumAddr:string = tempAddr;
      let rightOperand:TreeNode = additionNode.childrenNodes[1];

      // check for more addition
      while(rightOperand.value == "Add"){
        console.log("Add");
        // load Acc with value
        digit = rightOperand.childrenNodes[0].value;
        this.loadRegConst(parseInt(digit), this.ACC[0]);
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
        this.loadRegConst(parseInt(digit), this.ACC[0]);
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
      let locInfo:[string, string, number] = this.staticTable.get(id + "@" + this.currentScope.level);
      if (locInfo == null){
        let tempScope = this.currentScope.parentScope;
        while (locInfo == null){
          locInfo = this.staticTable.get(id + "@" + tempScope.level);
          tempScope = tempScope.parentScope;
        }
      }
      return locInfo[1];
    }

    public createWhile(whileNode:TreeNode): void{
      let tempAddr:string;
      let jumpDes:number = this.code.length; // top of loop

      this.createBool(whileNode.childrenNodes[0]);

      // noteq case
      if(whileNode.childrenNodes[0].value == "NotEqual"){
        this.loadRegConst(0, this.ACC[0]);
        let neqJumpNdx:number = this.addToJump();
        this.code[neqJumpNdx] = "02";
        this.loadRegConst(1, this.ACC[0]);
        tempAddr = this.addToStatic("Neq"+this.tempNum, "int");
        this.storeAcc(tempAddr);
        this.loadRegConst(0, this.XREG[0]);
        this.compareX(tempAddr);
      }

      let jumpNdx:number = this.addToJump();
      this.handleBlock(whileNode.childrenNodes[1]);
      // jump to top of while
      this.loadRegConst(2, this.XREG[0]);
      this.loadRegConst(1,this.ACC[0]);
      tempAddr = this.addToStatic("CpX"+this.tempNum, "int");
      this.storeAcc(tempAddr);
      this.compareX(tempAddr);
      let jumpNdx2:number = this.addToJump();
      this.code[jumpNdx2] = this.decimalToHex((256 - this.code.length) + jumpDes);
      this.code[jumpNdx] = this.decimalToHex(this.code.length - jumpNdx - 1);
    }

    public createIf(ifNode:TreeNode): void{
      this.createBool(ifNode.childrenNodes[0]);
      // noteq case
      if(ifNode.childrenNodes[0].value == "NotEqual"){
        this.loadRegConst(0, this.ACC[0]);
        let neqJumpNdx:number = this.addToJump();
        this.code[neqJumpNdx] = "02";
        this.loadRegConst(1, this.ACC[0]);
        let tempAddr:string = this.addToStatic("Neq"+this.tempNum, "int");
        this.storeAcc(tempAddr);
        this.loadRegConst(0, this.XREG[0]);
        this.compareX(tempAddr);
      }
      let jumpNdx:number = this.addToJump();
      this.handleBlock(ifNode.childrenNodes[1]);
      this.code[jumpNdx] = this.decimalToHex(this.code.length - jumpNdx - 1);
    }

    public createBool(boolNode:TreeNode):void{
      let tempAddr:string;
      console.log("BOOL " + boolNode.value);

      if(boolNode.value == "true"){
        this.loadRegConst(this.trueAddr, this.XREG[0]);
        this.loadRegConst(this.trueAddr, this.ACC[0]);
        tempAddr = this.addToStatic(boolNode.value + "" + this.tempNum, "bool");
        this.storeAcc(tempAddr);
        this.compareX(tempAddr);

      } else if(boolNode.value == "false"){
        this.loadRegConst(this.falseAddr, this.XREG[0]);
        this.loadRegConst(this.trueAddr, this.ACC[0]);
        tempAddr = this.addToStatic(boolNode.value + "" + this.tempNum, "bool");
        this.storeAcc(tempAddr);
        this.compareX(tempAddr);

      } else{
        let var1Type:string = this.createExpr(boolNode.childrenNodes[0], this.XREG);
        let var2Node:TreeNode = boolNode.childrenNodes[1];
        let isId:RegExp = /^[a-z]$/;
        let isDigit:RegExp = /^[0-9]$/;
        let isString:RegExp = /^\"[a-zA-Z]*\"$/;

        if(isString.test(var2Node.value)){
          let stringPointer:number;
          if(this.stringTable.get(var2Node.value) == null){
            this.addString(var2Node.value.substring(1,var2Node.value.length-1)); // ignore the quotes
            let stringPointer:number = 255 - this.tempStringMem.length;
          } else{
            stringPointer = this.stringTable.get(var2Node.value);
          }
          this.loadRegConst(stringPointer, this.ACC[0]); // pointer to string
          tempAddr = this.addToStatic("string" + this.tempNum, "string");
          
        } else if(var2Node.value == "true"){
          this.loadRegConst(this.trueAddr, this.ACC[0]);
          tempAddr = this.addToStatic(var2Node.value + "" + this.tempNum, "bool");
          this.storeAcc(tempAddr);

        } else if(var2Node.value == "false"){
          this.loadRegConst(this.falseAddr, this.ACC[0]);
          tempAddr = this.addToStatic(var2Node.value + "" + this.tempNum, "bool");
          this.storeAcc(tempAddr);

        } else if(isId.test(var2Node.value)){
          tempAddr = this.findTempAddr(var2Node.value);

        } else if(isDigit.test(var2Node.value)){
          let intValue = parseInt(var2Node.value);
          this.loadRegConst(intValue, this.ACC[0]);
          tempAddr = this.addToStatic(var2Node.value + "" + this.tempNum, "int");
          this.storeAcc(tempAddr);

        } else if(var2Node.value == "Add"){
          tempAddr = this.calculateSum(var2Node);
        }

        this.compareX(tempAddr);
      }
    }

    public createExpr(exprNode:TreeNode, register:[string,string]): string{
      let isId:RegExp = /^[a-z]$/;
      let isDigit:RegExp = /^[0-9]$/;
      let isString:RegExp = /^\"[a-zA-Z]*\"$/;

      // identify value to be loaded
      let value:string = exprNode.value;

      if(isString.test(value)){
        let stringPointer:number;
        if(this.stringTable.get(value) == null){
          this.addString(value.substring(1,value.length-1)); // ignore the quotes
          stringPointer = 255 - this.tempStringMem.length;
          this.stringTable.set(value, stringPointer);
        } else{
          stringPointer = this.stringTable.get(value);
        }
        this.loadRegConst(stringPointer, register[0]); // pointer to string
        return "string";

      } else if(value == "true"){
        this.loadRegConst(this.trueAddr, register[0]);
        return "boolean";

      } else if(value == "false"){
        this.loadRegConst(this.falseAddr, register[0]);
        return "boolean";

      } else if (isId.test(value)){
        let varAddr:string = this.findTempAddr(value);
        this.loadRegMem(varAddr, register[1]);
        return this.findType(value);

      } else if (isDigit.test(value)){
        // convert value to hex
        let intValue = parseInt(value);
        this.loadRegConst(intValue, register[0]);
        return "int";

      } else if(value == "Add"){
        let sumAddr:string = this.calculateSum(exprNode);
        // sumAddr is where the result of the addtion is
        this.loadRegMem(sumAddr, register[1]);
        return "int";
      } 
    }

    public handleBackpatch(): void{
      console.log(this.staticTable);
      let staticKeys = this.staticTable.keys();
      let key = staticKeys.next();
      let tempTable = new Map<string, number>();
      while(!key.done){
        let locInfo = this.staticTable.get(key.value);
        tempTable.set(locInfo[1], locInfo[2]+this.code.length);
        key = staticKeys.next();
      }
      console.log(this.code);
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
          this.code[i] = this.decimalToHex(index);
          this.code[i+1] = "00";
        }
      }
    }

    public decimalToHex(value:number): string{
      if(value < 16){
        return "0" + value.toString(16).toUpperCase();
      } else{
        return value.toString(16).toUpperCase();
      }
    }

    public loadRegConst(value:number, register:string): void{
      this.code.push(register);
      this.code.push(this.decimalToHex(value));
    }

    public loadRegMem(tempAddr:string, register:string): void{
      this.code.push(register);
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