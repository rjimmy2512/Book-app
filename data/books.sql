DROP TABLE IF EXISTS tasks;

CREATE TABLE mybookslibrary (
    id SERIAL PRIMARY KEY,
    author VARCHAR(80),
    title VARCHAR(100),
    isbn text,
    image_url text,
    bookshelf text,
    description text,
    status bool,
    category VARCHAR(255)
);

INSERT INTO mybookslibrary (task, description, status, category)
VALUES ('Task 1', 'This is the first task', false, 'tasks'),
     ('Task 2', 'This is the second task', false, 'tasks');