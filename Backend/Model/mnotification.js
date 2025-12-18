const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
