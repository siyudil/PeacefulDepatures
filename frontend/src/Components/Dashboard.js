import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminHeader from './admin/AdminHeader';
import AdminSidebar from './admin/AdminSidebar';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalVendors: 0,
    maleStaff: 0,
    femaleStaff: 0,
    activeStaff: 0,
    activeVendors: 0
  });

  const [assignmentStats, setAssignmentStats] = useState({
    totalAssignments: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0
  });

  const [recentStaff, setRecentStaff] = useState([]);
  const [recentVendors, setRecentVendors] = useState([]);

  const API_URL = 'http://localhost:5000/api/staff';
  const ASSIGNMENTS_API_URL = 'http://localhost:5000/api/assignments';

  useEffect(() => {
    const fetchAssignmentStats = async () => {
      try {
        const response = await axios.get(ASSIGNMENTS_API_URL);
        const assignments = response.data.assignments || [];
        
        setAssignmentStats({
          totalAssignments: assignments.length,
          scheduled: assignments.filter(a => a.status === 'Scheduled').length,
          inProgress: assignments.filter(a => a.status === 'In Progress').length,
          completed: assignments.filter(a => a.status === 'Completed').length
        });
      } catch (error) {
        console.error('Error fetching assignment stats:', error);
      }
    };

    const fetchDashboardData = async () => {
      try {
        // Fetch staff data
        const staffResponse = await axios.get(API_URL);
        const allData = staffResponse.data.staff || [];
        
        // Calculate statistics
        const staff = allData.filter(item => item.role === 'Staff');
        const vendors = allData.filter(item => item.role === 'Vendor');
        
        setStats({
          totalStaff: staff.length,
          totalVendors: vendors.length,
          maleStaff: staff.filter(s => s.gender === 'Male').length,
          femaleStaff: staff.filter(s => s.gender === 'Female').length,
          activeStaff: staff.filter(s => s.contact_num).length,
          activeVendors: vendors.filter(v => v.contact_num).length
        });

        // Get recent entries (last 5)
        setRecentStaff(staff.slice(-5).reverse());
        setRecentVendors(vendors.slice(-5).reverse());
        
        // Fetch assignment statistics
        await fetchAssignmentStats();
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon, title, value, color, link }) => (
    <Link to={link} className="stat-card-link">
      <div className={`stat-card ${color}`}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
          <h3>{value}</h3>
          <p>{title}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="dashboard">
      <AdminHeader />
      <AdminSidebar />
      <div className="dashboard-header">
        <h1>Manage Staff & Vendors</h1>
        <p>Manage your staff, vendors, and work assignments efficiently</p>
      </div>

      {/* ✅ Top Menu Buttons*/}
      <div className="top-menu">
        <Link to="/dashboard" className="menu-btn active">
          Dashboard
        </Link>
        <Link to="/staff" className="menu-btn">
          Staff
        </Link>
        <Link to="/vendors" className="menu-btn">
          Vendors
        </Link>
        <Link to="/assignments" className="menu-btn">
          Assignments
        </Link>
        <Link to="/reports" className="menu-btn">
          Reports
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <StatCard
          icon="👥"
          title="Total Staff"
          value={stats.totalStaff}
          color="blue"
          link="/staff"
        />
        <StatCard
          icon="🏢"
          title="Total Vendors"
          value={stats.totalVendors}
          color="green"
          link="/vendors"
        />
        <StatCard
          icon="👨"
          title="Male Staff"
          value={stats.maleStaff}
          color="purple"
          link="/staff"
        />
        <StatCard
          icon="👩"
          title="Female Staff"
          value={stats.femaleStaff}
          color="pink"
          link="/staff"
        />
        {/* Assignment Statistics */}
        <StatCard
          icon="📋"
          title="Total Assignments"
          value={assignmentStats.totalAssignments}
          color="orange"
          link="/assignments"
        />
        <StatCard
          icon="⏰"
          title="Scheduled"
          value={assignmentStats.scheduled}
          color="yellow"
          link="/assignments"
        />
        <StatCard
          icon="🔄"
          title="In Progress"
          value={assignmentStats.inProgress}
          color="teal"
          link="/assignments"
        />
        <StatCard
          icon="✅"
          title="Completed"
          value={assignmentStats.completed}
          color="green"
          link="/assignments"
        />
      </div>

      <div className="dashboard-content">
        {/* Recent Staff */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Staff Members</h2>
            <Link to="/staff" className="view-all-btn">View All</Link>
          </div>
          <div className="recent-list">
            {recentStaff.length === 0 ? (
              <div className="empty-state">No staff members found</div>
            ) : (
              recentStaff.map(staff => (
                <div key={staff._id} className="recent-item">
                  <div className="item-avatar">
                    {staff.f_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{staff.f_name}</div>
                    <div className="item-details">{staff.job_role}</div>
                  </div>
                  <div className="item-date">
                    {new Date(staff.date_of_joinning).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Vendors */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Vendors</h2>
            <Link to="/vendors" className="view-all-btn">View All</Link>
          </div>
          <div className="recent-list">
            {recentVendors.length === 0 ? (
              <div className="empty-state">No vendors found</div>
            ) : (
              recentVendors.map(vendor => (
                <div key={vendor._id} className="recent-item">
                  <div className="item-avatar vendor">
                    {vendor.f_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{vendor.f_name}</div>
                    <div className="item-details">{vendor.job_role}</div>
                  </div>
                  <div className="item-date">
                    {new Date(vendor.date_of_joinning).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/staff" className="action-btn primary">
            <span className="action-icon">➕</span>
            Add New Staff
          </Link>
          <Link to="/vendors" className="action-btn secondary">
            <span className="action-icon">➕</span>
            Add New Vendor
          </Link>
          <Link to="/assignments" className="action-btn tertiary">
            <span className="action-icon">📋</span>
            Create Assignment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;