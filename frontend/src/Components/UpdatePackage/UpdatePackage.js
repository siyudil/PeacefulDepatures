import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";
import "./UpdatePackage.css";

function UpdatePackage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    packageName: "",
    packageId: "",
    packageType: "",
    description: "",
    packagePrice: "", // Changed from basePrice to packagePrice in LKR
    finalPrice: "",
    duration: "",
    availability: "Available",
    packageImage: null,
    features: [],
    discount: "",
    isFeatured: false,
    serviceCategory: "",
    tags: []
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newFeature, setNewFeature] = useState("");

  const API_URL = "http://localhost:5000/api/packages";

  // Service categories and package types
  const serviceCategories = [
    "Funeral Service",
    "Memorial Service",
    "Cremation Service",
    "Burial Service",
    "Traditional Service",
    "Premium Service"
  ];

  const packageTypes = [
    "Basic",
    "Standard", 
    "Premium",
    "Luxury",
    "Custom"
  ];

  // Predefined tags for quick selection
  const predefinedTags = [
    "Traditional", "Modern", "Eco-Friendly", "Religious", "Non-Religious",
    "Urgent", "Budget", "Premium", "Customizable", "All-Inclusive"
  ];

  // Predefined features for quick selection
  const predefinedFeatures = [
    "Flower Arrangements", "Transportation", "Catering Services", 
    "Funeral Director", "Casket Selection", "Urn Selection",
    "Memorial Cards", "Obituary Publishing", "Grave Site Preparation",
    "Cremation Services", "Embalming", "Viewing Room",
    "Chapel Service", "Graveside Service", "Aftercare Support"
  ];

  // Fetch package details
  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        setFetchLoading(true);
        setError("");

        console.log("🔄 Fetching package with MongoDB ID:", id);

        const response = await axios.get(`${API_URL}/${id}`);
        console.log("📦 API Response:", response.data);
        
        if (response.data.success && response.data.package) {
          const packageData = response.data.package;
          console.log("✅ Package data found:", packageData);
          populateFormData(packageData);
        } else {
          setError("Package not found or invalid response");
        }
      } catch (err) {
        console.error("❌ Error fetching package:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch package details";
        setError(errorMessage);
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchPackageDetails();
    } else {
      setError("No package ID provided");
      setFetchLoading(false);
    }
  }, [id]);

  const populateFormData = (pkg) => {
    console.log("📝 Populating form with package data:", pkg);
    
    const populatedData = {
      packageName: pkg.packageName || pkg.PackageName || "",
      packageId: pkg.packageId || pkg.PackageId || "",
      packageType: pkg.packageType || pkg.PackageType || "",
      description: pkg.description || pkg.Description || "",
      packagePrice: pkg.packagePrice?.toString() || pkg.PackagePrice?.toString() || pkg.basePrice?.toString() || pkg.BasePrice?.toString() || "",
      finalPrice: pkg.finalPrice?.toString() || pkg.FinalPrice?.toString() || "",
      duration: pkg.duration?.toString() || pkg.Duration?.toString() || "",
      availability: pkg.availability || pkg.Availability || "Available",
      packageImage: null,
      features: pkg.features || [],
      discount: pkg.discount?.toString() || "",
      isFeatured: pkg.isFeatured || false,
      serviceCategory: pkg.serviceCategory || "",
      tags: pkg.tags || []
    };

    console.log("🎯 Form data after population:", populatedData);
    setFormData(populatedData);
    
    // Set existing image for preview
    if (pkg.packageImage || pkg.PackageImage) {
      setExistingImage(pkg.packageImage || pkg.PackageImage);
      setImagePreview(pkg.packageImage || pkg.PackageImage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (error) setError("");
  };

  // Feature management - UPDATED TO MATCH TAGS FUNCTIONALITY
  const handleAddFeature = (feature) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({ ...prev, features: [...prev.features, feature] }));
    }
    setNewFeature("");
  };

  const handleRemoveFeature = (featureToRemove) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }));
  };

  const handlePredefinedFeatureClick = (feature) => {
    handleAddFeature(feature);
  };

  // Tag management
  const handleAddTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePredefinedTagClick = (tag) => {
    handleAddTag(tag);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file (JPEG, PNG, GIF)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      // Clean filename
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const cleanFile = new File([file], cleanFileName, { type: file.type });

      setFormData(prev => ({ ...prev, packageImage: cleanFile }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(cleanFile);
      
      if (error) setError("");
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, packageImage: null }));
    setImagePreview(existingImage);
  };

  // Calculate discount percentage
  const calculateDiscount = () => {
    const base = parseFloat(formData.packagePrice);
    const final = parseFloat(formData.finalPrice);
    if (base > 0 && final < base) {
      return Math.round(((base - final) / base) * 100);
    }
    return 0;
  };

  const validateForm = () => {
    if (!formData.packageName.trim()) return "Package name is required";
    if (!formData.packageId.trim()) return "Package ID is required";
    if (!formData.packageType.trim()) return "Package type is required";
    if (!formData.serviceCategory.trim()) return "Service category is required";

    const packagePrice = Number(formData.packagePrice);
    const finalPrice = Number(formData.finalPrice);
    const duration = Number(formData.duration);

    if (isNaN(packagePrice) || packagePrice <= 0) return "Package price must be a positive number";
    if (isNaN(finalPrice) || finalPrice <= 0) return "Final price must be a positive number";
    if (finalPrice > packagePrice) return "Final price cannot be greater than package price";
    if (isNaN(duration) || duration < 1) return "Duration must be at least 1 day";

    // Validate features
    if (formData.features.length === 0) return "At least one feature is required";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      console.log("🔄 Starting update process for package ID:", id);

      // Append all form data
      const formFields = [
        "packageName", "packageId", "packageType", "description", 
        "packagePrice", "finalPrice", "duration", "availability",
        "discount", "isFeatured", "serviceCategory"
      ];

      formFields.forEach(field => {
        submitData.append(field, formData[field]);
      });

      // Append features as JSON array
      submitData.append("features", JSON.stringify(formData.features));

      // Append tags as JSON array
      submitData.append("tags", JSON.stringify(formData.tags));

      // Append image if selected
      if (formData.packageImage instanceof File) {
        submitData.append("packageImage", formData.packageImage);
      }

      const response = await axios.put(`${API_URL}/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000,
      });
      
      console.log("✅ Update response received!");
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/packages");
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to update package");
      }
    } catch (err) {
      console.error("❌ UPDATE ERROR:", err);
      
      let errorMessage = "Failed to update package. ";
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      navigate("/packages");
    }
  };

  const handleBackToPackages = () => {
    navigate("/packages");
  };

  const discountPercentage = calculateDiscount();

  if (fetchLoading) {
    return (
      <div className="admin-dashboard">
        <AdminHeader />
        <div className="admin-body">
          <AdminSidebar />
          <div className="admin-content loading-center">
            <div className="loading-spinner"></div>
            <p>Loading package details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <div className="update-package-container">
            <div className="page-header">
              <div className="header-title-section">
                <h1>Update Package</h1>
                <p className="required-note">Package Name, Package Type, and Service Category are required fields</p>
              </div>
              <button 
                onClick={handleBackToPackages}
                className="btn btn-secondary back-to-packages-btn"
              >
                ← Back to Packages
              </button>
            </div>

            {success && (
              <div className="alert alert-success">
                ✅ Package updated successfully! Redirecting...
              </div>
            )}
            
            {error && (
              <div className="alert alert-error">
                <strong>⚠️ Error:</strong> {error}
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={() => setError("")} 
                    className="btn-retry"
                    style={{ marginRight: '10px' }}
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="btn-retry"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="package-form">
              {/* Basic Information Section */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="required">Package Name</label>
                    <input
                      type="text"
                      name="packageName"
                      value={formData.packageName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter package name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="required">Package ID</label>
                    <input
                      type="text"
                      name="packageId"
                      value={formData.packageId}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter package ID"
                      readOnly
                      className="readonly-input"
                    />
                    <small className="help-text">Package ID cannot be changed</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="required">Package Type</label>
                    <select
                      name="packageType"
                      value={formData.packageType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select package type</option>
                      {packageTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="required">Service Category</label>
                    <select
                      name="serviceCategory"
                      value={formData.serviceCategory}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select category</option>
                      {serviceCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter detailed package description..."
                  />
                </div>
              </div>

              {/* Pricing & Duration Section - UPDATED FOR LKR */}
              <div className="form-section">
                <h3>Pricing & Duration</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="required">Package Price (LKR)</label>
                    <input
                      type="number"
                      name="packagePrice"
                      value={formData.packagePrice}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <small className="help-text">Base package price in Sri Lankan Rupees</small>
                  </div>

                  <div className="form-group">
                    <label className="required">Final Price (LKR)</label>
                    <input
                      type="number"
                      name="finalPrice"
                      value={formData.finalPrice}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <small className="help-text">Final price after discounts in Sri Lankan Rupees</small>
                  </div>

                  <div className="form-group">
                    <label className="required">Duration (days)</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      min="1"
                      placeholder="Enter duration in days"
                    />
                  </div>
                </div>

                {discountPercentage > 0 && (
                  <div className="discount-display">
                    <span className="discount-text">
                      🎯 Discount: {discountPercentage}% (Save Rs. {(formData.packagePrice - formData.finalPrice).toFixed(2)})
                    </span>
                  </div>
                )}
              </div>

              {/* Features Section - UPDATED TO MATCH TAGS STYLING */}
              <div className="form-section">
                <h3>Package Features</h3>
                
                <div className="form-group">
                  <label>Add Features</label>
                  <div className="feature-input-container">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature(newFeature))}
                      placeholder="Type a feature and press Enter (e.g., Flower arrangements, Transportation, etc.)"
                      className="feature-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFeature(newFeature)}
                      className="btn-add-feature"
                    >
                      Add Feature
                    </button>
                  </div>
                  
                  {/* Predefined Features */}
                  <div className="predefined-features">
                    <label>Quick Features:</label>
                    <div className="feature-buttons">
                      {predefinedFeatures.map(feature => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => handlePredefinedFeatureClick(feature)}
                          className="feature-button"
                          disabled={formData.features.includes(feature)}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Features */}
                  {formData.features.length > 0 && (
                    <div className="selected-features">
                      <label>Selected Features:</label>
                      <div className="features-container">
                        {formData.features.map(feature => (
                          <span key={feature} className="feature-tag">
                            {feature}
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(feature)}
                              className="feature-remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags Section */}
              <div className="form-section">
                <h3>Tags & Categorization</h3>
                
                <div className="form-group">
                  <label>Add Tags</label>
                  <div className="tag-input-container">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newTag))}
                      placeholder="Type a tag and press Enter"
                      className="tag-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(newTag)}
                      className="btn-add-tag"
                    >
                      Add Tag
                    </button>
                  </div>
                  
                  {/* Predefined Tags */}
                  <div className="predefined-tags">
                    <label>Quick Tags:</label>
                    <div className="tag-buttons">
                      {predefinedTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handlePredefinedTagClick(tag)}
                          className="tag-button"
                          disabled={formData.tags.includes(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="selected-tags">
                      <label>Selected Tags:</label>
                      <div className="tags-container">
                        {formData.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="tag-remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image & Settings Section */}
              <div className="form-section">
                <h3>Image & Settings</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Package Image</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleImageChange}
                    />
                    <small className="help-text">
                      Select a new image to update (optional). Supports: JPEG, PNG, GIF • Max 5MB
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleInputChange}
                      />
                      ⭐ Mark as Featured Package
                    </label>
                    <small className="help-text">Featured packages will be highlighted on the website</small>
                  </div>
                </div>

                {imagePreview && (
                  <div className="form-group">
                    <label>Image Preview</label>
                    <div className="image-preview">
                      <img src={imagePreview} alt="Package preview" />
                      <button 
                        type="button" 
                        onClick={removeImage}
                        className="btn-remove-image"
                      >
                        Remove New Image
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Availability</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                    >
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Updating Package...
                    </>
                  ) : (
                    "Update Package"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdatePackage;


