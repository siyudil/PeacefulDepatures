import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Displayinvoice.css";

const servicePriceMap = {
  "Tea & biscuits service": 8000.0,
  "Basic decoration upgrade (extra drapes & simple decor)": 12000.0,
  "Extra artificial flower stands": 6000.0,
  "Additional plastic chair seating": 10000.0,
  "Family transport van (Toyota KDH)": 15000.0,
  "Tea, coffee & snacks service": 20000.0,
  "HD video recording (ceremony only)": 25000.0,
  "Customized floral arch at entrance": 30000.0,
  "Guest transport (mini bus)": 18000.0,
  "Decorative LED lighting setup": 15000.0,
  "Full buffet catering service": 60000.0,
  "Personal Funeral Coordinator": 55000.0,
  "Professional photography & cinematic video": 50000.0,
  "Luxury family transport (Mercedes Vito/Van)": 40000.0,
  "Designer floral wall/backdrop": 45000.0,
};

function Displayinvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const invoiceRef = useRef();

  const [discount, setDiscount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [autoDiscountApplied, setAutoDiscountApplied] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/invoices/${id}`);
        const data = res.data.invoice;

        data.additionalservices = Array.isArray(data.additionalservices)
          ? data.additionalservices.map((service) => {
              const serviceName = service.name || service;
              const mappedPrice =
                servicePriceMap[serviceName] !== undefined
                  ? servicePriceMap[serviceName]
                  : parseFloat(service.price) || 0;
              return { name: serviceName, price: mappedPrice };
            })
          : [];

        const sub =
          (parseFloat(data.packageprice) || 0) +
          (parseFloat(data.hallprice) || 0) +
          data.additionalservices.reduce((sum, s) => sum + (s.price || 0), 0);

        setSubtotal(sub);

        if (
          data.discountedTotal &&
          parseFloat(data.discountedTotal) < parseFloat(data.totalprice)
        ) {
          setDiscount(10);
          setTotal(parseFloat(data.discountedTotal).toFixed(2));
          setAutoDiscountApplied(true);
        } else {
          setDiscount(0);
          setTotal(parseFloat(data.totalprice).toFixed(2));
          setAutoDiscountApplied(false);
        }

        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice:", err);
      }
    };
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (!autoDiscountApplied) {
      const discPercent = parseFloat(discount) || 0;
      const discAmount = (subtotal * discPercent) / 100;
      setTotal((subtotal - discAmount).toFixed(2));
    }
  }, [discount, subtotal, autoDiscountApplied]);

  if (!invoice) return <p>Loading invoice...</p>;

  const items = [
    { name: invoice.packages, price: parseFloat(invoice.packageprice) || 0 },
    ...(invoice.additionalservices || []),
    { name: invoice.hallname, price: parseFloat(invoice.hallprice) || 0 },
  ];

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

      pdf.save(`Invoice_${invoice._id}.pdf`);
    });
  };

  return (
    <div>
      <div className="display-invoice-box" ref={invoiceRef}>
        <header className="display-invoice-header">
          <h1>INVOICE</h1>
          <div className="display-company-info">
            <h3>Peaceful Departures</h3>
            <p>
              19, Heaven Lane,
              <br /> Colombo.
            </p>
            <p><strong>Invoice No:</strong> {invoice._id}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </header>

        <div className="display-invoice-middle">
          <div className="display-invoice-details">
            <h4>Bill To</h4>
            <p><strong>Name:</strong> {invoice.name}</p>
            <p><strong>Address:</strong> {invoice.address}</p>
            <p><strong>Phone:</strong> {invoice.phonenumber}</p>
            <p><strong>Email:</strong> {invoice.email}</p>
            <p><strong>Payment Method:</strong> {invoice.payment}</p>
          </div>

          <table className="display-invoice-table">
            <thead>
              <tr>
                <th>QTY</th>
                <th>DESCRIPTION</th>
                <th>AMOUNT (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{(parseFloat(item.price) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="display-invoice-totals">
            <table>
              <tbody>
                <tr>
                  <td className="label">SUBTOTAL</td>
                  <td className="value">{subtotal.toFixed(2)}</td>
                </tr>

                {autoDiscountApplied ? (
                  <tr>
                    <td className="label">DISCOUNT (%)</td>
                    <td className="value">10%</td>
                  </tr>
                ) : (
                  <tr style={{ display: "none" }}>
                    <td className="label">DISCOUNT (%)</td>
                    <td className="value">0%</td>
                  </tr>
                )}

                <tr>
                  <td className="label total">TOTAL</td>
                  <td className="value total">{total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer className="display-invoice-footer">
          <h4>TERMS & CONDITIONS</h4>
          <p>The money paid will not be refunded.</p>
        </footer>
      </div>

      <div className="display-invoice-download">
        <button onClick={downloadPDF} className="display-download-btn">
          ⬇ Download PDF
        </button>
      </div>
    </div>
  );
}

export default Displayinvoice;
