
async function fetchData() {
   return await fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => response.json())
      .then(data =>{ console.log(data)
                    return  data;})
      .catch(error => console.error('Error:', error));
      
}

fetchData().then(data => {
   console.log('Fetched Data:', data);
}   ).catch(error => {
   console.error('Fetch Error:', error);
});


//promise example
fetch('https://jsonplaceholder.typicode.com/photos').then((res)=>res.json()).then((data)=>console.log(data));
 //fetch is promise based
