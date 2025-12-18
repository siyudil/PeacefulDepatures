import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import axios from 'axios';
import AdminHeader from './admin/AdminHeader';
import AdminSidebar from './admin/AdminSidebar';
import './VendorManagement.css';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    f_name: '',
    nic: '',
    gmail: '',
    contact_num: '',
    address: '',
    job_role: '',
    gender: '',
    date_of_joinning: '',
    role: 'Vendor'
  });

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api/staff';

  // Validation rules
  const validationRules = {
    f_name: {
      required: true,
      pattern: /^[A-Za-z\s&.,-]{2,100}$/,
      message: 'Vendor name should be 2-100 characters long and contain only letters, spaces, &, ., ,, -'
    },
    nic: {
      required: true,
      pattern: /^([0-9]{9}[xXvV]|[0-9]{12}|[A-Za-z0-9]{5,20})$/,
      message: 'NIC/Business ID should be valid NIC (9/12 digits) or Business ID (5-20 alphanumeric characters)'
    },
    gmail: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    contact_num: {
      required: true,
      pattern: /^(?:\+94|0)?[1-9]\d{8}$/,
      message: 'Please enter a valid Sri Lankan phone number (10 digits starting with 0 or +94)'
    },
    address: {
      required: true,
      minLength: 10,
      maxLength: 255,
      message: 'Address should be 10-255 characters long'
    },
    job_role: {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'Service/Product type should be 2-50 characters long'
    },
    gender: {
      required: false,
      message: 'Please select a gender'
    },
    date_of_joinning: {
      required: true,
      validate: (value) => {
        if (!value) return false;
        const selectedDate = new Date(value);
        const today = new Date();
        const minDate = new Date('2000-01-01');
        return selectedDate <= today && selectedDate >= minDate;
      },
      message: 'Partnership date should be between 2000-01-01 and today'
    },
    role: {
      required: true,
      message: 'Please select vendor type'
    }
  };

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    if (rules.required && !value.trim()) {
      return 'This field is required';
    }

    if (!rules.required && !value.trim()) {
      return ''; // Optional field and empty, no error
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
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

    return '';
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      const allStaff = response.data.staff || [];
      const vendorList = allStaff.filter(person => person.role === 'Vendor');
      setVendors(vendorList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      alert('Error fetching vendor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field when it changes (only if it's been touched)
    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field when it loses focus
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const resetForm = () => {
    setFormData({
      f_name: '',
      nic: '',
      gmail: '',
      contact_num: '',
      address: '',
      job_role: '',
      gender: '',
      date_of_joinning: '',
      role: 'Vendor'
    });
    setFormErrors({});
    setTouchedFields({});
    setEditingVendor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(field => {
      allTouched[field] = true;
    });
    setTouchedFields(allTouched);

    // Validate all fields
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting.');
      return;
    }

    try {
      if (editingVendor) {
        await axios.put(`${API_URL}/${editingVendor._id}`, formData);
        alert('Vendor updated successfully!');
      } else {
        const vendorData = { ...formData, role: 'Vendor' };
        await axios.post(API_URL, vendorData);
        alert('Vendor added successfully!');
      }
      
      fetchVendors();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Error saving vendor data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (vendor) => {
    setFormData({
      f_name: vendor.f_name,
      nic: vendor.nic,
      gmail: vendor.gmail,
      contact_num: vendor.contact_num,
      address: vendor.address,
      job_role: vendor.job_role,
      gender: vendor.gender,
      date_of_joinning: vendor.date_of_joinning.split('T')[0],
      role: vendor.role
    });
    setEditingVendor(vendor);
    setShowForm(true);
    setFormErrors({});
    setTouchedFields({});
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        alert('Vendor deleted successfully!');
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Error deleting vendor');
      }
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.f_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.gmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && vendor.contact_num) ||
                         (filter === 'inactive' && !vendor.contact_num);
    
    return matchesSearch && matchesFilter;
  });

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.contact_num).length;

  // Helper function to check if field has error and is touched
  const hasError = (fieldName) => {
    return touchedFields[fieldName] && formErrors[fieldName];
  };

  return (
    <div className="vendor-management">
         <AdminHeader />
         <AdminSidebar />
         
                {/* ✅ Top Menu Buttons*/}
               <div className="top-menu">
                 <Link to="/dashboard" className="menu-btn">
                   Dashboard
                 </Link>
                 <Link to="/staff" className="menu-btn">
                   Staff
                 </Link>
                 <Link to="/vendors" className="menu-btn active">
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
          <h1>Vendor Management</h1>
          <p>Manage your vendor relationships and information</p>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add New Vendor
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">🏢</div>
          <div className="stat-info">
            <h3>{totalVendors}</h3>
            <p>Total Vendors</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">✅</div>
          <div className="stat-info">
            <h3>{activeVendors}</h3>
            <p>Active Vendors</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">⏸</div>
          <div className="stat-info">
            <h3>{totalVendors - activeVendors}</h3>
            <p>Inactive Vendors</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search vendors by name, email, or service..."
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
            <option value="all">All Vendors</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Vendor Form Modal */}
      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h2>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
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
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vendor Name *</label>
                    <input
                      type="text"
                      name="f_name"
                      value={formData.f_name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter vendor name"
                      required
                      className={hasError('f_name') ? 'error' : ''}
                    />
                    {hasError('f_name') && (
                      <span className="error-message">{formErrors.f_name}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>NIC/Business ID *</label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter NIC or Business ID"
                      required
                      className={hasError('nic') ? 'error' : ''}
                    />
                    {hasError('nic') && (
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
                      placeholder="vendor@email.com"
                      required
                      className={hasError('gmail') ? 'error' : ''}
                    />
                    {hasError('gmail') && (
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
                      className={hasError('contact_num') ? 'error' : ''}
                    />
                    {hasError('contact_num') && (
                      <span className="error-message">{formErrors.contact_num}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter full business address"
                    required
                    className={hasError('address') ? 'error' : ''}
                  />
                  {hasError('address') && (
                    <span className="error-message">{formErrors.address}</span>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Business Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Service/Product Type *</label>
                    <input
                      type="text"
                      name="job_role"
                      value={formData.job_role}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g., Catering, Flowers, Transportation"
                      required
                      className={hasError('job_role') ? 'error' : ''}
                    />
                    {hasError('job_role') && (
                      <span className="error-message">{formErrors.job_role}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={hasError('gender') ? 'error' : ''}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {hasError('gender') && (
                      <span className="error-message">{formErrors.gender}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Partnership Date *</label>
                    <input
                      type="date"
                      name="date_of_joinning"
                      value={formData.date_of_joinning}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={hasError('date_of_joinning') ? 'error' : ''}
                    />
                    {hasError('date_of_joinning') && (
                      <span className="error-message">{formErrors.date_of_joinning}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Vendor Type *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={hasError('role') ? 'error' : ''}
                    >
                      <option value="Vendor">Vendor</option>
                      <option value="Supplier">Supplier</option>
                      <option value="Partner">Partner</option>
                    </select>
                    {hasError('role') && (
                      <span className="error-message">{formErrors.role}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-success">
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
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

      {/* Vendors List */}
      <div className="vendors-list">
        <div className="list-header">
          <h2>Vendors ({filteredVendors.length})</h2>
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>
        
        {filteredVendors.length === 0 && !loading ? (
          <div className="empty-state">
            <h3>No vendors found</h3>
            <p>{searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first vendor'}</p>
            {!searchTerm && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add Your First Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredVendors.map((vendor) => (
              <div key={vendor._id} className="vendor-card">
                <div className="vendor-header">
                  <div className="vendor-avatar">
                    {vendor.f_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="vendor-info">
                    <h3>{vendor.f_name}</h3>
                    <span className="vendor-type">{vendor.role}</span>
                  </div>
                  <div className="vendor-actions">
                    <button 
                      className="btn-icon edit"
                      onClick={() => handleEdit(vendor)}
                      title="Edit vendor"
                    >
                      ✏
                    </button>
                    <button 
                      className="btn-icon delete"
                      onClick={() => handleDelete(vendor._id)}
                      title="Delete vendor"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                
                <div className="vendor-details">
                  <div className="detail-item">
                    <span>📦</span>
                    <span>{vendor.job_role}</span>
                  </div>
                  <div className="detail-item">
                    <span>📧</span>
                    <span>{vendor.gmail}</span>
                  </div>
                  <div className="detail-item">
                    <span>📞</span>
                    <span>{vendor.contact_num}</span>
                  </div>
                  <div className="detail-item">
                    <span>📅</span>
                    <span>Since {new Date(vendor.date_of_joinning).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="vendor-footer">
                  <div className="vendor-status">
                    <span className={`status-dot ${vendor.contact_num ? 'active' : 'inactive'}`}></span>
                    {vendor.contact_num ? 'Active' : 'Inactive'}
                  </div>
                  <div className="vendor-id">
                    ID: {vendor.nic}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorManagement;