

//arrays
let arr

arr = [1,2,3,4,5,6,7,8,]
arr

// array methods
arr.push(9) // adds to the end of the array
arr
arr.pop() // removes the last element of the array
arr
arr.unshift(0) // adds to the beginning of the array
arr
arr.shift() // removes the first element of the array
arr
arr.splice(2, 1) // removes the element at index 2
arr
arr.splice(2, 0, 10) // adds 10 at index 2
arr

// array methods with strings
let strArr = ['a', 'b', 'c', 'd']
strArr.push('e') // adds to the end of the array
strArr
strArr.pop() // removes the last element of the array
strArr
strArr.unshift('z') // adds to the beginning of the array
strArr
strArr.shift() // removes the first element of the array
strArr
strArr.splice(2, 1) // removes the element at index 2
strArr
strArr.splice(2, 0, 'x') // adds 'x' at index 2
strArr
// array methods with objects
let objArr = [{name: 'John'}, {name: 'Jane'}, {name:
'Jack'}]
objArr.push({name: 'Jill'}) // adds to the end of the array      
objArr          
objArr.pop() // removes the last element of the array
objArr
objArr.unshift({name: 'Joe'}) // adds to the beginning of the array
objArr
objArr.shift() // removes the first element of the array
objArr
objArr.splice(1, 1) // removes the element at index 1
objArr
objArr.splice(1, 0, {name: 'Jim'}) // adds {name: 'Jim'} at index 1
objArr
// array methods with mixed types
let mixedArr = [1, 'a', {name: 'John'}, true]
mixedArr.push(2) // adds to the end of the array
mixedArr
mixedArr.pop() // removes the last element of the array
mixedArr
mixedArr.unshift('z') // adds to the beginning of the array
mixedArr
mixedArr.shift() // removes the first element of the array
mixedArr
mixedArr.splice(2, 1) // removes the element at index 2
mixedArr
mixedArr.splice(2, 0, 'x') // adds 'x' at index 2
mixedArr
