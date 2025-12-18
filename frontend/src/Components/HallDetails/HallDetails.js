// src/components/HallDetails.js
import React, { useState, useEffect, useCallback } from "react";
import Nav from "../Nav/Nav";

import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./HallDetails.css";

function HallDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    hallName: "",
    hallPrice: "",
    capacity: "",
    openingHours: "",
    description: "",
    features: [],
    isAvailable: true,
    location: {
      address: "",
      city: "",
      district: ""
    }
  });
  const [newFeature, setNewFeature] = useState("");

  const API_BASE_URL = "http://localhost:5000/api";

  // FIXED: Using useCallback to memoize the function
  const fetchHallDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/halls/${id}`);
      if (response.data.success) {
        setHall(response.data.hall);
        setError(null);
      } else {
        setError(response.data.message || "Failed to fetch hall details");
      }
    } catch (err) {
      console.error("Fetch hall details error:", err);
      setError(err.response?.data?.message || err.message || "Error fetching hall details");
    } finally {
      setLoading(false);
    }
  }, [id]); // Add id as dependency since it's used in the API call

  // FIXED: useEffect now has proper dependencies
  useEffect(() => {
    fetchHallDetails();
  }, [fetchHallDetails]); // Now fetchHallDetails is stable due to useCallback

  const handleEdit = () => {
    setFormData({
      hallName: hall.hallName || "",
      hallPrice: hall.hallPrice || "",
      capacity: hall.capacity || "",
      openingHours: hall.openingHours || "",
      description: hall.description || "",
      features: hall.features || [],
      isAvailable: hall.isAvailable !== undefined ? hall.isAvailable : true,
      location: hall.location || {
        address: "",
        city: "",
        district: ""
      }
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    try {
      const apiData = {
        hallName: formData.hallName.trim(),
        hallPrice: parseFloat(formData.hallPrice),
        capacity: parseInt(formData.capacity),
        openingHours: formData.openingHours.trim(),
        description: formData.description?.trim() || "",
        features: formData.features || [],
        isAvailable: formData.isAvailable,
        location: formData.location || {}
      };

      const response = await axios.put(
        `${API_BASE_URL}/halls/${id}`,
        apiData
      );

      if (response.data.success) {
        setHall(response.data.hall);
        setShowEditModal(false);
        alert("Hall updated successfully!");
      }
    } catch (error) {
      console.error("Update hall error:", error);
      alert("Error updating hall: " + (error.response?.data?.message || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this hall? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/halls/${id}`);
        if (response.data.success) {
          alert("Hall deleted successfully!");
          navigate("/admin/halls");
        }
      } catch (error) {
        alert("Error deleting hall: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/halls/${id}`,
        { isAvailable: !hall.isAvailable }
      );
      if (response.data.success) {
        setHall(response.data.hall);
        alert(`Hall ${!hall.isAvailable ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      alert("Error updating availability: " + (error.response?.data?.message || error.message));
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updatedFeatures });
  };

  const handleLocationChange = (field, value) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        [field]: value
      }
    });
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "LKR 0";
    return `LKR ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // FIXED: Added missing function to handle feature input key press
  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  if (loading) {
    return (
      <div className="hall-details-loading">
        <div className="spinner"></div>
        <p>Loading hall details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hall-details-error">
        <h2>❌ Error Loading Hall</h2>
        <p>{error}</p>
        <button onClick={fetchHallDetails} className="btn btn-primary">
          Try Again
        </button>
        <button onClick={() => navigate("/admin/halls")} className="btn btn-secondary">
          Back to Halls
        </button>
      </div>
    );
  }

  if (!hall) {
    return (
      <div className="hall-details-not-found">
        <h2>Hall Not Found</h2>
        <p>The requested hall could not be found.</p>
        <button onClick={() => navigate("/admin/halls")} className="btn btn-primary">
          Back to Halls
        </button>
      </div>
    );
  }

  return (
    <div className="hall-details">
      <Nav />
      {/* Header */}
      <div className="hall-details-header">
        <button 
          onClick={() => navigate("/admin/halls")} 
          className="btn btn-back"
        >
          ← Back to Halls
        </button>
        <div className="header-actions">
          <button 
            onClick={toggleAvailability}
            className={`btn ${hall.isAvailable ? 'btn-warning' : 'btn-success'}`}
          >
            {hall.isAvailable ? '⏸️ Make Unavailable' : '▶️ Make Available'}
          </button>
          <button onClick={handleEdit} className="btn btn-primary">
            ✏️ Edit Hall
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            🗑️ Delete Hall
          </button>
        </div>
      </div>

      {/* Hall Overview */}
      <div className="hall-overview">
        <div className="hall-image-section">
          <div className="hall-image-large">
            🏛️ {hall.hallName?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          <div className="hall-status">
            <span className={`status-badge ${hall.isAvailable ? 'available' : 'unavailable'}`}>
              {hall.isAvailable ? '✅ Available' : '❌ Unavailable'}
            </span>
          </div>
        </div>

        <div className="hall-basic-info">
          <h1>{hall.hallName}</h1>
          <div className="price-tag">{formatCurrency(hall.hallPrice)}</div>
          <div className="hall-meta">
            <div className="meta-item">
              <span className="meta-label">Capacity:</span>
              <span className="meta-value">{hall.capacity} people</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Opening Hours:</span>
              <span className="meta-value">{hall.openingHours}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Last Updated:</span>
              <span className="meta-value">{formatDate(hall.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="hall-details-grid">
        {/* Description Section */}
        <div className="detail-section">
          <h3>Description</h3>
          <div className="detail-content">
            {hall.description || "No description provided."}
          </div>
        </div>

        {/* Location Section */}
        <div className="detail-section">
          <h3>Location</h3>
          <div className="detail-content">
            {hall.location ? (
              <div className="location-details">
                {hall.location.address && (
                  <div className="location-item">
                    <strong>Address:</strong> {hall.location.address}
                  </div>
                )}
                {hall.location.city && (
                  <div className="location-item">
                    <strong>City:</strong> {hall.location.city}
                  </div>
                )}
                {hall.location.district && (
                  <div className="location-item">
                    <strong>District:</strong> {hall.location.district}
                  </div>
                )}
                {!hall.location.address && !hall.location.city && !hall.location.district && (
                  <p>No location information provided.</p>
                )}
              </div>
            ) : (
              <p>No location information provided.</p>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="detail-section">
          <h3>Features & Amenities</h3>
          <div className="detail-content">
            {hall.features && hall.features.length > 0 ? (
              <div className="features-grid">
                {hall.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    ✓ {feature}
                  </div>
                ))}
              </div>
            ) : (
              <p>No features added yet.</p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="detail-section">
          <h3>Additional Information</h3>
          <div className="detail-content">
            <div className="info-grid">
              <div className="info-item">
                <strong>Hall ID:</strong> {hall._id}
              </div>
              <div className="info-item">
                <strong>Created:</strong> {formatDate(hall.createdAt)}
              </div>
              <div className="info-item">
                <strong>Last Updated:</strong> {formatDate(hall.updatedAt)}
              </div>
              <div className="info-item">
                <strong>Status:</strong> 
                <span className={`status ${hall.isAvailable ? 'available' : 'unavailable'}`}>
                  {hall.isAvailable ? 'Available for Booking' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="hall-actions-footer">
        <button onClick={handleEdit} className="btn btn-primary">
          ✏️ Edit Hall
        </button>
        <button onClick={toggleAvailability} className="btn btn-secondary">
          {hall.isAvailable ? '⏸️ Make Unavailable' : '▶️ Make Available'}
        </button>
        <button onClick={handleDelete} className="btn btn-danger">
          🗑️ Delete Hall
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>Edit Hall</h2>
              <button 
                className="close-btn"
                onClick={() => !saveLoading && setShowEditModal(false)}
                disabled={saveLoading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="hall-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Hall Name *</label>
                  <input
                    type="text"
                    value={formData.hallName}
                    onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Price (LKR) *</label>
                  <input
                    type="number"
                    value={formData.hallPrice}
                    onChange={(e) => setFormData({ ...formData, hallPrice: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    min="1"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Hours *</label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    required
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  disabled={saveLoading}
                />
              </div>

              <div className="form-group">
                <label>Features</label>
                <div className="features-input">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Enter a feature"
                    onKeyPress={handleFeatureKeyPress} // FIXED: Using the new function
                    disabled={saveLoading}
                  />
                  <button 
                    type="button" 
                    onClick={addFeature} 
                    className="btn btn-secondary"
                    disabled={saveLoading || !newFeature.trim()}
                  >
                    Add
                  </button>
                </div>
                
                {formData.features.length > 0 && (
                  <div className="features-list">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="feature-tag">
                        {feature}
                        <button 
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="remove-feature"
                          disabled={saveLoading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    disabled={saveLoading}
                  />
                  <span className="checkmark"></span>
                  Available for booking
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="btn btn-secondary"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner-small"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Hall'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HallDetails;