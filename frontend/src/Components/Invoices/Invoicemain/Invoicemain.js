import React, { useRef } from "react";
import { Link } from "react-router-dom";
import "./Invoicemain.css";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Invoicemain({ invoice, refreshList }) {
  const {
    _id,
    name,
    address,
    phonenumber,
    email,
    packages,
    additionalservices = [],
    hallname,
    packageprice,
    additionalservicestotalprice,
    hallprice,
    totalprice,
    discountedTotal,
    payment,
    cardDetails,
    status,
  } = invoice;

  const invoiceRef = useRef();

  const deleteHandler = async () => {
    const confirmDelete = window.confirm("⚠ Are you sure you want to delete this invoice?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/invoices/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("✅ Invoice deleted successfully!");
      refreshList();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("❌ Failed to delete invoice.");
    }
  };

  const downloadPDF = () => {
    const input = invoiceRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice_${_id}.pdf`);
    });
  };

  const statusClass = status ? status.trim().toLowerCase() : "pending";

  return (
    <div className="invmain-card" ref={invoiceRef}>
      <h2>
        <u>Your Payment Details</u>
      </h2>

      {/* ✅ Status Button */}
      <button className={`invmain-status-btn ${statusClass}`}>{status}</button>

      <p>
        <strong>Invoice ID:</strong> {_id}
      </p>
      <p>
        <strong>Name:</strong> {name}
      </p>
      <p>
        <strong>Address:</strong> {address}
      </p>
      <p>
        <strong>Phone Number:</strong> {phonenumber}
      </p>
      <p>
        <strong>Email:</strong> {email}
      </p>
      <p>
        <strong>Package Name:</strong> {packages}
      </p>

      <div>
        <strong>Additional Services:</strong>
        {additionalservices.length ? (
          <ul>
            {additionalservices.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p>None</p>
        )}
      </div>

      <p>
        <strong>Hall Name:</strong> {hallname}
      </p>
      <p>
        <strong>Package Price:</strong> Rs. {packageprice}
      </p>
      <p>
        <strong>Additional Services Total:</strong> Rs. {additionalservicestotalprice}
      </p>
      <p>
        <strong>Hall Price:</strong> Rs. {hallprice}
      </p>
      <p>
        <strong>Total Price:</strong> Rs. {totalprice}
      </p>

      {discountedTotal && parseFloat(discountedTotal) < parseFloat(totalprice) && (
        <div className="invmain-discount-box">
          <p className="invmain-discount-text">
            🎉 <strong>Discount Applied (10% Off)</strong>
          </p>
          <p>
            <strong>Discounted Total:</strong> Rs. {discountedTotal}
          </p>
        </div>
      )}

      <p>
        <strong>Payment Method:</strong> {payment}
      </p>

      {payment === "Credit Card" && cardDetails && (
        <div className="invmain-card-details">
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

      <div className="invmain-button-group">
        <Link to={`/Invoicesdetails/${_id}`}>
          <button className="invmain-btn-update">Update</button>
        </Link>
        <button className="invmain-btn-delete" onClick={deleteHandler}>Delete</button>

        {statusClass === "approved" && (
          <button onClick={downloadPDF} className="invmain-download-btn">
            ⬇ Download PDF
          </button>
        )}
      </div>
    </div>
  );
}

export default Invoicemain;
