const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');

let server;

beforeAll((done) => {
  mongoose.connect('mongodb://localhost:27017/testUserService', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, done);
  server = app.listen(3002); // Specify the port directly for simplicity in testing
});

afterAll((done) => {
  mongoose.connection.close();
  server.close(done);
});

describe('User Management and Authentication', () => {
  test('Health check', async () => {
    const response = await request(server).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });

  test('Registers a new user', async () => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123'
    };
    const response = await request(server).post('/register').send(newUser);
    expect(response.statusCode).toBe(201);
    expect(response.body.email).toEqual(newUser.email);
  });

  test('Fails to login with incorrect credentials', async () => {
    const credentials = {
      username: 'testuser',
      password: 'wrongpassword'
    };
    const response = await request(server).post('/login').send(credentials);
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Invalid username or password');
  });

  test('Logs in with correct credentials', async () => {
    const credentials = {
      username: 'testuser',
      password: 'test123'
    };
    const response = await request(server).post('/login').send(credentials);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('Updates user data', async () => {
    // Assume existing user ID is "123"
    const updates = { username: 'updatedUser' };
    const response = await request(server).put('/user/123').send(updates);
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe('updatedUser');
  });
});
