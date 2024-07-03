const express = require('express');
const redis = require('redis');
const geoip = require('geoip-lite');
const axios = require('axios');

const app = express();
const port = 6379; 

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

app.use(express.json());

// Route to cache user IP, location, and todos
app.post('/cache', (req, res) => {
  const { userId, todos } = req.body;
  const userIP = req.ip;
  const geo = geoip.lookup(userIP);

  // Store IP and location information
  redisClient.set(`user:${userId}:ip`, userIP);
  if (geo) {
    redisClient.set(`user:${userId}:location`, JSON.stringify(geo));
  }

  // Cache the todos
  redisClient.setex(`todos:${userId}`, 3600, JSON.stringify(todos));

  res.sendStatus(200);
});

// Route to retrieve cached user data
app.get('/cache/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userIP = await new Promise((resolve, reject) => {
      redisClient.get(`user:${userId}:ip`, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const userLocation = await new Promise((resolve, reject) => {
      redisClient.get(`user:${userId}:location`, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const todos = await new Promise((resolve, reject) => {
      redisClient.get(`todos:${userId}`, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    res.json({
      userId,
      userIP,
      userLocation: userLocation ? JSON.parse(userLocation) : null,
      todos: todos ? JSON.parse(todos) : null,
    });
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Redis sidecar listening on port ${port}`);
});
