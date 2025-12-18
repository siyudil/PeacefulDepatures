const express = require("express");
const router = express.Router();
const Notification = require("../Model/NotificationModel");

// ✅ Add notification
router.post("/", async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(200).json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding notification" });
  }
});

// ✅ Get notifications by username
router.get("/:userName", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userName: { $regex: req.params.userName, $options: "i" } // partial match, case-insensitive
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Mark all notifications for a user as read
router.put("/mark-read/:userName", async (req, res) => {
  try {
    const updated = await Notification.updateMany(
      { userName: req.params.userName, status: "unread" },
      { $set: { status: "read" } }
    );
    res.json({ message: "Notifications marked as read", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;