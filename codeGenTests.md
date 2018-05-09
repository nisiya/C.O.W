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
