import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "../../Nav/Nav";
import "./EditProfile.css";  

function EditProfile() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ name: "", email: "", password: "" });

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ FIX
      });
      setInputs({
        name: res.data.name,
        email: res.data.email,
        password: "",
      });
    } catch (err) {
      console.error("Error fetching profile for edit:", err);
    }
  };
  fetchProfile();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    await axios.put("http://localhost:5000/api/auth/update", inputs, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Profile updated successfully!");
    navigate("/profile");
  } catch (err) {
    alert(err.response?.data?.msg || "Failed to update profile");
  }
};

  return (
    <div>
      <Nav />
      <div className="edit-profile-page">
        <h2>Edit Profile</h2>
        <form className="edit-profile-form" onSubmit={handleSubmit}>
          <label>Name</label>
          <input name="name" value={inputs.name} onChange={handleChange} />

          <label>Email</label>
          <input name="email" type="email" value={inputs.email} onChange={handleChange} />

          <label>Password (leave blank if unchanged)</label>
          <input
            name="password"
            type="password"
            value={inputs.password}
            onChange={handleChange}
          />

          <button type="submit" className="update-btn">
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
