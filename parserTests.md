# Test Casts

## Valid Programs
1. VarDecl, Assignment, IntExpr, intop, Print, Id, digit, type
```
{
  int a
  a = 2 + a
  print (a)
}$
```

2. While, If, BooleanExpr boolval, boolop, Charlist, char, space
```
{
  while(b == true){
    print("hello there")
  }

  if(b != false){
    b = 2
  }
}$
```

3. Nested While and if
```
{
  while(b == true){
    print("hello there")
    while(b == true){
      print("hello there")
      if(b != false){
        b = 2
      }
    }
  }
}$
```

## Multiple Programs
1. Alan's test case
```
{}$	
	 		 {{{{{{}}}}}}$	
	 	 	 {{{{{{}}}	/*	comments	are	ignored	*/	}}}}$	
	 	 	 {	/*	comments	are	still	ignored	*/	int	@}$
```

2. Chain of Blocks
```
{stringa}${a="block"}${printa}${while(b!=8){a="blockblock"}}${iffalse{print("blockblockblock")}}$
```

## Error Programs
1. BooleanExpr
```
{
/* boolop on its own should have no parenthesis */
while(true){ 
  print (a)
  }
}$
```

2. IntExpr
```
{
/* should be digit + expr */
  a = a + 1
}$
```

3. Missing Brackets
```
a = 0}$
{
b = 1
$
```