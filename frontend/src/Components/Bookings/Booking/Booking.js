import React, { useState, useEffect } from "react";
import Nav from "../../Nav/Nav";
import axios from "axios";
import BookingDetails from "../BookingDetails/BookingDetails";
import "../BookingDetails/BookingDetails.css";

function Booking() {
  const [bookings, setBookings] = useState([]);


const fetchHandler = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBookings(res.data.bookings.reverse());
  } catch (err) {
    console.error("Error fetching bookings:", err);
  }
};

  useEffect(() => {
    fetchHandler();
  }, []);

  // remove deleted booking from state
  const handleDeleteBooking = (id) => {
    setBookings((prev) => prev.filter((b) => b._id !== id));
  };

  return (
  <div>
    <Nav />
    <div className="booking-page">
      <div className="booking-list">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <BookingDetails
              key={booking._id}
              booking={booking}
              onDelete={handleDeleteBooking}
            />
          ))
        ) : (
          <p style={{ textAlign: "center", width: "100%" }}>
            No bookings found.
          </p>
        )}
      </div>
    </div>
  </div>
);
}

export default Booking;
