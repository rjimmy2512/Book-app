'use strict';

//psql -d app_name -f schema.sql where app_name is your app
//heroku pg:psql --app app_name < schema.sql

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 3000;

// Tells express to use the built-in rules for ejs
app.set('view engine', 'ejs');

// Tells express to find static files (like css) in the public dir
app.use('/public', express.static('public'));

// Tells express to read all incoming body info (from the Books api)
app.use(express.urlencoded({extended:true}));

client.connect();
client.on('error', err => console.error(err));


//ROUTES
app.get('/', getBooks);
app.get('/new', newSearch);
app.post('/add', addNewBook);
app.post('/searches', createSearch);
app.get('/add', (req, res) => {
  res.render('pages/add');
});
app.get('/books/:book_id', getOneBook);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));



// Helper Functions
function getBooks(req, res) {
  let sql = 'SELECT * FROM books;';
  return client.query(sql)
    .then(response => {
      if (response.rowCount > 0) {
        res.render('pages/index', { allBooks: response.rows });
      }
    });
}

function newSearch(req, res) {
  res.render('pages/new');
}

function addNewBook(req, res) {
  let r = req.body;
  let sql = 'INSERT INTO books(authors, title, isbn,image_url,description_book,bookshelf) VALUES($1, $2, $3, $4, $5, $6) RETURNING id';
  let values = [r.authors, r.title, r.isbn, r.image_url, r.description_book, r.bookshelf];
  client.query(sql, values)
    .then(result => {
      if (result.rowCount > 0) {
        res.redirect('/');
      }
    });
}

function createSearch(req, res) {
  console.log(req.body.search);
  let url = 'https://www.googleapis.com/bcooks/v1/volumes?q=';
  if (req.body.search[1] === 'title') { url += `intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `inauthor:${req.body.search[0]}`;}

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => res.render('pages/show', { searchResults: results }));
}

function getOneBook(req, res) {
  let sql = 'SELECT * FROM books WHERE id=$1;';
  return client.query(sql, [req.params.book_id])
    .then(result => {
      if (result.rowCount > 0) {
        console.log('result', result.rows);
        res.render('pages/searches/details', { bookDetail: result.rows });
      }
    });
}

//Book constructor
function Book(info){
  this.title = info.title || 'No title available';
  this.authors = info.authors || 'No author';
  this.description = info.description || 'No Description';
  this.img = info.imageLinks.thumbnail;
  this.publishDate = info.publishedDate;
  this.isbn = info.type || 'No ISBN available';
  this.identifier = info.identifier;
}

function menu() {
  var x = document.getElementById('myLinks');
  if (x.style.display === 'block') {
    x.style.display = 'none';
  } else {
    x.style.display = 'block';
  }
}


// Handling Errors!!!!
app.get('*', (req, res) => res.status(404).send('This route does not exist'));

function errorHandler(error, req, res) {
  res.render('pages/error');
}


// Turning on server
app.listen(PORT, () => console.log(`server up on ${PORT}`));
