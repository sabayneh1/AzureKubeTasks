const jwt = require('jsonwebtoken');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Internal Server Error' });
};

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/users/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.redirect('/users/login');
    }
    req.user = user;
    next();
  });
};

module.exports = { asyncHandler, errorHandler, authenticateJWT };
