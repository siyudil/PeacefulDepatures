const express = require("express");
const router = express.Router();
const Obituary = require("../Model/UserModel");
const Condolence = require("../Model/CondolenceModel");
const {
  approveObituary,
  rejectObituary,
  deleteUser,
  getAllUsers,
  getTopViewed
} = require("../Controllers/UserController");

// Get all obituaries (for admin dashboard)
router.get("/obituaries", async (req, res) => {
  try {
    const obituaries = await Obituary.find();
    res.json(obituaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top 5 most viewed obituaries
router.get("/obituaries/top-viewed", getTopViewed);

// Approve obituary
router.put("/obituaries/:id/approve", approveObituary);

// Reject obituary
router.put("/obituaries/:id/reject", rejectObituary);

// Delete obituary
router.delete("/obituaries/:id", deleteUser);

// Delete condolence (admin)
router.delete("/condolences/:id", async (req, res) => {
  try {
    const deleted = await Condolence.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Unable to delete condolence" });
    return res.status(200).json({ message: "Condolence successfully deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;