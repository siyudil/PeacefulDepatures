const mongoose = require('mongoose');

const workAssignmentSchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff member is required']
  },
  work_type: {
    type: String,
    required: [true, 'Work type is required'],
    enum: ['Funeral Service', 'Transportation', 'Catering', 'Decoration', 'Cleaning', 'Administrative', 'Other']
  },
  assignment_date: {
    type: Date,
    required: [true, 'Assignment date is required']
  },
  start_time: {
    type: String,
    required: [true, 'Start time is required']
  },
  end_time: {
    type: String,
    required: [true, 'End time is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  client_name: {
    type: String,
    required: [true, 'Client name is required']
  },
  client_contact: {
    type: String,
    required: [true, 'Client contact is required']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Add index for better performance
workAssignmentSchema.index({ staff_id: 1, assignment_date: 1 });

module.exports = mongoose.model('WorkAssignment', workAssignmentSchema);