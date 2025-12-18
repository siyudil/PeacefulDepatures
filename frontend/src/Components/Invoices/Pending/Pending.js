import React from "react";
import { Clock } from "lucide-react";
import "./Pending.css";

function Pending({ phonenumber = "94764811001", customerName = "Customer" }) {
  const handleSendmsg = () => {
    const message = `Hello ${customerName}, your payment is pending. Please complete the payment at your earliest convenience.`;

    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phonenumber}&text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="pending-container">
      <div className="pending-icon-wrapper">
        <Clock className="pending-icon-symbol" />
      </div>

      <div className="pending-transaction-details">
        <h1>
          <strong>Payment Pending ⏳</strong>
        </h1>
        <p>
          <strong>Invoice Date:</strong> {new Date().toLocaleDateString()}
        </p>
        <p>Your payment will be processed once confirmed.</p>
      </div>

      <button className="pending-btn-primary" onClick={handleSendmsg}>
        OK
      </button>
    </div>
  );
}

export default Pending;
