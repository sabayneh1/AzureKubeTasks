const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// MongoDB connection setup
const mongoURI = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

console.log('Connecting to MongoDB at:', mongoURI);
console.log('Using JWT Secret:', jwtSecret);

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  console.log('Using database:', mongoose.connection.name);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit process with error
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Root route to redirect to the login page
app.get('/', (req, res) => {
  res.redirect('/users/login');
});

// Redirect /users to login page
app.get('/users', (req, res) => {
  res.redirect('/users/login');
});

// Route handlers
app.get('/users/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/users/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Registration endpoint to create a new user
app.post('/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.redirect('/users/login');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).send({ message: 'Registration failed', error });
  }
});

// Login endpoint to authenticate a user and issue a JWT
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);  // Debugging

    const user = await User.findOne({ username });
    console.log('User found:', user);  // Debugging

    if (!user) {
      console.error('User not found:', username);  // Debugging
      return res.status(401).send({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);  // Debugging

    if (!passwordMatch) {
      console.error('Invalid password for user:', username);  // Debugging
      return res.status(401).send({ error: 'Invalid username or password' });
    }

    console.log('User authenticated successfully:', username);  // Debugging

    const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false }); // Make sure secure: false for local testing
    res.redirect('/todos');
  } catch (error) {
    console.error('Login error:', error.message, error.stack); // More detailed error logging
    res.status(500).send({ message: 'Login failed', error });
  }
});

// Endpoint to update user data
app.put('/users/user/:id', async (req, res) => {
  try {
    const update = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.send(user);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).send({ message: 'Failed to update user', error });
  }
});

// Health check route to ensure service is running
app.get('/users/health', (req, res) => {
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

// Catch-all route to redirect to login page
app.get('*', (req, res) => {
  res.redirect('/users/login');
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`User service listening on port ${port}`);
  });
}

module.exports = app;
