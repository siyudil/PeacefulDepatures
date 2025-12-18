// Routes/CondolenceRoutes.js
const express = require("express");
const router = express.Router();
const Condolence = require("../Model/CondolenceModel");
const multer = require("multer");

// Media upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname),
});
const upload = multer({ storage });

// Add a condolence
router.post("/:userId", upload.array("media", 5), async (req, res) => {
  try {
    const { name, message } = req.body;
    const userId = req.params.userId;
    const media = req.files ? req.files.map(file => file.filename) : [];

    const condolence = await Condolence.create({ userId, name, message, media });
    res.json({ status: "ok", data: condolence });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Get condolences for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const condolences = await Condolence.find({ userId }).sort({ createdAt: -1 });
    res.json({ status: "ok", data: condolences });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

module.exports = router;