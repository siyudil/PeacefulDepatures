import React, { useState } from "react";
import Nav from "../../Nav/Nav";
import { useNavigate } from "react-router";
import axios from "axios";
import "./AddObituary.css";

function AddObituary() {
  const history = useNavigate();
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({
    name: "",
    nickName: "",
    DoB: "",
    DoD: "",
    Age: "",
    address: "",
    Fdate: "",
    Ftime: "",
    Fvenue: "",
    BorC: "",
    Tline: "",
    Msg: "",
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dobError, setDobError] = useState("");
  const [fdateError, setFdateError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate Age in years
      if (name === "DoB" || name === "DoD") {
        const dob = updated.DoB ? new Date(updated.DoB) : null;
        const dod = updated.DoD ? new Date(updated.DoD) : new Date();
        if (dob && dod) updated.Age = dod.getFullYear() - dob.getFullYear();

        if (dob && dod && dob > dod) {
          setDobError("Date of Birth must be earlier than Date of Passing");
        } else {
          setDobError("");
        }

        if (updated.Fdate) {
          const fdate = new Date(updated.Fdate);
          if (dod && fdate < dod) {
            setFdateError("Funeral Date cannot be earlier than Date of Passing");
          } else {
            setFdateError("");
          }
        }
      }

      if (name === "Fdate") {
        const fdate = new Date(value);
        const dod = updated.DoD ? new Date(updated.DoD) : new Date();
        if (dod && fdate < dod) {
          setFdateError("Funeral Date cannot be earlier than Date of Passing");
        } else {
          setFdateError("");
        }
      }

      return updated;
    });
  };

  const onImgChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleNext = () => {
    if (dobError || fdateError) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (dobError || fdateError) {
      alert("Please fix errors before submitting the form.");
      return;
    }

    const formData = new FormData();
    Object.entries(inputs).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (image) formData.append("image", image);

    try {
      await axios.post("http://localhost:5000/users", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("userName", inputs.name);
      history("/pending");
    } catch (err) {
      console.error("❌ Error adding obituary:", err);
      alert("Failed to submit obituary. Please try again.");
    }
  };

  return (
    <div className="add-obituary">
      <Nav />
      <div className="add-obituary-background">
      <div className="add-obituary-container">
        <h3>Add Obituary</h3>
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <form onSubmit={handleFormSubmit}>
          {/* Step indicators / helper text */}
          {step === 1 && (
            <p style={{marginTop: -10, marginBottom: 10, color: '#6b7280'}}>Step 1 of 3: Personal Information</p>
          )}
          {step === 2 && (
            <p style={{marginTop: -10, marginBottom: 10, color: '#6b7280'}}>Step 2 of 3: Tribute Details</p>
          )}
          {step === 3 && (
            <p style={{marginTop: -10, marginBottom: 10, color: '#6b7280'}}>Step 3 of 3: Funeral Information</p>
          )}
          {/* Step 1 - Personal Info */}
          {step === 1 && (
            <div className="form-step">
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={inputs.name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
              <label>Nick Name</label>
              <input
                type="text"
                name="nickName"
                value={inputs.nickName}
                onChange={handleChange}
                placeholder="Optional nickname"
              />
              <label>Date of Birth <span className="required">*</span></label>
              <input
                type="date"
                name="DoB"
                value={inputs.DoB}
                onChange={handleChange}
                required
              />
              <label>Date of Passing <span className="required">*</span></label>
              <input
                type="date"
                name="DoD"
                value={inputs.DoD}
                onChange={handleChange}
                required
              />
              {dobError && <p className="error-message">{dobError}</p>}
              <label>Age</label>
              <input type="number" name="Age" value={inputs.Age} readOnly placeholder="Auto-calculated" />
              <label>Address <span className="required">*</span></label>
              <input
                type="text"
                name="address"
                value={inputs.address}
                onChange={handleChange}
                placeholder="Residential address"
                required
              />
              <label>Upload Image</label>
              <input type="file" accept="image/*" onChange={onImgChange} />
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="hug-img" />
              )}
            </div>
          )}

          {/* Step 2 - Tribute Info */}
          {step === 2 && (
            <div className="form-step">
              <label>Tribute Line</label>
              <textarea
                name="Tline"
                value={inputs.Tline}
                onChange={handleChange}
                placeholder="Short tribute line..."
              />
              <label>Closing Message/Quote</label>
              <textarea
                name="Msg"
                value={inputs.Msg}
                onChange={handleChange}
                placeholder="Write a message..."
              />
            </div>
          )}

          {/* Step 3 - Funeral Info */}
          {step === 3 && (
            <div className="form-step">
              <label>Funeral Date <span className="required">*</span></label>
              <input
                type="date"
                name="Fdate"
                value={inputs.Fdate}
                onChange={handleChange}
                required
              />
              {fdateError && <p className="error-message">{fdateError}</p>}
              <label>Funeral Time <span className="required">*</span></label>
              <input
                type="time"
                name="Ftime"
                value={inputs.Ftime}
                onChange={handleChange}
                required
              />
              <label>Funeral Venue <span className="required">*</span></label>
              <input
                type="text"
                name="Fvenue"
                value={inputs.Fvenue}
                onChange={handleChange}
                placeholder="Venue name and address"
                required
              />
              <label>Burial or Cremation <span className="required">*</span></label>
              <select
                name="BorC"
                value={inputs.BorC}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Burial">Burial</option>
                <option value="Cremation">Cremation</option>
              </select>
            </div>
          )}

          <div className="form-navigation">
            {step > 1 && (
              <button type="button" onClick={handleBack}>
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  dobError !== "" ||
                  fdateError !== "" ||
                  (step === 1 && (
                    !inputs.name || !inputs.DoB || !inputs.DoD || !inputs.address
                  ))
                }
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={
                  fdateError !== "" ||
                  !inputs.Fdate || !inputs.Ftime || !inputs.Fvenue || !inputs.BorC
                }
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

export default AddObituary;
