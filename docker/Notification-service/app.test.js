const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');

let server;

beforeAll((done) => {
  mongoose.connect('mongodb://localhost:27017/testNotificationService', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, done);
  server = app.listen(3004); // Specify the port directly for simplicity in testing
});

afterAll((done) => {
  mongoose.connection.close();
  server.close(done);
});

describe('Notification Service', () => {
  test('Register notification preferences', async () => {
    const newUserNotifications = {
      userId: 'user123',
      email: 'user@example.com',
      phone: '1234567890',
      preferences: { offers: true, alerts: false }
    };
    const response = await request(server).post('/register').send(newUserNotifications);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('userId', 'user123');
    expect(response.body.preferences).toEqual(expect.objectContaining({
      offers: true,
      alerts: false
    }));
  });

  test('Send notification', async () => {
    const notificationData = {
      userId: 'user123',
      message: 'This is a test notification'
    };
    const response = await request(server).post('/send').send(notificationData);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Notification sent successfully!');
  });

  test('Health check', async () => {
    const response = await request(server).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });
});
