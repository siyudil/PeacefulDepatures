import React from 'react';
import Nav from '../Nav/Nav';
import { Link, useNavigate } from "react-router-dom";
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const handleWriteObituary = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && (role === "customer" || role === "admin")) {
      navigate("/addobt");
    } else {
      navigate("/login");
    }
  };
  return (
    <div className="home-container">
      <Nav/>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="video-container">
          <video autoPlay loop muted playsInline className="background-video">
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="hero-overlay">
            <h1>Where life stories live on</h1>
            <button onClick={handleWriteObituary} className="hero-btn">
              Write an Obituary →
            </button>
          </div>
        </div>
      </div>

      {/* About Us */}
<div className="about-section">
  <div className="about-left">
    <h2>Celebration of Life</h2>
    <p>
      Honoring a friend or family member with a celebration of life is a 
      profound expression of love. Our planners help create ceremonies 
      filled with dignity, compassion, and meaning. 
    </p>
    <p>
      We guide families in designing heartfelt tributes, blending tradition 
      with modern touches that truly honor the memory of loved ones. 
    </p>
    <button className="learn-more-btn">Learn More</button>
  </div>

  <div className="about-right">
    <div className="photo-collage">
      <img src="/candle.jpg" alt="Candle" className="photo top" />
      <img src="/flowers.jpg" alt="Flowers" className="photo middle" />
      <img src="/family.jpg" alt="Family gathering" className="photo bottom" />
    </div>
  </div>
</div>


      {/* Services */}
      <div className="services-section">
        <h2>OUR MISSION</h2>
        <p>
          "We help create remembrances that reflect the unique values, character 
          and traditions of the families we serve.That is our passion, that is 
          our purpose, that is our promise. Guaranteed."
        </p>
      </div>

      {/* Contact Section */}
      <div className="contact-section">
        <h2>Get in touch 24/7</h2>
        <p>We are always here for you. Whether you need immediate help 
          after the death of a loved one or would like to talk to someone 
          about planning a funeral ahead of time, a Dignity Memorial 
          provider is only a phone call away.
        </p>
        <h1 className='phone-number'>0112-345-678</h1>
        <Link to="/contactus" className="contact-btn">Contact Us</Link>
      </div>
    </div>
  );
}

export default Home;