const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional username for legacy lookups (customer flow without auth link)
    userName: {
      type: String,
    },
    category: {
      type: String,
      enum: ["Booking", "Obituary", "Payment", "Package", "Service", "Staff", "Vendor"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: String }, // optional: link to booking/payment etc.
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
