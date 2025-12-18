import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './Contact.css'; 

function Contact() {
  const form = useRef();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setLoading(true); // Start animation

    emailjs
      .sendForm('service_v2aufci', 'template_byz5qw1', form.current, {
        publicKey: 'VikGsnilpYqsWeFZl',
      })
      .then(
        () => {
          setLoading(false);
          alert('Message sent successfully!');
          form.current.reset();
          navigate('/');
        },
        (error) => {
          setLoading(false);
          alert('Failed to send the message, please try again.');
          console.log('FAILED...', error.text);
        }
      );
  };

  return (
    <div className="contact-container">
      {/* Close button */}
      <button 
        className="close-btn" 
        onClick={() => navigate('/')}
      >
        ✖
      </button>

      <h1>Contact Us</h1>
      <form ref={form} onSubmit={sendEmail} className="contact-form">
        <label>Name</label><br />
        <input type="text" name="user_name" required /><br /><br />

        <label>Email</label><br />
        <input type="email" name="user_email" required /><br /><br />

        <label>Message</label><br />
        <textarea name="message" required /><br /><br />

        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {loading && (
        <div className="loader">
          <div className="spinner"></div>
          <p>Sending your message...</p>
        </div>
      )}
    </div>
  );
}

export default Contact;