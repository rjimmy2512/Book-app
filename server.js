'use strict'

//psql -d app_name -f schema.sql where app_name is your app
//heroku pg:psql --app app_name < schema.sql

const express = require('express');
const app = express();
const superagent = require('superagent');
require('dotenv').config();
const methodOverride = require('method-override');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT || 3000;

let shelfCategories = [];

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
app.get('/', buildIndex);
app.get('/search', newSearch);
app.post('/searchresults', searchAPI);
app.get('/books/:book_id', getOneBook);
app.get('/add', (req, res) => res.render('pages/editbook', {bookshelves: shelfCategories}));
app.post('/add', addNewBook);

app.put('/books/:book_id', updateBook);

app.delete('/books/:id', deleteBook);

function updateBook(req, res) {
  let sql = 'UPDATE books SET image=$1, title=$2, authors=$3, description=$4, bookshelf=$5, isbn=$6 WHERE id=$7;';
  let { image, title, authors, description, bookshelf, isbn } = req.body;
  let values = [image, title, [authors], description, [bookshelf], isbn, req.params.book_id];
  client.query(sql, values) 
  .then(res.redirect(`/book/${req.params.book_id}`));
}

//Helper Functions
async function addNewBook(req,res){
  let r = req.body;
  let sql = 'INSERT INTO books(image,title,authors,description,bookshelf,isbn) VALUES($1,$2, $3, $4, $5, $6) RETURNING id;';
  let values = [r.image, r.title, [r.authors], r.description, [r.bookshelf], r.isbn];
  let result = await client.query(sql, values)
  .then( result => {
      if(result.rowCount > 0){
        console.log('result.rows[0].id: ', result.rows[0].id);
          res.redirect((`/book/${result.rows[0].id}`));
      }
  })
}

async function getOneBook(req,res){
  let sql = 'SELECT * FROM books WHERE id=$1;'
  let result = await client.query(sql,[req.params.book_id]);
  res.render('searches/new', {searchResults:result.rows, route: '/book', bookshelves: shelfCategories});
}


async function getShelfCategories(req,res){
  let sql = 'SELECT DISTINCT shelf FROM books;';
  let result = await client.query(sql);
  let resultRows = result.rows;
  shelfCategories.length = 0;
  
  resultRows.forEach( (row, idx) => {
    row.shelf.forEach( shelf => {
      if(!(shelf.includes(','))){
        shelfCategories.push(shelf);
      }
      if(shelf.includes(',')){
        shelf = shelf.split(', ' || ',');
        shelf.forEach( category => {
          shelfCategories.push(category);
        })
      }
    })
  });
}

async function buildIndex(req,res){
  let sql = 'SELECT * FROM books;';
  let result = await client.query(sql);
  console.log('result.rows from buildIndex: ', result.rows);

  getShelfCategories();

  res.render('pages/index', {searchResults:result, route: '/'});
}


function newSearch(req, res){ //renders the search.ejs file in pages dir 
    res.render('pages/searches/search');
}


async function searchAPI(req, res){
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';  
  //these if statements determine the rest of the URL
  if(req.body.search[1] === 'title' ) {url += `intitle:${req.body.search[0]}`;}
  if(req.body.search[1] === 'author' ) {url += `inauthor:${req.body.search[0]}`;}
  try{
    //wait for the result of the API call
    let result = await superagent.get(url);
    let bookArray = result.body.items.map(bookResult => new Book(bookResult.volumeInfo));
    //pass the array of book objects back to the response
    res.render('pages/searches/searchresults', {searchResults:bookArray, route: 'pages/searches', bookshelves: shelfCategories});
  }
  catch{
     errorHandler(`No books with the ${req.body.search[1]} ${req.body.search[0]} was found.`, req, res);
  }
}

function deleteBook(req, res) {
  console.log('$1: ');
  let sql = 'DELETE FROM books WHERE id=$1;';
  console.log('+++++++++++______________++++++++++++DELETE+++++++++++______________++++++++++++');
  console.log('req.body.id: ', req.body.id);
  let values = [parseInt(req.body.id)];
  console.log('req.body.id: ', values);
  console.log('+++++++++++______________++++++++++++DELETE+++++++++++______________++++++++++++');
  return client.query(sql, values)
    .then(res.redirect('/'));
}

//Book constructor
function Book(info){
  this.image = info.imageLinks.thumbnail;
  this.title = info.title || 'No title available';
  this.authors = info.authors || ['No authors listed'];
  this.description = info.description || 'No description available';
  if(info.industryIdentifiers.length > 1){
    this.isbn = info.industryIdentifiers[1].identifier;
  }
  if(info.industryIdentifiers.length === 1){
    this.isbn = info.industryIdentifiers[0].identifier;
  }
  this.bookshelf = info.categories || 'No bookshelf specified';
}

//DON'T FORGET TO HANDLE ERRORS!!!!

app.get('*', (req, res) => res.status(404).send('This route does not exist'));

function errorHandler(error, req, res) {
  res.status(500).send(error);
  // res.render('pages/error');
}

app.listen(PORT, () => console.log(`server up on ${PORT}`));