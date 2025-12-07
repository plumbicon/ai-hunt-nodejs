require("dotenv").config();
const app = require("./app");
const db = require("./models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const PORT = process.env.PORT || 6000;

const createAdminIfNotExists = async () => {
  const adminEmail = "admin@example.com";

  try {
    const existingAdmin = await db.User.findOne({ where: { role: "admin" } });

    if (!existingAdmin) {
      console.log(`No admin user found. Creating a new one...`);

      // Generate a random password
      const tempPassword = crypto.randomBytes(8).toString("hex");
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

      await db.User.create({
        fullName: "Default Admin",
        birthDate: new Date(),
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isBlocked: false,
      });

      console.log(
        "================================================================",
      );
      console.log(
        "!!!            ADMIN USER CREATED SUCCESSFULLY             !!!",
      );
      console.log(
        "!!! PLEASE CHANGE THESE CREDENTIALS AS SOON AS POSSIBLE !!!",
      );
      console.log(
        "================================================================",
      );
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${tempPassword}`);
      console.log(
        "================================================================",
      );
    }
  } catch (error) {
    console.error("Error during admin user creation:", error);
    // We don't want to halt the server startup for this
  }
};

const start = async () => {
  try {
    console.log("Connecting to the database...");
    await db.sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Run migrations and optionally create admin (controlled by CREATE_ADMIN env)
    // For this implementation, we assume migrations are run separately via CLI.
    if (process.env.CREATE_ADMIN === "true") {
      await createAdminIfNotExists();
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

start();
