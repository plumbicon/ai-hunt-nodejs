const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: 'Unauthorized: Access token is missing.' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Forbidden: Token has expired.' });
      }
      return res.status(403).json({ message: 'Forbidden: Invalid token.' });
    }

    // Attach the user payload to the request object
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  // This middleware should run AFTER authenticateToken
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin role required.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
};
