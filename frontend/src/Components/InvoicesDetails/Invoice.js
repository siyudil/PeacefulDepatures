import React, { useEffect, useState, useCallback } from "react";
import Nav from "../Nav/Nav";
import axios from "axios";
import Invoicemain from "../Invoices/Invoicemain/Invoicemain";
import { useNavigate } from "react-router-dom";
import "./Invoices.css";

const URL = "http://localhost:5000/invoices";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await axios.get(URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleContinue = () => {
    if (invoices.length > 0) {
      const latestInvoice = invoices[0];

      if (latestInvoice.payment === "Credit Card") {
        navigate("/success");
      } else if (
        latestInvoice.payment === "Cash" ||
        latestInvoice.payment === "Bank Transfer"
      ) {
        navigate("/pending");
      } else {
        navigate(`/Displayinvoice/${latestInvoice._id}`);
      }
    } else {
      alert("⚠ No invoices available!");
    }
  };

  return (
    <div className="invoices-container">
      <Nav />
      <h1 className="invoices-title">Client Payment Details</h1>
      <p className="invoices-description">
        Please review the information below. If all looks correct, click confirm to get your invoice.
      </p>

      <div className="invoices-list">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div key={invoice._id} className="invoices-item">
              <Invoicemain invoice={invoice} refreshList={fetchInvoices} />
            </div>
          ))
        ) : (
          <p className="invoices-empty">No invoices available.</p>
        )}
      </div>

      {/* Confirm Payment button removed as requested */}
    </div>
  );
}

export default Invoices;
