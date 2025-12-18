import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './History.css';

function History() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/invoices");
        setInvoices(res.data.invoices || []); // assuming backend returns { invoices: [...] }
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <div className="history-page">
      <h2 className="history-title">Payment History</h2>

      <table className="history-table">
        <thead className="history-thead">
          <tr>
            <th>#</th>
            <th>Client Name</th>
            <th>Address</th>
            <th>Phone Number</th>
            <th>Email</th>
            <th>Package</th>
            <th>Additional Services</th>
            <th>Hall Name</th>
            <th>Payment Price</th>
            <th>Additional Services Price</th>
            <th>Hall Price</th>
            <th>Payment Method</th>
          </tr>
        </thead>

        <tbody className="history-tbody">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="12">No invoices found</td>
            </tr>
          ) : (
            invoices.map((inv, index) => (
              <tr key={inv._id}>
                <td>{index + 1}</td>
                <td>{inv.name}</td>
                <td>{inv.address}</td>
                <td>{inv.phonenumber}</td>
                <td>{inv.email}</td>
                <td>{inv.packages}</td>
                <td>{inv.additionalservices}</td>
                <td>{inv.hallname}</td>
                <td>{inv.packageprice}</td>
                <td>{inv.additionalservicestotalprice}</td>
                <td>{inv.hallprice}</td>
                <td>{inv.payment}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default History;
