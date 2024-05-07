const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with error
});

// Serving static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route to redirect to the login page, enhancing user flow
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Registration endpoint to create a new user
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).send({ success: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).send({ message: 'Registration failed', error });
  }
});

// Login endpoint to authenticate a user and issue a JWT
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.send({ token });
    } else {
      res.status(401).send({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send({ message: 'Login failed', error });
  }
});

// Endpoint to update user data
app.put('/user/:id', async (req, res) => {
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
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Fallback route for undefined paths
app.get('*', (req, res) => {
  res.status(404).send('404 Not Found');
});

// Start the server, except during testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`User service listening on port ${port}`);
  });
}

module.exports = app;
