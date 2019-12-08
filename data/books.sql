DROP TABLE IF EXISTS books, bookshelves;

CREATE TABLE IF NOT EXISTS bookshelves (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    author VARCHAR(200),
    title VARCHAR(300),
    isbn VARCHAR(255),
    image_url VARCHAR(300),
    bookshelf_id INT REFERENCES bookshelves(id),
    description TEXT,
    status bool,
    category VARCHAR(255)
);
