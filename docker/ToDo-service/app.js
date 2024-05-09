const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ToDo = require('./models/ToDo');
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

// Root route
app.get('/', (req, res) => {
  res.redirect('/todos');
});

// Enhanced error handling middleware, moved to a correct position in code.
const errorHandler = (err, req, res, next) => {
  console.error('Error status:', err.status);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  res.status(err.status || 500).send({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '🔒'
  });
};

// Route handlers with detailed error logging
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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`ToDo service listening on port ${port}`);
  });
}

module.exports = app;
