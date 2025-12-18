const mongoose = require("mongoose");
const condolenceSchema = new mongoose.Schema({
  
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  name: { 
    type: String, 
    required: true 
  },

  message: { 
    type: String, 
    required: false
  },

    media: [String], // array of filenames (images/videos)
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
    "Condolence", 
    condolenceSchema);