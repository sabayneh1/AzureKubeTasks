const express = require('express');
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const app = express();
const port = process.env.PORT || 3004;

app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/notificationService', {
  useNewUrlParser: true,
  useUnifiedTopology: true
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

// Send a notification (simulated)
app.post('/send', async (req, res) => {
  try {
    const { userId, message } = req.body;
    // Here you would integrate with an external service to actually send the notification
    console.log(`Sending notification to user ${userId}: ${message}`);
    res.status(200).send({ message: 'Notification sent successfully!' });
  } catch (error) {
    res.status(500).send(error.message);
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
