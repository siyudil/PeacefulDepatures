import React, { useState, useEffect, useMemo, useCallback } from "react";
import Nav from "../../Nav/Nav";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddBooking.css";

const packagePrices = { Serenity: 100000, Grace: 200000, Eternity: 400000 };
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

const HALLS = [
  "Hall of Tranquility",
  "Hall of Remembrance",
  "Hall of Eternity",
];
const PACKAGES = ["Serenity", "Grace", "Eternity"];
const MAX_BOOKINGS_PER_DAY = 5;
const MAX_PACKAGE_SETS_PER_DAY = 5; // daily
const MAX_PACKAGE_TOTAL_SETS = 10; // limit per package

function AddBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [suggestions, setSuggestions] = useState({});
  const [highlight, setHighlight] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);
  const [checking, setChecking] = useState(false);
  const [inputs, setInputs] = useState({
    name: "",
    relationship: "",
    address: "",
    phone: "",
    email: "",
    deceasedName: "",
    dob: "",
    dod: "",
    gender: "",
    religion: "",
    funeralType: "",
    funeralVenue: "",
    otherVenue: "",
    noOfDays: "",
    cemetery: "",
    arrivalDate: "",
    departureDate: "",
    departureTime: "",
    requests: "",
    packageName: "",
    selectedServices: [],
    servicesTotal: 0,
    packagePrice: 0,
    hallPrice: 0,
    totalPrice: 0,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:5000/bookings")
      .then((res) => setBookings(res.data.bookings || []))
      .catch(() => {});
  }, []);

  // --- Price Calculation ---
  const { packagePrice, hallPrice, totalPrice } = useMemo(() => {
    const packagePrice = inputs.packageName
      ? packagePrices[inputs.packageName]
      : 0;
    let hallPrice = 0;
    if (inputs.funeralVenue && hallPrices[inputs.funeralVenue]) {
      const days = parseInt(inputs.noOfDays || 0, 10);
      if (days > 0) hallPrice = hallPrices[inputs.funeralVenue] * days;
    }
    const servicesTotal = inputs.servicesTotal || 0;
    const totalPrice = packagePrice + hallPrice + servicesTotal;
    return { packagePrice, hallPrice, totalPrice };
  }, [
    inputs.packageName,
    inputs.funeralVenue,
    inputs.noOfDays,
    inputs.servicesTotal,
  ]);

  useEffect(() => {
    setInputs((prev) => ({
      ...prev,
      packagePrice,
      hallPrice,
      totalPrice,
    }));
  }, [packagePrice, hallPrice, totalPrice]);

  // Expand booking dates for checking overlapping days
  const expandBookingDates = (b) => {
    const out = [];
    if (!b.arrivalDate || !b.departureDate) return out;
    const start = new Date(b.arrivalDate);
    const end = new Date(b.departureDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().substring(0, 10));
    }
    return out;
  };

  // Create hall and package availability maps
  const availabilityMaps = useMemo(() => {
    const dailyCounts = {};
    const hallCounts = {};
    const packageCounts = {};
    bookings.forEach((b) => {
      expandBookingDates(b).forEach((iso) => {
        dailyCounts[iso] = (dailyCounts[iso] || 0) + 1;
        hallCounts[iso] = hallCounts[iso] || {};
        const hall =
          b.funeralVenue === "Other" ? b.otherVenue || "Other" : b.funeralVenue;
        hallCounts[iso][hall] = (hallCounts[iso][hall] || 0) + 1;
        packageCounts[iso] = packageCounts[iso] || {};
        const pkg = b.packageName || "Unknown";
        packageCounts[iso][pkg] = (packageCounts[iso][pkg] || 0) + 1;
      });
    });
    return { dailyCounts, hallCounts, packageCounts };
  }, [bookings]);

  // ✅ Real-time backend-based availability check
const checkAvailability = useCallback(
  async (override = {}) => {
    // merge latest inputs with any immediate overrides
    const vals = { ...inputs, ...override };
    const {
      arrivalDate,
      departureDate,
      funeralVenue,
      otherVenue,
      packageName, // optional; backend allows check without it
    } = vals;

    // only evaluate when the date + hall fields are set
    if (!arrivalDate || !departureDate || !funeralVenue) {
      setAvailabilityMsg("");
      setSuggestions({});
      setHighlight("");
      setCanSubmit(false);
      return;
    }

    try {
      setChecking(true);
      // clear the old message immediately so it doesn't "stick"
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
        {
          arrivalDate,
          departureDate,
          funeralVenue,
          otherVenue,
          packageName, // may be undefined; backend handles it
        },
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

  // ✅ When user clicks a suggested hall or date, auto-fill and recheck
 const handleSuggestionClick = (type, value) => {
  if (type === "hall") {
    const override =
      value === "Other"
        ? { funeralVenue: "Other", otherVenue: "Other" }
        : { funeralVenue: value, otherVenue: "" };

    // update state
    setInputs(prev => ({ ...prev, ...override }));
    // ✅ recheck immediately with the override (no second click needed)
    checkAvailability(override);
  }

  if (type === "date") {
    const override = { arrivalDate: value, departureDate: value };
    setInputs(prev => ({ ...prev, ...override }));
    // ✅ recheck immediately with the override
    checkAvailability(override);
  }
};


  // 🩵 Force refresh availability UI while user is on Step 3
  useEffect(() => {
    if (step === 3) {
      checkAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    inputs.arrivalDate,
    inputs.departureDate,
    inputs.funeralVenue,
    inputs.otherVenue,
    inputs.packageName,
  ]);

  // 🩵 Force re-render of Step 3 when async check finishes (ensures message visible immediately)
  useEffect(() => {
    if (availabilityMsg && step === 3) {
      setStep((prev) => (prev === 3 ? 3 : prev));
    }
  }, [availabilityMsg, step]);

  // --- Inline Validation ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));

    // Real-time check when relevant fields change
    if (
      [
        "arrivalDate",
        "departureDate",
        "funeralVenue",
        "packageName",
        "otherVenue",
      ].includes(name)
    ) {
      setTimeout(() => {
        checkAvailability();
      }, 200);
    }

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
        if (!letterRegex.test(value)) error = "Must contain only letters";
        break;

      case "address":
      case "otherVenue":
      case "cemetery":
        if (!addressRegex.test(value)) error = "Invalid characters entered";
        break;

      case "phone":
        if (!phoneRegex.test(value))
          error = "Must be 10 digits and start with 0";
        break;

      case "email":
        if (!emailRegex.test(value)) error = "Invalid email format";
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

    setErrors((prev) => ({ ...prev, [name]: error }));
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

  // --- Step Validation ---
  const validateStep = () => {
    let newErrors = {};
    if (step === 1) {
      if (!inputs.name) newErrors.name = "Name is required";
      if (!inputs.relationship)
        newErrors.relationship = "Relationship is required";
      if (!inputs.address) newErrors.address = "Address is required";
      if (!inputs.phone) newErrors.phone = "Phone is required";
      if (!inputs.email) newErrors.email = "Email is required";
    }
    if (step === 2) {
      if (!inputs.deceasedName)
        newErrors.deceasedName = "Deceased name is required";
      if (!inputs.dob) newErrors.dob = "Date of birth is required";
      if (!inputs.dod) newErrors.dod = "Date of death is required";
      if (!inputs.gender) newErrors.gender = "Gender is required";
      if (!inputs.religion) newErrors.religion = "Religion is required";

      // ✅ Extra check: DOB < DOD
      if (inputs.dob && inputs.dod) {
        const dob = new Date(inputs.dob);
        const dod = new Date(inputs.dod);
        if (dob >= dod) {
          newErrors.dod = "Date of death must be after date of birth";
        }
      }
    }
    if (step === 3) {
      if (!inputs.funeralType)
        newErrors.funeralType = "Funeral type is required";
      if (!inputs.funeralVenue)
        newErrors.funeralVenue = "Funeral venue is required";
      if (inputs.funeralVenue === "Other" && !inputs.otherVenue)
        newErrors.otherVenue = "Other venue is required";
      if (!inputs.noOfDays) newErrors.noOfDays = "Number of days is required";
      if (!inputs.cemetery) newErrors.cemetery = "Cemetery is required";
      if (!inputs.arrivalDate)
        newErrors.arrivalDate = "Arrival date is required";
      if (!inputs.departureDate)
        newErrors.departureDate = "Departure date is required";
      if (!inputs.departureTime)
        newErrors.departureTime = "Departure time is required";

      // ✅ Extra check: Arrival ≥ DOD
      if (inputs.dod && inputs.arrivalDate) {
        if (new Date(inputs.arrivalDate) < new Date(inputs.dod)) {
          newErrors.arrivalDate = "Arrival must be on/after date of death";
        }
      }

      // ✅ Extra check: Departure ≥ Arrival
      if (inputs.arrivalDate && inputs.departureDate) {
        if (new Date(inputs.departureDate) < new Date(inputs.arrivalDate)) {
          newErrors.departureDate = "Departure must be on/after arrival date";
        }
      }
    }
    if (step === 4) {
      if (!inputs.packageName)
        newErrors.packageName = "Package selection is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 4));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    try {
      await axios.post("http://localhost:5000/bookings", inputs, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate("/bookingdetails");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add booking");
    }
  };

  return (
    <div>
      <Nav />
      <div className="form-wrapper">
        <h1 className="form-title">Funeral Booking</h1>

        {/* Progress bar */}
        <div className="progressbar">
          <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
          <div className={`line ${step >= 2 ? "active" : ""}`}></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
          <div className={`line ${step >= 3 ? "active" : ""}`}></div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>3</div>
          <div className={`line ${step >= 4 ? "active" : ""}`}></div>
          <div className={`step ${step >= 4 ? "active" : ""}`}>4</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1 */}
          {step === 1 && (
            <div className="form-section">
              <h2>Your Personal Details</h2>
              <div className="form-grid">
                <div>
                  <label>
                    Name<span className="required">*</span>
                  </label>
                  <input
                    name="name"
                    value={inputs.name}
                    onChange={handleChange}
                    className={errors.name ? "error-border" : ""}
                  />
                  {errors.name && <p className="error">{errors.name}</p>}
                </div>
                <div>
                  <label>
                    Relationship<span className="required">*</span>
                  </label>
                  <input
                    name="relationship"
                    value={inputs.relationship}
                    onChange={handleChange}
                    className={errors.relationship ? "error-border" : ""}
                  />
                  {errors.relationship && (
                    <p className="error">{errors.relationship}</p>
                  )}
                </div>
                <div>
                  <label>
                    Address<span className="required">*</span>
                  </label>
                  <input
                    name="address"
                    value={inputs.address}
                    onChange={handleChange}
                    className={errors.address ? "error-border" : ""}
                  />
                  {errors.address && <p className="error">{errors.address}</p>}
                </div>
                <div>
                  <label>
                    Phone<span className="required">*</span>
                  </label>
                  <input
                    name="phone"
                    value={inputs.phone}
                    onChange={handleChange}
                    className={errors.phone ? "error-border" : ""}
                  />
                  {errors.phone && <p className="error">{errors.phone}</p>}
                </div>
                <div>
                  <label>
                    Email<span className="required">*</span>
                  </label>
                  <input
                    name="email"
                    value={inputs.email}
                    onChange={handleChange}
                    className={errors.email ? "error-border" : ""}
                  />
                  {errors.email && <p className="error">{errors.email}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="form-section">
              <h2>Deceased Person’s Details</h2>
              <div className="form-grid">
                <div>
                  <label>
                    Full Name<span className="required">*</span>
                  </label>
                  <input
                    name="deceasedName"
                    value={inputs.deceasedName}
                    onChange={handleChange}
                    className={errors.deceasedName ? "error-border" : ""}
                  />
                  {errors.deceasedName && (
                    <p className="error">{errors.deceasedName}</p>
                  )}
                </div>
                <div>
                  <label>
                    Date of Birth<span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={inputs.dob}
                    onChange={handleChange}
                    className={errors.dob ? "error-border" : ""}
                  />
                  {errors.dob && <p className="error">{errors.dob}</p>}
                </div>
                <div>
                  <label>
                    Date of Death<span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="dod"
                    value={inputs.dod}
                    onChange={handleChange}
                    className={errors.dod ? "error-border" : ""}
                  />
                  {errors.dod && <p className="error">{errors.dod}</p>}
                </div>
                <div>
                  <label>
                    Gender<span className="required">*</span>
                  </label>
                  <select
                    name="gender"
                    value={inputs.gender}
                    onChange={handleChange}
                    className={errors.gender ? "error-border" : ""}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className="error">{errors.gender}</p>}
                </div>
                <div>
                  <label>
                    Religion<span className="required">*</span>
                  </label>
                  <input
                    name="religion"
                    value={inputs.religion}
                    onChange={handleChange}
                    className={errors.religion ? "error-border" : ""}
                  />
                  {errors.religion && (
                    <p className="error">{errors.religion}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div
              className="form-section"
              key={`${inputs.arrivalDate}-${inputs.departureDate}-${inputs.funeralVenue}-${inputs.packageName}`}
            >
              <h2>Funeral Details</h2>
              <div className="form-grid">
                <div>
                  <label>
                    Funeral Type<span className="required">*</span>
                  </label>
                  <select
                    name="funeralType"
                    value={inputs.funeralType}
                    onChange={handleChange}
                    className={errors.funeralType ? "error-border" : ""}
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
                  <label>
                    Funeral Venue<span className="required">*</span>
                  </label>
                  <select
                    name="funeralVenue"
                    value={inputs.funeralVenue}
                    onChange={handleChange}
                    className={errors.funeralVenue ? "error-border" : ""}
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
                    <label>
                      Other Venue<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="otherVenue"
                      value={inputs.otherVenue}
                      onChange={handleChange}
                      className={errors.otherVenue ? "error-border" : ""}
                    />
                    {errors.otherVenue && (
                      <p className="error">{errors.otherVenue}</p>
                    )}
                  </div>
                )}
                <div>
                  <label>
                    Cemetery<span className="required">*</span>
                  </label>
                  <input
                    name="cemetery"
                    value={inputs.cemetery}
                    onChange={handleChange}
                    className={errors.cemetery ? "error-border" : ""}
                  />
                  {errors.cemetery && (
                    <p className="error">{errors.cemetery}</p>
                  )}
                </div>
                <div>
                  <label>
                    Arrival Date<span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="arrivalDate"
                    value={inputs.arrivalDate}
                    onChange={handleChange}
                    className={`${errors.arrivalDate ? "error-border" : ""} ${
                      highlight === "error"
                        ? "glow-error"
                        : highlight === "success"
                        ? "glow-success"
                        : ""
                    }`}
                  />
                  {errors.arrivalDate && (
                    <p className="error">{errors.arrivalDate}</p>
                  )}
                </div>
                <div>
                  <label>
                    Departure Date<span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={inputs.departureDate}
                    onChange={handleChange}
                    className={`${errors.departureDate ? "error-border" : ""} ${
                      highlight === "error"
                        ? "glow-error"
                        : highlight === "success"
                        ? "glow-success"
                        : ""
                    }`}
                  />
                  {errors.departureDate && (
                    <p className="error">{errors.departureDate}</p>
                  )}
                </div>
                <div>
                  <label>
                    Departure Time<span className="required">*</span>
                  </label>
                  <input
                    type="time"
                    name="departureTime"
                    value={inputs.departureTime}
                    onChange={handleChange}
                    className={errors.departureTime ? "error-border" : ""}
                  />
                  {errors.departureTime && (
                    <p className="error">{errors.departureTime}</p>
                  )}
                </div>
                <div>
                  <label>
                    No of Days<span className="required">*</span>
                  </label>
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
                    className={errors.noOfDays ? "error-border" : ""}
                  />
                  {errors.noOfDays && (
                    <p className="error">{errors.noOfDays}</p>
                  )}
                </div>
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
                      <strong>🏛️ Suggested Halls:</strong>
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
              <label>Special Requests</label>
              <textarea
                name="requests"
                value={inputs.requests}
                onChange={handleChange}
              ></textarea>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="form-section">
              <h2>Package & Services</h2>
              <label>
                Package Name<span className="required">*</span>
              </label>
              <select
                name="packageName"
                value={inputs.packageName}
                onChange={handleChange}
                className={errors.packageName ? "error-border" : ""}
              >
                <option value="">Select</option>
                <option value="Serenity">Serenity</option>
                <option value="Grace">Grace</option>
                <option value="Eternity">Eternity</option>
              </select>
              {errors.packageName && (
                <p className="error">{errors.packageName}</p>
              )}

              {inputs.packageName && (
                <div>
                  <label>Additional Services (up to 3)</label>
                  {servicesByPackage[inputs.packageName].map((service, idx) => (
                    <div key={idx} className="service-row">
                      <span className="service-name">{service.name}</span>
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
                  ))}
                </div>
              )}
              <div className="price-summary">
                <div className="price-row">
                  <span>Package Price:</span>
                  <span>LKR {inputs.packagePrice || 0}</span>
                </div>
                <div className="price-row">
                  <span>Hall Price (× days):</span>
                  <span>LKR {inputs.hallPrice || 0}</span>
                </div>
                <div className="price-row">
                  <span>Additional Services:</span>
                  <span>LKR {inputs.servicesTotal || 0}</span>
                </div>
                <div className="price-row total">
                  <span>Total Price:</span>
                  <span>LKR {inputs.totalPrice || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-navigation">
            {step > 1 && (
              <button type="button" onClick={prevStep}>
                Previous
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={nextStep}>
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                className={!canSubmit ? "disabled-btn" : ""}
              >
                Submit Booking
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBooking;
