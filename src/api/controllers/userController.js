const userService = require('../../services/userService');

/**
 * Gets a paginated list of all users. Admin only.
 * GET /api/users?page=<page_number>&limit=<items_per_page>
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const { count, rows } = await userService.getAll({ page, limit });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalItems: count,
      totalPages,
      currentPage: page,
      users: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching users.' });
  }
};

/**
 * Gets a single user by ID.
 * User can get themselves, or an admin can get any user.
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const requestedId = req.params.id;
    const requester = req.user; // from authenticateToken middleware

    // Authorization check
    if (requester.role !== 'admin' && requester.id !== requestedId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
    }

    const user = await userService.getById(requestedId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching user.' });
  }
};

/**
 * Blocks a user.
 * User can block themselves, or an admin can block any user.
 * PATCH /api/users/:id/block
 */
const blockUser = async (req, res) => {
  try {
    const requestedId = req.params.id;
    const requester = req.user;

    // Authorization check
    if (requester.role !== 'admin' && requester.id !== requestedId) {
      return res.status(403).json({ message: 'Forbidden: You can only block your own profile.' });
    }

    const updatedUser = await userService.block(requestedId);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while blocking user.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  blockUser,
};
