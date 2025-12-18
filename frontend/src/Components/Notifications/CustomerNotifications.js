import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../Nav/Nav";
import {
  FaBell,
  FaBookOpen,
  FaFeatherAlt,
  FaMoneyCheckAlt,
  FaBoxOpen,
  FaUsersCog,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./CustomerNotifications.css";

function CustomerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  // Fetch notifications for logged-in user
  useEffect(() => {
    const fetchAndMarkNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        let list = [];
        const merge = (arr) => {
          if (!Array.isArray(arr)) return;
          // de-duplicate by _id if present, else by JSON string
          const map = new Map(list.filter(Boolean).map((n) => [n._id || JSON.stringify(n), n]));
          for (const n of arr) {
            const key = n?._id || JSON.stringify(n);
            if (!map.has(key)) map.set(key, n);
          }
          list = Array.from(map.values());
        };

        // 1) Prefer token-protected route mounted at /obituarynotifications
        if (token) {
          try {
            const res = await axios.get("http://localhost:5000/obituarynotifications", {
              headers: { Authorization: `Bearer ${token}` },
            });
            merge(res.data.notifications || []);

            // Mark unread as read on the same router
            const unread = (res.data.notifications || []).filter((n) => !n.isRead);
            if (unread.length > 0) {
              await axios.put(
                "http://localhost:5000/obituarynotifications/mark-all-read",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } catch (e) {
            // fall through to username-based
          }

          // Also try a token route at /notifications if present (for Booking)
          try {
            const res2 = await axios.get("http://localhost:5000/notifications", {
              headers: { Authorization: `Bearer ${token}` },
            });
            merge(res2.data.notifications || []);
            const unread2 = (res2.data.notifications || []).filter((n) => !n.isRead);
            if (unread2.length > 0) {
              // Try both mark-all endpoints safely
              try {
                await axios.put(
                  "http://localhost:5000/notifications/mark-all-read",
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (_) {}
            }
          } catch (_) {}
        }

        // 2) If nothing yet, try username-based endpoints
        if (!list.length) {
          const userName = localStorage.getItem("userName");
          if (userName) {
            // Try new by-username route first
            try {
              const byUser = await axios.get(
                `http://localhost:5000/obituarynotifications/by-username/${encodeURIComponent(userName)}`
              );
              merge(byUser.data.notifications || []);
            } catch (_) {}

            // Legacy rnotication route: /notifications/:userName -> may return array
            try {
              const legacy = await axios.get(
                `http://localhost:5000/notifications/${encodeURIComponent(userName)}`
              );
              const arr = Array.isArray(legacy.data)
                ? legacy.data
                : legacy.data.notifications || [];
              merge(arr);
            } catch (_) {}
          }
        }

        setNotifications(list);
      } catch (err) {
        console.error("Error fetching or marking notifications:", err);
      }
    };

    fetchAndMarkNotifications();
  }, []);

  // Categories shown in sidebar
  const categories = [
    { name: "All", icon: <FaBell /> },
    { name: "Booking", icon: <FaBookOpen /> },
    { name: "Obituary and Condolence", icon: <FaFeatherAlt /> },
    { name: "Payment and Invoice", icon: <FaMoneyCheckAlt /> },
    { name: "Package and Service", icon: <FaBoxOpen /> },
    { name: "Staff and Vendor", icon: <FaUsersCog /> },
  ];

  // Filter notifications by selected category
  const filtered = (() => {
    if (activeCategory === "All") return notifications;

    const norm = (s) => (s || "").toString().trim().toLowerCase();
    if (activeCategory === "Obituary and Condolence") {
      return notifications.filter((n) => {
        const c = norm(n.category);
        return c === "obituary" || c === "condolence";
      });
    }

    const target = norm(activeCategory);
    return notifications.filter((n) => {
      const c = norm(n.category);
      if (target === "booking") return c === "booking" || c === "bookings";
      if (target === "payment and invoice") return c === "payment" || c === "invoice" || c === "payment and invoice";
      if (target === "package and service") return c === "package" || c === "service" || c === "packages" || c === "services" || c === "package and service";
      if (target === "staff and vendor") return c === "staff" || c === "vendor" || c === "staff and vendor";
      return c === target;
    });
  })();

  // Handle click: mark as read + navigate
  const handleNotificationClick = async (n) => {
    try {
      const token = localStorage.getItem("token");

      // mark as read in backend
      await axios.put(
        `http://localhost:5000/notifications/${n._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // navigate to related booking (only for Booking category)
      if (n.relatedId && n.category === "Booking") {
        navigate(`/bookingdetails/${n.relatedId}`);
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

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

          {/* ===== Notification List ===== */}
          <section className="notif-content">
            <h2>{activeCategory} Messages</h2>
            {filtered.length === 0 ? (
              <p className="empty">No notifications found.</p>
            ) : (
              filtered.map((n) => (
                <div
                  key={n._id}
                  className={`notif-card ${n.isRead ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-header">
                    <h4>{n.title}</h4>
                    <span className="notif-date">
                      {new Date(n.createdAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <p>{n.message}</p>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default CustomerNotifications;
