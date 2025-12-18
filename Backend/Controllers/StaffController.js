const Staff = require("../Model/StaffModels");

// Get all staff/vendors
const getAllStaff = async (req, res) => {
  try {
    console.log("Fetching all staff...");
    const staff = await Staff.find().sort({ createdAt: -1 });
    console.log(`Found ${staff.length} staff members`);
    res.status(200).json({ 
      success: true,
      count: staff.length,
      staff: staff  
    });
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching staff data: " + err.message 
    });
  }
};

// Add staff/vendor
const addStaff = async (req, res) => {
  try {
    const staff = new Staff(req.body);
    await staff.save();
    res.status(201).json({ 
      success: true,
      message: "Staff added successfully",
      staff: staff  
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Staff with this NIC or Email already exists" 
      });
    }
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get staff by ID
const getById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff member not found" 
      });
    }
    res.json({ 
      success: true,
      staff: staff 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update staff
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true, 
        runValidators: true 
      }
    );
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff member not found" 
      });
    }
    res.json({ 
      success: true,
      message: "Staff updated successfully",
      staff: staff  
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Staff with this NIC or Email already exists" 
      });
    }
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff member not found" 
      });
    }
    res.json({ 
      success: true,
      message: "Staff member deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

module.exports = {
  getAllStaff,
  addStaff,
  getById,
  updateStaff,
  deleteStaff
};