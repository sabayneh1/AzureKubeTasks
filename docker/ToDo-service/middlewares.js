const jwt = require('jsonwebtoken');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Internal Server Error' });
};

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;
  console.log('Cookies:', req.cookies); // Log cookies
  console.log('Token:', token); // Log token

  if (!token) {
    console.log('No token provided');
    return res.status(401).send({ error: 'Unauthorized - No Token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Invalid token:', err);
      return res.status(401).send({ error: 'Unauthorized - Invalid Token' });
    }
    req.user = user;
    console.log('User authenticated:', user); // Log successful authentication
    next(); // Pass control to the next middleware or route handler
  });
};

module.exports = { asyncHandler, errorHandler, authenticateJWT };
