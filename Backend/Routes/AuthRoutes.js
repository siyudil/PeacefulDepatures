const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  deleteAccount,
  updateUser,
} = require("../Controllers/AuthController");
const verifyToken = require("../Middleware/AuthMiddleware");

const router = express.Router();

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// PROFILE (protected)
router.get("/me", verifyToken(), getProfile);

// UPDATE USER (protected)
router.put("/update", verifyToken(), updateUser);

// DELETE ACCOUNT (protected)
router.delete("/delete", verifyToken(), deleteAccount);

module.exports = router;
