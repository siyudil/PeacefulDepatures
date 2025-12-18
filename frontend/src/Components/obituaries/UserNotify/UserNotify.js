import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserNotify.css";
import Nav from "../../Nav/Nav";
import {
  FaBell,
  FaBookOpen,
  FaFeatherAlt,
  FaMoneyCheckAlt,
  FaBoxOpen,
  FaUsersCog,
} from "react-icons/fa";

function UserNotify() {
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const userName = localStorage.getItem("userName");
    if (!userName) {
      console.log("No userName found in localStorage");
      return;
    }

    axios
      .get(`http://localhost:5000/notifications/${userName}`)
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error("Error fetching notifications:", err));
  }, []);

  const categories = [
    { name: "All", icon: <FaBell /> },
    { name: "Booking", icon: <FaBookOpen /> },
    { name: "Obituary and Condolence", icon: <FaFeatherAlt /> },
    { name: "Payment and Invoice", icon: <FaMoneyCheckAlt /> },
    { name: "Package and Service", icon: <FaBoxOpen /> },
    { name: "Staff and Vendor", icon: <FaUsersCog /> },
  ];

  const filtered =
    activeCategory === "All"
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  return (
    <div>
      <Nav />
      <div className="notifications-page">
        <div className="notifications-body">
          {/* ===== Sidebar ===== */}
          <aside className="notif-sidebar">
            <h3>📬 Notifications</h3>
            <div className="sidebar-buttons">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  className={activeCategory === cat.name ? "active" : ""}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <span className="icon">{cat.icon}</span>
                  <span className="cat-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* ===== Notification Content ===== */}
          <div className="notif-content">
            <h2>🔔 Notifications</h2>
            {filtered.length === 0 ? (
              <p className="empty">No notifications yet.</p>
            ) : (
              filtered.map((n) => (
                <div
                  key={n._id}
                  className={`notif-card ${n.status === "read" ? "read" : "unread"}`}
                >
                  <div className="notif-header">
                    <h4>{n.category}</h4>
                    <span className="notif-date">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserNotify;
