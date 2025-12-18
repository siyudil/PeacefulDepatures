import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./UpdateInvoice.css";

function UpdateInvoice() {
  const [inputs, setInputs] = useState({
    name: "",
    packages: "",
    hallname: "",
    packageprice: "",
    hallprice: "",
    additionalservices: [],
    additionalservicestotalprice: "",
    phonenumber: "",
    address: "",
    email: "",
    payment: "",
  });

  const history = useNavigate();
  const { id } = useParams();

  // --- Define additional services per package ---
  const serviceOptions = {
    "Serenity Package (Basic)": [
      { name: "Flower Arrangement", price: 5000 },
      { name: "Memorial Card", price: 2000 },
    ],
    "Grace Package (Standard)": [
      { name: "Flower Arrangement", price: 7000 },
      { name: "Photography", price: 5000 },
    ],
    "Eternity Package (VIP)": [
      { name: "Flower Arrangement", price: 10000 },
      { name: "Photography", price: 8000 },
      { name: "Catering", price: 15000 },
    ],
  };

  // Fetch invoice by ID
  useEffect(() => {
    const fetchHandler = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/invoices/${id}`);
        setInputs({
          ...res.data.invoice,
          additionalservices: res.data.invoice.additionalservices || [],
        });
      } catch (err) {
        console.error("Error fetching invoice:", err);
      }
    };
    fetchHandler();
  }, [id]);

  // Update invoice request
  const sendRequest = async () => {
    try {
      await axios.put(`http://localhost:5000/invoices/${id}`, {
        ...inputs,
        packageprice: Number(inputs.packageprice),
        hallprice: Number(inputs.hallprice),
        additionalservicestotalprice: Number(inputs.additionalservicestotalprice),
      });
      alert("✅ Invoice updated successfully!");
    } catch (err) {
      console.error("Error updating invoice:", err);
      alert("❌ Failed to update invoice. Please try again.");
    }
  };

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // --- Handle additional services checkbox change ---
  const handleServiceChange = (e) => {
    const { value, checked } = e.target;
    setInputs((prev) => {
      const updatedServices = checked
        ? [...prev.additionalservices, value]
        : prev.additionalservices.filter((s) => s !== value);
      return { ...prev, additionalservices: updatedServices };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendRequest();
    history("/Invoicesdetails");
  };

  return (
    <div className="updateinvoice-container">
      <h1 className="updateinvoice-title">Update Invoice</h1>

      <form className="updateinvoice-form" onSubmit={handleSubmit}>
        <h3 className="updateinvoice-section-title">Personal Details</h3>

        <label className="updateinvoice-label">Name</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="name"
          onChange={handleChange}
          value={inputs.name || ""}
          required
        />

        <label className="updateinvoice-label">Address</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="address"
          onChange={handleChange}
          value={inputs.address || ""}
          required
        />

        <label className="updateinvoice-label">Phone Number</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="phonenumber"
          onChange={handleChange}
          value={inputs.phonenumber || ""}
          required
        />

        <label className="updateinvoice-label">Email</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="email"
          onChange={handleChange}
          value={inputs.email || ""}
          required
        />

        <h3 className="updateinvoice-section-title">Packages and Services</h3>

        <label className="updateinvoice-label">Package Name</label>
        <select
          className="updateinvoice-select"
          name="packages"
          value={inputs.packages}
          onChange={handleChange}
          required
        >
          <option value="Serenity Package (Basic)">
            Serenity Package (Basic)
          </option>
          <option value="Grace Package (Standard)">
            Grace Package (Standard)
          </option>
          <option value="Eternity Package (VIP)">
            Eternity Package (VIP)
          </option>
        </select>

        <label className="updateinvoice-label">Additional Services</label>
        <div className="updateinvoice-services-box">
          {inputs.packages &&
            serviceOptions[inputs.packages]?.map((service, index) => (
              <div key={index} className="updateinvoice-service-item">
                <input
                  type="checkbox"
                  id={`service-${index}`}
                  value={service.name}
                  checked={inputs.additionalservices.includes(service.name)}
                  onChange={handleServiceChange}
                />
                <label htmlFor={`service-${index}`}>
                  {service.name} (Rs. {service.price})
                </label>
              </div>
            ))}
        </div>

        <label className="updateinvoice-label">Hall Name</label>
        <select
          className="updateinvoice-select"
          name="hallname"
          value={inputs.hallname}
          onChange={handleChange}
          required
        >
          <option value="Hall of Tranquility">Hall of Tranquility</option>
          <option value="Hall of Remembrance">Hall of Remembrance</option>
          <option value="Hall of Eternity">Hall of Eternity</option>
        </select>

        <h3 className="updateinvoice-section-title">Prices</h3>

        <label className="updateinvoice-label">Package Price</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="packageprice"
          onChange={handleChange}
          value={inputs.packageprice || ""}
          required
        />

        <label className="updateinvoice-label">Additional Services Price</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="additionalservicestotalprice"
          onChange={handleChange}
          value={inputs.additionalservicestotalprice || ""}
          required
        />

        <label className="updateinvoice-label">Hall Price</label>
        <input
          className="updateinvoice-input"
          type="text"
          name="hallprice"
          onChange={handleChange}
          value={inputs.hallprice || ""}
          required
        />

        <label className="updateinvoice-label">Payment Method</label>
        <select
          className="updateinvoice-select"
          name="payment"
          value={inputs.payment || ""}
          onChange={handleChange}
          required
        >
          <option value="Credit Card">Credit Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
        </select>

        <button type="submit" className="updateinvoice-btn-submit">
          Submit
        </button>
      </form>
    </div>
  );
}

export default UpdateInvoice;
