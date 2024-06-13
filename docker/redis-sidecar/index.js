const express = require('express');
const redis = require('redis');
const geoip = require('geoip-lite');
const axios = require('axios');

const app = express();
const port = 4000; // Port for sidecar service

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Redis sidecar listening on port ${port}`);
});
