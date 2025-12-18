const express = require("express");
const router = express.Router();
const verifyToken = require("../Middleware/AuthMiddleware");
const Notification = require("../Model/NotificationModel");

/**
 * ✅ Get all notifications for the logged-in user
 * Sorted by newest first
 */
router.get("/", verifyToken(), async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching notifications" });
  }
});

/**
 * ✅ Legacy-compatible: fetch notifications by userName (no auth)
 * Used by obituary submission flows that only know the obituary name
 */
router.get("/by-username/:userName", async (req, res) => {
  try {
    const q = req.params.userName;
    const notifications = await Notification.find({
      userName: { $regex: q, $options: "i" },
    }).sort({ createdAt: -1 });
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications by username:", err);
    return res.status(500).json({ message: "Server error while fetching notifications by username" });
  }
});

/**
 * ✅ Mark a single notification as read
 */
router.put("/:id/read", verifyToken(), async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notif)
      return res.status(404).json({ message: "Notification not found" });

    res.status(200).json({ message: "Marked as read", notif });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res
      .status(500)
      .json({ message: "Server error while marking notification as read" });
  }
});

/**
 * ✅ Mark all notifications as read (used when opening notifications page)
 */
router.put("/mark-all-read", verifyToken(), async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res
      .status(500)
      .json({ message: "Server error while marking all notifications as read" });
  }
});

/**
 * ✅ Delete all notifications (optional cleanup route for future)
 */
router.delete("/clear", verifyToken(["admin", "customer"]), async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("Error deleting notifications:", err);
    res
      .status(500)
      .json({ message: "Server error while clearing notifications" });
  }
});

module.exports = router;
