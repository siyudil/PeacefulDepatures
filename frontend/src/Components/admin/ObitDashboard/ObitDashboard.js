import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../AdminSidebar";
import AdminHeader from "../AdminHeader";
import "./ObitDashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function ObitDashboard() {
  const [obituaries, setObituaries] = useState([]);
  const [topViewed, setTopViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("table");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentActions, setRecentActions] = useState([]);
  const [condolencesMap, setCondolencesMap] = useState({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([fetchObituaries(), fetchTopViewed()]);
      } catch (e) {
        // error is set inside fetch functions
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchObituaries = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/obituaries");
      setObituaries(res.data);

      const counts = {
        total: res.data.length,
        pending: res.data.filter((o) => o.status === "pending").length,
        approved: res.data.filter((o) => o.status === "approved").length,
        rejected: res.data.filter((o) => o.status === "rejected").length,
      };
      setStats(counts);

      const condolencesData = {};
      await Promise.all(
        res.data.map(async (o) => {
          try {
            const cRes = await axios.get(
              `http://localhost:5000/condolences/${o._id}`
            );
            condolencesData[o._id] = cRes.data.data;
          } catch (e) {
            console.error(`Error fetching condolences for ${o.name}:`, e);
            condolencesData[o._id] = [];
          }
        })
      );
      setCondolencesMap(condolencesData);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to load obituaries. Ensure backend is running on http://localhost:5000 and CORS allows your frontend origin."
      );
    }
  };

  const fetchTopViewed = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/admin/obituaries/top-viewed"
      );
      setTopViewed(res.data);
    } catch (err) {
      console.error("Error fetching top viewed obituaries:", err);
      if (err?.response?.status === 404) {
        setTopViewed([]);
        return;
      }
      // Do not set global error for this; allow charts to render empty
    }
  };

  const logAction = (type, name) => {
    const entry = {
      id: Date.now(),
      action: type,
      name,
      time: new Date().toLocaleString(),
    };
    setRecentActions((prev) => [entry, ...prev.slice(0, 4)]);
  };

  const handleApprove = async (id, name) => {
    await axios.put(`http://localhost:5000/admin/obituaries/${id}/approve`);
    setObituaries((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status: "approved" } : o))
    );
    logAction("Approved", name);
    fetchObituaries();
  };

  const handleReject = async (id, name) => {
    await axios.put(`http://localhost:5000/admin/obituaries/${id}/reject`);
    setObituaries((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status: "rejected" } : o))
    );
    logAction("Rejected", name);
    fetchObituaries();
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the obituary for "${name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`http://localhost:5000/admin/obituaries/${id}`);
      setObituaries((prev) => prev.filter((o) => o._id !== id));
      logAction("Deleted", name);
      alert(`✅ Obituary for "${name}" has been deleted successfully.`);
      fetchObituaries();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete obituary. Please try again.");
    }
  };

  const handleDeleteCondolence = async (obitId, cId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this condolence by "${name}"?`
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`http://localhost:5000/admin/condolences/${cId}`);
      setCondolencesMap((prev) => ({
        ...prev,
        [obitId]: prev[obitId].filter((c) => c._id !== cId),
      }));
      logAction("Deleted Condolence", name);
      alert(`✅ Condolence by "${name}" deleted successfully.`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete condolence. Please try again.");
    }
  };

  const filteredObituaries = obituaries.filter((o) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesName =
      query === "" || (o.name && o.name.toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesName && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: { color: "#b38600", bg: "#fff3cd" },
      approved: { color: "#155724", bg: "#d4edda" },
      rejected: { color: "#721c24", bg: "#f8d7da" },
      default: { color: "#000", bg: "#eee" },
    };
    const { color, bg } = styles[status] || styles.default;
    return (
      <span
        style={{
          backgroundColor: bg,
          color,
          padding: "5px 10px",
          borderRadius: "15px",
          fontWeight: "bold",
          textTransform: "capitalize",
        }}
      >
        {status}
      </span>
    );
  };

  const downloadReportPDF = () => {
    try {
      if (!Array.isArray(filteredObituaries) || filteredObituaries.length === 0) {
        alert("No rows to include in the report. Adjust filters and try again.");
        return;
      }
      const doc = new jsPDF({ orientation: "portrait", unit: "pt" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const headerH = 90;

      // Header background
      doc.setFillColor(16, 77, 125); // deep blue
      doc.rect(0, 0, pageWidth, headerH, "F");

      // Header text (white)
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.setFontSize(20);
      doc.text("Peaceful Departures", 40, 32);
      doc.setFont(undefined, "normal");
      doc.setFontSize(12);
      doc.text("Obituaries Report & Analytics", 40, 52);

      const generated = new Date().toLocaleString();
      doc.setFontSize(11);
      doc.text("Email: peacfuldepartures@gmail.com", pageWidth - 40, 26, { align: "right" });
      doc.text("Phone: +94 77 123 4567", pageWidth - 40, 44, { align: "right" });
      doc.text(`Generated on: ${generated}`, pageWidth - 40, 62, { align: "right" });

      // Reset for body content
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");

      const tableBody = filteredObituaries.map((o) => [
        o?.name ?? "",
        (o?.status ?? "").toUpperCase(),
        typeof o?.views === "number" ? o.views : 0,
        (condolencesMap[o._id] || []).length,
      ]);

      autoTable(doc, {
        startY: headerH + 20,
        margin: { left: 40, right: 40 },
        theme: 'grid',
        head: [["Name", "Status", "Views", "Condolences"]],
        body: tableBody,
        styles: {
          fontSize: 10,
          cellPadding: 6,
          lineColor: [220, 223, 227],
          lineWidth: 0.5,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 248, 252],
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center' },
          2: { halign: 'right', cellWidth: 70 },
          3: { halign: 'right', cellWidth: 100 },
        },
        didDrawPage: (data) => {
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageNumber = `${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(`Page ${pageNumber}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
        },
      });

      doc.save("obituaries_report.pdf");
    } catch (e) {
      alert("Failed to generate PDF report.");
    }
  };

  const pieData = [
    { name: "Pending", value: stats.pending },
    { name: "Approved", value: stats.approved },
    { name: "Rejected", value: stats.rejected },
  ];

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          {loading && <div style={{ padding: "12px" }}>Loading dashboard...</div>}
          {!loading && error && (
            <div style={{ padding: "12px", color: "#b00020" }}>{error}</div>
          )}
          {/* ✅ Tab container fixed */}
          <div className="tab-container">
            <button
              className={`tab-button ${activeTab === "table" ? "active" : ""}`}
              onClick={() => setActiveTab("table")}
            >
              🕊 Manage Obituaries
            </button>
            <button
              className={`tab-button ${
                activeTab === "condolences" ? "active" : ""
              }`}
              onClick={() => setActiveTab("condolences")}
            >
              💌 Manage Condolences
            </button>
            <button
              className={`tab-button ${activeTab === "chart" ? "active" : ""}`}
              onClick={() => setActiveTab("chart")}
            >
              📊 Obituary Analytics
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card total">
              <h3>Total</h3>
              <p>{stats.total}</p>
            </div>
            <div className="stat-card pending">
              <h3>Pending</h3>
              <p>{stats.pending}</p>
            </div>
            <div className="stat-card approved">
              <h3>Approved</h3>
              <p>{stats.approved}</p>
            </div>
            <div className="stat-card rejected">
              <h3>Rejected</h3>
              <p>{stats.rejected}</p>
            </div>
          </div>
          {/* Manage Obituaries Tab */}
          {activeTab === "table" && (
            <div className="tab-content">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "8px", width: "250px" }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: "8px" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <h2>Obituaries Management</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                    <th>Condolences</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredObituaries.map((o) => (
                    <tr key={o._id}>
                      <td>{o.name}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <button onClick={() => handleApprove(o._id, o.name)}>
                          Approve
                        </button>
                        <button onClick={() => handleReject(o._id, o.name)}>
                          Reject
                        </button>
                        <button onClick={() => handleDelete(o._id, o.name)}>
                          Delete
                        </button>
                      </td>
                      <td>
                        {condolencesMap[o._id] &&
                        condolencesMap[o._id].length > 0 ? (
                          <span>
                            {condolencesMap[o._id].length} condolences
                          </span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredObituaries.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        No obituaries match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ marginTop: "16px" }}>
                <button
                  onClick={downloadReportPDF}
                  style={{
                    backgroundColor: "#1f2937",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Download Report (PDF)
                </button>
              </div>
            </div>
          )}

          {/* Manage Condolences Tab */}
          {activeTab === "condolences" && (
            <div className="tab-content">
              <h2>💌 Condolences Management</h2>
              <table>
                <thead>
                  <tr>
                    <th>Obituary Name</th>
                    <th>Message</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {obituaries.map((o) =>
                    (condolencesMap[o._id] || []).map((c) => (
                      <tr key={c._id}>
                        <td>{o.name}</td>
                        <td>
                          <p>{c.message}</p>
                          <div className="condolence-media">
                            {c.media.map((file, idx) =>
                              file.match(/\.(mp4|webm)$/) ? (
                                <video
                                  key={idx}
                                  controls
                                  width="100"
                                  src={`http://localhost:5000/uploads/${file}`}
                                />
                              ) : (
                                <img
                                  key={idx}
                                  width="100"
                                  src={`http://localhost:5000/uploads/${file}`}
                                  alt="condolence media"
                                />
                              )
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              const confirmDelete = window.confirm(
                                `Are you sure you want to delete this condolence for "${o.name}"?`
                              );
                              if (confirmDelete) {
                                handleDeleteCondolence(o._id, c._id, c.name);
                              }
                            }}
                            style={{
                              backgroundColor: "#e63946",
                              color: "#fff",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {Object.keys(condolencesMap).length === 0 && (
                    <tr>
                      <td colSpan={3}>No condolences yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "chart" && (
            <div className="tab-content">
              <h2>🌟 Top Viewed & Status Analytics</h2>
              <div className="graph-container">
                <div className="graph-item">
                  <h3>Top 5 Most Viewed</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={topViewed}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#1e5835ff">
                        {topViewed.map((entry, index) => {
                          const colors = [
                            "#FF6384",
                            "#36A2EB",
                            "#FFCE56",
                            "#4BC0C0",
                            "#9966FF",
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="graph-item">
                  <h3>Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                      >
                        <Cell fill="#FFCE56" />
                        <Cell fill="#4BC0C0" />
                        <Cell fill="#FF6384" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ObitDashboard;
