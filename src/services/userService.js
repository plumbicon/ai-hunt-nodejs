const db = require("../models");

/**
 * Retrieves a paginated list of users.
 * @param {object} pagination - Pagination options.
 * @param {number} pagination.page - The current page.
 * @param {number} pagination.limit - The number of items per page.
 * @returns {Promise<object>} An object containing the list of users and the total count.
 */
const getAll = async ({ page, limit }) => {
  const offset = (page - 1) * limit;
  const users = await db.User.findAndCountAll({
    attributes: { exclude: ["password"] }, // Exclude password field
    limit,
    offset,
    order: [['createdAt', 'DESC']] // Optional: to keep the order consistent
  });
  return users;
};

/**
 * Retrieves a user by their ID.
 * @param {string} id - The ID of the user.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
const getById = async (id) => {
  const user = await db.User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });
  return user;
};

/**
 * Blocks a user by their ID.
 * @param {string} id - The ID of the user to block.
 * @returns {Promise<object|null>} The updated user object.
 */
const block = async (id) => {
  const user = await db.User.findByPk(id);
  if (!user) {
    return null; // Or throw an error
  }

  user.isBlocked = true;
  await user.save();

  const userJson = user.toJSON();
  delete userJson.password;

  return userJson;
};

module.exports = {
  getAll,
  getById,
  block,
};
