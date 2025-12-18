import React, { useState, useEffect, useMemo, useCallback } from "react";
import Nav from "../../Nav/Nav";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./UpdateBooking.css";

const packagePrices = {
  Serenity: 100000,
  Grace: 200000,
  Eternity: 400000,
};

const hallPrices = {
  "Hall of Tranquility": 25000,
  "Hall of Remembrance": 50000,
  "Hall of Eternity": 100000,
};

const servicesByPackage = {
  Serenity: [
    { name: "Tea & biscuits", price: 8000 },
    { name: "Decoration upgrade", price: 12000 },
    { name: "Extra flower stands", price: 6000 },
    { name: "Additional chairs", price: 10000 },
    { name: "Family transport van", price: 15000 },
  ],
  Grace: [
    { name: "Tea, coffee & snacks", price: 20000 },
    { name: "HD video recording", price: 25000 },
    { name: "Floral arch entrance", price: 30000 },
    { name: "Guest transport bus", price: 18000 },
    { name: "LED lighting setup", price: 15000 },
  ],
  Eternity: [
    { name: "Full buffet catering", price: 60000 },
    { name: "Funeral Coordinator", price: 55000 },
    { name: "Photography & video", price: 50000 },
    { name: "Luxury family van", price: 40000 },
    { name: "Designer floral wall", price: 45000 },
  ],
};

function UpdateBooking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inputs, setInputs] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [suggestions, setSuggestions] = useState({});
  const [highlight, setHighlight] = useState("");
  const [checking, setChecking] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  // Fetch booking
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.booking) {
          setInputs({
            ...res.data.booking,
            dob: res.data.booking.dob
              ? res.data.booking.dob.substring(0, 10)
              : "",
            dod: res.data.booking.dod
              ? res.data.booking.dod.substring(0, 10)
              : "",
            arrivalDate: res.data.booking.arrivalDate
              ? res.data.booking.arrivalDate.substring(0, 10)
              : "",
            departureDate: res.data.booking.departureDate
              ? res.data.booking.departureDate.substring(0, 10)
              : "",
          });
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  // ✅ Real-time backend-based availability check
  const checkAvailability = useCallback(
    async (override = {}) => {
      if (!inputs) return;
      const vals = { ...inputs, ...override };
      const {
        arrivalDate,
        departureDate,
        funeralVenue,
        otherVenue,
        packageName,
      } = vals;

      if (!arrivalDate || !departureDate || !funeralVenue) {
        setAvailabilityMsg("");
        setSuggestions({});
        setHighlight("");
        setCanSubmit(false);
        return;
      }

      try {
        setChecking(true);
        setAvailabilityMsg("");
        setSuggestions({});
        setHighlight("");

        const token = localStorage.getItem("token");
        if (!token) {
          setAvailabilityMsg("⚠️ Please log in to check availability.");
          setCanSubmit(false);
          setChecking(false);
          return;
        }

        const res = await axios.post(
          "http://localhost:5000/bookings/check-availability",
          { arrivalDate, departureDate, funeralVenue, otherVenue, packageName },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { available, message, suggestions } = res.data;
        setAvailabilityMsg(available ? `✅ ${message}` : `❌ ${message}`);
        setSuggestions(suggestions || {});
        setHighlight(available ? "success" : "error");
        setCanSubmit(available);
      } catch (err) {
        console.error("Availability check failed:", err);
        setAvailabilityMsg("⚠️ Error checking availability. Please try again.");
        setSuggestions({});
        setHighlight("error");
        setCanSubmit(false);
      } finally {
        setChecking(false);
      }
    },
    [inputs]
  );

  // ✅ Handle suggestion clicks (hall/date)
  const handleSuggestionClick = (type, value) => {
    if (type === "hall") {
      const override =
        value === "Other"
          ? { funeralVenue: "Other", otherVenue: "Other" }
          : { funeralVenue: value, otherVenue: "" };
      setInputs((prev) => ({ ...prev, ...override }));
      checkAvailability(override);
    }

    if (type === "date") {
      const override = { arrivalDate: value, departureDate: value };
      setInputs((prev) => ({ ...prev, ...override }));
      checkAvailability(override);
    }
  };

  // 🩵 Auto recheck when relevant fields change
  useEffect(() => {
    if (!inputs) return;
    checkAvailability();
  }, [
    inputs?.arrivalDate,
    inputs?.departureDate,
    inputs?.funeralVenue,
    inputs?.otherVenue,
    inputs?.packageName,
  ]);

  // Derived values
  const packageName = inputs?.packageName;
  const funeralVenue = inputs?.funeralVenue;
  const noOfDays = inputs?.noOfDays;
  const servicesTotal = inputs?.servicesTotal || 0;

  const { packagePrice, hallPrice, totalPrice } = useMemo(() => {
    let packagePrice = packageName ? packagePrices[packageName] : 0;
    let hallPrice = 0;

    if (funeralVenue && hallPrices[funeralVenue]) {
      const days = parseInt(noOfDays || 0);
      if (days > 0 && days <= 7) {
        hallPrice = hallPrices[funeralVenue] * days;
      }
    }

    const totalPrice = packagePrice + hallPrice + servicesTotal;
    return { packagePrice, hallPrice, totalPrice };
  }, [packageName, funeralVenue, noOfDays, servicesTotal]);

  useEffect(() => {
    if (
      packagePrice === undefined ||
      hallPrice === undefined ||
      totalPrice === undefined
    )
      return;
    setInputs((prev) => ({
      ...prev,
      packagePrice,
      hallPrice,
      totalPrice,
    }));
  }, [packagePrice, hallPrice, totalPrice]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));

    // clear previous error
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // recheck immediately when hall/date/package fields change
    if (
      [
        "arrivalDate",
        "departureDate",
        "funeralVenue",
        "otherVenue",
        "packageName",
      ].includes(name)
    ) {
      checkAvailability({ [name]: value });
    }

    // inline validation
    let error = "";
    const letterRegex = /^[A-Za-z\s]+$/;
    const addressRegex = /^[A-Za-z0-9\s,.'\-/#]*$/;
    const phoneRegex = /^0\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    switch (name) {
      case "name":
      case "relationship":
      case "deceasedName":
      case "religion":
        if (value && !letterRegex.test(value))
          error = "Must contain only letters";
        break;

      case "address":
      case "otherVenue":
      case "cemetery":
        if (value && !addressRegex.test(value))
          error = "Invalid characters entered";
        break;

      case "phone":
        if (value && !phoneRegex.test(value))
          error = "Must be 10 digits and start with 0";
        break;

      case "email":
        if (value && !emailRegex.test(value)) error = "Invalid email format";
        break;

      case "packageName":
        // ✅ When package changes, clear previous selected services
        setInputs((prev) => ({
          ...prev,
          packageName: value,
          selectedServices: [],
          servicesTotal: 0,
        }));
        setErrors((prev) => ({ ...prev, packageName: "" }));
        return; // stop further processing for this field

      case "dob":
        if (value) {
          const dob = new Date(value);
          const today = new Date();
          if (dob > today) error = "Date of birth cannot be in the future";
          if (inputs.dod && new Date(inputs.dod) <= dob) {
            error = "Date of birth must be before date of death";
          }
        }
        break;

      case "dod":
        if (value) {
          const dod = new Date(value);
          const today = new Date();
          if (dod > today) error = "Date of death cannot be in the future";
          if (inputs.dob && dod <= new Date(inputs.dob)) {
            error = "Date of death must be after date of birth";
          }
        }
        break;

      case "arrivalDate":
        if (value) {
          const arrival = new Date(value);
          const today = new Date();
          if (arrival > today) error = "Arrival date cannot be in the future";
          if (inputs.dod && arrival < new Date(inputs.dod)) {
            error = "Arrival must be on/after date of death";
          }
          if (
            inputs.departureDate &&
            arrival > new Date(inputs.departureDate)
          ) {
            error = "Arrival cannot be after departure date";
          }

          // ✅ Recalculate departure date if noOfDays is already entered
          if (inputs.noOfDays && inputs.noOfDays > 0) {
            const newDeparture = new Date(arrival);
            newDeparture.setDate(
              arrival.getDate() + parseInt(inputs.noOfDays) - 1
            );
            setInputs((prev) => ({
              ...prev,
              departureDate: newDeparture.toISOString().substring(0, 10),
            }));
          }
        }
        break;

      case "departureDate":
        if (value) {
          const departure = new Date(value);
          const today = new Date();
          if (departure > today)
            error = "Departure date cannot be in the future";
          if (inputs.arrivalDate && departure < new Date(inputs.arrivalDate)) {
            error = "Departure must be on/after arrival date";
          }

          // ✅ Auto-calculate noOfDays = departureDate - arrivalDate
          if (inputs.arrivalDate && value) {
            const arrival = new Date(inputs.arrivalDate);
            const diffTime = departure - arrival;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // include both days

            if (diffDays <= 0) {
              error = "Departure must be after arrival date";
            } else if (diffDays > 7) {
              error = "Number of days must be between 1 and 7";
            } else {
              setInputs((prev) => ({ ...prev, noOfDays: diffDays }));
              setErrors((prev) => ({ ...prev, noOfDays: "" }));
            }
          }
        }
        break;

      case "noOfDays":
        if (value) {
          const days = parseInt(value);
          if (isNaN(days) || days <= 0) {
            error = "Must be greater than 0";
          } else if (days < 1 || days > 7) {
            error = "Number of days must be between 1 and 7";
          }

          // ✅ Auto-update departure date if arrival date is set
          if (inputs.arrivalDate && days >= 1 && days <= 7) {
            const arrival = new Date(inputs.arrivalDate);
            const newDeparture = new Date(arrival);
            newDeparture.setDate(arrival.getDate() + days - 1);
            setInputs((prev) => ({
              ...prev,
              departureDate: newDeparture.toISOString().substring(0, 10),
            }));
            setErrors((prev) => ({ ...prev, departureDate: "" }));
          }
        }
        break;

      default:
        break;
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleServiceChange = (service, checked) => {
    let selected = [...(inputs.selectedServices || [])];
    let servicesTotal = inputs.servicesTotal || 0;

    if (checked) {
      if (selected.length < 3) {
        selected.push(service.name);
        servicesTotal += service.price;
      }
    } else {
      selected = selected.filter((s) => s !== service.name);
      servicesTotal -= service.price;
    }

    setInputs((prev) => ({
      ...prev,
      selectedServices: selected,
      servicesTotal,
    }));
  };

  // --- Form Validation before submit ---
  const validateForm = () => {
    let newErrors = {};
    if (!inputs.name) newErrors.name = "Name is required";
    if (!inputs.relationship)
      newErrors.relationship = "Relationship is required";
    if (!inputs.address) newErrors.address = "Address is required";
    if (!inputs.phone) newErrors.phone = "Phone is required";
    if (!inputs.email) newErrors.email = "Email is required";
    if (!inputs.deceasedName)
      newErrors.deceasedName = "Deceased name is required";
    if (!inputs.dob) newErrors.dob = "Date of birth is required";
    if (!inputs.dod) newErrors.dod = "Date of death is required";
    if (!inputs.gender) newErrors.gender = "Gender is required";
    if (!inputs.religion) newErrors.religion = "Religion is required";
    if (!inputs.funeralType) newErrors.funeralType = "Funeral type is required";
    if (!inputs.funeralVenue)
      newErrors.funeralVenue = "Funeral venue is required";
    if (inputs.funeralVenue === "Other" && !inputs.otherVenue)
      newErrors.otherVenue = "Other venue is required";
    if (!inputs.noOfDays) newErrors.noOfDays = "Number of days is required";
    if (!inputs.cemetery) newErrors.cemetery = "Cemetery is required";
    if (!inputs.arrivalDate) newErrors.arrivalDate = "Arrival date is required";
    if (!inputs.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (!inputs.departureTime)
      newErrors.departureTime = "Departure time is required";
    if (!inputs.packageName)
      newErrors.packageName = "Package selection is required";

    // extra date checks
    if (inputs.dob && inputs.dod) {
      if (new Date(inputs.dob) >= new Date(inputs.dod)) {
        newErrors.dod = "Date of death must be after date of birth";
      }
    }
    if (inputs.dod && inputs.arrivalDate) {
      if (new Date(inputs.arrivalDate) < new Date(inputs.dod)) {
        newErrors.arrivalDate = "Arrival must be on/after date of death";
      }
    }
    if (inputs.arrivalDate && inputs.departureDate) {
      if (new Date(inputs.departureDate) < new Date(inputs.arrivalDate)) {
        newErrors.departureDate = "Departure must be on/after arrival date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/bookings/${id}`, inputs, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/bookingdetails");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update booking");
    }
  };

  if (loading || !inputs) {
    return (
      <div>
        <Nav />
        <p style={{ textAlign: "center" }}>Loading booking details...</p>
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <div className="update-form-wrapper">
        <h1 className="update-form-title">Update Booking</h1>

        <form onSubmit={handleSubmit}>
          {/* Personal */}
          <div className="card">
            <h3>Your Personal Details</h3>
            <div className="form-grid">
              <div>
                <label>Name *</label>
                <input
                  name="name"
                  value={inputs.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="error">{errors.name}</p>}
              </div>
              <div>
                <label>Relationship *</label>
                <input
                  name="relationship"
                  value={inputs.relationship}
                  onChange={handleChange}
                />
                {errors.relationship && (
                  <p className="error">{errors.relationship}</p>
                )}
              </div>
              <div>
                <label>Address *</label>
                <input
                  name="address"
                  value={inputs.address}
                  onChange={handleChange}
                />
                {errors.address && <p className="error">{errors.address}</p>}
              </div>
              <div>
                <label>Phone *</label>
                <input
                  name="phone"
                  value={inputs.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="error">{errors.phone}</p>}
              </div>
              <div>
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={inputs.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="error">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Deceased */}
          <div className="card">
            <h3>Deceased Person’s Details</h3>
            <div className="form-grid">
              <div>
                <label>Full Name *</label>
                <input
                  name="deceasedName"
                  value={inputs.deceasedName}
                  onChange={handleChange}
                />
                {errors.deceasedName && (
                  <p className="error">{errors.deceasedName}</p>
                )}
              </div>
              <div>
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={inputs.dob}
                  onChange={handleChange}
                />
                {errors.dob && <p className="error">{errors.dob}</p>}
              </div>
              <div>
                <label>Date of Death *</label>
                <input
                  type="date"
                  name="dod"
                  value={inputs.dod}
                  onChange={handleChange}
                />
                {errors.dod && <p className="error">{errors.dod}</p>}
              </div>
              <div>
                <label>Gender *</label>
                <select
                  name="gender"
                  value={inputs.gender}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="error">{errors.gender}</p>}
              </div>
              <div>
                <label>Religion *</label>
                <input
                  name="religion"
                  value={inputs.religion}
                  onChange={handleChange}
                />
                {errors.religion && <p className="error">{errors.religion}</p>}
              </div>
            </div>
          </div>

          {/* Funeral */}
          <div className="card">
            <h3>Funeral Details</h3>
            <div className="form-grid">
              <div>
                <label>Funeral Type *</label>
                <select
                  name="funeralType"
                  value={inputs.funeralType}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Burial">Burial</option>
                  <option value="Cremation">Cremation</option>
                </select>
                {errors.funeralType && (
                  <p className="error">{errors.funeralType}</p>
                )}
              </div>
              <div>
                <label>Funeral Venue *</label>
                <select
                  name="funeralVenue"
                  value={inputs.funeralVenue}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Hall of Tranquility">
                    Hall of Tranquility
                  </option>
                  <option value="Hall of Remembrance">
                    Hall of Remembrance
                  </option>
                  <option value="Hall of Eternity">Hall of Eternity</option>
                  <option value="Other">Other</option>
                </select>
                {errors.funeralVenue && (
                  <p className="error">{errors.funeralVenue}</p>
                )}
              </div>
              {inputs.funeralVenue === "Other" && (
                <div>
                  <label>Other Venue *</label>
                  <input
                    type="text"
                    name="otherVenue"
                    value={inputs.otherVenue || ""}
                    onChange={handleChange}
                  />
                  {errors.otherVenue && (
                    <p className="error">{errors.otherVenue}</p>
                  )}
                </div>
              )}
              <div>
                <label>Cemetery *</label>
                <input
                  name="cemetery"
                  value={inputs.cemetery}
                  onChange={handleChange}
                />
                {errors.cemetery && <p className="error">{errors.cemetery}</p>}
              </div>
              <div>
                <label>Arrival Date *</label>
                <input
                  type="date"
                  name="arrivalDate"
                  value={inputs.arrivalDate}
                  onChange={handleChange}
                />
                {errors.arrivalDate && (
                  <p className="error">{errors.arrivalDate}</p>
                )}
              </div>
              <div>
                <label>Departure Date *</label>
                <input
                  type="date"
                  name="departureDate"
                  value={inputs.departureDate}
                  onChange={handleChange}
                />
                {errors.departureDate && (
                  <p className="error">{errors.departureDate}</p>
                )}
              </div>
              <div>
                <label>Departure Time *</label>
                <input
                  type="time"
                  name="departureTime"
                  value={inputs.departureTime}
                  onChange={handleChange}
                />
                {errors.departureTime && (
                  <p className="error">{errors.departureTime}</p>
                )}
              </div>
              <div>
                <label>No of Days *</label>
                <input
                  type="number"
                  name="noOfDays"
                  value={inputs.noOfDays}
                  onChange={handleChange}
                  min="1"
                  max="7"
                  readOnly={
                    inputs.arrivalDate && inputs.departureDate ? true : false
                  }
                />
                {errors.noOfDays && <p className="error">{errors.noOfDays}</p>}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Special Requests</label>
                <textarea
                  name="requests"
                  value={inputs.requests}
                  onChange={handleChange}
                ></textarea>
              </div>
              {/* Availability Feedback */}
              {availabilityMsg && (
                <p
                  className={`availability-msg ${
                    availabilityMsg.startsWith("❌") ? "error" : "success"
                  }`}
                >
                  {availabilityMsg}
                </p>
              )}
              {checking && (
                <p className="checking-msg">🔄 Checking availability...</p>
              )}

              {/* Suggestions */}
              {Object.keys(suggestions).length > 0 && (
                <div className="suggestions-box">
                  {suggestions.halls?.length > 0 && (
                    <div>
                      <strong>🏛 Suggested Halls:</strong>
                      <ul>
                        {suggestions.halls.map((h) => (
                          <li
                            key={h}
                            className="clickable-suggestion"
                            onClick={() => handleSuggestionClick("hall", h)}
                          >
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {suggestions.dates?.length > 0 && (
                    <div>
                      <strong>📅 Suggested Dates:</strong>
                      <ul>
                        {suggestions.dates.map((d) => (
                          <li
                            key={d}
                            className="clickable-suggestion"
                            onClick={() => handleSuggestionClick("date", d)}
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Package */}
          <div className="card">
            <h3>Package & Services</h3>

            <div className="form-grid">
              <div>
                <label>Package Name *</label>
                <select
                  name="packageName"
                  value={inputs.packageName}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Serenity">Serenity</option>
                  <option value="Grace">Grace</option>
                  <option value="Eternity">Eternity</option>
                </select>
                {errors.packageName && (
                  <p className="error">{errors.packageName}</p>
                )}
              </div>
            </div>

            {inputs.packageName && (
              <>
                <label style={{ marginTop: "15px", display: "block" }}>
                  Additional Services (up to 3)
                </label>
                <div className="services-list">
                  {servicesByPackage[inputs.packageName].map((service, idx) => (
                    <div key={idx} className="service-item">
                      <span>{service.name}</span>
                      <div className="service-right">
                        <span className="service-price">
                          +LKR {service.price}
                        </span>
                        <input
                          type="checkbox"
                          checked={inputs.selectedServices?.includes(
                            service.name
                          )}
                          onChange={(e) =>
                            handleServiceChange(service, e.target.checked)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Summary Box */}
            <div className="price-summary">
              <p>
                Package Price: <span>LKR {inputs.packagePrice || 0}</span>
              </p>
              <p>
                Hall Price (× days): <span>LKR {inputs.hallPrice || 0}</span>
              </p>
              <p>
                Additional Services:{" "}
                <span>LKR {inputs.servicesTotal || 0}</span>
              </p>
              <h4>
                Total Price:{" "}
                <span className="total-price">
                  LKR {inputs.totalPrice || 0}
                </span>
              </h4>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`update-btn ${!canSubmit ? "disabled-btn" : ""}`}
            >
              Update Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateBooking;
