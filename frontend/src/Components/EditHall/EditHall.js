// src/components/EditHall/EditHall.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../Nav/Nav";

import { 
  FaSave, 
  FaArrowLeft, 
  FaTrash, 
  FaPlus, 
  FaTimes,
  FaImage,
  FaHome,
  FaEye
} from "react-icons/fa";
import "./EditHall.css";

function EditHall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000/api";

  const [formData, setFormData] = useState({
    hallName: "",
    hallPrice: "",
    capacity: "",
    openingHours: "",
    hallType: "",
    description: "",
    isAvailable: true,
    isFeatured: false,
    features: [],
    location: {
      address: "",
      city: "",
      district: "",
      coordinates: {
        lat: "",
        lng: ""
      }
    },
    facilities: {
      parking: false,
      ac: false,
      generator: false,
      wifi: false,
      soundSystem: false
    },
    images: [],
    tags: [],
    specialNotes: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");
  const [previewImages, setPreviewImages] = useState([]);

  // Fetch hall data
  useEffect(() => {
    fetchHallData();
  }, [id]);

  const fetchHallData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/halls/${id}`);
      
      if (response.data.success) {
        const hall = response.data.hall;
        
        // Set form data with proper defaults
        setFormData({
          hallName: hall.hallName || "",
          hallPrice: hall.hallPrice || "",
          capacity: hall.capacity || "",
          openingHours: hall.openingHours || "",
          hallType: hall.hallType || "",
          description: hall.description || "",
          isAvailable: hall.isAvailable !== undefined ? hall.isAvailable : true,
          isFeatured: hall.isFeatured || false,
          features: hall.features || [],
          location: {
            address: hall.location?.address || "",
            city: hall.location?.city || "",
            district: hall.location?.district || "",
            coordinates: {
              lat: hall.location?.coordinates?.lat || "",
              lng: hall.location?.coordinates?.lng || ""
            }
          },
          facilities: {
            parking: hall.facilities?.parking || false,
            ac: hall.facilities?.ac || false,
            generator: hall.facilities?.generator || false,
            wifi: hall.facilities?.wifi || false,
            soundSystem: hall.facilities?.soundSystem || false
          },
          images: hall.images || [],
          tags: hall.tags || [],
          specialNotes: hall.specialNotes || ""
        });

        setPreviewImages(hall.images || []);
        setError("");
      } else {
        setError("Failed to fetch hall data");
      }
    } catch (err) {
      console.error("Error fetching hall:", err);
      setError(err.response?.data?.message || "Failed to load hall data");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (location, facilities)
      const keys = name.split('.');
      if (keys[0] === 'location' && keys[1] === 'coordinates') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              ...prev.location.coordinates,
              [keys[2]]: value
            }
          }
        }));
      } else if (keys[0] === 'location') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            [keys[1]]: value
          }
        }));
      } else if (keys[0] === 'facilities') {
        setFormData(prev => ({
          ...prev,
          facilities: {
            ...prev.facilities,
            [keys[1]]: checked
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle feature management
  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Handle tag management
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Handle image management
  const handleAddImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setPreviewImages(prev => [...prev, newImage.trim()]);
      setNewImage("");
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.hallName.trim()) {
      setError("Hall name is required");
      return false;
    }
    if (!formData.hallPrice || formData.hallPrice <= 0) {
      setError("Valid hall price is required");
      return false;
    }
    if (!formData.capacity || formData.capacity <= 0) {
      setError("Valid capacity is required");
      return false;
    }
    if (!formData.openingHours.trim()) {
      setError("Opening hours are required");
      return false;
    }
    if (!formData.location.city.trim()) {
      setError("City is required");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");

      const response = await axios.put(`${API_BASE_URL}/halls/${id}`, formData);
      
      if (response.data.success) {
        setSuccess("Hall updated successfully!");
        setTimeout(() => {
          navigate("/admin/view-halls");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to update hall");
      }
    } catch (err) {
      console.error("Error updating hall:", err);
      setError(err.response?.data?.message || "Failed to update hall");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete hall
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this hall? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/halls/${id}`);
      
      if (response.data.success) {
        setSuccess("Hall deleted successfully!");
        setTimeout(() => {
          navigate("/admin/view-halls");
        }, 1500);
      } else {
        setError(response.data.message || "Failed to delete hall");
      }
    } catch (err) {
      console.error("Error deleting hall:", err);
      setError(err.response?.data?.message || "Failed to delete hall");
    }
  };

  // Navigation handlers
  const handleBack = () => {
    navigate("/admin/view-halls");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleViewHalls = () => {
    navigate("/admin/view-halls");
  };

  // Loading state
  if (loading) {
    return (
      <div className="edit-hall-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading hall data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-hall-container">
      <Nav />
      {/* Header */}
      <header className="edit-hall-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn btn-secondary" onClick={handleBack}>
              <FaArrowLeft /> Back to Halls
            </button>
            <button className="btn btn-primary" onClick={handleGoHome}>
              <FaHome /> Home
            </button>
          </div>
          <div className="header-center">
            <h1>✏️ Edit Hall</h1>
            <p>Update hall information and settings</p>
          </div>
          <div className="header-right">
            <button className="btn btn-info" onClick={handleViewHalls}>
              <FaEye /> View All Halls
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="message error">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="message success">
          ✅ {success}
        </div>
      )}

      {/* Main Form */}
      <div className="edit-hall-content">
        <form onSubmit={handleSubmit} className="hall-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hallName">Hall Name *</label>
                <input
                  type="text"
                  id="hallName"
                  name="hallName"
                  value={formData.hallName}
                  onChange={handleInputChange}
                  placeholder="Enter hall name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hallPrice">Price (LKR) *</label>
                <input
                  type="number"
                  id="hallPrice"
                  name="hallPrice"
                  value={formData.hallPrice}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacity">Capacity *</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Enter capacity"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="openingHours">Opening Hours *</label>
                <input
                  type="text"
                  id="openingHours"
                  name="openingHours"
                  value={formData.openingHours}
                  onChange={handleInputChange}
                  placeholder="e.g., 8:00 AM - 10:00 PM"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hallType">Hall Type</label>
                <select
                  id="hallType"
                  name="hallType"
                  value={formData.hallType}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                  <option value="luxury">Luxury</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="form-section">
            <h2>Location Information</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="location.address">Address</label>
                <input
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location.city">City *</label>
                <input
                  type="text"
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location.district">District</label>
                <input
                  type="text"
                  id="location.district"
                  name="location.district"
                  value={formData.location.district}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location.coordinates.lat">Latitude</label>
                <input
                  type="text"
                  id="location.coordinates.lat"
                  name="location.coordinates.lat"
                  value={formData.location.coordinates.lat}
                  onChange={handleInputChange}
                  placeholder="Enter latitude"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location.coordinates.lng">Longitude</label>
                <input
                  type="text"
                  id="location.coordinates.lng"
                  name="location.coordinates.lng"
                  value={formData.location.coordinates.lng}
                  onChange={handleInputChange}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="form-section">
            <h2>Description</h2>
            <div className="form-group full-width">
              <label htmlFor="description">Hall Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the hall, its features, ambiance, etc."
                rows="4"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="form-section">
            <h2>Features & Amenities</h2>
            <div className="form-group full-width">
              <label>Add Features</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Enter a feature (e.g., Air Conditioning, Projector)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                />
                <button type="button" onClick={handleAddFeature} className="btn btn-sm btn-success">
                  <FaPlus /> Add
                </button>
              </div>
              
              {/* Features List */}
              {formData.features.length > 0 && (
                <div className="items-list">
                  <h4>Current Features ({formData.features.length})</h4>
                  <div className="items-grid">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="item-tag">
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="remove-btn"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Facilities Checkboxes */}
            <div className="facilities-grid">
              <h4>Facilities</h4>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="facilities.parking"
                    checked={formData.facilities.parking}
                    onChange={handleInputChange}
                  />
                  Parking Available
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="facilities.ac"
                    checked={formData.facilities.ac}
                    onChange={handleInputChange}
                  />
                  Air Conditioning
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="facilities.generator"
                    checked={formData.facilities.generator}
                    onChange={handleInputChange}
                  />
                  Generator Backup
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="facilities.wifi"
                    checked={formData.facilities.wifi}
                    onChange={handleInputChange}
                  />
                  WiFi
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="facilities.soundSystem"
                    checked={formData.facilities.soundSystem}
                    onChange={handleInputChange}
                  />
                  Sound System
                </label>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="form-section">
            <h2>Hall Images</h2>
            <div className="form-group full-width">
              <label>Add Image URL</label>
              <div className="input-with-button">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Enter image URL"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                />
                <button type="button" onClick={handleAddImage} className="btn btn-sm btn-success">
                  <FaImage /> Add
                </button>
              </div>
              
              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="images-section">
                  <h4>Current Images ({previewImages.length})</h4>
                  <div className="images-grid">
                    {previewImages.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img src={image} alt={`Hall ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="remove-image-btn"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="form-section">
            <h2>Tags</h2>
            <div className="form-group full-width">
              <label>Add Tags</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter a tag (e.g., Wedding, Conference, Party)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button type="button" onClick={handleAddTag} className="btn btn-sm btn-success">
                  <FaPlus /> Add
                </button>
              </div>
              
              {/* Tags List */}
              {formData.tags.length > 0 && (
                <div className="items-list">
                  <h4>Current Tags ({formData.tags.length})</h4>
                  <div className="items-grid">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="item-tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="remove-btn"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="form-section">
            <h2>Settings</h2>
            <div className="settings-grid">
              <label className="checkbox-label large">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                />
                <div className="checkbox-text">
                  <strong>Available for Booking</strong>
                  <span>Hall is currently available for customers to book</span>
                </div>
              </label>

              <label className="checkbox-label large">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                <div className="checkbox-text">
                  <strong>Featured Hall</strong>
                  <span>Show this hall as featured on the homepage</span>
                </div>
              </label>
            </div>

            {/* Special Notes */}
            <div className="form-group full-width">
              <label htmlFor="specialNotes">Special Notes</label>
              <textarea
                id="specialNotes"
                name="specialNotes"
                value={formData.specialNotes}
                onChange={handleInputChange}
                placeholder="Any special instructions or notes about this hall..."
                rows="3"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={saving}
            >
              <FaTrash /> Delete Hall
            </button>
            
            <div className="action-buttons">
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner-small"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave /> Update Hall
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditHall;