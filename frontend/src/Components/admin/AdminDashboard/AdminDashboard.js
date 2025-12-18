import React from "react";
import AdminHeader from "../../admin/AdminHeader";
import AdminSidebar from "../AdminSidebar";
import "./AdminDashboard.css";

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <h3>Admin Menu</h3>
          {/* Main Content Area */}
          <div className="admin-content">
            <h2>Welcome to the Admin Dashboard</h2>
            <p>Select a menu item to manage your site.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
