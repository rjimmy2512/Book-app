'use strict';

const express = require('express');

//const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());
const superagent = require('superagent');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

//tells express to use the built-in rules for ejs
app.set('view engine', 'ejs');

//tells express to find static files (like css) in the public dir
app.use('/public', express.static('public'));

//tells express to read all incoming body info (from the Books api)
app.use(express.urlencoded({extended:true}));


//Routes

// API Route
app.get('/books', getBooks);

// Test  Route
app.get('/hello', (req, res) => {
  res.render('pages/index');
});

// Other Routes
app.get('/', newSearch);
app.post('/searches', getBooks);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


//Helper Functions
function newSearch(req, res){ //renders the index.ejs file in pages dir
  res.render('pages/index');
}

//
function getBooks(request, response) {
  // console.log(request);
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if(request.body.search[1] === 'title' ) {url += `intitle:${request.body.search[0]}`;}
  if(request.body.search[1] === 'author' ) {url += `inauthor:${request.body.search[0]}`;}
  superagent.get(url)

    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', {searchResults:results}))
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}


// error handler
function errorHandler(error, request, response) {
  response.status(500).send(error);
}

//Book constructor
function Book(info){
  this.title = info.title || 'No title available';
  this.authors = info.authors || 'No author';
  this.description = info.description || 'No Description';
  this.imgurl = info.thumbnail;
}

//DON'T FORGET TO HANDLE ERRORS!!!!

app.listen(PORT, () => console.log(`server up on ${PORT}`));
