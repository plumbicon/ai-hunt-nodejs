const authService = require('../../services/authService');
const jwt = require('jsonwebtoken');

/**
 * Handles user registration request.
 * Allows public registration for 'user' role.
 * Requires admin JWT for 'admin' role registration.
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { fullName, birthDate, email, password, role } = req.body;

    if (!fullName || !birthDate || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // If trying to register an admin, validate the requester's token
    if (role === 'admin') {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Admin token is required.' });
      }
      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden: Admin privileges required.' });
        }
        // Token is valid and user is an admin, proceed.
      } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
      }
    }

    const newUser = await authService.register({ fullName, birthDate, email, password, role });
    res.status(201).json(newUser);
  } catch (error) {
    // Handle potential unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * Handles user login request.
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const accessToken = await authService.login(email, password);
    res.status(200).json({ accessToken });

  } catch (error) {
    // Distinguish between different authentication errors
    if (error.message.startsWith('Authentication failed')) {
      return res.status(401).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = {
  register,
  login,
};
