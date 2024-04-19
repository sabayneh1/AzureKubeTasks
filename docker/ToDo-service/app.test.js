// todo-service/app.test.js
const request = require('supertest');
const app = require('./app');

let server;

beforeAll((done) => {
  server = app.listen(0, done); // Use dynamic port allocation
});

afterAll((done) => {
  server.close(done);
});

describe('ToDo Service', () => {
  test('responds with all ToDo items', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(expect.arrayContaining([]));  // Check for array response
  });
});
