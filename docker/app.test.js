const request = require('supertest');
const app = require('./app');

let server;

beforeAll((done) => {
  server = app.listen(0, done); // Use dynamic port allocation
});

afterAll((done) => {
  server.close(done);
});

describe('Main Central Service', () => {
  test('responds with a welcome message', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Welcome to the Central Microservice Hub!');
  });

  test('provides service information', async () => {
    const response = await request(server).get('/info');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('This service acts as a central hub for various microservices.');
  });
});
