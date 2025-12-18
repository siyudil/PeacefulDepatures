import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { FaUser, FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // --- Validation Function ---
  const validate = () => {
    let newErrors = {};
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (!name) {
      newErrors.name = "Name is required";
    } else if (!nameRegex.test(name)) {
      newErrors.name = "Name should contain only letters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "Password must be at least 6 characters and include letters & numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handle Register ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return; // ❌ stop if validation fails

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        role,
      });

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="register-page">
      {/* Left Side */}
      <div className="register-left">
        <div className="left-text">
          <h1>Start Your Journey</h1>
          <p>
            Create an account today <br />
            and access compassionate services with ease.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="register-right">
        <div className="register-card">
          <h2 className="register-title">Create Account</h2>
          <p className="register-subtitle">Please fill in the details below</p>

          <form onSubmit={handleRegister}>
            {/* Name */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "error-border" : ""}
                />
              </div>
              {errors.name && <p className="error">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "error-border" : ""}
                />
              </div>
              {errors.email && <p className="error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "error-border" : ""}
                />
              </div>
              {errors.password && <p className="error">{errors.password}</p>}
            </div>

            {/* Role */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaUserShield className="input-icon" />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button type="submit" className="register-btn">
              Register
            </button>
          </form>

          <p className="login-link">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
