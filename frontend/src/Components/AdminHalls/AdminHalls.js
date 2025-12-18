import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminHalls.css";
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";

function AdminHalls() {
  const navigate = useNavigate();
  const HALLS_BASE_URL = "http://localhost:5000/admin/halls"; // matches app.js mount
  const PACKAGES_BASE_URL = "http://localhost:5000/api/packages"; // existing packages API

  const [halls, setHalls] = useState([]);
  const [editingHall, setEditingHall] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Package management states
  const [editingPackage, setEditingPackage] = useState(null);
  const [newPackage, setNewPackage] = useState({
    packageName: "",
    packagePrice: "",
    description: "",
    features: [],
    isAvailable: true
  });
  const [selectedHallForPackage, setSelectedHallForPackage] = useState(null);
  const [newPackageFeature, setNewPackageFeature] = useState("");

  const [newHall, setNewHall] = useState({
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

  // Fetch halls and packages on mount
  useEffect(() => {
    fetchHallsWithPackages();
  }, []);

  // Fetch all halls with packages
  const fetchHallsWithPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${HALLS_BASE_URL}`);
      if (response.data.success) {
        const hallsWithPackages = await Promise.all(
          response.data.halls.map(async (hall) => {
            try {
              // If your backend provides hall-specific packages route, use it; otherwise leave empty
              const packagesResponse = await axios.get(`${HALLS_BASE_URL}/${hall._id}/packages`).catch(() => ({ data: { success: false, packages: [] } }));
              return {
                ...hall,
                packages: packagesResponse.data.success ? packagesResponse.data.packages : []
              };
            } catch (error) {
              console.error(`Error fetching packages for hall ${hall._id}:`, error);
              return { ...hall, packages: [] };
            }
          })
        );
        setHalls(hallsWithPackages);
        setError(null);
      } else {
        setError("Failed to fetch halls");
      }
    } catch (error) {
      console.error("Error fetching halls:", error);
      setError(error.response?.data?.message || "Failed to load halls");
    } finally {
      setLoading(false);
    }
  };

  // Package Management Functions
  const openPackageModal = (hall, pkg = null) => {
    setSelectedHallForPackage(hall);
    if (pkg) {
      setEditingPackage(pkg);
      setNewPackage({
        packageName: pkg.packageName || "",
        packagePrice: pkg.packagePrice || "",
        description: pkg.description || "",
        features: pkg.features || [],
        isAvailable: pkg.isAvailable !== undefined ? pkg.isAvailable : true
      });
    } else {
      setEditingPackage(null);
      setNewPackage({
        packageName: "",
        packagePrice: "",
        description: "",
        features: [],
        isAvailable: true
      });
    }
    setNewPackageFeature("");
    setShowPackageModal(true);
  };

  const closePackageModal = () => {
    setShowPackageModal(false);
    setEditingPackage(null);
    setSelectedHallForPackage(null);
  };

  const addPackageFeature = () => {
    if (newPackageFeature.trim() && !newPackage.features.includes(newPackageFeature.trim())) {
      setNewPackage({
        ...newPackage,
        features: [...newPackage.features, newPackageFeature.trim()]
      });
      setNewPackageFeature("");
    }
  };

  const removePackageFeature = (index) => {
    const updatedFeatures = newPackage.features.filter((_, i) => i !== index);
    setNewPackage({ ...newPackage, features: updatedFeatures });
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    try {
      if (!newPackage.packageName?.trim()) {
        alert("Please enter a package name");
        setSaveLoading(false);
        return;
      }

      if (!newPackage.packagePrice || isNaN(newPackage.packagePrice) || parseFloat(newPackage.packagePrice) <= 0) {
        alert("Please enter a valid price");
        setSaveLoading(false);
        return;
      }

      const payload = {
        packageName: newPackage.packageName.trim(),
        packagePrice: parseFloat(newPackage.packagePrice),
        description: newPackage.description?.trim() || "",
        features: newPackage.features || [],
        isAvailable: newPackage.isAvailable,
        hallId: selectedHallForPackage._id
      };

      const response = editingPackage
        ? await axios.put(`${PACKAGES_BASE_URL}/${editingPackage._id}`, payload)
        : await axios.post(`${PACKAGES_BASE_URL}`, payload);

      if (response.data.success) {
        alert(`Package ${editingPackage ? 'updated' : 'added'} successfully!`);
        closePackageModal();
        fetchHallsWithPackages();
      } else {
        throw new Error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving package:", error);
      alert("Failed to save package: " + (error.response?.data?.message || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePackageDelete = async (packageId) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      try {
        setSaveLoading(true);
        const response = await axios.delete(`${PACKAGES_BASE_URL}/${packageId}`);

        if (response.data.success) {
          alert("Package deleted successfully!");
          fetchHallsWithPackages();
        }
      } catch (error) {
        console.error("Error deleting package:", error);
        alert("Error deleting package: " + (error.response?.data?.message || error.message));
      } finally {
        setSaveLoading(false);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHall({ ...newHall, [name]: value });
  };

  // Handle location changes
  const handleLocationChange = (field, value) => {
    setNewHall({
      ...newHall,
      location: {
        ...newHall.location,
        [field]: value
      }
    });
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim() && !newHall.features.includes(newFeature.trim())) {
      setNewHall({
        ...newHall,
        features: [...newHall.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    const updatedFeatures = newHall.features.filter((_, i) => i !== index);
    setNewHall({ ...newHall, features: updatedFeatures });
  };

  // Open modal (Add or Edit)
  const openModal = (hall = null) => {
    if (hall) {
      setEditingHall(hall);
      setNewHall({
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
    } else {
      setEditingHall(null);
      setNewHall({
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
    }
    setNewFeature("");
    setShowModal(true);
    setSaveSuccess(false);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingHall(null);
  };

  // Submit Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    
    try {
      // Validation
      if (!newHall.hallName?.trim()) {
        alert("Please enter a hall name");
        setSaveLoading(false);
        return;
      }

      if (!newHall.hallPrice || isNaN(newHall.hallPrice) || parseFloat(newHall.hallPrice) <= 0) {
        alert("Please enter a valid price");
        setSaveLoading(false);
        return;
      }

      if (!newHall.capacity || isNaN(newHall.capacity) || parseInt(newHall.capacity) <= 0) {
        alert("Please enter a valid capacity");
        setSaveLoading(false);
        return;
      }

      if (!newHall.openingHours?.trim()) {
        alert("Please enter opening hours");
        setSaveLoading(false);
        return;
      }

      const payload = {
        hallName: newHall.hallName.trim(),
        hallPrice: parseFloat(newHall.hallPrice),
        capacity: parseInt(newHall.capacity),
        openingHours: newHall.openingHours.trim(),
        description: newHall.description?.trim() || "",
        features: newHall.features || [],
        isAvailable: newHall.isAvailable,
        location: newHall.location || {},
        hallType: "Funeral Hall"
      };

      const response = editingHall
        ? await axios.put(`${HALLS_BASE_URL}/${editingHall._id}`, payload)
        : await axios.post(`${HALLS_BASE_URL}`, payload);

      if (response.data.success) {
        setSaveSuccess(true);
        
        setTimeout(() => {
          setShowModal(false);
          fetchHallsWithPackages();
          
          if (editingHall) {
            alert("Hall updated successfully!");
          } else {
            alert("Hall added successfully! Redirecting to view halls...");
            navigate("/halls/view");
          }
        }, 500);
      } else {
        throw new Error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving hall:", error);
      alert("Failed to save hall: " + (error.response?.data?.message || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Hall
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hall? This action cannot be undone.")) {
      try {
        setSaveLoading(true);
        const response = await axios.delete(`${HALLS_BASE_URL}/${id}`);

        if (response.data.success) {
          fetchHallsWithPackages();
          alert("Hall deleted successfully!");
        }
      } catch (error) {
        console.error("Error deleting hall:", error);
        alert("Error deleting hall: " + (error.response?.data?.message || error.message));
      } finally {
        setSaveLoading(false);
      }
    }
  };

  // Toggle Availability
  const toggleAvailability = async (hallId, currentStatus) => {
    try {
      setSaveLoading(true);
      const response = await axios.patch(
        `${HALLS_BASE_URL}/${hallId}`,
        { isAvailable: !currentStatus }
      );
      if (response.data.success) {
        fetchHallsWithPackages();
        alert(`Hall ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error("Error updating hall availability:", error);
      alert("Error updating hall availability: " + (error.response?.data?.message || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  // ✅ Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "LKR 0";
    return `LKR ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div className="admin-dashboard">
        <AdminHeader />
        <div className="admin-body">
          <AdminSidebar />
          <div className="admin-content">
            <div className="admin-halls-container">
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading halls...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="admin-dashboard">
        <AdminHeader />
        <div className="admin-body">
          <AdminSidebar />
          <div className="admin-content">
            <div className="admin-halls-container">
              <div className="error-state">
                <h3>❌ Error Loading Halls</h3>
                <p>{error}</p>
                <button onClick={fetchHallsWithPackages} className="btn-retry">🔄 Retry</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main Render
  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-halls-container">
            <div className="admin-halls-header">
              <h1>Hall Management</h1>
              <p>Manage funeral hall facilities and packages</p>
            </div>

            <div className="action-bar">
              <div className="button-group">
                <button className="btn-primary" onClick={() => openModal()} disabled={saveLoading}>
                  <span className="btn-icon">+</span>
                  Add New Hall
                </button>
                <button className="btn-secondary" onClick={() => navigate('/halls/view')} disabled={saveLoading}>
                  <span className="btn-icon">👁️</span>
                  View All Halls
                </button>
              </div>
            </div>

            <div className="halls-content">
              {halls.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏛️</div>
                  <h2>No Halls Available</h2>
                  <p>Add your first hall to get started</p>
                  <button className="btn-primary" onClick={() => openModal()} disabled={saveLoading}>
                    <span className="btn-icon">+</span>
                    Add Your First Hall
                  </button>
                </div>
              ) : (
                <div className="halls-grid">
                  {halls.map((hall) => (
                    <div key={hall._id} className={`hall-card ${!hall.isAvailable ? 'unavailable' : ''}`}>
                      <div className="hall-image-section">
                        <div className="image-placeholder">🏛️ {hall.hallName?.charAt(0)?.toUpperCase() || 'H'}</div>
                        {!hall.isAvailable && <div className="unavailable-badge">UNAVAILABLE</div>}
                        <div className="hall-overlay-actions">
                          <button className="btn-icon-small" onClick={() => toggleAvailability(hall._id, hall.isAvailable)} title={hall.isAvailable ? 'Make Unavailable' : 'Make Available'} disabled={saveLoading}>
                            {saveLoading ? '⏳' : (hall.isAvailable ? '⏸️' : '▶️')}
                          </button>
                        <div className="detail-row">
                          <span className="detail-label">Price:</span>
                          <span className="detail-value price">{formatCurrency(hall.hallPrice)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Capacity:</span>
                          <span className="detail-value">{hall.capacity} people</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Opening Hours:</span>
                          <span className="detail-value">{hall.openingHours}</span>
                        </div>
                        
                        {hall.location?.city && (
                          <div className="detail-row">
                            <span className="detail-label">Location:</span>
                            <span className="detail-value">{hall.location.city}</span>
                          </div>
                        )}
                        
                        {hall.description && (
                          <div className="detail-row">
                            <span className="detail-label">Description:</span>
                            <span className="detail-value description">
                              {hall.description.length > 100 
                                ? `${hall.description.substring(0, 100)}...` 
                                : hall.description}
                            </span>
                          </div>
                        )}

                        {hall.features && hall.features.length > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Features:</span>
                            <div className="features-list">
                              {hall.features.slice(0, 3).map((feature, index) => (
                                <span key={index} className="feature-tag">✓ {feature}</span>
                              ))}
                              {hall.features.length > 3 && (
                                <span className="feature-tag more">+ {hall.features.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Packages Section */}
                        <div className="detail-row">
                          <span className="detail-label">Packages:</span>
                          <div className="packages-section">
                            {hall.packages && hall.packages.length > 0 ? (
                              <div className="packages-list">
                                {hall.packages.map((pkg) => (
                                  <div key={pkg._id} className="package-item">
                                    <div className="package-info">
                                      <strong>{pkg.packageName}</strong>
                                      <span className="package-price">{formatCurrency(pkg.packagePrice)}</span>
                                    </div>
                                    <div className="package-actions">
                                      <button 
                                        className="btn-action edit small"
                                        onClick={() => openPackageModal(hall, pkg)}
                                        disabled={saveLoading}
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        className="btn-action delete small"
                                        onClick={() => handlePackageDelete(pkg._id)}
                                        disabled={saveLoading}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="no-packages">No packages added</span>
                            )}
                            <button 
                              className="btn-add-package"
                              onClick={() => openPackageModal(hall)}
                              disabled={saveLoading}
                            >
                              + Add Package
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="hall-actions">
                        <button 
                          className="btn-action edit" 
                          onClick={() => openModal(hall)}
                          disabled={saveLoading}
                        >
                          <span className="action-icon">✏️</span>
                          Edit Hall
                        </button>
                        <button 
                          className="btn-action delete" 
                          onClick={() => handleDelete(hall._id)}
                          disabled={saveLoading}
                        >
                          <span className="action-icon">🗑️</span>
                          Delete Hall
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add / Edit Hall Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{editingHall ? "Edit Hall" : "Add New Hall"}</h2>
                  <button 
                    className="close-btn" 
                    onClick={closeModal}
                    disabled={saveLoading}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="hall-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Hall Name *</label>
                      <input
                        type="text"
                        name="hallName"
                        value={newHall.hallName}
                        onChange={handleInputChange}
                        placeholder="Enter hall name"
                        required
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Price (LKR) *</label>
                      <input
                        type="number"
                        name="hallPrice"
                        value={newHall.hallPrice}
                        onChange={handleInputChange}
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
                        required
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Capacity *</label>
                      <input
                        type="number"
                        name="capacity"
                        value={newHall.capacity}
                        onChange={handleInputChange}
                        placeholder="Enter capacity"
                        min="1"
                        required
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Opening Hours *</label>
                      <input
                        type="text"
                        name="openingHours"
                        value={newHall.openingHours}
                        onChange={handleInputChange}
                        placeholder="e.g., 8:00 AM - 6:00 PM"
                        required
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        value={newHall.location.address}
                        onChange={(e) => handleLocationChange('address', e.target.value)}
                        placeholder="Enter street address"
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={newHall.location.city}
                        onChange={(e) => handleLocationChange('city', e.target.value)}
                        placeholder="Enter city"
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>District</label>
                      <input
                        type="text"
                        value={newHall.location.district}
                        onChange={(e) => handleLocationChange('district', e.target.value)}
                        placeholder="Enter district"
                        disabled={saveLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={newHall.description}
                      onChange={handleInputChange}
                      placeholder="Enter hall description"
                      rows="3"
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Features</label>
                    <div className="features-input-group">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Enter a feature"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        disabled={saveLoading}
                      />
                      <button 
                        type="button" 
                        onClick={addFeature} 
                        className="btn-add-feature"
                        disabled={saveLoading || !newFeature.trim()}
                      >
                        Add
                      </button>
                    </div>
                    
                    {newHall.features.length > 0 && (
                      <div className="features-tags">
                        {newHall.features.map((feature, index) => (
                          <div key={index} className="feature-tag-input">
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

                  <div className="form-group full-width">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={newHall.isAvailable}
                        onChange={(e) => setNewHall({ ...newHall, isAvailable: e.target.checked })}
                        disabled={saveLoading}
                      />
                      <span className="checkmark"></span>
                      Available for booking
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-cancel"
                      disabled={saveLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={saveLoading}
                    >
                      {saveLoading ? (
                        <>
                          <div className="spinner-small"></div>
                          {editingHall ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        editingHall ? "Update Hall" : "Add Hall"
                      )}
                    </button>
                  </div>

                  {saveSuccess && (
                    <div className="success-message">
                      ✅ {editingHall ? "Hall updated successfully!" : "Hall added successfully!"}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Package Management Modal */}
          {showPackageModal && selectedHallForPackage && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{editingPackage ? "Edit Package" : "Add New Package"}</h2>
                  <button 
                    className="close-btn" 
                    onClick={closePackageModal}
                    disabled={saveLoading}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handlePackageSubmit} className="package-form">
                  <div className="form-group">
                    <label>Package Name *</label>
                    <input
                      type="text"
                      value={newPackage.packageName}
                      onChange={(e) => setNewPackage({...newPackage, packageName: e.target.value})}
                      placeholder="Enter package name"
                      required
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Price (LKR) *</label>
                    <input
                      type="number"
                      value={newPackage.packagePrice}
                      onChange={(e) => setNewPackage({...newPackage, packagePrice: e.target.value})}
                      placeholder="Enter package price"
                      min="0"
                      step="0.01"
                      required
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                      placeholder="Enter package description"
                      rows="3"
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Features</label>
                    <div className="features-input-group">
                      <input
                        type="text"
                        value={newPackageFeature}
                        onChange={(e) => setNewPackageFeature(e.target.value)}
                        placeholder="Enter a feature"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPackageFeature())}
                        disabled={saveLoading}
                      />
                      <button 
                        type="button" 
                        onClick={addPackageFeature} 
                        className="btn-add-feature"
                        disabled={saveLoading || !newPackageFeature.trim()}
                      >
                        Add
                      </button>
                    </div>
                    
                    {newPackage.features.length > 0 && (
                      <div className="features-tags">
                        {newPackage.features.map((feature, index) => (
                          <div key={index} className="feature-tag-input">
                            {feature}
                            <button 
                              type="button"
                              onClick={() => removePackageFeature(index)}
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

                  <div className="form-group full-width">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={newPackage.isAvailable}
                        onChange={(e) => setNewPackage({...newPackage, isAvailable: e.target.checked})}
                        disabled={saveLoading}
                      />
                      <span className="checkmark"></span>
                      Available for booking
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={closePackageModal}
                      className="btn-cancel"
                      disabled={saveLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={saveLoading}
                    >
                      {saveLoading ? (
                        <>
                          <div className="spinner-small"></div>
                          {editingPackage ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        editingPackage ? "Update Package" : "Add Package"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

}

export default AdminHalls;