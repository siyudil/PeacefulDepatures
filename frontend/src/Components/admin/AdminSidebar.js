import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaCreditCard,
  FaBoxOpen,
  FaUsers,
  FaBell,
  FaUserCircle,
  FaCog,
} from "react-icons/fa";

function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      <h3 className="sidebar-title">Admin Dashboard</h3>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/managebookings" activeclassname="active">
            <FaCalendarAlt className="sidebar-icon" /> Bookings
          </NavLink>
        </li>
        <li>
          <NavLink to="/ObitDashboard" activeclassname="active">
            <FaFileAlt className="sidebar-icon" /> Obituaries
          </NavLink>
        </li>
        <li>
          <NavLink to="/PaymentHome" activeclassname="active">
            <FaCreditCard className="sidebar-icon" /> Payments
          </NavLink>
        </li>
        <li>
          <NavLink to="/packages" activeclassname="active">
            <FaBoxOpen className="sidebar-icon" /> Packages
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard" activeclassname="active">
            <FaUsers className="sidebar-icon" /> Staff
          </NavLink>
        </li>
        <li>
          <NavLink to="/AdminNotify" activeclassname="active">
            <FaBell className="sidebar-icon" /> Notifications
          </NavLink>
        </li>
        <li>
          <NavLink to="/" activeclassname="active">
            <FaUserCircle className="sidebar-icon" /> Profile
          </NavLink>
        </li>
        <li>
          <NavLink to="/" activeclassname="active">
            <FaCog className="sidebar-icon" /> Settings
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default AdminSidebar;
