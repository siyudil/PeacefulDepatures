import React from "react";
import { CheckCircle } from "lucide-react";
import "./Success.css";

function Success({ invoiceId, customerName, customerPhone, totalprice, discountedTotal }) {
  // ✅ WhatsApp message function
  const handleSendInvoice = () => {
    const phonenumber = customerPhone || "94764811001"; // fallback number
    const message = `Hello ${customerName || "Customer"}, your payment for invoice ${invoiceId || ""} was successful! Thank you for your trust. 🙏`;
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phonenumber}&text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // ✅ Calculate which amount to show
  const finalAmount =
    discountedTotal && parseFloat(discountedTotal) < parseFloat(totalprice)
      ? discountedTotal
      : totalprice;

  const discountApplied =
    discountedTotal && parseFloat(discountedTotal) < parseFloat(totalprice);

  return (
    <div className="success-container">
      <div className="success-icon-wrapper">
        <CheckCircle className="success-icon-symbol" />
      </div>

      <div className="success-transaction-details">
        <h1><strong>Payment Successful ✅</strong></h1>

        <h2>
          <strong>Full Payment: Rs. {finalAmount}</strong>
        </h2>

        {/* ✅ Show discount message only when applied */}
        {discountApplied && (
          <p className="success-discount-text">🎉 Discount Applied (10% Off)</p>
        )}

        <p><strong>Invoice ID:</strong> {invoiceId}</p>
        <p><strong>Invoice Date:</strong> {new Date().toLocaleDateString()}</p>
        <p>Thank you for your payment, {customerName || "Valued Customer"}.</p>
      </div>

      <button className="success-btn-primary" onClick={handleSendInvoice}>
        ✅ OK
      </button>
    </div>
  );
}

export default Success;
