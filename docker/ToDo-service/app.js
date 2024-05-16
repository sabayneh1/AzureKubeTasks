const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
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

  // Logging userId and todo for debugging
  console.log('Toggling todo:', todo);
  console.log('User ID:', req.user.userId);

  try {
    // Fetch user's email from the user service
    const userResponse = await axios.get(`http://user-service:3002/users/${req.user.userId}`);
    const userEmail = userResponse.data.email;

    // Logging fetched email
    console.log('Fetched user email:', userEmail);

    // Send notification
    const message = `Your todo "${todo.text}" has been marked as ${todo.completed ? 'completed' : 'incomplete'}.`;
    const notificationResponse = await axios.post('http://notification-service:3004/send', {
      email: userEmail,
      message: message
    });

    // Logging notification response
    console.log('Notification response:', notificationResponse.data);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }

  res.json({ completed: todo.completed });
}));

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
