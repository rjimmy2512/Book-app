'use strict';

// Manage Application Environment Variables
require('dotenv').config();


//Application Dependencies
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');


//Application Setup
const app = express();
const PORT = process.env.PORT;
// const cors = require('cors');
// app.use(cors());


// Database Client Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.log(err));


//Application Middleware

//1.Tells express to read all incoming body info (from the Books api)
app.use(express.urlencoded({extended:true}));

// 2.Tells express to find static files (like css) in the public dir
app.use('/public', express.static('public'));


// Handle HTML Form PUT/DELETE
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    //look in urlencoded POST bodies and delete it
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Tells express to use the built-in rules for ejs
app.set('view engine', 'ejs');


//ROUTES

// API Routes
app.get('/', getBooks);
app.post('/searches', createSearch);
app.get('/searches/new', newSearch);
app.get('/books/:id', getBook);
app.post('/books', createBook);
app.put('/books/:id', updateBook);
app.delete('/books/:id', deleteBook);

// Handling Errors
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


// Test  Route
app.get('/hello', (req, res) => res.render('pages/index'));



// Load Books from Database
function getBooks(req, res) {
  let SQL = 'SELECT * FROM books;';

  return client.query(SQL)
    .then(results => {
      if (results.rows.rowCount === 0) {
        res.render('pages/searches/new');
      } else {
        res.render('pages/index', {books: results.rows});
      }
    })
    .catch(err => errorHandler(err, res));
}

// // Render Search Form
// function newSearch(req, res) {
//   res.render('pages/searches/new');
// }


// HELPER FUNCTIONS
function newSearch(req, res) { //renders the index.ejs file in pages dir
  res.render('pages/searches/new');
}


//Get search results from Google Books API
function createSearch(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if(req.body.search[1] === 'title' ) {url += `intitle:${req.body.search[0]}`;}
  if(req.body.search[1] === 'author' ) {url += `inauthor:${req.body.search[0]}`;}

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => res.render('pages/searches/show', {searchResults:results}))
    .catch(err => errorHandler(err, res));
}


// Retrieve & render a single book
function getBook(req, res) {
  getBookshelves()
    .then(shelves => {

      let SQL = 'SELECT books.*, bookshelves.name FROM books INNER JOIN bookshelves on books.bookshelf_id=bookshelves.id WHERE books.id=$1';
      let values = [req.params.id];
      client.query(SQL, values)
        .then(result => {
          let shelf = shelves.rows.find(shelf => shelf.id === parseInt(result.rows[0].bookshelf_id));
          res.render('pages/books/detail', {book: result.rows[0], bookshelves: shelves.rows, shelfName: shelf});
        })
        .catch(err => errorHandler(err, res));
    });
}


// Create a new bookshelf
function createShelf(shelf) {
  let normalizedShelf = shelf.toUpperCase();
  let SQL1 = 'SELECT id from bookshelves where name=$1;';
  let values1 = [normalizedShelf];

  return client.query(SQL1, values1)
    .then(results => {
      if (results.rowCount) {
        return results.rows[0].id;
      } else {
        let INSERT = 'INSERT INTO bookshelves(name) VALUES($1) RETURNING id;';
        let insertValues = [normalizedShelf];

        return client.query(INSERT, insertValues)
          .then(results => {
            return results.rows[0].id;
          });
      }
    });
}


//Retrieve bookshelves from database
function getBookshelves() {
  let SQL = 'SELECT DISTINCT id, name FROM bookshelves ORDER BY name;';
  return client.query(SQL);
}


// Create a new book
function createBook(req, res) {
  createShelf(req.body.bookshelf)
    .then(id => {
      let {title, author, isbn, image_url, description} = req.body;
      let SQL = 'INSERT INTO books(title, author, isbn, image_url, description, bookshelf_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING id';
      let values = [title, author, isbn, image_url, description, id];
      client.query(SQL, values)
        .then(result => res.redirect(`/books/${result.rows[0].id}`))
        .catch(err => errorHandler(err, res));
    });
}


// Update a book in database
function updateBook(req, res) {
  let {title, author, isbn, image_url, description, bookshelf_id} = req.body;
  let SQL = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5, bookshelf_id=$6 WHERE id=$7';
  let values = [title, author, isbn, image_url, description, bookshelf_id, req.params.id];
  client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.id}`))
    .catch(err => errorHandler(err, res));
}


// Delete a single book
function deleteBook(req, res) {
  let SQL = 'DELETE FROM books WHERE id=$1;';
  let values = [req.params.id];
  return client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.id}`))
    .catch(err => errorHandler(err, res));
}


// Book constructor
function Book(info){
  this.title = info.title || 'No title available';
  this.author = info.authors || 'No author';
  this.description = info.description || 'No Description';
  this.img = info.imageLinks.thumbnail;
  this.publishDate = info.publishedDate;
  this.isbn = `${info.industryIdentifiers[0]}` || 'No ISBN available';
}

// Error handler
function errorHandler(error, res) {
  res.render('pages/error', {error: error});
}

//Make server listening
app.listen(PORT, () => console.log(`server up on ${PORT}`));

