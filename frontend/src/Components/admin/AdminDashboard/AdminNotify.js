import React from 'react'
import AdminSidebar from "../AdminSidebar";
import AdminHeader from "../AdminHeader";
import './AdminNotify.css';


function AdminNotify() {
  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
  <h1>Notifications</h1>
  <ul className="notification-list">
    <li>
      New obituary submitted by John Doe
      <small>28 Sep 2025, 10:00 AM</small>
    </li>
    <li>
      New obituary submitted by Jane Smith
      <small>27 Sep 2025, 4:30 PM</small>
    </li>
  </ul>
</div>
        </div>
    </div>
  )
}

export default AdminNotify