## Scope
### Passed
```javascript
{
    int b
    int a
    
    {
        a = 0
        boolean a
        a = true
        {
            boolean b
            b = false
        }
        {
            a = false
            int a
            a = 9
        }
    }
    
    {
        a = 1
        boolean b
        b = true
    }
    
    b = 1
}$
```

### Failed but passed
```javascript
{
    int a
    a = 5
    {
        string c
        c = "apple"
    }
    // error occurred here
    // scope did not go from 1 to 0
    string c
    c = "banana"
}
```

## String comparisons
### Failed but passed
```javascript
{
    string a
    a = "apple"
    // error occurred here
    // was not able to comapre a to "apple"
    if (a == "apple"){
        print("banana")
        a = "kiwi"
    }
}
```

### Passed
```javascript
{
    string a
    a = "apple"
    if (a == "apple"){
        print(a)
    }
    while ("apple" == a){
        print(a)
        print("banana")
        a = "kiwi"
    }
    print(a)
}
```

## Boolexpr
### Credit to Professor Labouseur
```javascript
    {
    int a
    a = 1
    while (a != 5) {
    a = 1 + a
    print(a)
    }
    } $
```

### Just boolval
```javascript
{
    if true{
        print("apple")
    }

    while false{
        print("banana")
    }

}
```

### Not Equals
```javascript
{
    int a
    a = 2
    if(a != 3){
        print("kiwi")
    }
}
```
## Addition
```javascript
{
    int a
    int b
    b = 0
    a = 1 + 2 + 3 + 4 + 5 + b
    print(a)
}
```

## Exceeds 256byte


## Strings
### A whole lot
```javascript
{   
    print("apples")
    print("are red")
    print("bananas")
    print("are yellow")
    print("oranges")
    print("are orange")
    print("or so")
    print("i hope")
    print("now i dont")
    print("know what to say")
    print("but i will")
    print("just keep going")
    print("to try and fill up")
    print("the two fifty six bytes")
    print("ok nevermind")
    print("not yet")
    print("how about now")
    // ok that worked, as in failed code gen
}
```
### A very loooooooooooooooong string
```javascript
{
    // there is no line wrap in console only here
    print("i see trees of green red roses too i see em bloom for me and for you and i think to myself what a wonderful world i see skies of blue clouds of white bright blessed days dark sacred nights and i think to myself what a wonderful world the colors of the rainbow so pretty in the sky")
    // but this exceeds 256 bytes
}
```
### String reassignment
```javascript
{
    string a
    a = "apple"
    print(a)
    a = "banana"
    print(a)
}
```