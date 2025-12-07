const express = require("express");
const authRoutes = require("./api/routes/authRoutes");
const userRoutes = require("./api/routes/userRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is up and running!" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

module.exports = app;
