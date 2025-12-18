import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminHeader from "../../admin/AdminHeader";
import AdminSidebar from "../../admin/AdminSidebar";
import "./BookingDetailsAdmin.css";

function BookingDetailsAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooking(res.data.booking);
      } catch (err) {
        console.error("Error fetching booking:", err);
      }
    };
    fetchBooking();
  }, [id]);

  const handleApprove = async () => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/bookings/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Booking approved");
    navigate("/managebookings");
  };

  const handleReject = async () => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/bookings/${id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Booking rejected and removed");
    navigate("/admin/bookings");
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/bookings/${id}/report`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Booking_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download report");
    }
  };

  if (!booking) return <p>Loading...</p>;

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Booking Details</h2>

          {/* Personal Info */}
          <div className="details-card">
            <h3>Personal Info</h3>
            <div className="details-grid">
              <p><b>Name:</b> {booking.name}</p>
              <p><b>Relationship:</b> {booking.relationship}</p>
              <p><b>Address:</b> {booking.address}</p>
              <p><b>Phone:</b> {booking.phone}</p>
              <p><b>Email:</b> {booking.email}</p>
            </div>
          </div>

          {/* Deceased Info */}
          <div className="details-card">
            <h3>Deceased Info</h3>
            <div className="details-grid">
              <p><b>Deceased Name:</b> {booking.deceasedName}</p>
              <p><b>Date of Birth:</b> {new Date(booking.dob).toLocaleDateString()}</p>
              <p><b>Date of Death:</b> {new Date(booking.dod).toLocaleDateString()}</p>
              <p><b>Gender:</b> {booking.gender}</p>
              <p><b>Religion:</b> {booking.religion}</p>
            </div>
          </div>

          {/* Funeral Info */}
          <div className="details-card">
            <h3>Funeral Info</h3>
            <div className="details-grid">
              <p><b>Type:</b> {booking.funeralType}</p>
              <p><b>Venue:</b> {booking.funeralVenue}</p>
              {booking.otherVenue && <p><b>Other Venue:</b> {booking.otherVenue}</p>}
              <p><b>No. of Days:</b> {booking.noOfDays}</p>
              <p><b>Cemetery:</b> {booking.cemetery}</p>
              <p><b>Arrival Date:</b> {new Date(booking.arrivalDate).toLocaleDateString()}</p>
              <p><b>Departure Date:</b> {new Date(booking.departureDate).toLocaleDateString()}</p>
              <p><b>Departure Time:</b> {booking.departureTime}</p>
              {booking.requests && <p><b>Special Requests:</b> {booking.requests}</p>}
            </div>
          </div>

          {/* Package & Services */}
          <div className="details-card">
            <h3>Package & Services</h3>
            <div className="details-grid">
              <p><b>Package:</b> {booking.packageName}</p>
              <p><b>Package Price:</b> LKR {booking.packagePrice}</p>
              <p><b>Hall Price:</b> LKR {booking.hallPrice}</p>
              <p>
                <b>Additional Services:</b>{" "}
                {booking.selectedServices?.length > 0
                  ? booking.selectedServices.join(", ")
                  : "None"}
              </p>
              <p><b>Total Price:</b> LKR {booking.totalPrice}</p>
            </div>
          </div>

          {/* Status */}
          <div className="details-card">
            <h3>Status</h3>
            <p><b>Status:</b> {booking.status || "pending"}</p>
          </div>

          {/* Action Buttons */}
          <div className="actions">
            {booking.status === "pending" && (
              <>
                <button className="approve-btn" onClick={handleApprove}>
                  Approve
                </button>
                <button className="reject-btn" onClick={handleReject}>
                  Reject
                </button>
              </>
            )}
            <button className="download-btn" onClick={handleDownloadPDF}>
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsAdmin;
