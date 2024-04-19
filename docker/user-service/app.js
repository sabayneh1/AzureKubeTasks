const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/userService', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1h' });
      res.send({ token });
    } else {
      res.status(401).send({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update user data
app.put('/user/:id', async (req, res) => {
  try {
    const update = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Service listening at http://localhost:${port}`);
  });
}

// Export the Express application
module.exports = app;
