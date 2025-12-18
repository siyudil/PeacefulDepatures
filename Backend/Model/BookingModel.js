// Model/BookingModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "Person", required: true },

    // Step 1: Personal details
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },

    // Step 2: Deceased details
    deceasedName: { type: String, required: true },
    dob: { type: Date, required: true },
    dod: { type: Date, required: true },
    gender: { type: String, required: true },
    religion: { type: String, required: true },

    // Step 3: Funeral details
    funeralType: { type: String, required: true },
    funeralVenue: { type: String, required: true },
    otherVenue: { type: String },
    noOfDays: { type: Number, required: true },
    cemetery: { type: String, required: true },
    arrivalDate: { type: Date, required: true },
    departureDate: { type: Date, required: true },
    departureTime: { type: String, required: true },
    requests: { type: String },

    // Step 4: Package & Pricing
    packageName: { type: String, required: true },
    packagePrice: { type: Number, default: 0 },
    selectedServices: { type: [String], default: [] },
    servicesTotal: { type: Number, default: 0 },
    hallPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },

    // Step 5: Status & Control
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notification: { type: String },
    locked: { type: Boolean, default: false },
  },
  {
    timestamps: true, // ✅ Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("BookingModel", bookingSchema);
