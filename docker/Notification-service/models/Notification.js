const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  preferences: {
    type: Map,
    of: Boolean
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
