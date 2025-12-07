const db = require("../models");

/**
 * Retrieves all users.
 * @returns {Promise<Array<object>>} A list of all users.
 */
const getAll = async () => {
  const users = await db.User.findAll({
    attributes: { exclude: ["password"] }, // Exclude password field
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
