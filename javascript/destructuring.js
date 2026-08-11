
const [first, second, third] = ['one', 'two', 'three'];
const {name, age} = {name: 'John', age: 30};
const {info:{address, phone}} = {info: {address: '123 Main St', phone: '123-456-7890'}};
console.log(name)


user = {  name: 'Alice',
  age: 25,
    address: {
        street: '456 Elm St',
        city: 'Wonderland',
        zip: '12345'
    }
}

function displayUserInfo({name, age, address: {street, city, zip}}) {
    console.log(`Name: ${name}, Age: ${age}`);
    console.log(`Address: ${street}, ${city}, ${zip}`);
}

displayUserInfo(user);