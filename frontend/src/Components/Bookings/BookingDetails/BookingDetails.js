import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./BookingDetails.css";

function BookingDetails({ booking, onDelete }) {
  const {
    _id,
    name,
    relationship,
    address,
    phone,
    email,
    deceasedName,
    dob,
    dod,
    gender,
    religion,
    funeralVenue,
    otherVenue,
    funeralType,
    cemetery,
    noOfDays,
    arrivalDate,
    departureDate,
    departureTime,
    requests,
    packageName,
    packagePrice,
    selectedServices,
    hallPrice,
    totalPrice,
    user,
    status,
  } = booking;

  const loggedInUserId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  const canEdit = role === "admin" || user === loggedInUserId;

  // Determine if an approved invoice already exists for this booking's customer
  const [invoiceApproved, setInvoiceApproved] = React.useState(false);
  const [checkingInvoice, setCheckingInvoice] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function checkInvoices() {
      try {
        setCheckingInvoice(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/invoices", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const invoices = res.data?.invoices || [];
        const forThisCustomer = invoices.filter(
          (inv) => inv?.email === email && inv?.name === name
        );
        const isApproved = forThisCustomer.some(
          (inv) => inv?.approved === true ||
                   inv?.status === "approved" ||
                   inv?.state === "approved" ||
                   inv?.payment === "Approved"
        );
        if (mounted) setInvoiceApproved(isApproved);
      } catch (e) {
        if (mounted) setInvoiceApproved(false);
      } finally {
        if (mounted) setCheckingInvoice(false);
      }
    }
    checkInvoices();
    return () => { mounted = false; };
  }, [email, name]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this booking?\n\nThis action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`http://localhost:5000/bookings/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message || "Booking deleted successfully!");
      if (onDelete) onDelete(_id);
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert(err.response?.data?.message || "Failed to delete booking");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime())
      ? dateValue
      : parsedDate.toISOString().substring(0, 10);
  };

  return (
    <div className="booking-card">
      {/* ====== Header with Status Badge ====== */}
      <div className="booking-header">
        <h3>Booking ID: {_id}</h3>
        <span className={`status-badge ${status || "pending"}`}>
          {status?.toUpperCase() || "PENDING"}
        </span>
      </div>

      {/* Personal Info */}
      <div className="booking-section">
        <h4>Personal Info</h4>
        <div className="booking-grid">
          <p>
            <strong>Name:</strong> {name}
          </p>
          <p>
            <strong>Relationship:</strong> {relationship}
          </p>
          <p>
            <strong>Address:</strong> {address}
          </p>
          <p>
            <strong>Phone:</strong> {phone}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
        </div>
      </div>

      {/* Deceased Info */}
      <div className="booking-section">
        <h4>Deceased Info</h4>
        <div className="booking-grid">
          <p>
            <strong>Deceased Name:</strong> {deceasedName}
          </p>
          <p>
            <strong>Date of Birth:</strong> {formatDate(dob)}
          </p>
          <p>
            <strong>Date of Death:</strong> {formatDate(dod)}
          </p>
          <p>
            <strong>Gender:</strong> {gender}
          </p>
          <p>
            <strong>Religion:</strong> {religion}
          </p>
        </div>
      </div>

      {/* Funeral Info */}
      <div className="booking-section">
        <h4>Funeral Info</h4>
        <div className="booking-grid">
          <p>
            <strong>Venue:</strong>{" "}
            {funeralVenue === "Other" ? otherVenue : funeralVenue}
          </p>
          <p>
            <strong>Type:</strong> {funeralType}
          </p>
          <p>
            <strong>Cemetery:</strong> {cemetery}
          </p>
          <p>
            <strong>No. of Days:</strong> {noOfDays}
          </p>
          <p>
            <strong>Arrival Date:</strong> {formatDate(arrivalDate)}
          </p>
          <p>
            <strong>Departure Date:</strong> {formatDate(departureDate)}
          </p>
          <p>
            <strong>Departure Time:</strong> {departureTime}
          </p>
          <p>
            <strong>Special Requests:</strong> {requests}
          </p>
        </div>
      </div>

      {/* Package & Services */}
      <div className="booking-section">
        <h4>Package & Services</h4>
        <div className="booking-grid">
          <p>
            <strong>Package:</strong> {packageName}
          </p>
          <p>
            <strong>Package Price:</strong> LKR {packagePrice?.toLocaleString()}
          </p>
          <p>
            <strong>Additional Services:</strong>{" "}
            {selectedServices?.length > 0
              ? selectedServices.join(", ")
              : booking.additionalServices?.length > 0
              ? booking.additionalServices.join(", ")
              : "None"}
          </p>
          <p>
            <strong>Hall Price:</strong> LKR {hallPrice?.toLocaleString()}
          </p>
          <p>
            <strong>Total Price:</strong>{" "}
            <b>LKR {totalPrice?.toLocaleString()}</b>
          </p>
        </div>
      </div>

      {/* ====== Actions ====== */}
      <div className="booking-actions">
        {/* 🚫 Admin cannot delete (just show disabled button) */}
        {role === "admin" && (
          <button
            onClick={() =>
              alert("Admins cannot delete bookings. Use Reject instead.")
            }
            className="disabled-btn"
          >
            Delete Disabled for Admin
          </button>
        )}

        {/* 🟢 Customer - Pending: can Update + Delete */}
        {role === "customer" && status === "pending" && (
          <>
            <Link to={`/updatebooking/${_id}`} className="update-btn">
              Update
            </Link>
            <button onClick={handleDelete} className="delete-btn">
              Delete
            </button>
          </>
        )}

        {/* 🟢 Customer - Approved: show actions until invoice is approved */}
        {role === "customer" && status === "approved" && !invoiceApproved && (
          <>
            <Link
              to="/Addinvoice"
              state={{
                bookingData: {
                  name,
                  address,
                  phonenumber: phone,
                  email,
                  packages: packageName,
                  packageprice: packagePrice,
                  additionalservices:
                    selectedServices || booking.additionalServices || [],
                  additionalservicestotalprice:
                    (booking.additionalServiceTotal || 0) +
                    (booking.selectedServiceTotal || 0),
                  hallname:
                    funeralVenue === "Other" ? otherVenue : funeralVenue,
                  hallprice: hallPrice,
                  totalprice: totalPrice,
                },
              }}
              className="payment-btn"
            >
              Proceed to Payment
            </Link>
            <button onClick={handleDelete} className="delete-btn">
              Delete
            </button>
          </>
        )}

        {/* 🔴 Customer - Rejected: show message + book again */}
        {role === "customer" && status === "rejected" && (
          <>
            <p className="rejected-msg">❌ Booking Rejected by Admin</p>
            <Link to="/addbooking" className="book-again-btn">
              Book Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default BookingDetails;
