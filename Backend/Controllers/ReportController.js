const Staff = require("../Model/StaffModels");
const WorkAssignment = require("../Model/WorkAssignmentModels");

// Generate Staff Report
const generateStaffReport = async (req, res) => {
  try {
    const { startDate, endDate, department, gender } = req.query;

    let filter = { role: "Staff" };

    if (startDate && endDate) {
      filter.date_of_joinning = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (department && department !== "all") {
      filter.job_role = department;
    }

    if (gender && gender !== "all") {
      filter.gender = gender;
    }

    const staff = await Staff.find(filter).sort({ date_of_joinning: -1 });

    // Calculate statistics
    const totalStaff = staff.length;
    const maleStaff = staff.filter((s) => s.gender === "Male").length;
    const femaleStaff = staff.filter((s) => s.gender === "Female").length;
    const departments = [...new Set(staff.map((s) => s.job_role))];

    const report = {
      metadata: {
        title: "Staff Management Report",
        generatedAt: new Date().toISOString(),
        filters: {
          dateRange:
            startDate && endDate ? `${startDate} to ${endDate}` : "All Time",
          department:
            department && department !== "all"
              ? department
              : "All Departments",
          gender: gender && gender !== "all" ? gender : "All Genders",
        },
      },
      summary: {
        totalStaff,
        maleStaff,
        femaleStaff,
        totalDepartments: departments.length,
      },
      details: staff.map((s) => ({
        id: s._id,
        name: s.f_name,
        nic: s.nic,
        email: s.gmail,
        phone: s.contact_num,
        department: s.job_role,
        gender: s.gender,
        joinDate: s.date_of_joinning,
        address: s.address,
        status: s.contact_num ? "Active" : "Inactive",
      })),
      departments: departments.map((dept) => ({
        name: dept,
        count: staff.filter((s) => s.job_role === dept).length,
      })),
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("Error generating staff report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating staff report: " + error.message });
  }
};

// Generate Vendor Report
const generateVendorReport = async (req, res) => {
  try {
    const { startDate, endDate, serviceType, status } = req.query;

    let filter = { role: "Vendor" };

    if (startDate && endDate) {
      filter.date_of_joinning = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (serviceType && serviceType !== "all") {
      filter.job_role = serviceType;
    }

    if (status && status !== "all") {
      if (status === "active") {
        filter.contact_num = { $exists: true, $ne: "" };
      } else if (status === "inactive") {
        filter.contact_num = { $in: [null, ""] };
      }
    }

    const vendors = await Staff.find(filter).sort({ date_of_joinning: -1 });

    const totalVendors = vendors.length;
    const activeVendors = vendors.filter((v) => v.contact_num).length;
    const serviceTypes = [...new Set(vendors.map((v) => v.job_role))];

    const report = {
      metadata: {
        title: "Vendor Management Report",
        generatedAt: new Date().toISOString(),
        filters: {
          dateRange:
            startDate && endDate ? `${startDate} to ${endDate}` : "All Time",
          serviceType:
            serviceType && serviceType !== "all"
              ? serviceType
              : "All Services",
          status: status && status !== "all" ? status : "All Status",
        },
      },
      summary: {
        totalVendors,
        activeVendors,
        inactiveVendors: totalVendors - activeVendors,
        totalServiceTypes: serviceTypes.length,
      },
      details: vendors.map((v) => ({
        id: v._id,
        name: v.f_name,
        businessId: v.nic,
        email: v.gmail,
        phone: v.contact_num,
        serviceType: v.job_role,
        gender: v.gender,
        partnershipDate: v.date_of_joinning,
        address: v.address,
        status: v.contact_num ? "Active" : "Inactive",
        vendorType: v.role,
      })),
      serviceTypes: serviceTypes.map((s) => ({
        name: s,
        count: vendors.filter((v) => v.job_role === s).length,
      })),
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("Error generating vendor report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating vendor report: " + error.message });
  }
};

// Generate Assignment Report
const generateAssignmentReport = async (req, res) => {
  try {
    const { startDate, endDate, status, priority, staffId } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.assignment_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (staffId && staffId !== "all") filter.staff_id = staffId;

    const assignments = await WorkAssignment.find(filter)
      .populate("staff_id", "f_name job_role contact_num")
      .sort({ assignment_date: -1 });

    const totalAssignments = assignments.length;
    const statusCounts = {
      scheduled: assignments.filter((a) => a.status === "Scheduled").length,
      inProgress: assignments.filter((a) => a.status === "In Progress").length,
      completed: assignments.filter((a) => a.status === "Completed").length,
      cancelled: assignments.filter((a) => a.status === "Cancelled").length,
    };

    const priorityCounts = {
      low: assignments.filter((a) => a.priority === "Low").length,
      medium: assignments.filter((a) => a.priority === "Medium").length,
      high: assignments.filter((a) => a.priority === "High").length,
      urgent: assignments.filter((a) => a.priority === "Urgent").length,
    };

    const report = {
      metadata: {
        title: "Work Assignment Report",
        generatedAt: new Date().toISOString(),
        filters: {
          dateRange:
            startDate && endDate ? `${startDate} to ${endDate}` : "All Time",
          status: status && status !== "all" ? status : "All Status",
          priority: priority && priority !== "all" ? priority : "All Priorities",
          staff: staffId && staffId !== "all" ? "Specific Staff" : "All Staff",
        },
      },
      summary: { totalAssignments, statusCounts, priorityCounts },
      details: assignments.map((a) => ({
        id: a._id,
        staffName: a.staff_id.f_name,
        staffRole: a.staff_id.job_role,
        workType: a.work_type,
        assignmentDate: a.assignment_date,
        startTime: a.start_time,
        endTime: a.end_time,
        location: a.location,
        clientName: a.client_name,
        clientContact: a.client_contact,
        priority: a.priority,
        status: a.status,
        description: a.description,
      })),
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("Error generating assignment report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating assignment report: " + error.message });
  }
};

// Generate Comprehensive Report
const generateComprehensiveReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [staff, vendors, assignments] = await Promise.all([
      Staff.find({
        role: "Staff",
        ...(startDate && endDate && { date_of_joinning: dateFilter }),
      }),
      Staff.find({
        role: "Vendor",
        ...(startDate && endDate && { date_of_joinning: dateFilter }),
      }),
      WorkAssignment.find({
        ...(startDate && endDate && { assignment_date: dateFilter }),
      }).populate("staff_id", "f_name job_role"),
    ]);

    const report = {
      metadata: {
        title: "Comprehensive Funeral Management Report",
        generatedAt: new Date().toISOString(),
        period: startDate && endDate ? `${startDate} to ${endDate}` : "All Time",
      },
      executiveSummary: {
        totalStaff: staff.length,
        totalVendors: vendors.length,
        totalAssignments: assignments.length,
        completedAssignments: assignments.filter(
          (a) => a.status === "Completed"
        ).length,
        activeStaff: staff.filter((s) => s.contact_num).length,
        activeVendors: vendors.filter((v) => v.contact_num).length,
      },
      staffAnalysis: {
        byGender: {
          male: staff.filter((s) => s.gender === "Male").length,
          female: staff.filter((s) => s.gender === "Female").length,
          other: staff.filter((s) => s.gender === "Other").length,
        },
        byDepartment: [...new Set(staff.map((s) => s.job_role))].map((dept) => ({
          department: dept,
          count: staff.filter((s) => s.job_role === dept).length,
        })),
      },
      vendorAnalysis: {
        byService: [...new Set(vendors.map((v) => v.job_role))].map(
          (service) => ({
            service,
            count: vendors.filter((v) => v.job_role === service).length,
          })
        ),
        byStatus: {
          active: vendors.filter((v) => v.contact_num).length,
          inactive: vendors.filter((v) => !v.contact_num).length,
        },
      },
      assignmentAnalysis: {
        byStatus: {
          scheduled: assignments.filter((a) => a.status === "Scheduled").length,
          inProgress: assignments.filter(
            (a) => a.status === "In Progress"
          ).length,
          completed: assignments.filter((a) => a.status === "Completed").length,
          cancelled: assignments.filter((a) => a.status === "Cancelled").length,
        },
        byPriority: {
          low: assignments.filter((a) => a.priority === "Low").length,
          medium: assignments.filter((a) => a.priority === "Medium").length,
          high: assignments.filter((a) => a.priority === "High").length,
          urgent: assignments.filter((a) => a.priority === "Urgent").length,
        },
        byWorkType: [...new Set(assignments.map((a) => a.work_type))].map(
          (type) => ({
            type,
            count: assignments.filter((a) => a.work_type === type).length,
          })
        ),
      },
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating comprehensive report: " + error.message });
  }
};

module.exports = {
  generateStaffReport,
  generateVendorReport,
  generateAssignmentReport,
  generateComprehensiveReport,
};