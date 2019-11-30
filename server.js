'use strict';

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const superagent = require('superagent');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Tells express to use the built-in rules for ejs
app.set('view engine', 'ejs');

// Tells express to find static files (like css) in the public dir
app.use('/public', express.static('public'));

// Tells express to read all incoming body info (from the Books api)
app.use(express.urlencoded({extended:true}));


//ROUTES

// API Route
app.get('/books', getBooks);

// Test  Route
app.get('/hello', (req, res) => {
  res.render('pages/index');
});

// Other Routes
app.get('/', newSearch);
app.post('/searches', getBooks);


// Helper Functions
function newSearch(req, res) { //renders the index.ejs file in pages dir
  res.render('pages/index');
}

function getBooks(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if(request.body.search[1] === 'title' ) {url += `intitle:${request.body.search[0]}`;}
  if(request.body.search[1] === 'author' ) {url += `inauthor:${request.body.search[0]}`;}
  superagent.get(url)

    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', {searchResults:results}))
    .catch(() => {
      errorHandler('Something went wrong, Please try again.', request, response);
    });
}

// Error handler
function errorHandler(error, request, response) {
  response.status(500).send(error);
}

// Book constructor
function Book(info){
  this.title = info.title || 'No title available';
  this.authors = info.authors || 'No author';
  this.description = info.description || 'No Description';
  this.img = info.imageLinks.thumbnail;
  this.publishDate = info.publishedDate;
  this.isbn = info.type || 'No ISBN available';
  this.identifier = info.identifier;
}

// Handling Errors!!!!
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


app.listen(PORT, () => console.log(`server up on ${PORT}`));

