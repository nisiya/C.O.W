# Test Cases

## Valid Programs
1. Fugly One-liner
```
{intaintbintxa=1b=2x=a+bprint(x)}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED

2. Weird Spacings
```
{
    while               (true){
        print("this is true")
    }
    inta=         0
    print (a         )
}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED after fixing error; forgot to account for `\r`

3. No open and closing brackets
```
a=0
b=2
c=4
print(a+b+c)
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED

4. Weird content in `print()`
```
{/*Lex will allow this*/ print "no paren"
print (should pass for lex a===0) /*and this one too*/}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED

5. Very normal program
```
{int a
a = 0
print(a+1)
}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED

## Waring Program
1. No EOP
```
{intaintbintxa=1b=2x=a+bprint(x)}
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED with warning and inserted `[$]` token

## Invalid Programs
1. Invalid symbol in the beginning
```
@int a
int b}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** ERROR detected
```
LEXER --> ERROR! Invalid token [ @ ] on line 1, column 0
```

2. Invalid symbol in middle of program
```
{int a
int @b
a = 0}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** ERROR detected
```
LEXER --> ERROR! Invalid token [ @ ] on line 2, column 4
```

3. Bad string 
{
    print("this is not # string")
}$
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** ERROR detected
```
LEXER --> ERROR! Invalid token [ # ] on line 2, column 23
```

4. `\n` in string
```
{
  "i am
  the cheese"
}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** ERROR detected
```
LEXER --> ERROR! Invalid token [ ] on line 2, column 7
```


5. More than one digit number
```
{int a
a = 123}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** ERROR detected
```
LEXER --> ERROR! Invalid token [ 123 ] on line 2, column 4
```

6. Uppercase
```
{ int A
a = 1}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** ERROR detected
```
LEXER --> ERROR! Invalid token [ A ] on line 1, column 6
```
## Variable Types
1. `string` and `boolean`
```
{string a
boolean b
a = "hello"
if(b){
print(a)
}
}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED, `string` and `boolean` tokens created

2. `srting`
```
{srting a}$
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Result:** PASSED, `T_Char` tokens were created for letters in `srting`
