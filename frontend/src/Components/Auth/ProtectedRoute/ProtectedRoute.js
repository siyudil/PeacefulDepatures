import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role not allowed → go to login
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise → render page
  return children;
};

export default ProtectedRoute;
