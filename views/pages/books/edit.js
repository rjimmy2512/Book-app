<!DOCTYPE html>
<html lang="en">
<head>
  <title>Add</title>
  <%- include('partials/head') %>
</head>
<body>
  <header>
    <%- include('partials/header') %>
  </header>
  <main>
    <%- include('partials/form', {formAction: 'add', book: [''], shelves: shelves}) %>
  </main>
  <footer>
    <%- include('partials/footer') %>
  </footer>
</body>
</html>