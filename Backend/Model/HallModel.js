// models/Hall.js
const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  // Basic Information
  hallName: {
    type: String,
    required: [true, 'Hall name is required'],
    trim: true,
    maxlength: [100, 'Hall name cannot exceed 100 characters']
  },
  
  // Pricing Information
  hallPrice: {
    type: Number,
    required: [true, 'Hall price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'LKR',
    enum: ['LKR', 'USD', 'EUR']
  },
  priceType: {
    type: String,
    enum: ['per_hour', 'per_day', 'per_event', 'package'],
    default: 'per_event'
  },
  
  // Capacity Information
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [10000, 'Capacity cannot exceed 10000']
  },
  
  // Operating Hours
  openingHours: {
    type: String,
    required: [true, 'Opening hours are required'],
    trim: true
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      trim: true
    }
  },
  
  // Contact Information
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  
  // Features and Amenities
  features: [{
    type: String,
    trim: true
  }],
  
  // Facilities
  facilities: {
    parking: { type: Boolean, default: false },
    ac: { type: Boolean, default: false },
    generator: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    soundSystem: { type: Boolean, default: false }
  },
  
  // Hall Specifications
  hallType: {
    type: String,
    enum: ['indoor', 'outdoor', 'garden', 'banquet', 'conference', 'multipurpose'],
    default: 'indoor'
  },
  
  // Images
  images: [{
    type: String
  }],
  
  // Availability and Booking
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Additional Information
  description: {
    type: String,
    trim: true
  },
  
  // Metadata
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
hallSchema.index({ hallName: 1 });
hallSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Hall', hallSchema);