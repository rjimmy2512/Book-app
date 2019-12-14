'use strict'
 
const express = require('express');
const app = express();
const superagent = require('superagent');
require('dotenv').config();
const methodOverride = require('method-override');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT || 3000;
 
//tells express to use the built-in rules for ejs 
app.set('view engine', 'ejs');  
 
//tells express to find static files (like css) in the public dir
app.use(express.static('public')); 
 
//tells express to read all incoming body info (from the Books api)
app.use(express.urlencoded({extended:true}));
 
app.use(methodOverride( (request, response) => {
  if(request.body && typeof request.body === 'object' && '_method' in request.body) {
    console.log('method override: ', request.body); 
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}));
 


//connect to the SQL server; if unsuccessful, throw an error
client.connect();
client.on('error', err => console.error(err));
 

//Routes
app.get('/', goToIndex);
app.get('/search', newSearch);
app.post('/searchresults', searchGoogleAPI);
app.post('/add', addNewBook);
app.get('/book/:book_id', getOneBook);
app.delete('/book/:id', deleteBook);
app.get('/add', (req, res) => {
  res.render('pages/add');
});


//Helper Functions
async function goToIndex(req,res){
  let sql = 'SELECT * FROM books;';
  let result = await client.query(sql);
  res.render('pages/index', {searchResults:result, route: '/'});
}


function newSearch(req, res){ 
  res.render('pages/searches/search')
}


function searchGoogleAPI(req, res){
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if(req.body.search[1] === 'title' ) {url += `intitle:${req.body.search[0]}`;}
  if(req.body.search[1] === 'author' ) {url += `inauthor:${req.body.search[0]}`;}
  
  superagent.get(url)
  .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
  .then(results => res.render('pages/searches/searchresults', {searchResults:results, route: 'searches/searchresults'}))
  .catch(() => {
    errorHandler(`No books with the ${req.body.search[1]} ${req.body.search[0]} was found.`, req, res);
  });
}


function getOneBook(req, res) {
  let sql = 'SELECT * FROM books WHERE id=$1;';
  return client.query(sql, [req.params.book_id])
    .then(result => {
      if (result.rowCount > 0) {
        console.log('result', result.row);
        res.render('books/detail', {bookDetail:result.rows});
      }
    });
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



function deleteBook(req, res) {
  let sql = 'DELETE FROM books WHERE id=$1;';
  let values = [parseInt(req.body.id)];
    return client.query(sql, values)
    .then(res.redirect('/'));
}
 


//Book constructor
function Book(info){
  this.image = info.bookThumbnail;
  this.title = info.title || 'No title available';
  this.authors = info.authors || ['No authors listed'];
  this.description = info.description || 'No description available';
  if(info.industryIdentifiers.length > 1){
    this.isbn = info.industryIdentifiers[1].identifier;
  }
  if(info.industryIdentifiers.length === 1){
    this.isbn = info.industryIdentifiers[0].identifier;
  }
  this.shelf = info.categories || 'No bookshelf specified';
}
 

//DON'T FORGET TO HANDLE ERRORS!!!!
 
app.get('*', (req, res) => res.status(404).send('This route does not exist'));
 
function errorHandler(error, req, res) {
  res.status(500).send(error);
  // res.render('pages/error');
}
 
app.listen(PORT, () => console.log(`server up listening on ${PORT}`));
