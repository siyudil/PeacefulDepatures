const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  hallName: {
    type: String,
    required: true,
    trim: true
  },
  hallPrice: {
    type: Number,
    required: true,
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  openingHours: {
    type: String,
    required: true
  },
  features: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  hallImage: {
    type: String
  },
  location: {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true }
  },
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  facilities: {
    parking: { type: Boolean, default: false },
    ac: { type: Boolean, default: false },
    generator: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false }
  },
  hallType: {
    type: String,
    enum: ['indoor', 'outdoor', 'garden', 'banquet', 'conference'],
    default: 'indoor'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hall', hallSchema);