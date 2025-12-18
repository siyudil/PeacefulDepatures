import React from "react";
import axios from "axios";
import "./Approvedpage.css";

function Approvedpage({ invoiceData, onStatusChange }) {
  if (!invoiceData) return null;

  const {
    _id,
    name,
    address,
    phonenumber,
    email,
    packages,
    packageprice,
    hallname,
    hallprice,
    totalprice,
    discountedTotal,
    additionalservices,
    additionalservicestotalprice,
    payment,
    cardDetails,
  } = invoiceData;

  const displayTotal =
    discountedTotal && discountedTotal < totalprice
      ? discountedTotal
      : totalprice;

  // ✅ Approve handler
  const handleApprove = async () => {
    try {
      await axios.put(`http://localhost:5000/invoices/${_id}/status`, {
        status: "Approved",
      });
      alert(`✅ ${name}'s invoice approved successfully!`);
      onStatusChange(_id, "Approved");
    } catch (err) {
      console.error("Error approving invoice:", err);
    }
  };

  // ❌ Reject handler
  const handleReject = async () => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this invoice?"
    );
    if (!confirmReject) return;
    try {
      await axios.put(`http://localhost:5000/invoices/${_id}/status`, {
        status: "Rejected",
      });
      alert(`❌ ${name}'s invoice rejected.`);
      onStatusChange(_id, "Rejected");
    } catch (err) {
      console.error("Error rejecting invoice:", err);
    }
  };

  return (
    <div className="approvedpage-container">
      <h1 className="approvedpage-title">Invoice Approval Summary</h1>

      <div className="approvedpage-summary-card">
        <h2 className="approvedpage-client-name">{name}</h2>
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Phone:</strong> {phonenumber}
        </p>
        <p>
          <strong>Address:</strong> {address}
        </p>
        <hr />

        <h3 className="approvedpage-section-title">Package Information</h3>
        <p>
          <strong>Package:</strong> {packages}
        </p>
        <p>
          <strong>Package Price:</strong> Rs. {packageprice}
        </p>

        <h3 className="approvedpage-section-title">Additional Services</h3>
        {additionalservices?.length > 0 ? (
          <ul className="approvedpage-service-list">
            {additionalservices.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p>No additional services selected</p>
        )}
        <p>
          <strong>Additional Services Total:</strong> Rs.{" "}
          {additionalservicestotalprice}
        </p>

        <h3 className="approvedpage-section-title">Funeral Hall</h3>
        <p>
          <strong>Hall Name:</strong> {hallname}
        </p>
        <p>
          <strong>Hall Price:</strong> Rs. {hallprice}
        </p>
        <hr />

        <h3 className="approvedpage-section-title">Final Billing</h3>
        <p>
          <strong>Final Payable Total:</strong> Rs. {displayTotal}
        </p>
        <p>
          <strong>Payment Method:</strong> {payment}
        </p>

        {payment === "Credit Card" && cardDetails && (
          <div className="approvedpage-carddetails-box">
            <h4>Credit Card Details</h4>
            <p>
              <strong>Card Holder:</strong> {cardDetails.cardHolder}
            </p>
            <p>
              <strong>Card Number:</strong> {cardDetails.cardNumber}
            </p>
            <p>
              <strong>Expiry:</strong> {cardDetails.expiry}
            </p>
            <p>
              <strong>CVC:</strong> {cardDetails.cvc}
            </p>
          </div>
        )}

        <div className="approvedpage-actions">
          <button
            className="approvedpage-btn approvedpage-approve-btn"
            onClick={handleApprove}
          >
            Approve
          </button>
          <button
            className="approvedpage-btn approvedpage-reject-btn"
            onClick={handleReject}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default Approvedpage;
