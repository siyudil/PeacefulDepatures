const Notification = require("../Model/mnotification");

// ✅ Create notification
exports.createNotification = async (req, res) => {
  try {
    const { userName, message } = req.body;
    const notification = new Notification({ userName, message });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { name } = req.params;
    const notifications = await Notification.find({ userName: name }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Mark as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: "read" });
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};