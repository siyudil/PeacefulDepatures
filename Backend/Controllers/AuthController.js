const User = require("../Model/PersonModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "1d" }
  );
};

// --- Helper Validation Functions ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name) => /^[A-Za-z\s]+$/.test(name);
const validatePassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password); // letters + numbers, min 6 chars

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // --- Validations ---
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    if (!validateName(name)) {
      return res
        .status(400)
        .json({ msg: "Name must only contain letters and spaces" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters and include both letters and numbers",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      msg: "User registered successfully",
      token,
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("registerUser error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validations ---
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);

    return res.json({
      token,
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("loginUser error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("getProfile error:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
};

// DELETE ACCOUNT
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    return res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteAccount error:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
};

// UPDATE USER
const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = {};

    if (name) {
      if (!validateName(name)) {
        return res
          .status(400)
          .json({ msg: "Name must only contain letters and spaces" });
      }
      updateData.name = name;
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ msg: "Invalid email format" });
      }
      updateData.email = email;
    }

    if (password) {
      if (!validatePassword(password)) {
        return res.status(400).json({
          msg: "Password must be at least 6 characters and include both letters and numbers",
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    return res.json({ msg: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("updateUser error:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  deleteAccount,
  updateUser,
};
