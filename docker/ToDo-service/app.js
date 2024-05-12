const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ToDo = require('./models/ToDo');
const { asyncHandler, authenticateJWT, errorHandler } = require('./middlewares');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());

// Middleware to check authentication for protected routes
app.use('/todos', authenticateJWT);

// Root route
app.get('/', (req, res) => {
  res.redirect('/todos');
});

// Route handlers
app.get('/todos', asyncHandler(async (req, res, next) => {
  const todos = await ToDo.find({ user: req.user.userId, completed: false });
  res.render('index', { todos });
}));

app.post('/todos', asyncHandler(async (req, res, next) => {
  const { text, completed = false } = req.body;
  const todo = new ToDo({
    text,
    completed,
    user: req.user.userId
  });
  await todo.save();
  res.redirect('/todos');
}));

app.get('/todos/:id/toggle', asyncHandler(async (req, res) => {
  const todo = await ToDo.findById(req.params.id);
  if (todo.user.toString() !== req.user.userId) {
    return res.status(403).send('Forbidden');
  }
  todo.completed = !todo.completed;
  await todo.save();
  res.json({ completed: todo.completed });
}));

app.get('/todos/:id/edit', asyncHandler(async (req, res) => {
  const todos = await ToDo.find({ user: req.user.userId });
  todos.forEach(todo => {
    if (todo.user.toString() !== req.user.userId) {
      return res.status(403).send('Forbidden');
    }
    todo.editing = todo.id === req.params.id;
  });
  res.render('index', { todos });
}));

app.put('/todos/:id', asyncHandler(async (req, res) => {
  const { text } = req.body;
  const todo = await ToDo.findById(req.params.id);
  if (todo.user.toString() !== req.user.userId) {
    return res.status(403).send('Forbidden');
  }
  todo.text = text;
  await todo.save();
  res.redirect('/todos');
}));

app.post('/todos/:id/comment', asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const todo = await ToDo.findById(req.params.id);
  if (todo.user.toString() !== req.user.userId) {
    return res.status(403).send('Forbidden');
  }
  todo.comments = todo.comments || [];
  todo.comments.push(comment);
  await todo.save();
  res.redirect('/todos');
}));

// for the notification services 

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the authentication token cookie
  res.redirect('/users/login'); // Redirect to the login page
});


app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use(errorHandler);

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Todo service listening on port ${port}`);
  });
}

module.exports = app;
