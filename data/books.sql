-- DROP TABLE IF EXISTS tasks;

-- CREATE TABLE mybookslibrary (
--     id SERIAL PRIMARY KEY,
--     author VARCHAR(80),
--     title VARCHAR(100),
--     isbn text,
--     image_url text,
--     bookshelf text,
--     description text,
--     status bool,
--     category VARCHAR(255)
-- );

-- INSERT INTO mybookslibrary (task, description, status, category)
-- VALUES ('Task 1', 'This is the first task', false, 'tasks'),
--      ('Task 2', 'This is the second task', false, 'tasks');

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