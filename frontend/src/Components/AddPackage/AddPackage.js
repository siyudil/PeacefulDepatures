import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Add this import

// Admin components
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";

function AddPackage() {
  const navigate = useNavigate(); // Add this hook
  
  const [inputs, setInputs] = useState({
    name: "",
    PackageId: "",
    PackageType: "",
    description: "",
    PackagePrice: "", // Changed from BasePrice/FinalPrice to PackagePrice
    Duration: "",
    Availability: "Available",
    packageImage: null,
  });

  // Additional Services State
  const [additionalServices, setAdditionalServices] = useState([
    { id: 1, name: "Flower Arrangements", price: 0, included: false },
    { id: 2, name: "Transportation", price: 0, included: false },
    { id: 3, name: "Catering", price: 0, included: false },
    { id: 4, name: "Photography", price: 0, included: false },
    { id: 5, name: "Videography", price: 0, included: false },
  ]);

  // Pricing Calculation State
  const [pricing, setPricing] = useState({
    packagePrice: 0,
    servicesTotal: 0,
    subTotal: 0,
    discount: 0,
    grandTotal: 0,
  });

  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");

  // Generate Package ID on mount
  useEffect(() => {
    generatePackageId();
  }, []);

  // Calculate pricing dynamically - using useCallback to memoize the function
  const calculatePricing = useCallback(() => {
    const packagePrice = parseFloat(inputs.PackagePrice) || 0;
    
    // Calculate additional services total
    const servicesTotal = additionalServices
      .filter(service => service.included)
      .reduce((total, service) => total + (parseFloat(service.price) || 0), 0);
    
    // Calculate subtotal (package price + services)
    const subTotal = packagePrice + servicesTotal;
    
    // Apply 5% discount if any services are included
    const discount = servicesTotal > 0 ? subTotal * 0.05 : 0;
    
    // Calculate grand total
    const grandTotal = subTotal - discount;
    
    setPricing({
      packagePrice,
      servicesTotal,
      subTotal,
      discount,
      grandTotal,
    });
  }, [inputs.PackagePrice, additionalServices]);

  // Calculate pricing whenever package price or services change
  useEffect(() => {
    calculatePricing();
  }, [calculatePricing]); // Now calculatePricing is properly included in dependencies

  const generatePackageId = async () => {
    try {
      setGeneratingId(true);
      const response = await axios.get("http://localhost:5000/api/packages", {
        timeout: 10000,
      });
      
      let packages = [];
      if (Array.isArray(response.data)) packages = response.data;
      else if (Array.isArray(response.data?.data)) packages = response.data.data;
      else if (Array.isArray(response.data?.packages)) packages = response.data.packages;

      if (packages.length === 0) {
        setInputs(prev => ({ ...prev, PackageId: "PKG0001" }));
      } else {
        let highestNumber = 0;
        packages.forEach(pkg => {
          if (pkg.PackageId && pkg.PackageId.startsWith('PKG')) {
            const num = parseInt(pkg.PackageId.replace('PKG', '')) || 0;
            if (num > highestNumber) highestNumber = num;
          }
        });
        const nextId = `PKG${(highestNumber + 1).toString().padStart(4, '0')}`;
        setInputs(prev => ({ ...prev, PackageId: nextId }));
      }
    } catch (err) {
      console.error("Error generating Package ID:", err);
      // Fallback ID generation
      setInputs(prev => ({ ...prev, PackageId: `PKG${Date.now().toString().slice(-4)}` }));
    } finally {
      setGeneratingId(false);
    }
  };

  // Handle text input change
  const handleChange = e => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (error) setError(null);
  };

  // Handle image selection
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors(prev => ({ ...prev, packageImage: "Please select a valid image file" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, packageImage: "Image size must be less than 5MB" }));
      return;
    }

    setInputs(prev => ({ ...prev, packageImage: file }));
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    if (fieldErrors.packageImage) {
      setFieldErrors(prev => ({ ...prev, packageImage: "" }));
    }
  };

  const handleClearImage = () => {
    setInputs(prev => ({ ...prev, packageImage: null }));
    setImagePreview("");
    const fileInput = document.getElementById("packageImage");
    if (fileInput) fileInput.value = "";
  };

  // Toggle service inclusion
  const toggleService = (id) => {
    setAdditionalServices(prevServices =>
      prevServices.map(service =>
        service.id === id
          ? { ...service, included: !service.included }
          : service
      )
    );
  };

  // Update service price
  const updateServicePrice = (id, price) => {
    setAdditionalServices(prevServices =>
      prevServices.map(service =>
        service.id === id
          ? { ...service, price: parseFloat(price) || 0 }
          : service
      )
    );
  };

  // Frontend form validation
  const validateForm = () => {
    const errors = {};
    
    if (!inputs.name.trim()) errors.name = "Package Name is required";
    if (!inputs.PackageType) errors.PackageType = "Package Type is required";
    if (!inputs.description.trim()) errors.description = "Description is required";
    
    if (!inputs.PackagePrice || isNaN(inputs.PackagePrice) || Number(inputs.PackagePrice) <= 0) {
      errors.PackagePrice = "Package Price must be a positive number";
    }
    
    if (!inputs.Duration || isNaN(inputs.Duration) || Number(inputs.Duration) <= 0) {
      errors.Duration = "Duration must be a positive number of days";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      setError("Please fix the validation errors below");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", inputs.name.trim());
      formData.append("PackageId", inputs.PackageId);
      formData.append("PackageType", inputs.PackageType);
      formData.append("description", inputs.description.trim());
      formData.append("PackagePrice", Number(inputs.PackagePrice));
      formData.append("FinalPrice", Number(pricing.grandTotal)); // Send grand total as FinalPrice
      formData.append("Duration", Number(inputs.Duration));
      formData.append("Availability", inputs.Availability);
      
      // Add additional services data
      const includedServices = additionalServices.filter(service => service.included);
      formData.append("additionalServices", JSON.stringify(includedServices));
      formData.append("servicesTotal", pricing.servicesTotal);
      formData.append("subTotal", pricing.subTotal);
      formData.append("discount", pricing.discount);
      formData.append("grandTotal", pricing.grandTotal);
      
      if (inputs.packageImage) {
        formData.append("packageImage", inputs.packageImage);
      }

      const response = await axios.post(
        "http://localhost:5000/api/packages", 
        formData, 
        {
          headers: { 
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        alert("Package created successfully!");
        navigate("/packages"); // UPDATED: Use navigate instead of window.location.href
      } else {
        throw new Error(response.data.message || "Failed to create package");
      }
    } catch (err) {
      console.error("Create error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      // Handle different types of errors
      if (err.response?.data?.errors) {
        const backendErrors = {};
        Object.keys(err.response.data.errors).forEach(key => {
          backendErrors[key] = err.response.data.errors[key].message || err.response.data.errors[key];
        });
        setFieldErrors(backendErrors);
        setError("Please fix the validation errors below.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'NETWORK_ERROR' || err.code === 'ECONNREFUSED') {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else if (err.code === 'TIMEOUT') {
        setError("Request timeout. Please try again.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Use navigate for React Router navigation
  const handleCancel = () => {
    navigate("/packages"); // UPDATED: Use navigate instead of window.location.href
  };

  // UPDATED: Use navigate for React Router navigation
  const handleBackToPackages = () => {
    navigate("/packages"); // UPDATED: Use navigate instead of window.location.href
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          {/* Header with Back Button */}
          <div className="page-header">
            <div className="header-title-section">
              <h1>Add New Package</h1>
              <p className="required-note">Package Name, Package Type, and Description are required fields</p>
            </div>
            <button 
              className="btn btn-secondary back-to-packages-btn"
              onClick={handleBackToPackages}
            >
              ← Back to Packages
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form className="package-form" onSubmit={handleCreate}>
            {/* Image Upload Section */}
            <div className="form-section">
              <h3>Package Image</h3>
              <div className="form-group">
                <div className="file-upload-container">
                  <input 
                    type="file" 
                    id="packageImage" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <label htmlFor="packageImage" className="file-upload-label">
                    Choose File
                  </label>
                  <span className="file-name">
                    {inputs.packageImage ? inputs.packageImage.name : "No file chosen"}
                  </span>
                </div>
                {fieldErrors.packageImage && (
                  <div className="field-error">{fieldErrors.packageImage}</div>
                )}
                
                {imagePreview && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={imagePreview} alt="Package preview" />
                      <button 
                        type="button" 
                        className="btn btn-danger btn-remove" 
                        onClick={handleClearImage}
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Package Details Section */}
            <div className="form-section">
              <h3>Package Details</h3>
              
              <div className="form-group">
                <label htmlFor="name" className="required">Package Name</label>
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  placeholder="Enter package name" 
                  value={inputs.name} 
                  onChange={handleChange}
                  className={fieldErrors.name ? "error input-error" : ""}
                />
                {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="PackageId">Package ID</label>
                <input 
                  type="text" 
                  id="PackageId"
                  name="PackageId" 
                  value={generatingId ? "Generating..." : inputs.PackageId} 
                  readOnly 
                  className="readonly-input"
                />
                {generatingId && <div className="generating-text">Generating unique Package ID...</div>}
              </div>

              <div className="form-group">
                <label htmlFor="PackageType" className="required">Package Type</label>
                <select 
                  id="PackageType" 
                  name="PackageType" 
                  value={inputs.PackageType} 
                  onChange={handleChange}
                  className={fieldErrors.PackageType ? "error input-error" : ""}
                >
                  <option value="">Select Package Type</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </select>
                {fieldErrors.PackageType && <div className="field-error">{fieldErrors.PackageType}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="description" className="required">Description</label>
                <textarea 
                  id="description"
                  name="description" 
                  value={inputs.description} 
                  onChange={handleChange} 
                  placeholder="Enter package description" 
                  rows="4"
                  className={fieldErrors.description ? "error input-error" : ""}
                />
                {fieldErrors.description && <div className="field-error">{fieldErrors.description}</div>}
              </div>
            </div>

            {/* Package Pricing Section */}
            <div className="form-section">
              <h3>Package Pricing</h3>
              
              <div className="form-group">
                <label htmlFor="PackagePrice" className="required">Package Price (LKR)</label>
                <input 
                  type="number" 
                  id="PackagePrice"
                  name="PackagePrice" 
                  value={inputs.PackagePrice} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  min="0"
                  step="0.01"
                  className={fieldErrors.PackagePrice ? "error input-error" : ""}
                />
                {fieldErrors.PackagePrice && <div className="field-error">{fieldErrors.PackagePrice}</div>}
                <small className="form-help">Base package price without additional services</small>
              </div>

              <div className="form-group">
                <label htmlFor="Duration" className="required">Duration (days)</label>
                <input 
                  type="number" 
                  id="Duration"
                  name="Duration" 
                  value={inputs.Duration} 
                  onChange={handleChange} 
                  placeholder="Enter duration in days" 
                  min="1"
                  className={fieldErrors.Duration ? "error input-error" : ""}
                />
                {fieldErrors.Duration && <div className="field-error">{fieldErrors.Duration}</div>}
              </div>
            </div>

            {/* Additional Services Section */}
            <div className="form-section">
              <h3>Additional Services</h3>
              <p className="section-description">Select additional services to include in the package (5% discount applied when services are added)</p>
              
              <div className="services-list">
                {additionalServices.map(service => (
                  <div key={service.id} className="service-item">
                    <div className="service-checkbox">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={service.included}
                        onChange={() => toggleService(service.id)}
                      />
                      <label htmlFor={`service-${service.id}`}>{service.name}</label>
                    </div>
                    
                    {service.included && (
                      <div className="service-price">
                        <label>Price (LKR)</label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateServicePrice(service.id, e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="price-summary">
                <div className="summary-row">
                  <span>Package Price:</span>
                  <span>Rs. {pricing.packagePrice.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Additional Services:</span>
                  <span>Rs. {pricing.servicesTotal.toFixed(2)}</span>
                </div>
                
                <div className="summary-row subtotal">
                  <span>Subtotal:</span>
                  <span>Rs. {pricing.subTotal.toFixed(2)}</span>
                </div>
                
                {pricing.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount (5%):</span>
                    <span>- Rs. {pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="summary-row grand-total">
                  <span><strong>Grand Total:</strong></span>
                  <span><strong>Rs. {pricing.grandTotal.toFixed(2)}</strong></span>
                </div>
                
                {pricing.discount > 0 && (
                  <div className="discount-note">
                    <small>🎉 5% discount applied for including additional services!</small>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || generatingId}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating Package...
                  </>
                ) : (
                  "Create Package"
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPackage;


