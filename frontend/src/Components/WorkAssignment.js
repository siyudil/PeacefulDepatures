import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import axios from 'axios';
import AdminHeader from './admin/AdminHeader';
import AdminSidebar from './admin/AdminSidebar';
import './WorkAssignment.css';

const WorkAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    staff_id: '',
    work_type: 'Funeral Service',
    assignment_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    description: '',
    priority: 'Medium',
    client_name: '',
    client_contact: '',
    notes: '',
    status: 'Scheduled'
  });

  const API_URL = 'http://localhost:5000/api/assignments';
  const STAFF_API_URL = 'http://localhost:5000/api/staff';

  const workTypes = [
    'Funeral Service', 'Transportation', 'Catering', 
    'Decoration', 'Cleaning', 'Administrative', 'Other'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, staffRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(STAFF_API_URL)
      ]);

      const staffMembers = staffRes.data.staff.filter(person => person.role === 'Staff');
      setStaff(staffMembers);
      setAssignments(assignmentsRes.data.assignments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      work_type: 'Funeral Service',
      assignment_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
      location: '',
      description: '',
      priority: 'Medium',
      client_name: '',
      client_contact: '',
      notes: '',
      status: 'Scheduled'
    });
    setEditingAssignment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await axios.put(`${API_URL}/${editingAssignment._id}`, formData);
        alert('Assignment updated successfully!');
      } else {
        await axios.post(API_URL, formData);
        alert('Assignment created successfully!');
      }
      
      fetchData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error saving assignment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (assignment) => {
    setFormData({
      staff_id: assignment.staff_id._id,
      work_type: assignment.work_type,
      assignment_date: assignment.assignment_date.split('T')[0],
      start_time: assignment.start_time,
      end_time: assignment.end_time,
      location: assignment.location,
      description: assignment.description,
      priority: assignment.priority,
      client_name: assignment.client_name,
      client_contact: assignment.client_contact,
      notes: assignment.notes,
      status: assignment.status
    });
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        alert('Assignment deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Error deleting assignment');
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/${id}/status`, { status });
      fetchData();
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesFilter = filter === 'all' || assignment.status === filter;
    const matchesDate = selectedDate ? 
      assignment.assignment_date.split('T')[0] === selectedDate : true;
    
    return matchesFilter && matchesDate;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ff6b6b';
      case 'Urgent': return '#ff0000';
      case 'Medium': return '#feca57';
      case 'Low': return '#48dbfb';
      default: return '#c8d6e5';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#1dd1a1';
      case 'In Progress': return '#feca57';
      case 'Scheduled': return '#54a0ff';
      case 'Cancelled': return '#ff6b6b';
      default: return '#c8d6e5';
    }
  };

  return (
    <div className="work-assignment">
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
        <Link to="/vendors" className="menu-btn">
          Vendors
        </Link>
        <Link to="/assignments" className="menu-btn active">
          Assignments
        </Link>
        <Link to="/reports" className="menu-btn">
          Reports
        </Link>
      </div>

        <div className="header-title">
          <h1>Work Assignment</h1>
          <p>Assign and manage work schedules for staff members</p>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Assign New Work
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">📋</div>
          <div className="stat-info">
            <h3>{assignments.length}</h3>
            <p>Total Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon scheduled">⏰</div>
          <div className="stat-info">
            <h3>{assignments.filter(a => a.status === 'Scheduled').length}</h3>
            <p>Scheduled</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon progress">🔄</div>
          <div className="stat-info">
            <h3>{assignments.filter(a => a.status === 'In Progress').length}</h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-info">
            <h3>{assignments.filter(a => a.status === 'Completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Assignments</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Filter by Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-filter"
          />
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={() => {
            setFilter('all');
            setSelectedDate(new Date().toISOString().split('T')[0]);
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="form-modal">
          <div className="form-container large">
            <div className="form-header">
              <h2>{editingAssignment ? 'Edit Work Assignment' : 'Create New Work Assignment'}</h2>
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
                <h3>Assignment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Staff Member *</label>
                    <select
                      name="staff_id"
                      value={formData.staff_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Staff Member</option>
                      {staff
                        .filter(staffMember => {
                          // When editing, allow the current staff member to appear
                          if (editingAssignment && staffMember._id === formData.staff_id) {
                            return true;
                          }
                          // Filter out staff who have active (not completed/cancelled) assignments
                          const hasActiveAssignment = assignments.some(
                            assignment => 
                              assignment.staff_id._id === staffMember._id && 
                              assignment.status !== 'Completed' && 
                              assignment.status !== 'Cancelled'
                          );
                          return !hasActiveAssignment;
                        })
                        .map(staffMember => (
                          <option key={staffMember._id} value={staffMember._id}>
                            {staffMember.f_name} - {staffMember.job_role}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Work Type *</label>
                    <select
                      name="work_type"
                      value={formData.work_type}
                      onChange={handleInputChange}
                      required
                    >
                      {workTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assignment Date *</label>
                    <input
                      type="date"
                      name="assignment_date"
                      value={formData.assignment_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority *</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter work location"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the work to be done..."
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Client Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Client Name *</label>
                    <input
                      type="text"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleInputChange}
                      placeholder="Enter client name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Client Contact</label>
                    <input
                      type="text"
                      name="client_contact"
                      value={formData.client_contact}
                      onChange={handleInputChange}
                      placeholder="Client phone number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes or instructions..."
                    rows="2"
                  />
                </div>

                {editingAssignment && (
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-success">
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
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

      {/* Assignments List */}
      <div className="assignments-list">
        <div className="list-header">
          <h2>Work Assignments ({filteredAssignments.length})</h2>
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>
        
        {filteredAssignments.length === 0 && !loading ? (
          <div className="empty-state">
            <h3>No assignments found</h3>
            <p>Create your first work assignment to get started</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <div className="assignments-table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Work Details</th>
                  <th>Date & Time</th>
                  <th>Client</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td>
                      <div className="staff-info">
                        <div className="staff-avatar">
                          {assignment.staff_id.f_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="staff-details">
                          <div className="staff-name">{assignment.staff_id.f_name}</div>
                          <div className="staff-role">{assignment.staff_id.job_role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="work-details">
                        <div className="work-type">{assignment.work_type}</div>
                        <div className="work-location">{assignment.location}</div>
                        <div className="work-description">{assignment.description}</div>
                      </div>
                    </td>
                    <td>
                      <div className="datetime-info">
                        <div className="assignment-date">
                          {new Date(assignment.assignment_date).toLocaleDateString()}
                        </div>
                        <div className="assignment-time">
                          {assignment.start_time} - {assignment.end_time}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="client-info">
                        <div className="client-name">{assignment.client_name}</div>
                        <div className="client-contact">{assignment.client_contact}</div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(assignment.priority) }}
                      >
                        {assignment.priority}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(assignment.status) }}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(assignment)}
                          title="Edit assignment"
                        >
                          ✏
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(assignment._id)}
                          title="Delete assignment"
                        >
                          🗑
                        </button>
                        <div className="status-actions">
                          <select 
                            value={assignment.status}
                            onChange={(e) => updateStatus(assignment._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
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

export default WorkAssignment;