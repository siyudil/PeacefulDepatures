import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AdminHeader from './admin/AdminHeader';
import AdminSidebar from './admin/AdminSidebar';
import "./StaffManagement.css";

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    f_name: "",
    nic: "",
    gmail: "",
    contact_num: "",
    address: "",
    job_role: "",
    gender: "",
    date_of_joinning: "",
    role: "Staff",
  });

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:5000/api/staff";

  // Validation rules
  const validationRules = {
    f_name: {
      required: true,
      pattern: /^[A-Za-z\s]{2,50}$/,
      message:
        "Name should be 2-50 characters long and contain only letters and spaces",
    },
    nic: {
      required: true,
      pattern: /^([0-9]{9}[xXvV]|[0-9]{12})$/,
      message: "NIC should be 9 digits with X/V or 12 digits",
    },
    gmail: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    contact_num: {
      required: true,
      pattern: /^(?:\+94|0)?[1-9]\d{8}$/,
      message: "Please enter a valid Sri Lankan phone number (10 digits)",
    },
    address: {
      required: true,
      minLength: 5,
      maxLength: 200,
      message: "Address should be 5-200 characters long",
    },
    job_role: {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: "Job role should be 2-50 characters long",
    },
    gender: {
      required: true,
      message: "Please select a gender",
    },
    date_of_joinning: {
      required: true,
      validate: (value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        const minDate = new Date("2000-01-01");
        return selectedDate <= today && selectedDate >= minDate;
      },
      message: "Join date should be between 2000-01-01 and today",
    },
    role: {
      required: true,
      message: "Please select a role",
    },
  };

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return "";

    if (rules.required && !value.trim()) {
      return "This field is required";
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message;
    }

    if (rules.minLength && value.length < rules.minLength) {
      return rules.message;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.message;
    }

    if (rules.validate && !rules.validate(value)) {
      return rules.message;
    }

    return "";
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      const allStaff = response.data.staff || [];
      const staffList = allStaff.filter((person) => person.role === "Staff");
      setStaff(staffList);
    } catch (error) {
      console.error("Error fetching staff:", error);
      alert("Error fetching staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field when it changes (only if it's been touched)
    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field when it loses focus
    const error = validateField(name, value);
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const resetForm = () => {
    setFormData({
      f_name: "",
      nic: "",
      gmail: "",
      contact_num: "",
      address: "",
      job_role: "",
      gender: "",
      date_of_joinning: "",
      role: "Staff",
    });
    setFormErrors({});
    setTouchedFields({});
    setEditingStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      allTouched[field] = true;
    });
    setTouchedFields(allTouched);

    // Validate all fields
    if (!validateForm()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    try {
      if (editingStaff) {
        await axios.put(`${API_URL}/${editingStaff._id}`, formData);
        alert("Staff member updated successfully!");
      } else {
        const staffData = { ...formData, role: "Staff" };
        await axios.post(API_URL, staffData);
        alert("Staff member added successfully!");
      }

      fetchStaff();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert(
        "Error saving staff data: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (staffMember) => {
    setFormData({
      f_name: staffMember.f_name,
      nic: staffMember.nic,
      gmail: staffMember.gmail,
      contact_num: staffMember.contact_num,
      address: staffMember.address,
      job_role: staffMember.job_role,
      gender: staffMember.gender,
      date_of_joinning: staffMember.date_of_joinning.split("T")[0],
      role: staffMember.role,
    });
    setEditingStaff(staffMember);
    setShowForm(true);
    setFormErrors({});
    setTouchedFields({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        alert("Staff member deleted successfully!");
        fetchStaff();
      } catch (error) {
        console.error("Error deleting staff:", error);
        alert("Error deleting staff member");
      }
    }
  };

  const departments = [...new Set(staff.map((s) => s.job_role))];

  const filteredStaff = staff.filter((staffMember) => {
    const matchesSearch =
      staffMember.f_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.nic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === "all" || staffMember.job_role === filter;

    return matchesSearch && matchesFilter;
  });

  const totalStaff = staff.length;
  const maleStaff = staff.filter((s) => s.gender === "Male").length;
  const femaleStaff = staff.filter((s) => s.gender === "Female").length;

  // Helper function to check if field has error and is touched
  const hasError = (fieldName) => {
    return touchedFields[fieldName] && formErrors[fieldName];
  };

  return (
    <div className="staff-management">
      <AdminHeader />
      <AdminSidebar />

      {/* ✅ Top Menu Buttons*/}
      <div className="top-menu">
        <Link to="/dashboard" className="menu-btn">
          Dashboard
        </Link>
        <Link to="/staff" className="menu-btn active">
          Staff
        </Link>
        <Link to="/vendors" className="menu-btn ">
          Vendors
        </Link>
        <Link to="/assignments" className="menu-btn">
          Assignments
        </Link>
        <Link to="/reports" className="menu-btn">
          Reports
        </Link>
      </div>

      <div className="header-title">
        <h1>Staff Management</h1>
        <p>Manage your Staff relationships and information</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add New Staff
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">👥</div>
          <div className="stat-info">
            <h3>{totalStaff}</h3>
            <p>Total Staff</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon male">👨</div>
          <div className="stat-info">
            <h3>{maleStaff}</h3>
            <p>Male Staff</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon female">👩</div>
          <div className="stat-info">
            <h3>{femaleStaff}</h3>
            <p>Female Staff</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon departments">🏢</div>
          <div className="stat-info">
            <h3>{departments.length}</h3>
            <p>Departments</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search staff by name, NIC, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Staff</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Form Modal */}
      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h2>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="f_name"
                      value={formData.f_name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter full name"
                      required
                      className={hasError("f_name") ? "error" : ""}
                    />
                    {hasError("f_name") && (
                      <span className="error-message">{formErrors.f_name}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>NIC *</label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter NIC number"
                      required
                      className={hasError("nic") ? "error" : ""}
                    />
                    {hasError("nic") && (
                      <span className="error-message">{formErrors.nic}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="gmail"
                      value={formData.gmail}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="staff@email.com"
                      required
                      className={hasError("gmail") ? "error" : ""}
                    />
                    {hasError("gmail") && (
                      <span className="error-message">{formErrors.gmail}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input
                      type="text"
                      name="contact_num"
                      value={formData.contact_num}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="+94 XXX XXX XXX"
                      required
                      className={hasError("contact_num") ? "error" : ""}
                    />
                    {hasError("contact_num") && (
                      <span className="error-message">
                        {formErrors.contact_num}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={hasError("gender") ? "error" : ""}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {hasError("gender") && (
                      <span className="error-message">{formErrors.gender}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Date of Joining *</label>
                    <input
                      type="date"
                      name="date_of_joinning"
                      value={formData.date_of_joinning}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={hasError("date_of_joinning") ? "error" : ""}
                    />
                    {hasError("date_of_joinning") && (
                      <span className="error-message">
                        {formErrors.date_of_joinning}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Residential Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter full residential address"
                    required
                    className={hasError("address") ? "error" : ""}
                  />
                  {hasError("address") && (
                    <span className="error-message">{formErrors.address}</span>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Employment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Job Role/Position *</label>
                    <input
                      type="text"
                      name="job_role"
                      value={formData.job_role}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g., Manager, Coordinator, Assistant"
                      required
                      className={hasError("job_role") ? "error" : ""}
                    />
                    {hasError("job_role") && (
                      <span className="error-message">
                        {formErrors.job_role}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Employee Type *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={hasError("role") ? "error" : ""}
                    >
                      <option value="Staff">Staff Member</option>
                      <option value="Manager">Manager</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                    {hasError("role") && (
                      <span className="error-message">{formErrors.role}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-success">
                  {editingStaff ? "Update Staff" : "Add Staff"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="staff-list">
        <div className="list-header">
          <h2>Staff Members ({filteredStaff.length})</h2>
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>

        {filteredStaff.length === 0 && !loading ? (
          <div className="empty-state">
            <h3>No staff members found</h3>
            <p>
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by adding your first staff member"}
            </p>
            {!searchTerm && (
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add Your First Staff Member
              </button>
            )}
          </div>
        ) : (
          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact Information</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staffMember) => (
                  <tr key={staffMember._id}>
                    <td>
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {staffMember.f_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="employee-details">
                          <div className="employee-name">
                            {staffMember.f_name}
                          </div>
                          <div className="employee-nic">
                            NIC: {staffMember.nic}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-email">{staffMember.gmail}</div>
                        <div className="contact-phone">
                          {staffMember.contact_num}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="position-badge">{staffMember.role}</span>
                    </td>
                    <td>
                      <div className="department-info">
                        {staffMember.job_role}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          staffMember.contact_num ? "active" : "inactive"
                        }`}
                      >
                        {staffMember.contact_num ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(staffMember)}
                          title="Edit staff member"
                        >
                          ✏
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(staffMember._id)}
                          title="Delete staff member"
                        >
                          🗑
                        </button>
                        <button
                          className="btn-action btn-view"
                          title="View details"
                          onClick={() => {
                            alert(
                              `Details for ${staffMember.f_name}\n\nEmail: ${staffMember.gmail}\nPhone: ${staffMember.contact_num}\nAddress: ${staffMember.address}\nPosition: ${staffMember.job_role}\nGender: ${staffMember.gender}\nJoin Date: ${staffMember.date_of_joinning}`
                            );
                          }}
                        >
                          👁
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
