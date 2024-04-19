const express = require('express');
const mongoose = require('mongoose');
const ToDo = require('./models/ToDo');
const { errorHandler, asyncHandler } = require('./middlewares');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/todoService', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Get all ToDo items
app.get('/', asyncHandler(async (req, res) => {
  const todos = await ToDo.find();
  res.send(todos);
}));

// Add a new ToDo item
app.post('/', asyncHandler(async (req, res) => {
  const { text, completed } = req.body;
  if (typeof text !== 'string' || typeof completed !== 'boolean') {
    res.status(400).send("Invalid input data.");
    return;
  }
  const todo = new ToDo({ text, completed });
  await todo.save();
  res.status(201).send(todo);
}));

// Health check route
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
