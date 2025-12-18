import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Nav from "../../Nav/Nav";
import axios from "axios";
import "./Addinvoice.css";

function Addinvoice() {
  const history = useNavigate();
  const location = useLocation();

  // ✅ Service options
  const serviceOptions = useMemo(
    () => ({
      "Serenity Package (Basic)": [
        { name: "Tea & biscuits service", price: 8000 },
        {
          name: "Basic decoration upgrade (extra drapes & simple decor)",
          price: 12000,
        },
        { name: "Extra artificial flower stands", price: 6000 },
        { name: "Additional plastic chair seating", price: 10000 },
        { name: "Family transport van (Toyota KDH)", price: 15000 },
      ],
      "Grace Package (Standard)": [
        { name: "Tea, coffee & snacks service", price: 20000 },
        { name: "HD video recording (ceremony only)", price: 25000 },
        { name: "Customized floral arch at entrance", price: 30000 },
        { name: "Guest transport (mini bus)", price: 18000 },
        { name: "Decorative LED lighting setup", price: 15000 },
      ],
      "Eternity Package (VIP)": [
        { name: "Full buffet catering service", price: 60000 },
        { name: "Personal Funeral Coordinator", price: 55000 },
        { name: "Professional photography & cinematic video", price: 50000 },
        { name: "Luxury family transport (Mercedes Vito/Van)", price: 40000 },
        { name: "Designer floral wall/backdrop", price: 45000 },
      ],
    }),
    []
  );

  // ✅ Package + Hall prices
  const packagePrices = useMemo(
    () => ({
      "Serenity Package (Basic)": 100000,
      "Grace Package (Standard)": 200000,
      "Eternity Package (VIP)": 400000,
    }),
    []
  );

  const hallPrices = useMemo(
    () => ({
      "Hall of Tranquility": 25000,
      "Hall of Remembrance": 50000,
      "Hall of Eternity": 100000,
    }),
    []
  );

  /** ✅ FIXED normalizeBookingData() */
  function normalizeBookingData(data, serviceOptions, packagePrices, hallPrices) {
    if (!data) return {};

    const packageMap = {
      Serenity: "Serenity Package (Basic)",
      Grace: "Grace Package (Standard)",
      Eternity: "Eternity Package (VIP)",
      "Serenity Package": "Serenity Package (Basic)",
      "Grace Package": "Grace Package (Standard)",
      "Eternity Package": "Eternity Package (VIP)",
    };

    const hallMap = {
      "Hall of Tranquility": "Hall of Tranquility",
      "Hall of Remembrance": "Hall of Remembrance",
      "Hall of Eternity": "Hall of Eternity",
      Tranquility: "Hall of Tranquility",
      Remembrance: "Hall of Remembrance",
      Eternity: "Hall of Eternity",
    };

    // ✅ Normalize package and hall names (support both short and full names in either field)
    const pkgInput = data.packageName || data.packages || "";
    const normalizedPackage = packageMap[pkgInput] || pkgInput || "";

    const hallInput = data.funeralVenue || data.hallname || "";
    const normalizedHall = hallMap[hallInput] || hallInput || "";

    // ✅ Normalize services (auto-map even if slightly different names)
    const selected =
      data.selectedServices || data.additionalservices || [];

    let normalizedServices = [];
    let additionalTotal = 0;

    if (normalizedPackage && serviceOptions[normalizedPackage]) {
      normalizedServices = serviceOptions[normalizedPackage]
        .filter((service) =>
          selected.some((sel) =>
            service.name.toLowerCase().includes(sel.toLowerCase().split(" ")[0]) // loose match
          )
        )
        .map((s) => s.name);

      additionalTotal = serviceOptions[normalizedPackage]
        .filter((s) => normalizedServices.includes(s.name))
        .reduce((sum, s) => sum + s.price, 0);
    }

    return {
      ...data,
      packages: normalizedPackage,
      hallname: normalizedHall,
      additionalservices: normalizedServices,
      additionalservicestotalprice:
        data.additionalservicestotalprice || additionalTotal,
      packageprice:
        data.packageprice || packagePrices[normalizedPackage] || 0,
      hallprice: data.hallprice || hallPrices[normalizedHall] || 0,
    };
  }

  // ✅ Normalize incoming data
  const bookingData = normalizeBookingData(
    location.state?.bookingData || {},
    serviceOptions,
    packagePrices,
    hallPrices
  );

  // ✅ Initialize input states
  const [inputs, setInputs] = useState({
    name: bookingData.name || "",
    address: bookingData.address || "",
    phonenumber: bookingData.phonenumber || "",
    email: bookingData.email || "",
    packages: bookingData.packages || "",
    packageprice: bookingData.packageprice || "",
    additionalservices: bookingData.additionalservices || [],
    additionalservicestotalprice:
      bookingData.additionalservicestotalprice || 0,
    hallname: bookingData.hallname || "",
    hallprice: bookingData.hallprice || "",
    totalprice: bookingData.totalprice || "",
    discountedTotal: bookingData.discountedTotal || "",
    payment: "",
  });

  const [showCardForm, setShowCardForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  // Track whether discount alert has been shown to avoid repeated alerts on re-renders
  const discountAlertShownRef = useRef(false);

  // ✅ Autofill base prices if missing (ensures totals compute even without booking-provided prices)
  useEffect(() => {
    if (inputs.packages && (inputs.packageprice === "" || inputs.packageprice === 0)) {
      const price = packagePrices[inputs.packages] || 0;
      if (price !== inputs.packageprice) {
        setInputs((prev) => ({ ...prev, packageprice: price }));
      }
    }
  }, [inputs.packages, inputs.packageprice, packagePrices]);

  useEffect(() => {
    if (inputs.hallname && (inputs.hallprice === "" || inputs.hallprice === 0)) {
      const price = hallPrices[inputs.hallname] || 0;
      if (price !== inputs.hallprice) {
        setInputs((prev) => ({ ...prev, hallprice: price }));
      }
    }
  }, [inputs.hallname, inputs.hallprice, hallPrices]);

  /** ✅ Auto-calculate total and discount */
  useEffect(() => {
    const packageprice = parseFloat(inputs.packageprice) || 0;
    const hallPrice = parseFloat(inputs.hallprice) || 0;

    let additionalTotal = 0;

    if (inputs.packages && serviceOptions[inputs.packages]) {
      additionalTotal = inputs.additionalservices.reduce((sum, serviceName) => {
        const service = serviceOptions[inputs.packages]?.find(
          (s) => s.name === serviceName
        );
        return service ? sum + service.price : sum;
      }, 0);
    }

    const total = packageprice + hallPrice + additionalTotal;

    // Apply discount based on package and threshold
    let discountedTotal = total;
    let discountThreshold = 0;

    if (inputs.packages === "Serenity Package (Basic)") discountThreshold = 150000;
    if (inputs.packages === "Grace Package (Standard)") discountThreshold = 300000;
    if (inputs.packages === "Eternity Package (VIP)") discountThreshold = 550000;

    if (total > discountThreshold && discountThreshold > 0) {
      discountedTotal = total * 0.9; // 10% discount
      if (!discountAlertShownRef.current) {
        alert("🎉 Wow! You got a 10% discount!");
        discountAlertShownRef.current = true;
      }
    } else {
      // Reset when discount no longer applicable, so alert can show again if user changes inputs
      discountAlertShownRef.current = false;
    }

    setInputs((prev) => ({
      ...prev,
      additionalservicestotalprice: additionalTotal,
      totalprice: total.toFixed(2),
      discountedTotal: discountedTotal.toFixed(2),
    }));
  }, [
    inputs.packages,
    inputs.additionalservices,
    inputs.packageprice,
    inputs.hallprice,
    serviceOptions,
  ]);

  /** ✅ Handlers */
  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "payment") setShowCardForm(value === "Credit Card");

    setInputs((prev) => ({ ...prev, [name]: value }));
  }

  function handleCardChange(e) {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!inputs.name.trim()) return alert("⚠ Name is required!");
    if (!/^\d{10}$/.test(inputs.phonenumber))
      return alert("⚠ Phone number must be 10 digits!");
    if (!/\S+@\S+\.\S+/.test(inputs.email))
      return alert("⚠ Enter a valid email!");

    if (inputs.payment === "Credit Card") {
      if (
        !cardDetails.cardHolder ||
        !/^\d{16}$/.test(cardDetails.cardNumber) ||
        !/^\d{2}\/\d{2}$/.test(cardDetails.expiry) ||
        !/^\d{3,4}$/.test(cardDetails.cvc)
      ) {
        return alert("⚠ Please fill in valid credit card details!");
      }
    }

    const payload = {
      ...inputs,
      packageprice: Number(inputs.packageprice),
      hallprice: Number(inputs.hallprice),
      totalprice: Number(inputs.totalprice),
      discountedTotal: Number(inputs.discountedTotal),
      cardDetails: inputs.payment === "Credit Card" ? cardDetails : null,
    };

    try {
      await axios.post("http://localhost:5000/invoices", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("✅ Invoice added successfully!");
      history("/Invoicesdetails");
    } catch (err) {
      console.error("Error adding invoice:", err);
      alert("❌ Failed to add invoice. Please try again.");
    }
  }

  return (
    <div className="invoice-container">
      <Nav />
      <h1 className="invoice-title">Funeral Booking Payment</h1>

      <form className="invoice-form" onSubmit={handleSubmit}>
        <h3 className="invoice-section">
          <u>Your Personal Details</u>
        </h3>
        <label>Name</label>
        <input type="text" name="name" value={inputs.name} readOnly />
        <label>Address</label>
        <input type="text" name="address" value={inputs.address} readOnly />
        <label>Phone Number</label>
        <input
          type="text"
          name="phonenumber"
          value={inputs.phonenumber}
          readOnly
        />
        <label>Email</label>
        <input type="email" name="email" value={inputs.email} readOnly />

        <h3 className="invoice-section">
          <u>Packages and Services</u>
        </h3>
        <label>Package Name</label>
        <select name="packages" value={inputs.packages} disabled>
          <option>{inputs.packages}</option>
        </select>

        <label>Additional Services</label>
        <div className="invoice-card-popup">
          {inputs.packages &&
            serviceOptions[inputs.packages]?.map((service, index) => (
              <div key={index}>
                <input
                  type="checkbox"
                  id={`service-${index}`}
                  value={service.name}
                  checked={inputs.additionalservices.includes(service.name)}
                  readOnly
                />
                <label htmlFor={`service-${index}`}>
                  {service.name} (Rs. {service.price})
                </label>
              </div>
            ))}
        </div>

        <label>Hall Name</label>
        <select name="hallname" value={inputs.hallname} disabled>
          <option>{inputs.hallname}</option>
        </select>

        <h3 className="invoice-section">
          <u>Prices</u>
        </h3>
        <label>Package Price</label>
        <input
          type="number"
          name="packageprice"
          value={inputs.packageprice}
          readOnly
        />
        <label>Additional Services Total Price</label>
        <input
          type="number"
          name="additionalservicestotalprice"
          value={inputs.additionalservicestotalprice}
          readOnly
        />
        <label>Hall Price</label>
        <input type="number" name="hallprice" value={inputs.hallprice} readOnly />
        <label>Total Price (Package + Services + Hall)</label>
        <input
          type="text"
          name="totalprice"
          value={inputs.totalprice}
          readOnly
        />

        {inputs.discountedTotal &&
          inputs.discountedTotal !== inputs.totalprice && (
            <>
              <label>Total Price after 10% Discount</label>
              <input
                type="text"
                name="discountedTotal"
                value={inputs.discountedTotal}
                readOnly
              />
            </>
          )}

        <label>Payment Method</label>
        <select
          name="payment"
          value={inputs.payment}
          onChange={handleChange}
          required
        >
          <option value="">Select Payment Method</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
        </select>

        {showCardForm && (
          <div className="invoice-card-form">
            <h3>Enter Credit Card Details</h3>
            <label>Card Holder's Name</label>
            <input
              type="text"
              name="cardHolder"
              placeholder="Card Holder's Name"
              value={cardDetails.cardHolder}
              onChange={handleCardChange}
              required
            />
            <label>Card Number</label>
            <input
              type="text"
              name="cardNumber"
              placeholder="1234456712344567"
              value={cardDetails.cardNumber}
              onChange={handleCardChange}
              required
            />
            <label>Expiration Date</label>
            <input
              type="text"
              name="expiry"
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={handleCardChange}
              required
            />
            <label>CVC</label>
            <input
              type="text"
              name="cvc"
              placeholder="123"
              value={cardDetails.cvc}
              onChange={handleCardChange}
              required
            />
          </div>
        )}

        <button type="submit" className="invoice-submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Addinvoice;
