import React from 'react'
import Nav from '../../Nav/Nav';
import { useNavigate } from "react-router-dom";
import './AddBookingDetails.css'  

function AddBookingDetails() {
  const navigate = useNavigate();
  return (
    <div className="booking-container">
         <Nav/>
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Planning an Unforgettable Memorial</h1>
        <p>
          Every life deserves to be remembered in a special way. <br />
          Our platform allows you to easily plan funeral arrangements, 
          select from a range of customizable packages and services, 
          and book everything online with just a few clicks.
        </p>
      </div>

      <div className="cta-button">
        <button onClick={() => navigate("/add-booking")}>
          Book a Funeral Now
        </button>
      </div>

      {/* Video Section */}
      <div className="video-wrapper">
        <iframe
          src="https://www.youtube.com/embed/sHHyuk1MQtY?si=ScIhHM1ARYlmCDf-"
          title="Funeral Planning Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h2>Why Choose Our Funeral Planning?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="icon">📦</div>
            <h3>Comprehensive Funeral Packages</h3>
            <p>
              Choose from carefully designed funeral packages that include 
              essential services, ensuring everything is handled with care 
              and dignity.
            </p>
          </div>
          <div className="benefit-card">
            <div className="icon">⚙️</div>
            <h3>Customizable Services</h3>
            <p>
              Personalize arrangements by selecting services such as 
              floral tributes, transportation, virtual streaming, 
              and memorial tributes.
            </p>
          </div>
          <div className="benefit-card">
            <div className="icon">💻</div>
            <h3>Book Online with Ease</h3>
            <p>
              Save time and reduce stress by booking funeral services 
              directly through our secure online system, available 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddBookingDetails
