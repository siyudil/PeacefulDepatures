// DisplayPackages.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DisplayPackages.css"; // Import the CSS file

function DisplayPackages() {
  const [packages, setPackages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch packages from API
    axios.get("/api/packages")
      .then(res => setPackages(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleClick = (id) => {
    navigate(`/package/${id}`);
  };

  return (
    <div className="grid-container">
      {packages.map(pkg => (
        <div 
          key={pkg.id} 
          className="card" 
          onClick={() => handleClick(pkg.id)}
        >
          <img src={pkg.image} alt={pkg.name} className="card-image" />
          <h3>{pkg.name}</h3>
          <p>{pkg.shortDescription}</p>
        </div>
      ))}
    </div>
  );
}

export default DisplayPackages;
