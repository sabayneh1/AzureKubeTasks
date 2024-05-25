const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Notification = require('./models/Notification');
const app = express();
const port = process.env.PORT || 3004;

app.use(express.json());

const connectToDatabase = (uri, serviceName) => {
  const connection = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  connection.on('connected', () => console.log(`Connected to ${serviceName} MongoDB`));
  connection.on('error', err => console.error(`${serviceName} MongoDB connection error:`, err));
  return connection;
};

const todoServiceConnection = connectToDatabase(process.env.TODO_SERVICE_MONGO_URI, 'todoService');
const userServiceConnection = connectToDatabase(process.env.USER_SERVICE_MONGO_URI, 'userService');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: true, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register notification preferences
app.post('/register', async (req, res) => {
  try {
    const { userId, email, phone, preferences } = req.body;
    const notification = new Notification({ userId, email, phone, preferences });
    await notification.save();
    res.status(201).send(notification);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Send a notification
app.post('/send', async (req, res) => {
  try {
    const { email, message } = req.body;

    console.log('Received request to send notification to:', email, 'Message:', message);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Todo Notification',
      text: message
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.response);
    res.status(200).send({ message: 'Notification sent successfully!' });
  } catch (error) {
    console.error('Error processing notification request:', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Notification Service listening on port ${port}`);
  });
}

module.exports = app;
