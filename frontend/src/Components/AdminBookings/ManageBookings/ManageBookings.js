import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AdminHeader from "../../admin/AdminHeader";
import AdminSidebar from "../../admin/AdminSidebar";
import { Bar, Doughnut } from "react-chartjs-2";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import "./ManageBookings.css";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/** ---- CONFIG ---- **/
const HALLS = [
  "Hall of Tranquility",
  "Hall of Remembrance",
  "Hall of Eternity",
];
const PACKAGES = ["Serenity", "Grace", "Eternity"];
const MAX_BOOKINGS_PER_DAY = 5;
const MAX_PACKAGE_SETS_PER_DAY = 5;

/** Expand a booking across all occupied dates */
function expandBookingDates(booking) {
  const out = [];
  if (!booking.arrivalDate || !booking.departureDate) return out;
  const start = new Date(booking.arrivalDate);
  const end = new Date(booking.departureDate);
  const cur = new Date(start);
  while (cur <= end) {
    out.push(cur.toISOString().substring(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Build calendar matrix */
function buildCalendarMatrix(year, monthIdx0) {
  const firstDay = new Date(year, monthIdx0, 1);
  const startWeekday = firstDay.getDay();
  const grid = [];
  let cur = 1 - startWeekday;
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const date = new Date(year, monthIdx0, cur);
      row.push(date);
      cur++;
    }
    grid.push(row);
  }
  return grid;
}

/** Aggregate booking availability */
function useAvailabilityMaps(bookings) {
  return useMemo(() => {
    const dailyCounts = {};
    const hallPackageCounts = {}; // ✅ Track hall + package combination
    const hallCounts = {};
    const packageCounts = {};

    (bookings || []).forEach((b) => {
      const dates = expandBookingDates(b);
      dates.forEach((iso) => {
        // --- Daily total ---
        dailyCounts[iso] = (dailyCounts[iso] || 0) + 1;

        // --- Hall-specific count ---
        const hall =
          b.funeralVenue === "Other" ? b.otherVenue || "Other" : b.funeralVenue;
        hallCounts[iso] = hallCounts[iso] || {};
        hallCounts[iso][hall] = (hallCounts[iso][hall] || 0) + 1;

        // --- Package-specific count ---
        const pkg = b.packageName || "Unknown";
        packageCounts[iso] = packageCounts[iso] || {};
        packageCounts[iso][pkg] = (packageCounts[iso][pkg] || 0) + 1;

        // --- ✅ NEW: Hall + Package combination ---
        const key = `${hall}__${pkg}`;
        hallPackageCounts[iso] = hallPackageCounts[iso] || {};
        hallPackageCounts[iso][key] = (hallPackageCounts[iso][key] || 0) + 1;
      });
    });

    return { dailyCounts, hallCounts, packageCounts, hallPackageCounts };
  }, [bookings]);
}

/** ---- MAIN PAGE ---- **/
function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");

  const fetchBookings = async (query = "") => {
    try {
      const token = localStorage.getItem("token");
      const url = query
        ? `http://localhost:5000/bookings/search?q=${encodeURIComponent(query)}`
        : "http://localhost:5000/bookings";
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Sort by newest first (latest createdAt)
      const sortedBookings = (res.data.bookings || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setBookings(sortedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // ✅ Initial fetch + auto-refresh every 10 seconds
  useEffect(() => {
    fetchBookings();

    const interval = setInterval(() => {
      fetchBookings();
    }, 10000); // refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/bookings/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("✅ Booking approved successfully!");
    fetchBookings(); // refresh after approval
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/bookings/${id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("❌ Booking rejected and removed.");
    fetchBookings(); // refresh after rejection
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Manage Bookings</h2>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              Bookings
            </button>
            <button
              className={`tab ${activeTab === "availability" ? "active" : ""}`}
              onClick={() => setActiveTab("availability")}
            >
              Availability
            </button>
            <button
              className={`tab ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              Reports & Analytics
            </button>
            <button
              className={`tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Booking History
            </button>
          </div>

          {activeTab === "bookings" && (
            <BookingsTab
              bookings={bookings}
              onSearch={(q) => fetchBookings(q)}
              search={search}
              setSearch={setSearch}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          {activeTab === "availability" && (
            <AvailabilityTab bookings={bookings} />
          )}

          {activeTab === "analytics" && (
            <ReportsAnalyticsTab bookings={bookings} />
          )}

          {activeTab === "history" && <HistoryTab bookings={bookings} />}
        </div>
      </div>
    </div>
  );
}

/** ---- TAB: BOOKINGS ---- **/
function BookingsTab({
  bookings,
  onSearch,
  search,
  setSearch,
  onApprove,
  onReject,
}) {
  return (
    <>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, email, package, deceased..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => onSearch(search.trim())}>Search</button>
      </div>

      {bookings.length === 0 ? (
        <p className="no-bookings">No bookings found</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} className="admin-booking-card">
            <div className="booking-summary">
              <h3>{b.name}</h3>
              <p>
                <b>Package:</b> {b.packageName}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span className={`status-badge ${b.status || "pending"}`}>
                  {b.status || "pending"}
                </span>
              </p>
              <p>
                <b>Arrival:</b>{" "}
                {b.arrivalDate
                  ? new Date(b.arrivalDate).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <b>Departure:</b>{" "}
                {b.departureDate
                  ? new Date(b.departureDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="booking-actions">
              <Link to={`/admin/bookings/${b._id}`} className="view-btn">
                View Booking
              </Link>
              {b.status === "pending" && (
                <>
                  <button
                    className="approve-btn"
                    onClick={() => onApprove(b._id)}
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => onReject(b._id)}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}

/** ---- TAB: AVAILABILITY ---- **/
function AvailabilityTab({ bookings }) {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedHall, setSelectedHall] = useState(HALLS[0]);
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  const [message, setMessage] = useState("");
  const [dayBookings, setDayBookings] = useState([]);
  const [clickedDate, setClickedDate] = useState(null);

  const { dailyCounts, packageCounts, hallPackageCounts } =
    useAvailabilityMaps(bookings);

  // Calendar grid
  const calMatrix = useMemo(
    () => buildCalendarMatrix(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

  // Reset when switching filters
  useEffect(() => {
    setMessage("");
    setDayBookings([]);
    setClickedDate(null);
  }, [selectedHall, selectedPackage]);

  const nextMonth = () =>
    setMonthDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
    );
  const prevMonth = () =>
    setMonthDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
    );

  const getLocalISO = (date) =>
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).toLocaleDateString("en-CA");

  function tryBook(date) {
    const iso = getLocalISO(date);
    if (date.getMonth() !== monthDate.getMonth()) return;

    const total = dailyCounts[iso] || 0;
    const hall = selectedHall === "Other Venue" ? "Other" : selectedHall;
    const key = `${hall}__${selectedPackage}`;

    const comboFull = (hallPackageCounts[iso]?.[key] || 0) > 0;
    const pkgFull =
      (packageCounts[iso]?.[selectedPackage] || 0) >= MAX_PACKAGE_SETS_PER_DAY;
    const dayFull = total >= MAX_BOOKINGS_PER_DAY;

    const bookedToday = bookings.filter((b) =>
      expandBookingDates(b).includes(iso)
    );

    setClickedDate(iso);
    setDayBookings(bookedToday);

    if (comboFull) {
      setMessage(
        `⚠️ The "${selectedPackage}" package is already booked in "${selectedHall}" on ${iso}.`
      );
      return;
    }
    if (pkgFull) {
      setMessage(`⚠️ Package "${selectedPackage}" is fully booked on ${iso}.`);
      return;
    }
    if (dayFull) {
      setMessage(`⚠️ All bookings are full on ${iso}.`);
      return;
    }

    if (bookedToday.length > 0) {
      setMessage(`📅 ${iso} — ${bookedToday.length} booking(s) on this day.`);
      return;
    }

    setMessage(`✅ ${iso} is available for booking.`);
  }

  return (
    <div className="availability improved">
      {/* Controls */}
      <div className="availability-controls">
        <div className="selectors">
          <label>
            Hall:&nbsp;
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
            >
              {[...HALLS, "Other Venue"].map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </label>
          <label>
            Package:&nbsp;
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
            >
              {PACKAGES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="month-switcher">
          <button onClick={prevMonth}>◀</button>
          <strong>
            {monthDate.toLocaleString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button onClick={nextMonth}>▶</button>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend dark">
        <span className="legend free">Available (Green)</span>
        <span className="legend pending">Pending (Yellow)</span>
        <span className="legend full">Approved (Red)</span>
      </div>

      {/* Calendar Grid */}
      <div className="calendar modern">
        <div className="calendar-head">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="cell head">
              {d}
            </div>
          ))}
        </div>
        <div className="calendar-body">
          {calMatrix.map((row, i) => (
            <div key={i} className="row">
              {row.map((date) => {
                const iso = getLocalISO(date);
                const total = dailyCounts[iso] || 0;
                const hall =
                  selectedHall === "Other Venue" ? "Other" : selectedHall;

                // ✅ Get bookings for this date, hall, and package
                const relatedBookings = bookings.filter(
                  (b) =>
                    expandBookingDates(b).includes(iso) &&
                    (b.funeralVenue === hall || b.otherVenue === hall) &&
                    b.packageName === selectedPackage
                );

                // ✅ Case-insensitive color logic for proper detection
                let css = "free"; // default: available (green)

                if (
                  relatedBookings.some(
                    (b) => b.status && b.status.toLowerCase() === "approved"
                  )
                ) {
                  css = "full"; // red
                } else if (
                  relatedBookings.some(
                    (b) =>
                      !b.status ||
                      b.status.toLowerCase() === "pending" ||
                      b.status.toLowerCase() === "awaiting"
                  )
                ) {
                  css = "pending"; // yellow
                } else if (total >= MAX_BOOKINGS_PER_DAY - 1) {
                  css = "limited"; // orange (nearly full)
                }

                return (
                  <div
                    key={iso}
                    className={`cell day ${
                      date.getMonth() !== monthDate.getMonth() ? "out" : css
                    }`}
                    onClick={() => tryBook(date)}
                  >
                    <div className="cell-top">
                      <span className="daynum">{date.getDate()}</span>
                      {css !== "out" && (
                        <span className="count">
                          {total}/{MAX_BOOKINGS_PER_DAY}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Message + List */}
      {message && (
        <div className="availability-message">
          <p>{message}</p>
          {dayBookings.length > 0 && (
            <div className="booking-list">
              <h4>Bookings on {clickedDate}</h4>
              <ul>
                {dayBookings.map((b) => (
                  <li key={b._id}>
                    <b>{b.name}</b> – {b.packageName}
                    <br />
                    {b.funeralVenue} ({b.status || "pending"})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** ---- TAB: REPORTS & ANALYTICS ---- **/
function ReportsAnalyticsTab({ bookings }) {
  const [rangeType, setRangeType] = useState("monthly");
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState("All Users");
  const [growthView, setGrowthView] = useState("daily"); // 'daily' | 'weekly' | 'monthly'

  // ---------- GET UNIQUE USERS ----------
  const allUsers = useMemo(() => {
    // Normalize names: trim spaces, make consistent casing
    const normalized = bookings
      .map((b) => (b.name ? b.name.trim().toLowerCase() : "unknown"))
      .filter((n) => n !== "");

    // Convert back to nicely capitalized unique names
    const unique = [...new Set(normalized)].map((n) =>
      n.replace(/\b\w/g, (c) => c.toUpperCase())
    );

    return ["All Users", ...unique];
  }, [bookings]);

  // ---------- FILTER BY RANGE ----------
  const { filtered, label } = useMemo(() => {
    const d = new Date(baseDate);
    let start, end, label;

    if (rangeType === "weekly") {
      const day = d.getDay();
      start = new Date(d);
      start.setDate(d.getDate() - day);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      label = `${start.toISOString().substring(0, 10)} to ${end
        .toISOString()
        .substring(0, 10)}`;
    } else {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      label = d.toLocaleString("en-GB", { month: "long", year: "numeric" });
    }

    // ✅ Ensure full date coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // ✅ Filter bookings by their actual event dates
    const filtered = bookings.filter((b) => {
      if (!b.arrivalDate || !b.departureDate) return false;
      const arrival = new Date(b.arrivalDate);
      const departure = new Date(b.departureDate);
      return (
        (arrival >= start && arrival <= end) ||
        (departure >= start && departure <= end) ||
        (arrival <= start && departure >= end)
      );
    });

    return { filtered, label };
  }, [bookings, baseDate, rangeType]);

  // ---------- FILTER BY USER ----------
  const userBookings =
    selectedUser === "All Users"
      ? filtered
      : filtered.filter(
          (b) =>
            b.name &&
            b.name.trim().toLowerCase() === selectedUser.trim().toLowerCase()
        );

  // ---------- STATS ----------
  const stats = useMemo(() => {
    const total = userBookings.length;
    const approved = userBookings.filter((b) => b.status === "approved").length;
    const rejected = userBookings.filter((b) => b.status === "rejected").length;
    const pending = userBookings.filter(
      (b) => !b.status || b.status === "pending"
    ).length;

    const pkgCounts = {};
    const growth = {};

    userBookings.forEach((b) => {
      const pkg = b.packageName || "Unknown";
      pkgCounts[pkg] = (pkgCounts[pkg] || 0) + 1;

      const dateLabel =
        rangeType === "weekly"
          ? new Date(b.createdAt).toLocaleDateString("en-GB", {
              weekday: "short",
            })
          : new Date(b.createdAt).getDate();
      growth[dateLabel] = (growth[dateLabel] || 0) + 1;
    });

    return { total, approved, rejected, pending, pkgCounts, growth };
  }, [userBookings, rangeType]);

  // ---------- CHARTS ----------

  const statusData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected],
        backgroundColor: ["#2E7D32", "#F9A825", "#C62828"],
        cutout: "65%",
      },
    ],
  };

  const packageData = {
    labels: Object.keys(stats.pkgCounts),
    datasets: [
      {
        label: "Packages",
        data: Object.values(stats.pkgCounts),
        backgroundColor: ["#1976D2", "#2E7D32", "#F9A825", "#C62828"],
        borderRadius: 6,
      },
    ],
  };

  // ---------- GROWTH DATA (bar + line) ----------
  const growthStats = useMemo(() => {
    const map = {};

    userBookings.forEach((b) => {
      const created = new Date(b.createdAt);
      let label;

      if (growthView === "daily") {
        label = created.toISOString().substring(0, 10);
      } else if (growthView === "weekly") {
        const week = Math.ceil(created.getDate() / 7);
        const month = created.toLocaleString("en-GB", { month: "short" });
        label = `W${week} ${month}`;
      } else if (growthView === "monthly") {
        label = created.toLocaleString("en-GB", {
          month: "short",
          year: "numeric",
        });
      }

      map[label] = (map[label] || 0) + 1;
    });

    const labels = Object.keys(map);
    const dailyCounts = labels.map((lbl) => map[lbl]);
    let cumulative = 0;
    const cumulativeCounts = dailyCounts.map((c) => (cumulative += c));

    return { labels, dailyCounts, cumulativeCounts };
  }, [userBookings, growthView]);

  const growthData = {
    labels: growthStats.labels,
    datasets: [
      {
        type: "bar",
        label: "New Bookings",
        data: growthStats.dailyCounts,
        backgroundColor: "#42A5F5",
        borderRadius: 6,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Cumulative Total",
        data: growthStats.cumulativeCounts,
        borderColor: "#2E7D32",
        backgroundColor: "#A5D6A7",
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: "#2E7D32",
        yAxisID: "y1",
      },
    ],
  };

  const growthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Booking Growth Over Time",
        color: "#1E293B",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Daily Bookings" },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        title: { display: true, text: "Cumulative Total" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: true } },
  };

  // ---------- PDF EXPORT FUNCTION ----------
  async function exportPDF(selectedUser, label, stats, filtered, rangeType) {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    /** ---------------- HEADER SECTION ---------------- **/
    pdf.setFillColor(0, 100, 160); // Teal-blue header bar
    pdf.rect(0, 0, pageWidth, 30, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Peaceful Departures", 14, 18);

    // Contact info (right-aligned)
    pdf.setFontSize(10);
    pdf.text("Email: peacefuldepatures@gmail.com", pageWidth - 90, 12);
    pdf.text("Phone: +94 77 123 4567", pageWidth - 90, 18);

    // Report title
    pdf.setFontSize(13);
    pdf.text("Booking Reports & Analytics", 14, 27);

    /** ---------------- REPORT DETAILS ---------------- **/
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.text(`Report Period: ${label}`, 14, 40);
    pdf.text(`Generated On: ${new Date().toLocaleString("en-GB")}`, 14, 47);
    pdf.text(`User: ${selectedUser}`, 14, 54);
    pdf.line(10, 58, pageWidth - 10, 58);

    /** ---------------- SUMMARY BOXES ---------------- **/
    const boxY = 63;
    const boxH = 18;
    const boxW = (pageWidth - 40) / 4;
    const boxes = [
      { title: "Total", value: stats.total, color: "#1976D2" },
      { title: "Approved", value: stats.approved, color: "#2E7D32" },
      { title: "Pending", value: stats.pending, color: "#F9A825" },
      { title: "Rejected", value: stats.rejected, color: "#C62828" },
    ];

    boxes.forEach((b, i) => {
      const x = 12 + i * (boxW + 5);
      pdf.setFillColor(b.color);
      pdf.roundedRect(x, boxY, boxW, boxH, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text(b.title, x + 5, boxY + 7);
      pdf.text(String(b.value), x + boxW / 2, boxY + 14, { align: "center" });
    });

    /** ---------------- PACKAGE SUMMARY ---------------- **/
    let pkgY = boxY + boxH + 15;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Package Breakdown", 14, pkgY);
    pkgY += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    if (Object.keys(stats.pkgCounts).length === 0) {
      pdf.text("No package data available for this period.", 18, pkgY);
      pkgY += 6;
    } else {
      Object.entries(stats.pkgCounts).forEach(([pkg, count]) => {
        pdf.text(`• ${pkg}: ${count} bookings`, 18, pkgY);
        pkgY += 6;
      });
    }

    /** ---------------- CHART IMAGES (Doughnut, Bars, Growth) ---------------- **/
    const chartContainers = document.querySelectorAll(".chart-wrapper canvas");
    let currentY = pkgY + 10;

    if (chartContainers.length > 0) {
      for (const canvas of chartContainers) {
        const imgData = await html2canvas(canvas, { scale: 2 }).then((c) =>
          c.toDataURL("image/png")
        );
        pdf.addImage(imgData, "PNG", 15, currentY, pageWidth - 30, 80);
        currentY += 85;
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }
      }
    } else {
      pdf.text("⚠️ No charts found to include in this report.", 14, currentY);
    }

    /** ---------------- FOOTER ---------------- **/
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text("Confidential | Peaceful Departures © 2025", 14, 285);

    /** ---------------- SAVE FILE ---------------- **/
    const fileName = `Booking_Report_${selectedUser}_${label.replace(
      /\s+/g,
      "_"
    )}.pdf`;
    pdf.save(fileName);
  }

  // ---------- UI ----------
  return (
    <div className="analytics">
      <div className="filters">
        <label>
          User:&nbsp;
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {allUsers.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>

        <label>
          Range:&nbsp;
          <select
            value={rangeType}
            onChange={(e) => setRangeType(e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label>
          Base Date:&nbsp;
          <input
            type="date"
            value={new Date(baseDate).toISOString().substring(0, 10)}
            onChange={(e) => setBaseDate(new Date(e.target.value))}
          />
        </label>

        <button
          onClick={() =>
            exportPDF(selectedUser, label, stats, filtered, rangeType)
          }
        >
          Export PDF
        </button>
      </div>

      <h4 className="range-label">
        {label} — <span>{selectedUser}</span>
      </h4>

      {/* Summary Cards */}
      <div className="analytics-summary small">
        <div className="summary-card total">
          <h3>{stats.total}</h3>
          <p>Total</p>
        </div>
        <div className="summary-card approved">
          <h3>{stats.approved}</h3>
          <p>Approved</p>
        </div>
        <div className="summary-card pending">
          <h3>{stats.pending}</h3>
          <p>Pending</p>
        </div>
        <div className="summary-card rejected">
          <h3>{stats.rejected}</h3>
          <p>Rejected</p>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="chart-box half">
          <h5>Booking Status</h5>
          <div className="chart-wrapper">
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-box half">
          <h5>Package Distribution</h5>
          <div className="chart-wrapper">
            <Bar data={packageData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-box full">
          <div className="chart-filter-bar">
            <label>
              View:&nbsp;
              <select
                value={growthView}
                onChange={(e) => setGrowthView(e.target.value)}
                className="growth-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
          </div>
          <h5>Booking Growth</h5>
          <div className="chart-wrapper">
            <Bar data={growthData} options={growthOptions} />
          </div>
        </div>
        <div className="chart-box full">
          <h5>Bookings by Hall</h5>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: [
                  "Hall of Tranquility",
                  "Hall of Remembrance",
                  "Hall of Eternity",
                  "Other",
                ],
                datasets: [
                  {
                    label: "Bookings per Hall",
                    data: [
                      userBookings.filter(
                        (b) => b.funeralVenue === "Hall of Tranquility"
                      ).length,
                      userBookings.filter(
                        (b) => b.funeralVenue === "Hall of Remembrance"
                      ).length,
                      userBookings.filter(
                        (b) => b.funeralVenue === "Hall of Eternity"
                      ).length,
                      userBookings.filter((b) => b.funeralVenue === "Other")
                        .length,
                    ],
                    backgroundColor: [
                      "#1976D2",
                      "#2E7D32",
                      "#F9A825",
                      "#C62828",
                    ],
                    borderRadius: 6,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

//HistoryTab
function HistoryTab({ bookings }) {
  /** ---------- EXPORT TO PDF ---------- **/
  const exportToPDF = () => {
    const pdf = new jsPDF("l", "mm", "a4"); // Landscape
    const pageWidth = pdf.internal.pageSize.getWidth();

    /** ---------------- HEADER ---------------- **/
    pdf.setFillColor(0, 100, 160);
    pdf.rect(0, 0, pageWidth, 30, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Peaceful Departures", 14, 18);

    // Contact info
    pdf.setFontSize(10);
    pdf.text("Email: peacefuldepatures@gmail.com", pageWidth - 90, 12);
    pdf.text("Phone: +94 77 123 4567", pageWidth - 90, 18);

    // Report name
    pdf.setFontSize(13);
    pdf.text("Booking History Report", 14, 27);

    /** ---------------- REPORT DETAILS ---------------- **/
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString("en-GB")}`, 14, 38);
    pdf.text(`Total Bookings: ${bookings.length}`, 14, 44);
    pdf.line(10, 48, pageWidth - 10, 48);

    /** ---------------- TABLE ---------------- **/
    const tableData = bookings.map((b, i) => [
      i + 1,
      b.name || "-",
      b.packageName || "-",
      b.funeralVenue === "Other" ? b.otherVenue || "Other" : b.funeralVenue,
      b.status || "pending",
      b.totalPrice?.toLocaleString() || "0",
      b.arrivalDate
        ? new Date(b.arrivalDate).toLocaleDateString("en-GB")
        : "N/A",
      b.departureDate
        ? new Date(b.departureDate).toLocaleDateString("en-GB")
        : "N/A",
      b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-GB") : "N/A",
    ]);

    autoTable(pdf, {
      startY: 52,
      head: [
        [
          "#",
          "Customer",
          "Package",
          "Hall",
          "Status",
          "Total (LKR)",
          "Arrival",
          "Departure",
          "Created",
        ],
      ],
      body: tableData,
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
        lineColor: [220, 220, 220],
        textColor: [33, 33, 33],
      },
      headStyles: {
        fillColor: [0, 100, 160],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 247, 249] },
      margin: { left: 10, right: 10 },
      theme: "grid",
      didDrawPage: () => {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
          "Confidential | Generated by Peaceful Departures System © 2025",
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      },
    });

    /** ---------------- SAVE FILE ---------------- **/
    pdf.save("Booking_History_Report.pdf");
  };

  return (
    <div className="history-tab">
      <div className="history-header">
        <h3>All Booking History</h3>
        <div className="export-buttons">
          <button onClick={exportToPDF} className="pdf-btn">
            Export PDF
          </button>
        </div>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Package</th>
              <th>Hall</th>
              <th>Status</th>
              <th>Total (LKR)</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b, idx) => (
                <tr key={b._id}>
                  <td>{idx + 1}</td>
                  <td>{b.name}</td>
                  <td>{b.packageName}</td>
                  <td>
                    {b.funeralVenue === "Other"
                      ? b.otherVenue || "Other"
                      : b.funeralVenue}
                  </td>
                  <td className={b.status || "pending"}>
                    {b.status || "pending"}
                  </td>
                  <td>{b.totalPrice?.toLocaleString() || "0"}</td>
                  <td>
                    {b.arrivalDate
                      ? new Date(b.arrivalDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    {b.departureDate
                      ? new Date(b.departureDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString("en-GB")
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageBookings;
