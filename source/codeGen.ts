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
    public tempNum:number; // temp location counter
    public jumpNum:number; // jump number counter
    public staticTable: Map<string, [string, string, number]>;
    public jumpTable: Map<string, number>;
    public stringTable: Map<string, number>; // map addr to added strings
    public currentScope:ScopeNode;
    public varOffset:number; // from end of code area
    public heap:string[]; //
    public trueAddr:number; // where string true and false
    public falseAddr:number; // are stored for printing boolean

    readonly ACC:[string,string] = ["A9","AD"];
    readonly XREG:[string,string] = ["A2","AE"];
    readonly YREG:[string,string] = ["A0","AC"];

    public start(asTree:Tree, scopeTree:ScopeTree): string[]{
      _OutputLog = "";

      this.asTree = asTree;
      this.code = new Array<string>();
      this.heap = new Array<string>();
      this.tempNum = 0;
      this.jumpNum = 0;
      this.staticTable = new Map<string, [string, string, number]>();
      this.jumpTable = new Map<string, number>();
      this.stringTable = new Map<string, number>();
      this.currentScope = scopeTree.root;
      this.varOffset = 0;

      // front load the true and false values
      this.addString("false");
      this.falseAddr = 255 - this.heap.length;
      this.addString("true");     
      this.trueAddr = 255 - this.heap.length;

      // start with root like always
      this.handleBlock(asTree.root);

      // end of code
      this.addBreak();
      
      let tempCodeLen = this.code.length;

      // pad the 00s
      while (this.code.length + this.heap.length < 255){
        this.code.push("00");
      }

      // append heap to the end
      while (this.heap.length > 0){
        this.pushByte(this.heap.pop());
      }

      this.handleBackpatch(tempCodeLen);

      if(this.code.length > 256){
        return null; // memory exceeds 256 bytes
      } else {
        return this.code;
      }
    }

    public handleBlock(blockNode:TreeNode): void{
      let childScopeIndex:number = 0; // which child to visit
      let tempScope:ScopeNode = this.currentScope;
      for (var i=0; i<blockNode.childrenNodes.length; i++){
        let childNode:TreeNode = blockNode.childrenNodes[i];
        if (childNode.value == "Block"){
          this.currentScope = tempScope.childrenScopes[childScopeIndex]; 
          this.handleBlock(childNode);
          this.currentScope = this.currentScope.parentScope;
          childScopeIndex++;          
        } else{
          this.createCode(childNode);
        }
      }
      this.currentScope = tempScope;
    }

    public createCode(currentNode:TreeNode): void{
      if(_VerboseMode){
        _OutputLog += "\n   CODEGEN --> Found [" + currentNode.value 
                  + "] on line " + currentNode.location[0] + " and column " + currentNode.location[1];
      }
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
      }
    }

    // add entry to static table
    // returns the temp location address
    public addToStatic(id:string, type:string): string{
      let tempAddr = "T" + this.tempNum + " XX";
      this.staticTable.set(id + "@" + this.currentScope.level, 
                           [type, tempAddr, this.varOffset]);
      this.tempNum++;
      this.varOffset++;
      return tempAddr;
    }

    // add entry to jump table
    // returns current point in code
    public addToJump(): number{
      let jumpKey:string = "J" + this.jumpNum;
      this.jumpTable.set(jumpKey, 0);
      this.pushByte("D0");
      this.pushByte(jumpKey);
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

    // add to heap
    public addString(value:string): void{
        this.heap.push("00"); // strings are 00-terminated
        for (var i=value.length-1; i>=0; i--){
          let asciiVal:number = value.charCodeAt(i);
          this.heap.push(asciiVal.toString(16).toUpperCase());
        }
    }

    public createAssign(assignNode:TreeNode): void{
      let id:string = assignNode.childrenNodes[0].value;
      // identify value to be loaded
      let varType:string = this.createExpr(assignNode.childrenNodes[1], this.ACC);
      let tempAddr:string;

      if (varType == "string"){
        tempAddr = this.findTempAddr(id); // string reassignment

        if (tempAddr == null){ // new string assignment
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

      if(varType == "int"){
        this.loadRegConst(1, this.XREG[0]);
      } else{
        this.loadRegConst(2, this.XREG[0]);
      }

      this.pushByte("FF"); //system call
    }

    // identify type of variable
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

    // does addition by adding to accumulator and storing at temp location
    public calculateSum(additionNode:TreeNode): string{
      if(_VerboseMode){
        _OutputLog += "\n   CODEGEN --> Found [" + additionNode.value 
                   + "] on line " + additionNode.location[0] + " and column " + additionNode.location[1];
      }
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

    // find the corresponding TXXX address
    public findTempAddr(id:string): string{
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

    public handleNotEq(): void{
      this.loadRegConst(0, this.ACC[0]);
      let neqJumpNdx:number = this.addToJump();
      this.code[neqJumpNdx] = "02";
      this.loadRegConst(1, this.ACC[0]);
      let tempAddr:string = this.addToStatic("Neq"+this.tempNum, "int");
      this.storeAcc(tempAddr);
      this.loadRegConst(0, this.XREG[0]);
      this.compareX(tempAddr);
    }

    public createWhile(whileNode:TreeNode): void{
      let tempAddr:string;
      let jumpDes:number = this.code.length; // top of loop

      this.createBool(whileNode.childrenNodes[0]);

      // NotEqual case
      if(whileNode.childrenNodes[0].value == "NotEqual"){
        this.handleNotEq();
      }

      let jumpNdx:number = this.addToJump();
      this.handleBlock(whileNode.childrenNodes[1]);
      // jump forward to top of while
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

      // NotEqual case
      if(ifNode.childrenNodes[0].value == "NotEqual"){
        this.handleNotEq();
      }

      let jumpNdx:number = this.addToJump();
      this.handleBlock(ifNode.childrenNodes[1]);
      this.code[jumpNdx] = this.decimalToHex(this.code.length - jumpNdx - 1);
    }


    public createBool(boolNode:TreeNode):void{
      let tempAddr:string;

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
        // check first variable
        let var1Type:string = this.createExpr(boolNode.childrenNodes[0], this.XREG);
        let var2Node:TreeNode = boolNode.childrenNodes[1];
        let isId:RegExp = /^[a-z]$/;
        let isDigit:RegExp = /^[0-9]$/;
        var isString:RegExp = /^\"([a-zA-Z]|\s)*\"$/;

        // then check second varible
        if(isString.test(var2Node.value)){
          let stringPointer:number;
          let stringVal:string = var2Node.value.substring(1,var2Node.value.length-1);
          
          // add to heap if string does not already exist
          if(this.stringTable.get(stringVal) == null){
            this.addString(stringVal); // ignore the quotes
            stringPointer = 255 - this.heap.length;
            this.stringTable.set(stringVal, stringPointer);
          } else{
            stringPointer = this.stringTable.get(stringVal);
          }
          
          this.loadRegConst(stringPointer, this.ACC[0]); // pointer to string
          tempAddr = this.addToStatic("string" + this.tempNum, "string");
          this.storeAcc(tempAddr);
          
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
      let isString:RegExp = /^\"([a-zA-Z]|\s)*\"$/;

      // identify value to be loaded
      let value:string = exprNode.value;

      if(isString.test(value)){
        let stringPointer:number;
        let stringVal:string = value.substring(1,value.length-1);

        // add to heap if string does not already exist
        if(this.stringTable.get(stringVal) == null){
          this.addString(stringVal); // ignore the quotes
          stringPointer = 255 - this.heap.length;
          this.stringTable.set(stringVal, stringPointer);
        } else{
          stringPointer = this.stringTable.get(stringVal);
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

    public handleBackpatch(tempCodeLen:number): void{
      let staticKeys = this.staticTable.keys();
      let key = staticKeys.next();
      let tempTable = new Map<string, number>();
      // make table with just TXXX and offset
      while(!key.done){
        let locInfo = this.staticTable.get(key.value);
        tempTable.set(locInfo[1], locInfo[2]+tempCodeLen);
        key = staticKeys.next();
      }
      this.backpatch(tempTable, tempCodeLen);
    }

    public backpatch(tempTable:Map<string, number>, tempCodeLen:number): void{      
      let isTemp:RegExp = /^T/;
      for(var i=0; i<tempCodeLen; i++){
        // walkthrough the code and replace with correct addresses
        if(isTemp.test(this.code[i])){
          let staticKeys = this.code[i] + " "+ this.code[i+1];
          let index = tempTable.get(staticKeys);
          this.code[i] = this.decimalToHex(index);
          this.code[i+1] = "00";
          if(_VerboseMode){
            _OutputLog += "\n   CODEGEN --> Backpatching memory location for  [" + staticKeys + "] to [" + this.code[i] + this.code[i+1] + "] ...";
          }
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
    
    public pushByte(value:string): void{
      this.code.push(value);
      if(_VerboseMode){
        _OutputLog += "\n   CODEGEN --> Pushing byte [" + value + "] to memory...";
      }
      
    }

    public loadRegConst(value:number, register:string): void{
      this.pushByte(register);
      this.pushByte(this.decimalToHex(value));
    }

    public loadRegMem(tempAddr:string, register:string): void{
      this.pushByte(register);
      let memAddr:string[] = tempAddr.split(" ");
      this.pushByte(memAddr[0]);
      this.pushByte(memAddr[1]);
    }

    public storeAcc(tempAddr:string): void{
      this.pushByte("8D");
      let memAddr:string[] = tempAddr.split(" ");
      this.pushByte(memAddr[0]);
      this.pushByte(memAddr[1]);
    }

    public addAcc(tempAddr:string): void{
      this.pushByte("6D");
      let memAddr:string[] = tempAddr.split(" ");
      this.pushByte(memAddr[0]);
      this.pushByte(memAddr[1]);
    }

    public addBreak(): void{
      this.pushByte("00");
    }

    public compareX(tempAddr:string): void{
      this.pushByte("EC");
      let memAddr:string[] = tempAddr.split(" ");
      this.pushByte(memAddr[0]);
      this.pushByte(memAddr[1]);
    }

  }
}