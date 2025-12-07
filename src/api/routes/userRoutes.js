const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// All routes in this file are protected and require a valid token.
// The authenticateToken middleware is applied to all of them.

// @route   GET /api/users
// @desc    Get all users
// @access  Admin
router.get(
  '/',
  [authenticateToken, isAdmin], // Requires token and admin role
  userController.getAllUsers
);

// @route   GET /api/users/:id
// @desc    Get a user by ID
// @access  Private (Admin or Owner)
router.get(
  '/:id',
  authenticateToken, // Requires token
  userController.getUserById
);

// @route   PATCH /api/users/:id/block
// @desc    Block a user
// @access  Private (Admin or Owner)
router.patch(
  '/:id/block',
  authenticateToken, // Requires token
  userController.blockUser
);


module.exports = router;
