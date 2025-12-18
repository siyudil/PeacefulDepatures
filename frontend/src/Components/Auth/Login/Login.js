import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FaEnvelope, FaLock } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return; // ✅ Stop if validation fails

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // ✅ Save user details in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userEmail", res.data.email);

      // ✅ Redirect based on role
      if (res.data.role === "admin") {
        navigate("/admindashboard");
      } else {
        navigate("/mainhome");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="overlay-box">
          <h1 className="animated-title">Peaceful Departures</h1>
          <p className="animated-subtitle">
            Providing compassionate funeral services <br />
            with dignity, care, and respect.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Welcome</h2>
          <p className="login-subtitle">Please sign in to continue</p>

          {error && <p className="error-msg">{error}</p>}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="form-group">
              <div
                className={`input-wrapper ${
                  fieldErrors.email ? "error-border" : ""
                }`}
              >
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {fieldErrors.email && (
                <p className="error">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div
                className={`input-wrapper ${
                  fieldErrors.password ? "error-border" : ""
                }`}
              >
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {fieldErrors.password && (
                <p className="error">{fieldErrors.password}</p>
              )}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="register-link">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")}>Register Now</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
