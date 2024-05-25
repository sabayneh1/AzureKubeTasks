const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const winston = require('winston');
require('dotenv').config();
const fs = require('fs');

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

// Configure Morgan for HTTP request logging
app.use(morgan('combined'));

// Configure Winston for application logging
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Setup logging to /var/log/user-service.log for Fluentd
const logStream = fs.createWriteStream('/var/log/user-service.log', { flags: 'a' });
const fluentLogger = new console.Console(logStream, logStream);

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
    winstonLogger.error(`Registration error: ${error}`);
    res.status(400).send({ message: 'Registration failed', error });
  }
});

// Login endpoint to authenticate a user and issue a JWT
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    fluentLogger.log(`Login attempt: ${username}`);
    winstonLogger.info(`Login attempt: ${username}`);

    const user = await User.findOne({ username });
    fluentLogger.log(`User found: ${user ? user.username : 'not found'}`);
    winstonLogger.info(`User found: ${user ? user.username : 'not found'}`);

    if (!user) {
      fluentLogger.log(`User not found: ${username}`);
      winstonLogger.error(`User not found: ${username}`);
      return res.status(401).send({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    fluentLogger.log(`Password match: ${passwordMatch}`);
    winstonLogger.info(`Password match: ${passwordMatch}`);

    if (!passwordMatch) {
      fluentLogger.log(`Invalid password for user: ${username}`);
      winstonLogger.error(`Invalid password for user: ${username}`);
      return res.status(401).send({ error: 'Invalid username or password' });
    }

    fluentLogger.log(`User authenticated successfully: ${username}`);
    winstonLogger.info(`User authenticated successfully: ${username}`);

    const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false }); // Make sure secure: false for local testing
    res.redirect('/todos');
  } catch (error) {
    fluentLogger.log(`Login error: ${error.message}`);
    winstonLogger.error(`Login error: ${error.message}`, error.stack);
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
    winstonLogger.error(`Update error: ${error}`);
    res.status(400).send({ message: 'Failed to update user', error });
  }
});

// Health check route to ensure service is running
app.get('/users/health', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint to get user details for notification purposes
app.get('/users/:id', async (req, res) => {
  try {
    winstonLogger.info(`Fetching user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select('email');
    if (!user) {
      winstonLogger.error(`User not found: ${req.params.id}`);
      return res.status(404).send({ error: 'User not found' });
    }
    winstonLogger.info(`User email fetched: ${user.email}`);
    res.send(user);
  } catch (error) {
    winstonLogger.error(`Error fetching user email: ${error}`);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  winstonLogger.error(`Error: ${err}`);
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
    winstonLogger.info(`User service listening on port ${port}`);
  });
}

module.exports = app;
