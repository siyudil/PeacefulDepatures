import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaClipboardList,
  FaCreditCard,
  FaBell,
  FaCog,
  FaUser,
} from "react-icons/fa";
import axios from "axios";
import Nav from "../../Nav/Nav";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ===== 1. Fetch Profile =====
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };
    fetchProfile();
  }, []);

  // ===== 2. Fetch Notifications Count =====
  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const count = res.data.notifications?.filter((n) => !n.isRead).length || 0;
      setUnreadCount(count);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Call on mount + every 10 seconds
  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // ===== 3. Reset count when on /notifications page =====
  useEffect(() => {
    if (location.pathname === "/notifications") {
      setUnreadCount(0); // instantly clear badge
    }
  }, [location.pathname]);

  // ===== 4. Actions =====
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete("http://localhost:5000/api/auth/delete", {
          headers: { Authorization: `Bearer ${token}` },
        });
        localStorage.clear();
        alert("Account deleted successfully.");
        navigate("/register");
      } catch (err) {
        alert(err.response?.data?.msg || "Failed to delete account");
      }
    }
  };

  // ===== 5. Render =====
  return (
    <div>
      <Nav />
      <div className="profile-page">
        <div className="profile-header">
          <FaUser className="profile-avatar" />
          <h2>{user?.name || "Guest User"}</h2>
          <p>{user?.email || "No email available"}</p>
          <span className="profile-role">{user?.role}</span>

          <div className="profile-actions">
            <button
              className="edit-btn"
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
            <button className="delete-btn" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        </div>

        <div className="profile-sections">
          <div
            className="profile-card"
            onClick={() => navigate("/bookingdetails")}
          >
            <FaClipboardList className="profile-icon" />
            <h3>Bookings</h3>
            <p>View and manage your funeral bookings</p>
          </div>

          <div className="profile-card" onClick={() => navigate("/Invoicesdetails")}>
            <FaCreditCard className="profile-icon" />
            <h3>Payments</h3>
            <p>Check your payment history and invoices</p>
          </div>

          {/* 🔔 Notifications card with live red badge */}
          <div
            className="profile-card notif-card-container"
            onClick={() => navigate("/notifications")}
          >
            <div className="notif-icon-wrapper">
              <FaBell className="profile-icon" />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </div>
            <h3>Notifications</h3>
            <p>Stay updated with important alerts</p>
          </div>

          <div className="profile-card" onClick={() => navigate("/settings")}>
            <FaCog className="profile-icon" />
            <h3>Settings</h3>
            <p>Update your account details and preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
