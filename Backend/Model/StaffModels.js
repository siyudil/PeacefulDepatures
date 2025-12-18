const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  f_name: {
    type: String,
    required: [true, "First name is required"],
    trim: true
  },
  nic: {
    type: String,
    required: [true, "NIC is required"],
    unique: true,
    trim: true
  },
  gmail: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  contact_num: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true
  },
  job_role: {
    type: String,
    required: [true, "Job role is required"],
    trim: true
  },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: ["Male", "Female", "Other"]
  },
  date_of_joinning: {
    type: Date,
    required: [true, "Date of joining is required"]
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ["Staff", "Vendor"]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Staff", staffSchema);