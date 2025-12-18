const express = require("express");
const router = express.Router();
const {
  getAllStaff,
  addStaff,
  getById,
  updateStaff,
  deleteStaff
} = require("../Controllers/StaffController");

// GET /api/staff - Get all staff
router.get("/", getAllStaff);

// POST /api/staff - Add new staff
router.post("/", addStaff);

// GET /api/staff/:id - Get staff by ID
router.get("/:id", getById);

// PUT /api/staff/:id - Update staff
router.put("/:id", updateStaff);

// DELETE /api/staff/:id - Delete staff
router.delete("/:id", deleteStaff);

module.exports = router;