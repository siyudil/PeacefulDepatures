const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  PackageId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  PackageName: {
    type: String,
    required: true,
    trim: true
  },
  PackageType: {
    type: String,
    required: true,
    trim: true
  },
  Description: {
    type: String,
    trim: true
  },
  BasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  AdditionalServicesPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  Duration: {
    type: Number,
    required: true,
    min: 1
  },
  Availability: {
    type: String,
    default: 'Available',
    enum: ['Available', 'Unavailable']
  },
  PackageImage: {
    type: String
  },
  features: [{
    type: String,
    trim: true
  }],
  isPopular: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Package', packageSchema);