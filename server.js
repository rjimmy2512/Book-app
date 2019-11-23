'use strict';

const express = require('express');
//const path = require('path');
const app = express();
const superagent = require('superagent');

const PORT = process.env.PORT || 3000;

//tells express to use the built-in rules for ejs
app.set('view engine', 'ejs');

//tells express to find static files (like css) in the public dir
app.use('/public', express.static('public'));

//tells express to read all incoming body info (from the Books api)
app.use(express.urlencoded({extended:true}));


//Routes
// Test  Route
app.get('/hello', (req, res) => {
  res.render('pages/index');
});

// Other Routes
app.get('/', newSearch);
app.post('/searches', createSearch);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


//Helper Functions
function newSearch(req, res){ //renders the index.ejs file in pages dir
  res.render('pages/index');
}

function createSearch(req, res){
  let url = 'https://www.googleapis.com/books/v1/volumes?q=search+terms'; //this is not the full URL
  //these if statements determine the rest of the URL
  if(req.body.search[1] === 'title' ) {url += `intitle:${req.body.search[0]}`;}
  if(req.body.search[1] === 'author' ) {url += `inauthor:${req.body.search[0]}`;}

  superagent.get(url)
    //map over the info from superagent, inside the items array, and create a new Book object
    //from each result
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    //take that array of Book objects and pass it to the searches page when rendered
    .then(results => res.render('pages/searches/show', {searchResults:results}));
}

//Book constructor
function Book(info){
  console.log('volume info: ',info.title);
  this.title = info.title || 'No title available';
  this.authors = info.authors;
  this.publisher = info.publisher;
  this.publishedate = info.publishedDate;
  this.description = info.description;
}

//DON'T FORGET TO HANDLE ERRORS!!!!

app.listen(PORT, () => console.log(`server up on ${PORT}`));
