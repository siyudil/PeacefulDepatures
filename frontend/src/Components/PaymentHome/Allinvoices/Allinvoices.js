import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCreditCard } from "react-icons/fa";
import axios from "axios";
import "./Allinvoices.css";

function Allinvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/invoices", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setInvoices(res.data.invoices || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <div className="allinv-container">
      <h1 className="allinv-title">All Invoices</h1>

      {invoices.length === 0 ? (
        <p className="allinv-empty">No invoices found.</p>
      ) : (
        invoices.map((inv) => (
          <div className="allinv-card-wrapper" key={inv._id}>
            <div
              className="allinv-profile-card"
              onClick={() =>
                navigate(`/Displayinvoice/${inv._id}`, {
                  state: { invoiceId: inv._id },
                })
              }
            >
              <FaCreditCard className="allinv-icon" size={30} />
              <h3 className="allinv-client-name">{inv.name}</h3>
              <p className="allinv-client-desc">
                Check {inv.name}'s payment invoices
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Allinvoices;
