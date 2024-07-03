// const express = require('express');
// const path = require('path');
// const mongoose = require('mongoose');
// const axios = require('axios');
// const { createClient } = require('redis');
// const geoip = require('geoip-lite');
// const requestIp = require('request-ip');
// const ToDo = require('./models/ToDo');
// const { asyncHandler, authenticateJWT, errorHandler } = require('./middlewares');
// const methodOverride = require('method-override');
// const cookieParser = require('cookie-parser');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3003;

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// app.use(express.static(path.join(__dirname, 'public')));
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride('_method'));
// app.use(cookieParser());
// app.use(requestIp.mw()); // Middleware to get client IP address

// // Redis client setup
// const redisClient = createClient({
//   url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
//   password: process.env.REDIS_PASSWORD,
// });

// redisClient.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// redisClient.on('connect', () => {
//   console.log('Connected to Redis');
// });

// redisClient.on('ready', () => {
//   console.log('Redis client is ready');
// });

// redisClient.on('end', () => {
//   console.log('Redis connection closed');
// });

// redisClient.on('reconnecting', (delay, attempt) => {
//   console.log(`Reconnecting to Redis (attempt ${attempt}, delay ${delay}ms)`);
// });

// redisClient.on('warning', (msg) => {
//   console.warn('Redis warning:', msg);
// });

// (async () => {
//   await redisClient.connect();
// })();

// // Middleware to check authentication for protected routes
// app.use('/todos', authenticateJWT);

// // Middleware to extract IP and location and store in Redis
// app.use(async (req, res, next) => {
//   if (req.user && req.user.userId) {
//     const userId = req.user.userId;
//     const userIP = req.headers['x-forwarded-for'] || req.clientIp; // Using X-Forwarded-For header if available
//     const geo = geoip.lookup(userIP);

//     try {
//       await redisClient.set(`user:${userId}:ip`, userIP);

//       if (geo) {
//         await redisClient.set(`user:${userId}:location`, JSON.stringify(geo));
//       }
//     } catch (error) {
//       console.error('Error caching user IP and location:', error.message);
//     }
//   }
//   next();
// });

// // Root route
// app.get('/', (req, res) => {
//   res.redirect('/todos');
// });

// // Route handlers
// app.get('/todos', asyncHandler(async (req, res, next) => {
//   const todos = await ToDo.find({ user: req.user.userId, completed: false });

//   // Cache the response in Redis sidecar
//   try {
//     await redisClient.setEx(`todos:${req.user.userId}`, 3600, JSON.stringify(todos));
//   } catch (error) {
//     console.error('Error caching todos:', error.message);
//   }

//   res.render('index', { todos });
// }));

// app.post('/todos', asyncHandler(async (req, res, next) => {
//   const { text, completed = false } = req.body;

//   if (!text || text.trim() === '') {
//     return res.status(400).json({ error: 'Text for to-do is required' });
//   }

//   const todo = new ToDo({
//     text,
//     completed,
//     user: req.user.userId
//   });

//   await todo.save();

//   // Cache the response in Redis sidecar
//   try {
//     const todos = await ToDo.find({ user: req.user.userId, completed: false });
//     await redisClient.setEx(`todos:${req.user.userId}`, 3600, JSON.stringify(todos));
//   } catch (error) {
//     console.error('Error caching todos:', error.message);
//   }

//   res.redirect('/todos');
// }));

// app.get('/todos/:id/toggle', asyncHandler(async (req, res) => {
//   const todo = await ToDo.findById(req.params.id);
//   if (todo.user.toString() !== req.user.userId) {
//     return res.status(403).send('Forbidden');
//   }
//   todo.completed = !todo.completed;
//   await todo.save();

//   // Logging userId and todo for debugging
//   console.log('Toggling todo:', todo);
//   console.log('User ID:', req.user.userId);

//   try {
//     // Fetch user's email from the user service
//     const userResponse = await axios.get(`http://user-service:3002/users/${req.user.userId}`);
//     const userEmail = userResponse.data.email;

//     // Logging fetched email
//     console.log('Fetched user email:', userEmail);

//     // Send notification
//     const message = `Your todo "${todo.text}" has been marked as ${todo.completed ? 'completed' : 'incomplete'}.`;
//     const notificationResponse = await axios.post('http://notification-service:3004/send', {
//       email: userEmail,
//       message: message
//     });

//     // Logging notification response
//     console.log('Notification response:', notificationResponse.data);
//   } catch (error) {
//     console.error('Error sending notification:', error.message);
//   }

//   // Cache the updated todos in Redis
//   try {
//     const todos = await ToDo.find({ user: req.user.userId, completed: false });
//     await redisClient.setEx(`todos:${req.user.userId}`, 3600, JSON.stringify(todos));
//   } catch (error) {
//     console.error('Error caching todos:', error.message);
//   }

//   res.json({ completed: todo.completed });
// }));

// app.get('/todos/:id/edit', asyncHandler(async (req, res) => {
//   const todos = await ToDo.find();
//   todos.forEach(todo => {
//     todo.editing = todo.id === req.params.id;
//   });
//   res.render('index', { todos });
// }));

// app.put('/todos/:id', asyncHandler(async (req, res) => {
//   const { text } = req.body;

//   if (!text || text.trim() === '') {
//     return res.status(400).json({ error: 'Text for to-do is required' });
//   }

//   await ToDo.findByIdAndUpdate(req.params.id, { text });

//   // Cache the updated todos in Redis
//   try {
//     const todos = await ToDo.find({ user: req.user.userId, completed: false });
//     await redisClient.setEx(`todos:${req.user.userId}`, 3600, JSON.stringify(todos));
//   } catch (error) {
//     console.error('Error caching todos:', error.message);
//   }

//   res.redirect('/todos');
// }));

// app.post('/todos/:id/comment', asyncHandler(async (req, res) => {
//   const { comment } = req.body;
//   const todo = await ToDo.findById(req.params.id);

//   if (!comment || comment.trim() === '') {
//     return res.status(400).json({ error: 'Comment cannot be empty' });
//   }

//   todo.comments = todo.comments || [];
//   todo.comments.push(comment);
//   await todo.save();

//   // Cache the updated todos in Redis
//   try {
//     const todos = await ToDo.find({ user: req.user.userId, completed: false });
//     await redisClient.setEx(`todos:${req.user.userId}`, 3600, JSON.stringify(todos));
//   } catch (error) {
//     console.error('Error caching todos:', error.message);
//   }

//   res.redirect('/todos');
// }));

// // Logout route
// app.get('/logout', (req, res) => {
//   res.clearCookie('token'); // Clear the authentication token cookie
//   res.redirect('/users/login'); // Redirect to the login page
// });

// app.get('/health', (req, res) => {
//   res.status(200).send('OK');
// });

// // Error handling middleware
// app.use(errorHandler);

// // Start the server
// if (process.env.NODE_ENV !== 'test') {
//   app.listen(port, () => {
//     console.log(`Todo service listening on port ${port}`);
//   });
// }

// module.exports = app;


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const ToDo = require('./models/ToDo');
const { asyncHandler, authenticateJWT, errorHandler } = require('./middlewares');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Middleware to check authentication for protected routes
app.use('/todos', authenticateJWT);

// Root route
app.get('/', (req, res) => {
  res.redirect('/todos');
});

// Route handlers
app.get('/todos', asyncHandler(async (req, res, next) => {
  const todos = await ToDo.find({ user: req.user.userId, completed: false });
  res.render('index', { todos });
}));

app.post('/todos', asyncHandler(async (req, res, next) => {
  const { text, completed = false } = req.body;
  const todo = new ToDo({
    text,
    completed,
    user: req.user.userId
  });
  await todo.save();
  res.redirect('/todos');
}));

app.get('/todos/:id/toggle', asyncHandler(async (req, res) => {
  const todo = await ToDo.findById(req.params.id);
  if (todo.user.toString() !== req.user.userId) {
    return res.status(403).send('Forbidden');
  }
  todo.completed = !todo.completed;
  await todo.save();

  // Logging userId and todo for debugging
  console.log('Toggling todo:', todo);
  console.log('User ID:', req.user.userId);

  try {
    // Fetch user's email from the user service
    const userResponse = await axios.get(`http://user-service:3002/users/${req.user.userId}`);
    const userEmail = userResponse.data.email;

    // Logging fetched email
    console.log('Fetched user email:', userEmail);

    // Send notification
    const message = `Your todo "${todo.text}" has been marked as ${todo.completed ? 'completed' : 'incomplete'}.`;
    const notificationResponse = await axios.post('http://notification-service:3004/send', {
      email: userEmail,
      message: message
    });

    // Logging notification response
    console.log('Notification response:', notificationResponse.data);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }

  res.json({ completed: todo.completed });
}));

app.put('/todos/:id', asyncHandler(async (req, res) => {
  const { text } = req.body;
  const todo = await ToDo.findById(req.params.id);
  if (!todo || todo.user.toString() !== req.user.userId) {
    return res.status(404).send('Todo not found or not authorized');
  }
  todo.text = text;
  await todo.save();
  res.redirect('/todos');
}));

app.post('/todos/:id/comment', asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const todo = await ToDo.findById(req.params.id);
  if (!todo || todo.user.toString() !== req.user.userId) {
    return res.status(404).send('Todo not found or not authorized');
  }
  todo.comments = todo.comments || [];
  todo.comments.push(comment);
  await todo.save();
  res.redirect('/todos');
}));

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the authentication token cookie
  res.redirect('/users/login'); // Redirect to the login page
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use(errorHandler);

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Todo service listening on port ${port}`);
  });
}

module.exports = app;
