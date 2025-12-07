const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;

/**
 * Registers a new user.
 * @param {object} userData - The user's data.
 * @returns {Promise<object>} The created user object (without password).
 */
const register = async (userData) => {
  const { fullName, birthDate, email, password, role } = userData;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user in the database
  const newUser = await db.User.create({
    fullName,
    birthDate,
    email,
    password: hashedPassword,
    role,
    // Role defaults to 'user' as per the model definition if not provided
  });

  // Don't return the password hash
  const userJson = newUser.toJSON();
  delete userJson.password;

  return userJson;
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} The JWT access token.
 */
const login = async (email, password) => {
  const user = await db.User.findOne({ where: { email } });

  if (!user) {
    throw new Error("Authentication failed: User not found.");
  }

  if (user.isBlocked) {
    throw new Error("Authentication failed: User is blocked.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Authentication failed: Invalid password.");
  }

  // Generate JWT
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }, // Token expires in 1 hour
  );

  return accessToken;
};

module.exports = {
  register,
  login,
};
