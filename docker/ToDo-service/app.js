const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ToDo = require('./models/ToDo');
const methodOverride = require('method-override');
const { asyncHandler } = require('./middlewares');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Root route
app.get('/', (req, res) => {
  res.redirect('/todos');
});

// Route handlers
app.get('/todos', asyncHandler(async (req, res, next) => {
  const todos = await ToDo.find();
  res.render('index', { todos });
}));

app.post('/todos', asyncHandler(async (req, res, next) => {
  const { text, completed = false } = req.body;
  const todo = new ToDo({ text, completed });
  await todo.save();
  res.redirect('/todos');
}));

app.get('/todos/:id/toggle', asyncHandler(async (req, res) => {
  const todo = await ToDo.findById(req.params.id);
  todo.completed = !todo.completed;
  await todo.save();
  res.redirect('/todos');
}));

app.get('/todos/:id/edit', asyncHandler(async (req, res) => {
  const todos = await ToDo.find();
  todos.forEach(todo => {
    todo.editing = todo.id === req.params.id;
  });
  res.render('index', { todos });
}));

app.put('/todos/:id', asyncHandler(async (req, res) => {
  const { text } = req.body;
  await ToDo.findByIdAndUpdate(req.params.id, { text });
  res.redirect('/todos');
}));

app.post('/todos/:id/comment', asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const todo = await ToDo.findById(req.params.id);
  todo.comments = todo.comments || [];
  todo.comments.push(comment);
  await todo.save();
  res.redirect('/todos');
}));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).send({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '🔒'
  });
};
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`ToDo service listening on port ${port}`);
  });
}

module.exports = app;
