const Booking = require("../Model/BookingModel");
const Notification = require("../Model/NotificationModel");
const PDFDocument = require("pdfkit");

// --- Utility Functions ---
const calculateTotals = (booking) => {
  const packagePrice = booking.packagePrice || 0;
  const servicesTotal = booking.servicesTotal || 0;
  const hallPrice = booking.hallPrice || 0;
  const totalPrice = packagePrice + servicesTotal + hallPrice;
  return { packagePrice, servicesTotal, hallPrice, totalPrice };
};

const validateServices = (selectedServices) =>
  !(selectedServices && selectedServices.length > 3);

const validateNoOfDays = (funeralVenue, noOfDays) => {
  if (!noOfDays || noOfDays < 1) return false;
  if (funeralVenue && funeralVenue !== "Other" && noOfDays > 7) return false;
  return true;
};

const validateBookingData = (data) => {
  const errors = [];

  // Regex
  const letterRegex = /^[A-Za-z\s]+$/;
  const addressRegex = /^[A-Za-z0-9\s,.'\-/#]*$/;
  const phoneRegex = /^0\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Required checks
  if (!data.name || !letterRegex.test(data.name))
    errors.push("Name is required and must contain only letters");
  if (!data.relationship || !letterRegex.test(data.relationship))
    errors.push("Relationship is required and must contain only letters");
  if (!data.address || !addressRegex.test(data.address))
    errors.push("Valid address is required");
  if (!data.phone || !phoneRegex.test(data.phone))
    errors.push("Phone must be 10 digits and start with 0");
  if (!data.email || !emailRegex.test(data.email))
    errors.push("Valid email is required");
  if (!data.deceasedName || !letterRegex.test(data.deceasedName))
    errors.push("Deceased name is required and must contain only letters");
  if (!data.religion || !letterRegex.test(data.religion))
    errors.push("Religion is required and must contain only letters");

  // Date validations
  const today = new Date();
  const dob = data.dob ? new Date(data.dob) : null;
  const dod = data.dod ? new Date(data.dod) : null;
  const arrival = data.arrivalDate ? new Date(data.arrivalDate) : null;
  const departure = data.departureDate ? new Date(data.departureDate) : null;

  if (dob && dob > today) errors.push("Date of birth cannot be in the future");
  if (dod && dod > today) errors.push("Date of death cannot be in the future");
  if (dob && dod && dob >= dod)
    errors.push("Date of death must be after date of birth");
  if (arrival && arrival > today) errors.push("Arrival date cannot be in the future");
  if (departure && departure > today) errors.push("Departure date cannot be in the future");
  if (dod && arrival && arrival < dod)
    errors.push("Arrival date must be on/after date of death");
  if (arrival && departure && departure < arrival)
    errors.push("Departure date must be on/after arrival date");

  return errors;
};

// Add booking
const addBookings = async (req, res) => {
  try {
    if (!validateServices(req.body.selectedServices)) {
      return res
        .status(400)
        .json({ message: "Maximum 3 additional services allowed" });
    }
    if (!validateNoOfDays(req.body.funeralVenue, req.body.noOfDays)) {
      return res
        .status(400)
        .json({ message: "Invalid number of days for selected funeral venue" });
    }

    const body = {
      ...req.body,
      user: req.user.id,
      dob: req.body.dob ? new Date(req.body.dob) : null,
      dod: req.body.dod ? new Date(req.body.dod) : null,
      arrivalDate: req.body.arrivalDate ? new Date(req.body.arrivalDate) : null,
      departureDate: req.body.departureDate
        ? new Date(req.body.departureDate)
        : null,
      status: "pending",
    };

    const { packagePrice, servicesTotal, hallPrice, totalPrice } =
      calculateTotals(body);
    body.packagePrice = packagePrice;
    body.servicesTotal = servicesTotal;
    body.hallPrice = hallPrice;
    body.totalPrice = totalPrice;

    const booking = new Booking(body);
    await booking.save();

    return res.status(201).json({ booking });
  } catch (err) {
    console.error("🔥 Error adding booking:", err.message);
    return res
      .status(500)
      .json({ message: "Unable to add booking", error: err.message });
  }
};

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }
    let bookings = await Booking.find(query);

    bookings = bookings.map((b) => ({
      ...b.toObject(),
      ...calculateTotals(b),
    }));

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get booking by ID
const getById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this booking" });
    }
    return res.status(200).json({ booking });
  } catch (err) {
    console.error("Error fetching booking:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this booking" });
    }
    if (booking.status === "approved") {
      return res
        .status(400)
        .json({ message: "Approved bookings cannot be updated" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json({ booking: updatedBooking });
  } catch (err) {
    console.error("Error updating booking:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingUserId = booking.user?.toString();
    const requesterId = req.user?.id?.toString();
    const isAdmin = req.user?.role === "admin";

    // 🚫 Admins cannot delete bookings
    if (isAdmin) {
      return res
        .status(403)
        .json({ message: "Admins cannot delete bookings. Use reject instead." });
    }

    // ❌ Customer can delete only their own booking
    if (bookingUserId !== requesterId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own bookings." });
    }

    // ✅ Customer deletion allowed (approved or not)
    await Booking.deleteOne({ _id: booking._id });
    console.log("🗑️ Booking deleted by customer:", booking._id);

    return res
      .status(200)
      .json({ message: "Booking deleted successfully." });
  } catch (err) {
    console.error("🔥 Error deleting booking:", err);
    return res
      .status(500)
      .json({ message: "Server error while deleting booking." });
  }
};

// Approve booking
// Approve booking
const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "approved";
    await booking.save();

    // 🔔 Create notification for customer
    await Notification.create({
      userId: booking.user,
      category: "Booking",
      title: "Booking Approved ✅",
      message: `Your booking (${booking._id}) has been approved. Please proceed to payment.`,
      relatedId: booking._id,
    });

    res.json({ msg: "Booking approved and notification sent", booking });
  } catch (err) {
    console.error("Error approving booking:", err);
    res.status(500).json({ msg: "Server error while approving booking" });
  }
};

// Reject booking
// Reject booking
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "rejected";
    await booking.save();

    // 🔔 Create notification for customer
    await Notification.create({
      userId: booking.user,
      category: "Booking",
      title: "Booking Rejected ❌",
      message: `Your booking (${booking._id}) was rejected by admin. Please contact support or book again.`,
      relatedId: booking._id,
    });

    // Optionally remove the booking after notification
    await booking.deleteOne();

    res.json({ msg: "Booking rejected, removed, and notification sent" });
  } catch (err) {
    console.error("Error rejecting booking:", err);
    res.status(500).json({ msg: "Server error while rejecting booking" });
  }
};

// Search bookings by name, email, deceasedName, or packageName
const searchBookings = async (req, res) => {
  try {
    const { q } = req.query; // ?q=keyword

    let query = {};
    if (q) {
      query = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { deceasedName: { $regex: q, $options: "i" } },
          { packageName: { $regex: q, $options: "i" } },
        ],
      };
    }

    // Only show own bookings if not admin
    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }

    const bookings = await Booking.find(query);

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Generate PDF Report
const generateBookingReport = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=booking-${booking._id}.pdf`
    );

    doc.pipe(res);

    // --- Header ---
    doc
      .fontSize(22)
      .fillColor("#2c3e50")
      .text("Peaceful Departures", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(16)
      .fillColor("#34495e")
      .text("Funeral Booking Report", { align: "center" })
      .moveDown(1);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // --- Booking Info ---
    doc.moveDown();
    doc.fontSize(12).fillColor("black").text(`Booking ID: ${booking._id}`);
    doc.text(`Status: ${booking.status || "Pending"}`);
    doc.moveDown(1);

    // --- Personal Info ---
    doc.fontSize(14).fillColor("#2c3e50").text("Personal Information", {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("black");
    doc.text(`Name: ${booking.name}`);
    doc.text(`Relationship: ${booking.relationship}`);
    doc.text(`Address: ${booking.address}`);
    doc.text(`Phone: ${booking.phone}`);
    doc.text(`Email: ${booking.email}`);
    doc.moveDown(1);

    // --- Deceased Info ---
    doc.fontSize(14).fillColor("#2c3e50").text("Deceased Information", {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("black");
    doc.text(`Full Name: ${booking.deceasedName}`);
    doc.text(`DOB: ${booking.dob?.toISOString().split("T")[0]}`);
    doc.text(`DOD: ${booking.dod?.toISOString().split("T")[0]}`);
    doc.text(`Gender: ${booking.gender}`);
    doc.text(`Religion: ${booking.religion}`);
    doc.moveDown(1);

    // --- Funeral Info ---
    doc.fontSize(14).fillColor("#2c3e50").text("Funeral Details", {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("black");
    doc.text(
      `Venue: ${
        booking.funeralVenue === "Other"
          ? booking.otherVenue
          : booking.funeralVenue
      }`
    );
    doc.text(`Cemetery: ${booking.cemetery}`);
    doc.text(
      `Arrival Date: ${booking.arrivalDate?.toISOString().split("T")[0]}`
    );
    doc.text(
      `Departure Date: ${booking.departureDate?.toISOString().split("T")[0]}`
    );
    doc.text(`Departure Time: ${booking.departureTime}`);
    doc.text(`No. of Days: ${booking.noOfDays}`);
    doc.text(`Special Requests: ${booking.requests || "None"}`);
    doc.moveDown(1);

    // --- Package & Services Table ---
    doc.fontSize(14).fillColor("#2c3e50").text("Package & Services", {
      underline: true,
    });
    doc.moveDown(0.5);

    let tableTop = doc.y;
    const col1X = 55;
    const col2X = 400;
    const tableWidth = 500;

    // Header row
    doc
      .fontSize(12)
      .fillColor("white")
      .rect(50, tableTop, tableWidth, 20)
      .fill("#34495e");

    doc.fillColor("white").text("Item", col1X, tableTop + 5);
    doc.text("Price (LKR)", col2X, tableTop + 5);

    doc.fillColor("black");
    tableTop += 25;

    // Helper function for rows
    const addRow = (label, value, wrap = false) => {
      const rowHeight = wrap ? doc.heightOfString(value, { width: 180 }) + 10 : 20;

      doc.rect(50, tableTop, tableWidth, rowHeight).stroke();
      doc.text(label, col1X, tableTop + 5);

      // ✅ Auto-wrap long text for Additional Services
      doc.text(value.toString(), col2X, tableTop + 5, {
        width: 180,
        continued: false,
      });

      tableTop += rowHeight;
    };

    // Rows
    addRow("Package Price", booking.packagePrice || 0);
    addRow("Hall Price", booking.hallPrice || 0);
    addRow("Additional Services", booking.selectedServices?.join(", ") || "None", true);
    addRow("Services Total", booking.servicesTotal || 0);

    // Total row
    doc.rect(50, tableTop, tableWidth, 20).fillAndStroke("#ecf0f1", "black");
    doc.fillColor("black").font("Helvetica-Bold");
    doc.text("Total Price", col1X, tableTop + 5);
    doc.text(booking.totalPrice.toString(), col2X, tableTop + 5);

    doc.font("Helvetica").fillColor("black");
    doc.moveDown(3);

    // --- Footer ---
    if (doc.y > 700) doc.addPage(); 

    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text(
        "This is a system-generated report from Peaceful Departures.",
        50,
        750,
        { align: "center", width: 500 }
      );

    doc.end();
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({ message: "Error generating PDF" });
  }
};

// ✅ Check Hall / Date / Package Availability (with hall + date suggestions)
const checkAvailability = async (req, res) => {
  try {
    const { arrivalDate, departureDate, funeralVenue, otherVenue, packageName } = req.body;

    // Allow check even before package selection
    if (!arrivalDate || !departureDate || !funeralVenue) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hall = funeralVenue === "Other" ? otherVenue || "Other" : funeralVenue;
    const start = new Date(arrivalDate);
    const end = new Date(departureDate);

    // 🔹 Find bookings that overlap these dates
    const overlapping = await Booking.find({
      status: { $in: ["approved", "pending"] },
      arrivalDate: { $lte: end },
      departureDate: { $gte: start },
    });

    // 🔹 Build daily hall and total counts
    const dailyCounts = {};
    const hallCounts = {};
    overlapping.forEach((b) => {
      if (!b.arrivalDate || !b.departureDate) return;
      let current = new Date(b.arrivalDate);
      const endDate = new Date(b.departureDate);
      while (current <= endDate) {
        const iso = current.toISOString().substring(0, 10);
        dailyCounts[iso] = (dailyCounts[iso] || 0) + 1;

        const bookedHall =
          b.funeralVenue === "Other" ? b.otherVenue || "Other" : b.funeralVenue;

        hallCounts[iso] = hallCounts[iso] || {};
        hallCounts[iso][bookedHall] = (hallCounts[iso][bookedHall] || 0) + 1;
        current.setDate(current.getDate() + 1);
      }
    });

    // 🔹 Evaluate availability
    let hallUnavailable = false;
    let otherVenueFull = false;
    let dayFull = false;
    const alt = { halls: [], dates: [] };

    const allHalls = ["Hall of Tranquility", "Hall of Remembrance", "Hall of Eternity"];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().substring(0, 10);
      const total = dailyCounts[iso] || 0;
      const hallCount = hallCounts[iso]?.[hall] || 0;

      if (hall !== "Other" && hallCount > 0) hallUnavailable = true;
      if (hall === "Other" && hallCount >= 5) otherVenueFull = true;
      if (total >= 5) dayFull = true;

      // 🔹 Suggest alternative halls
      if (hallUnavailable) {
        allHalls.forEach((h) => {
          if (h !== hall && (!hallCounts[iso] || !hallCounts[iso][h])) {
            alt.halls.push(h);
          }
        });
      }

      // 🔹 Suggest alternative dates
      if (hallUnavailable || otherVenueFull || dayFull) {
        for (let i = 1; i <= 10; i++) {
          const next = new Date(d);
          next.setDate(next.getDate() + i);
          const nISO = next.toISOString().substring(0, 10);
          const nextTotal = dailyCounts[nISO] || 0;
          const nextHallCount = hallCounts[nISO]?.[hall] || 0;
          const hallFree = hall === "Other" ? nextHallCount < 5 : nextHallCount === 0;

          if (nextTotal < 5 && hallFree) {
            alt.dates.push(nISO);
            if (alt.dates.length >= 3) break;
          }
        }
        break;
      }
    }

    // 🔹 Return results
    if (hallUnavailable) {
      return res.status(200).json({
        available: false,
        message: `Hall "${hall}" is already booked for the selected date(s).`,
        suggestions: alt,
      });
    }

    if (otherVenueFull) {
      return res.status(200).json({
        available: false,
        message: `Other venue bookings have reached their daily limit (5).`,
        suggestions: alt,
      });
    }

    if (dayFull) {
      return res.status(200).json({
        available: false,
        message: `Maximum bookings reached for the selected date(s).`,
        suggestions: alt,
      });
    }

    // ✅ Available
    return res.status(200).json({
      available: true,
      message: "Selected hall and date(s) are available.",
      suggestions: {},
    });
  } catch (err) {
    console.error("Availability check error:", err);
    res.status(500).json({ message: "Server error during availability check" });
  }
};


// --- Exports ---
exports.getAllBookings = getAllBookings;
exports.addBookings = addBookings;
exports.getById = getById;
exports.updateBooking = updateBooking;
exports.deleteBooking = deleteBooking;
exports.approveBooking = approveBooking;
exports.rejectBooking = rejectBooking;
exports.generateBookingReport = generateBookingReport;
exports.searchBookings = searchBookings;
exports.checkAvailability = checkAvailability;
