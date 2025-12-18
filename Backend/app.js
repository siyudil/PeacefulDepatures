// password: B2wgFQyO8JZ484xx
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const bookingRoutes = require("./Routes/BookingRoutes");
const notificationRoutes = require("./Routes/NotificationRoutes");
const authRoutes = require("./Routes/AuthRoutes"); 
const CondolenceRoutes = require("./Routes/CondolenceRoutes");
const adminRoutes = require("./Routes/AdminRoutes");
const NotificationRoutes = require("./Routes/rnotication");
const router = require("./Routes/UserRoutes");
const invoiceRoutes = require("./Routes/invoiceRoutes");
const HallRoutes = require("./Routes/halls");
const packageRoute = require("./Routes/PackageRoutes");
const verifyToken = require("./Middleware/AuthMiddleware"); 

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


// Simple test route
app.get("/", (req, res) => {
   res.json({ message: "Funeral Management API is working!" });
});

// Routes
app.use("/bookings", bookingRoutes);
app.use("/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/users",router);
app.use("/uploads", express.static(path.join(__dirname,"uploads"))); //to access images
app.use("/condolences", CondolenceRoutes);
app.use("/admin", adminRoutes);
app.use("/obituarynotifications", NotificationRoutes);
app.use("/api/staff", require("./Routes/StaffRoute"));
app.use("/api/assignments", require("./Routes/WorkAssignmentRoute"));
app.use("/api/reports", require("./Routes/ReportRoute"));
app.use("/invoices", invoiceRoutes);
app.use("/api/packages", packageRoute);
app.use("/admin/halls", HallRoutes);
// Example protected routes
app.get("/admin-only", verifyToken(["admin"]), (req, res) => {
  res.json({ msg: "Hello Admin" });
});

app.get("/customer-only", verifyToken(["customer", "admin"]), (req, res) => {
  res.json({ msg: "Hello Customer" });
});

mongoose.connect("mongodb+srv://teamusers:Team123@cluster0.2yhqevb.mongodb.net/funeralDB")
  .then(() => console.log("Connected to MongoDB"))
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));
