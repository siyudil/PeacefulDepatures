import "./App.css";
import React from "react";
import { Route, Routes } from "react-router";
import Home from "./Components/Home/Home";
import Booking from "./Components/Bookings/Booking/Booking";
import AddBookingDetails from "./Components/Bookings/AddBooking/AddBookingDetails";
import AddBooking from "./Components/Bookings/AddBooking/AddBooking";
import UpdateBooking from "./Components/Bookings/UpdateBooking/UpdateBooking";
import CustomerNotifications from "./Components/Notifications/CustomerNotifications";
import Login from "./Components/Auth/Login/Login";
import Register from "./Components/Auth/Register/Register";
import ProtectedRoute from "./Components/Auth/ProtectedRoute/ProtectedRoute";
import Profile from "./Components/Auth/Profile/Profile";
import EditProfile from "./Components/Auth/Profile/EditProfile";
import AdminDashboard from "./Components/admin/AdminDashboard/AdminDashboard";
import ManageBookings from "./Components/AdminBookings/ManageBookings/ManageBookings";
import BookingDetailsAdmin from "./Components/AdminBookings/ManageBookings/BookingDetailsAdmin";
import Obituaries from "./Components/obituaries/ObituaryDetails/Obituaries";
import AddObituary from "./Components/obituaries/AddObituary/AddObituary";
import UpdateObituary from "./Components/obituaries/Updateobituary/UpdateObituary";
import ObituaryDetails from "./Components/obituaries/ObituaryDetails/ObituaryDetails";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { Slide } from "react-toastify";
import PendingPage from "./Components/obituaries/PendingPage/PendingPage";
import ObitDashboard from "./Components/admin/ObitDashboard/ObitDashboard";
import Contact from "./Components/contact/Contact";
import AdminNotify from "./Components/admin/AdminDashboard/AdminNotify";
import UserNotify from "./Components/obituaries/UserNotify/UserNotify";
import Dashboard from "./Components/Dashboard";
import StaffManagement from "./Components/StaffManagement";
import VendorManagement from "./Components/VendorManagement";
import WorkAssignment from "./Components/WorkAssignment";
import ReportGeneration from "./Components/ReportGeneration";
import History from "./Components/Invoices/History/History";
import Invoices from "./Components/InvoicesDetails/Invoice";
import Addinvoice from "./Components/Invoices/Addinvoice/Addinvoice";
import UpdateInvoice from "./Components/Invoices/UpdateInvoice/UpdateInvoice";
import Displayinvoice from "./Components/Invoices/Displayinvoice/Displayinvoice";
import Success from "./Components/Invoices/Success/Success";
import Pending from "./Components/Invoices/Pending/Pending";
import PaymentHome from "./Components/PaymentHome/PaymentHome";
import Allinvoices from "./Components/PaymentHome/Allinvoices/Allinvoices";
import Approvedpage from "./Components/PaymentHome/Approvedpage/Approvedpage";
import AddPackage from "./Components/AddPackage/AddPackage";
import Packages from "./Components/Packages/Packages"; 
import UpdatePackage from "./Components/UpdatePackage/UpdatePackage";
import ClientPackages from "./Components/ClientPackages/ClientPackages";
import AdminHalls from "./Components/AdminHalls/AdminHalls";
import HallDetails from "./Components/HallDetails/HallDetails";
import Reviews from "./Components/Reviews/Reviews";
import PackageReports from "./Components/PackageReports/PackageReports";
import ViewHalls from "./Components/ViewHalls/ViewHalls";

function App() {
  return (
    <div>
      <React.Fragment>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} /> {/* Landing/Home page */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mainhome" element={<Home />} />
          {/* Booking Routes (Customer-only) */}
          <Route
            path="/bookingdetails"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookingdetails/:id"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route path="/addbooking" element={<AddBookingDetails />} />
          <Route
            path="/add-booking"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <AddBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updatebooking/:id"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <UpdateBooking />
              </ProtectedRoute>
            }
          />
          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Edit Profile */}
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admindashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/managebookings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <BookingDetailsAdmin />
              </ProtectedRoute>
            }
          />
          <Route path="/obituaries" element={<Obituaries />} />
          <Route path="/obituaries/:id" element={<ObituaryDetails />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/ObitDashboard" element={<ObitDashboard />} />
          <Route path="/contactus" element={<Contact />} />
          <Route path="/AdminNotify" element={<AdminNotify />} />
          <Route path="/Notifications" element={<UserNotify />} />
          {/* Update Obituary */}
          <Route
            path="/obituaries/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <UpdateObituary />
              </ProtectedRoute>
            }
          />
          {/* Add Obituary*/}
          <Route
            path="/addobt"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <AddObituary />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/vendors" element={<VendorManagement />} />
          <Route path="/assignments" element={<WorkAssignment />} />
          <Route path="/reports" element={<ReportGeneration />} />
          <Route path="/History" element={<History />} />
          <Route path="/approved/:id" element={<Approvedpage />} />
          <Route path="/Addinvoice" element={<Addinvoice />} />
          <Route path="/Invoicesdetails" element={<Invoices />} />
          <Route path="/Invoicesdetails/:id" element={<UpdateInvoice />} />
          <Route path="/Displayinvoice/:id" element={<Displayinvoice />} />
          <Route path="/Addinvoice" element={<Addinvoice />} />
          <Route path="/Success" element={<Success />} />
          <Route path="/Pending" element={<Pending />} />
          <Route path="/Displayinvoice/:id" element={<Allinvoices />} />
          <Route path="/PaymentHome" element={<PaymentHome />} />
          <Route path="/Allinvoices" element={<Allinvoices />} />
          <Route path="/halls/view" element={<ViewHalls />} />
          <Route
            path="/packages"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Packages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/package-reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PackageReports />
              </ProtectedRoute>
            }
          />
          <Route path="/managepackages" element={<ClientPackages />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route
            path="/add-package"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddPackage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-package/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UpdatePackage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/halls"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHalls />
              </ProtectedRoute>
            }
          />
          {/* Hall Details Route - Protected for admin */}
          <Route
            path="/admin/halls/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <HallDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<h2>404 - Page Not Found</h2>} />
        </Routes>
      </React.Fragment>
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar
        closeOnClick
        draggable={false}
        transition={Slide}
      />
    </div>
  );
}

export default App;
