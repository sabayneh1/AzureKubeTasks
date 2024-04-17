const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Welcome to the Central Microservice Hub!');
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Additional route as an example
app.get('/info', (req, res) => {
  res.status(200).send('This service acts as a central hub for various microservices.');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Central service listening on port ${port}`);
  });
}

module.exports = app;
