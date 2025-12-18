import React, { useEffect, useState, useRef } from "react";
import { FaCreditCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";
import Approvedpage from "./Approvedpage/Approvedpage";
import "./PaymentHome.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function PaymentHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [packageCountData, setPackageCountData] = useState([]);
  const [hallCountData, setHallCountData] = useState([]);
  const [packageRevenueData, setPackageRevenueData] = useState([]);
  const [hallRevenueData, setHallRevenueData] = useState([]);

  const reportRef = useRef();

  // ✅ Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/invoices", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const invoices = res.data.invoices || [];
        setInvoices(invoices);

        const packageCount = {};
        const hallCount = {};
        const packageRevenue = {};
        const hallRevenue = {};

        invoices.forEach((inv) => {
          const totalPrice = parseFloat(inv.totalprice) || 0;

          if (inv.packages) {
            packageCount[inv.packages] = (packageCount[inv.packages] || 0) + 1;
            packageRevenue[inv.packages] =
              (packageRevenue[inv.packages] || 0) + totalPrice;
          }

          if (inv.hallname) {
            hallCount[inv.hallname] = (hallCount[inv.hallname] || 0) + 1;
            hallRevenue[inv.hallname] =
              (hallRevenue[inv.hallname] || 0) + totalPrice;
          }
        });

        const packageOrder = [
          "Serenity Package (Basic)",
          "Grace Package (Standard)",
          "Eternity Package (VIP)",
        ];
        const hallOrder = [
          "Hall of Tranquility",
          "Hall of Remembrance",
          "Hall of Eternity",
        ];

        setPackageCountData(
          packageOrder.map((pkg) => ({
            name: pkg,
            count: packageCount[pkg] || 0,
          }))
        );
        setHallCountData(
          hallOrder.map((hall) => ({
            name: hall,
            count: hallCount[hall] || 0,
          }))
        );

        setPackageRevenueData(
          packageOrder.map((pkg) => ({
            name: pkg,
            revenue: (packageRevenue[pkg] || 0).toFixed(2),
          }))
        );
        setHallRevenueData(
          hallOrder.map((hall) => ({
            name: hall,
            revenue: (hallRevenue[hall] || 0).toFixed(2),
          }))
        );
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, []);

  const renderChart = (data, dataKey, title, fill = "#007bff") => (
    <div style={{ width: "100%", height: 400, marginBottom: 150 }}>
      <h3 style={{ textAlign: "center" }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill={fill} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // ✅ Generate PDF report (charts + facts)
  const handleGenerateReport = async () => {
    const input = reportRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFontSize(18);
    pdf.text("Payment & Service Report", 14, 15);
    pdf.addImage(imgData, "PNG", 10, 25, pdfWidth - 20, pdfHeight - 20);

    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text("Analytical Summary", 14, 20);
    pdf.setFontSize(12);

    const topPackage =
      packageCountData.reduce(
        (max, p) => (p.count > max.count ? p : max),
        packageCountData[0] || { name: "N/A", count: 0 }
      ) || {};
    const topHall =
      hallCountData.reduce(
        (max, h) => (h.count > max.count ? h : max),
        hallCountData[0] || { name: "N/A", count: 0 }
      ) || {};
    const topRevenuePackage =
      packageRevenueData.reduce(
        (max, p) =>
          parseFloat(p.revenue) > parseFloat(max.revenue) ? p : max,
        packageRevenueData[0] || { name: "N/A", revenue: 0 }
      ) || {};
    const topRevenueHall =
      hallRevenueData.reduce(
        (max, h) =>
          parseFloat(h.revenue) > parseFloat(max.revenue) ? h : max,
        hallRevenueData[0] || { name: "N/A", revenue: 0 }
      ) || {};

    const summaryText = `
The report provides a comprehensive overview of payment and service trends.

1️⃣ Most Popular Package: "${topPackage.name}" was selected ${topPackage.count} times, 
indicating its strong preference among clients.

2️⃣ Most Popular Hall: "${topHall.name}" hosted ${topHall.count} events, 
making it the most frequently booked hall.

3️⃣ Highest Revenue Package: "${topRevenuePackage.name}" generated the highest revenue, totaling Rs. ${topRevenuePackage.revenue}.

4️⃣ Highest Revenue Hall: "${topRevenueHall.name}" brought in the most income with Rs. ${topRevenueHall.revenue}.

These insights highlight customer preferences and revenue performance, which can help guide future pricing and package strategy decisions.
    `;

    const splitText = pdf.splitTextToSize(
      summaryText,
      pdf.internal.pageSize.getWidth() - 20
    );
    pdf.text(splitText, 14, 35);
    pdf.save("Payment_Service_Report.pdf");
  };

  return (
    <div className="paymenthome-admin-dashboard">
      <AdminHeader />
      <div className="paymenthome-admin-body">
        <AdminSidebar />
        <div className="paymenthome-fullpage">
          <h2 className="paymenthome-title">Payments Management</h2>

          <div className="paymenthome-actions">
            <button
              className="paymenthome-btn"
              onClick={() => setActiveTab("payments")}
            >
              Payments
            </button>
            <button
              className="paymenthome-btn"
              onClick={() => setActiveTab("invoices")}
            >
              View Invoices
            </button>
            <button
              className="paymenthome-btn"
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
            <button
              className="paymenthome-btn"
              onClick={() => setActiveTab("reports")}
            >
              Generate Reports
            </button>
          </div>

          {/* ---- Payments ---- */}
          {activeTab === "payments" && (
            <div>
              {selectedInvoice ? (
                <div className="paymenthome-approved-view">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="paymenthome-backbtn"
                  >
                    ← Back to all payments
                  </button>
                  <Approvedpage invoiceData={selectedInvoice} />
                </div>
              ) : invoices.length === 0 ? (
                <p>No invoices found.</p>
              ) : (
                <div className="paymenthome-list">
                  {invoices.map((inv) => (
                    <div
                      key={inv._id}
                      className="paymenthome-card"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <FaCreditCard className="paymenthome-icon" size={30} />
                      <h3>{inv.name}</h3>
                      <p>Check {inv.name}'s payment details</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- All Invoices ---- */}
          {activeTab === "invoices" && (
            <div>
              <h1>All Invoices</h1>
              {invoices.length === 0 ? (
                <p>No invoices found.</p>
              ) : (
                invoices.map((inv) => (
                  <div className="paymenthome-allinvoice" key={inv._id}>
                    <div
                      className="paymenthome-card"
                      onClick={() =>
                        navigate(`/Displayinvoice/${inv._id}`, {
                          state: { invoiceId: inv._id },
                        })
                      }
                    >
                      <FaCreditCard className="paymenthome-icon" size={30} />
                      <h3>{inv.name}</h3>
                      <p>Check {inv.name}'s payment invoices</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ---- History ---- */}
          {activeTab === "history" && (
            <div>
              <h2 className="paymenthome-history-title">Payment History</h2>
              <table className="paymenthome-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Client Name</th>
                    <th>Address</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Package</th>
                    <th>Additional Services</th>
                    <th>Hall Name</th>
                    <th>Package Price</th>
                    <th>Additional Services Price</th>
                    <th>Hall Price</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="13">No invoices found</td>
                    </tr>
                  ) : (
                    invoices.map((inv, index) => (
                      <tr key={inv._id}>
                        <td>{index + 1}</td>
                        <td>{inv.name}</td>
                        <td>{inv.address}</td>
                        <td>{inv.phonenumber}</td>
                        <td>{inv.email}</td>
                        <td>{inv.packages}</td>
                        <td>{inv.additionalservices?.join(", ")}</td>
                        <td>{inv.hallname}</td>
                        <td>{inv.packageprice}</td>
                        <td>{inv.additionalservicestotalprice}</td>
                        <td>{inv.hallprice}</td>
                        <td>{inv.payment}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- Reports ---- */}
          {activeTab === "reports" && (
            <div className="paymenthome-reportgraphs" ref={reportRef}>
              <h1>Payment & Service Reports</h1>
              {packageCountData.length > 0 &&
                renderChart(packageCountData, "count", "Most Purchased Packages")}
              {hallCountData.length > 0 &&
                renderChart(hallCountData, "count", "Most Purchased Halls")}
              {packageRevenueData.length > 0 &&
                renderChart(packageRevenueData, "revenue", "Revenue per Package", "#28a745")}
              {hallRevenueData.length > 0 &&
                renderChart(hallRevenueData, "revenue", "Revenue per Hall", "#dc3545")}
              <div className="paymenthome-reportbtn-container">
                <button onClick={handleGenerateReport} className="paymenthome-reportbtn">
                  Generate a report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentHome;
