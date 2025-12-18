import React from "react";
import "./Nav.css";
import { Link, useNavigate } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // "customer" or "admin"
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleSignIn = () => {
    if (token) {
      // already logged in → redirect to dashboard
      if (role === "admin") {
        navigate("/admindashboard");
      } else {
        navigate("/mainhome");
      }
    } else {
      navigate("/login");
    }
  };

  const handleSignUp = () => {
    if (token) {
      // already logged in → redirect to dashboard
      if (role === "admin") {
        navigate("/admindashboard");
      } else {
        navigate("/mainhome");
      }
    } else {
      navigate("/register");
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <ul className="header">
        <li className="header-left">
          <div className="logo-container">
            <img src="/logo.jpg" alt="Logo" className="logo" />
            <h1 className="header-h1">Peaceful Departures</h1>
          </div>
        </li>
        <li className="header-right">
          {!token ? (
            <>
              <button className="header-btn" onClick={handleSignIn}>
                Sign in
              </button>
              <button className="header-btn" onClick={handleSignUp}>
                Sign up
              </button>
            </>
          ) : (
            <button className="header-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </li>
      </ul>

      {/* Navigation Links */}
      <ul className="home-ul">
            <li className="home-li">
              <Link to="/mainhome" className="nav-link">
                Home
              </Link>
            </li>
            <li className="home-li">
              <Link to="/managepackages" className="nav-link">
                Packages
              </Link>
            </li>
            <li className="home-li">
              <Link to="/addbooking" className="nav-link">
                Plan a Funeral
              </Link>
            </li>
            <li className="home-li">
              <Link to="/obituaries" className="nav-link">
                Find Obituaries
              </Link>
            </li>
            <li className="home-li">
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </li>
      </ul>
    </div>
  );
}

export default Nav;
