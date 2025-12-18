const express = require("express");
const router = express.Router();
const BookingController = require("../Controllers/BookingControllers");
const verifyToken = require("../Middleware/AuthMiddleware");

/* -------------------- 🔍 Search -------------------- */
router.get("/search", verifyToken(), BookingController.searchBookings);

/* -------------------- ✅ Availability Check -------------------- */
// Allow both customer & admin to check
router.post("/check-availability", verifyToken(["admin", "customer"]), BookingController.checkAvailability);

/* -------------------- 🛠️ Admin Controls -------------------- */
// Approve / Reject bookings (admin only)
router.put("/:id/approve", verifyToken(["admin"]), BookingController.approveBooking);
router.put("/:id/reject", verifyToken(["admin"]), BookingController.rejectBooking);

/* -------------------- 🧾 CRUD Operations -------------------- */
// Get all bookings (admin sees all, customer sees own)
router.get("/", verifyToken(["admin", "customer"]), BookingController.getAllBookings);

// Create new booking (customer only)
router.post("/", verifyToken(["customer"]), BookingController.addBookings);

// Get a specific booking by ID (admin or owner)
router.get("/:id", verifyToken(["admin", "customer"]), BookingController.getById);

// Update booking (only owner, unless admin)
router.put("/:id", verifyToken(["customer"]), BookingController.updateBooking);

// Delete booking (admin or owner)
router.delete("/:id", verifyToken(["admin", "customer"]), BookingController.deleteBooking);

/* -------------------- 📄 PDF Report -------------------- */
router.get("/:id/report", verifyToken(["admin", "customer"]), BookingController.generateBookingReport);

module.exports = router;
