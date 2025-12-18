const WorkAssignment = require("../Model/WorkAssignmentModels");
const Staff = require("../Model/StaffModels");

// Get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await WorkAssignment.find()
      .populate({
        path: 'staff_id',
        select: 'f_name l_name job_role contact_num',
        // This ensures we still get the assignment even if staff is not found
        options: { allowNull: true }
      })
      .sort({ assignment_date: -1, created_at: -1 });
    
    // Transform data to handle null staff gracefully
    const safeAssignments = assignments.map(assignment => ({
      ...assignment.toObject(),
      staff_id: assignment.staff_id || {
        f_name: 'Unknown',
        l_name: 'Staff',
        job_role: 'Not Assigned',
        contact_num: 'N/A'
      }
    }));

    res.status(200).json({ 
      success: true,
      assignments: safeAssignments
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get today's assignments
const getTodayAssignments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const assignments = await WorkAssignment.find({
      assignment_date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate({
      path: 'staff_id',
      select: 'f_name l_name job_role contact_num',
      options: { allowNull: true }
    });

    // Transform data to handle null staff gracefully
    const safeAssignments = assignments.map(assignment => ({
      ...assignment.toObject(),
      staff_id: assignment.staff_id || {
        f_name: 'Unknown',
        l_name: 'Staff',
        job_role: 'Not Assigned',
        contact_num: 'N/A'
      }
    }));

    res.status(200).json({ 
      success: true,
      assignments: safeAssignments
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get assignments by staff member
const getAssignmentsByStaff = async (req, res) => {
  try {
    // First check if staff exists
    const staff = await Staff.findById(req.params.staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    const assignments = await WorkAssignment.find({ staff_id: req.params.staffId })
      .populate({
        path: 'staff_id',
        select: 'f_name l_name job_role contact_num'
      })
      .sort({ assignment_date: -1 });

    res.status(200).json({ 
      success: true,
      assignments 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await WorkAssignment.findById(req.params.id)
      .populate({
        path: 'staff_id',
        select: 'f_name l_name job_role contact_num',
        options: { allowNull: true }
      });

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: "Assignment not found" 
      });
    }

    // Handle null staff
    const safeAssignment = {
      ...assignment.toObject(),
      staff_id: assignment.staff_id || {
        f_name: 'Unknown',
        l_name: 'Staff',
        job_role: 'Not Assigned',
        contact_num: 'N/A'
      }
    };

    res.status(200).json({ 
      success: true,
      assignment: safeAssignment
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Create new assignment
const createAssignment = async (req, res) => {
  try {
    // Validate staff exists before creating assignment
    const staff = await Staff.findById(req.body.staff_id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    const assignment = new WorkAssignment(req.body);
    await assignment.save();
    
    await assignment.populate({
      path: 'staff_id',
      select: 'f_name l_name job_role contact_num'
    });

    res.status(201).json({ 
      success: true,
      message: "Assignment created successfully",
      assignment 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    // If updating staff_id, validate the new staff exists
    if (req.body.staff_id) {
      const staff = await Staff.findById(req.body.staff_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found"
        });
      }
    }

    const assignment = await WorkAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'staff_id',
      select: 'f_name l_name job_role contact_num',
      options: { allowNull: true }
    });
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: "Assignment not found" 
      });
    }

    // Handle null staff
    const safeAssignment = {
      ...assignment.toObject(),
      staff_id: assignment.staff_id || {
        f_name: 'Unknown',
        l_name: 'Staff',
        job_role: 'Not Assigned',
        contact_num: 'N/A'
      }
    };
    
    res.status(200).json({ 
      success: true,
      message: "Assignment updated successfully",
      assignment: safeAssignment
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update assignment status
const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const assignment = await WorkAssignment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate({
      path: 'staff_id',
      select: 'f_name l_name job_role contact_num',
      options: { allowNull: true }
    });
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: "Assignment not found" 
      });
    }

    // Handle null staff
    const safeAssignment = {
      ...assignment.toObject(),
      staff_id: assignment.staff_id || {
        f_name: 'Unknown',
        l_name: 'Staff',
        job_role: 'Not Assigned',
        contact_num: 'N/A'
      }
    };
    
    res.status(200).json({ 
      success: true,
      message: "Assignment status updated successfully",
      assignment: safeAssignment
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await WorkAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: "Assignment not found" 
      });
    }
    res.status(200).json({ 
      success: true,
      message: "Assignment deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByStaff,
  getTodayAssignments,
  updateAssignmentStatus
};