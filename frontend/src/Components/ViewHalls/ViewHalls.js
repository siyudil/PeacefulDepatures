// src/components/ViewHalls/Components/ViewHalls.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaPlus, FaArrowLeft, FaSearch, FaFilter, FaHome, FaSync, FaChartBar, FaToggleOn, FaToggleOff } from "react-icons/fa";
import "./ViewHalls.css";


function ViewHalls() {
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [successMessage, setSuccessMessage] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000/api";

  // ✅ Fetch all halls with packages
  useEffect(() => {
    fetchHallsWithPackages();
    fetchStatistics();
  }, []);

  const fetchHallsWithPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/halls/view/all`);
      if (response.data.success) {
        // Fetch packages for each hall
        const hallsWithPackages = await Promise.all(
          response.data.halls.map(async (hall) => {
            try {
              const packagesResponse = await axios.get(`${API_BASE_URL}/halls/${hall._id}/packages`);
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
    } catch (err) {
      console.error("Error fetching halls:", err);
      setError(err.response?.data?.message || "Failed to load halls");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/halls/statistics`);
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  // ✅ Delete Hall
  const handleDelete = async (id, hallName) => {
    if (!window.confirm(`Are you sure you want to delete "${hallName}"? This action cannot be undone.`)) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/halls/${id}`);
      if (response.data.success) {
        setHalls(halls.filter((hall) => hall._id !== id));
        setSuccessMessage(`Hall "${hallName}" deleted successfully!`);
        fetchStatistics(); // Refresh statistics
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(response.data.message || "Failed to delete hall");
      }
    } catch (err) {
      console.error("Error deleting hall:", err);
      setError(err.response?.data?.message || "Failed to delete hall.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ Toggle Hall Availability (Using new endpoint)
  const toggleAvailability = async (hallId, currentStatus, hallName) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/halls/${hallId}/availability`);
      if (response.data.success) {
        fetchHallsWithPackages(); // Refresh the list
        fetchStatistics(); // Refresh statistics
        setSuccessMessage(`Hall "${hallName}" ${response.data.hall.isAvailable ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error updating hall availability:", err);
      setError("Failed to update hall availability.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ Bulk Update Availability
  const bulkUpdateAvailability = async (hallIds, isAvailable) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/halls/bulk/availability`, {
        hallIds,
        isAvailable
      });
      if (response.data.success) {
        fetchHallsWithPackages();
        fetchStatistics();
        setSuccessMessage(response.data.message);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error bulk updating availability:", err);
      setError("Failed to bulk update hall availability.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ Bulk Activate Selected
  const bulkActivateSelected = () => {
    const selectedHalls = filteredAndSortedHalls.filter(hall => !hall.isAvailable);
    if (selectedHalls.length === 0) {
      setError("No unavailable halls to activate.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const hallIds = selectedHalls.map(hall => hall._id);
    bulkUpdateAvailability(hallIds, true);
  };

  // ✅ Bulk Deactivate Selected
  const bulkDeactivateSelected = () => {
    const selectedHalls = filteredAndSortedHalls.filter(hall => hall.isAvailable);
    if (selectedHalls.length === 0) {
      setError("No available halls to deactivate.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const hallIds = selectedHalls.map(hall => hall._id);
    bulkUpdateAvailability(hallIds, false);
  };

  // ✅ Navigate to Edit Hall
  const handleEdit = (hallId) => {
    navigate(`/admin/halls/edit/${hallId}`);
  };

  // ✅ Navigate to Add Hall
  const handleAddHall = () => {
    navigate("/admin/halls");
  };

  // ✅ Navigate back to Admin Halls
  const handleBackToAdmin = () => {
    navigate("/admin/halls");
  };

  // ✅ Navigate to Home
  const handleGoHome = () => {
    navigate("/");
  };

  // ✅ Open modal for view
  const handleView = (hall) => {
    setSelectedHall(hall);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedHall(null);
    setShowModal(false);
  };

  // ✅ Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "LKR 0";
    return `LKR ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // ✅ Filter and sort halls
  const filteredAndSortedHalls = halls
    .filter(hall => {
      const matchesSearch = hall.hallName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hall.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hall.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAvailability = filterAvailability === "all" || 
                                (filterAvailability === "available" && hall.isAvailable) ||
                                (filterAvailability === "unavailable" && !hall.isAvailable);
      
      return matchesSearch && matchesAvailability;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.hallName?.localeCompare(b.hallName) || 0;
        case "name-desc":
          return b.hallName?.localeCompare(a.hallName) || 0;
        case "price-low":
          return (a.hallPrice || 0) - (b.hallPrice || 0);
        case "price-high":
          return (b.hallPrice || 0) - (a.hallPrice || 0);
        case "capacity":
          return (b.capacity || 0) - (a.capacity || 0);
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

  // ✅ Statistics Card Component
  const StatisticsCard = () => (
    <div className="statistics-card">
      <div className="statistics-header">
        <h3><FaChartBar /> Hall Statistics</h3>
        <button className="btn btn-sm" onClick={() => setShowStatistics(!showStatistics)}>
          {showStatistics ? 'Hide' : 'Show'} Stats
        </button>
      </div>
      
      {showStatistics && statistics && (
        <div className="statistics-grid">
          <div className="stat-item">
            <span className="stat-number">{statistics.totalHalls}</span>
            <span className="stat-label">Total Halls</span>
          </div>
          <div className="stat-item available">
            <span className="stat-number">{statistics.availableHalls}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-item unavailable">
            <span className="stat-number">{statistics.unavailableHalls}</span>
            <span className="stat-label">Unavailable</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{statistics.availabilityRate}%</span>
            <span className="stat-label">Availability Rate</span>
          </div>
          {statistics.capacity && (
            <>
              <div className="stat-item">
                <span className="stat-number">{statistics.capacity.avgCapacity?.toFixed(0) || 0}</span>
                <span className="stat-label">Avg Capacity</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{statistics.capacity.maxCapacity || 0}</span>
                <span className="stat-label">Max Capacity</span>
              </div>
            </>
          )}
          {statistics.pricing && (
            <div className="stat-item">
              <span className="stat-number">{formatCurrency(statistics.pricing.avgPrice)}</span>
              <span className="stat-label">Avg Price</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ✅ Simple Header Component
  const Header = () => (
    <header className="view-halls-header">
      <div className="header-content">
        <div className="header-left">
          <button className="btn btn-secondary" onClick={handleBackToAdmin}>
            <FaArrowLeft /> Back to Admin
          </button>
          <button className="btn btn-primary" onClick={handleGoHome}>
            <FaHome /> Home
          </button>
        </div>
        <div className="header-center">
          <h1>🏛️ View All Halls</h1>
          <p>Manage and view all funeral halls</p>
        </div>
        <div className="header-right">
          <button className="btn btn-info" onClick={fetchHallsWithPackages}>
            <FaSync /> Refresh
          </button>
          <button className="btn btn-success" onClick={handleAddHall}>
            <FaPlus /> Add New Hall
          </button>
        </div>
      </div>
    </header>
  );

  // ✅ Loading State
  if (loading) return (
    <div className="admin-dashboard">
      <Header />
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading halls...</p>
      </div>
    </div>
  );

  // ✅ Error State
  if (error && !halls.length) return (
    <div className="admin-dashboard">
      <Header />
      <div className="error-state">
        <h3>❌ Error Loading Halls</h3>
        <p>{error}</p>
        <button onClick={fetchHallsWithPackages} className="btn btn-primary">
          <FaSync /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <Header />
      
      {/* ✅ Success/Error Messages */}
      {successMessage && (
        <div className="message success">
          ✅ {successMessage}
        </div>
      )}
      {error && (
        <div className="message error">
          ❌ {error}
        </div>
      )}
      
      <div className="admin-content">
        {/* ✅ Statistics and Bulk Actions */}
        <div className="dashboard-controls">
          <StatisticsCard />
          
          <div className="bulk-actions">
            <h4>Bulk Actions</h4>
            <div className="bulk-buttons">
              <button className="btn btn-success btn-sm" onClick={bulkActivateSelected}>
                <FaToggleOn /> Activate All Unavailable
              </button>
              <button className="btn btn-warning btn-sm" onClick={bulkDeactivateSelected}>
                <FaToggleOff /> Deactivate All Available
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Filters and Search */}
        <div className="filters-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search halls by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <FaFilter className="filter-icon" />
              <select 
                value={filterAvailability} 
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Unavailable Only</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="capacity">Capacity (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ✅ Results Info */}
        <div className="results-info">
          <p>
            Showing {filteredAndSortedHalls.length} of {halls.length} halls
            {searchTerm && ` for "${searchTerm}"`}
            {filterAvailability !== "all" && ` (${filterAvailability})`}
          </p>
          {statistics && (
            <div className="quick-stats">
              <span className="stat-badge available">{statistics.availableHalls} Available</span>
              <span className="stat-badge unavailable">{statistics.unavailableHalls} Unavailable</span>
            </div>
          )}
        </div>

        {/* ✅ Halls Grid */}
        <div className="hall-container">
          {filteredAndSortedHalls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏛️</div>
              <h3>No Halls Found</h3>
              <p>No halls match your current search or filters.</p>
              <button onClick={handleAddHall} className="btn btn-primary">
                Add Your First Hall
              </button>
            </div>
          ) : (
            <div className="hall-grid">
              {filteredAndSortedHalls.map((hall) => (
                <div className={`hall-card ${!hall.isAvailable ? 'unavailable' : ''}`} key={hall._id}>
                  {/* Hall Image */}
                  <div className="hall-image-section">
                    {hall.images && hall.images.length > 0 ? (
                      <img 
                        src={hall.images[0]} 
                        alt={hall.hallName} 
                        className="hall-image"
                      />
                    ) : (
                      <div className="image-placeholder">
                        🏛️ {hall.hallName?.charAt(0)?.toUpperCase() || 'H'}
                      </div>
                    )}
                    {!hall.isAvailable && (
                      <div className="unavailable-badge">UNAVAILABLE</div>
                    )}
                    {hall.isFeatured && (
                      <div className="featured-badge">FEATURED</div>
                    )}
                  </div>

                  {/* Hall Info */}
                  <div className="hall-info">
                    <h3>{hall.hallName || "Unnamed Hall"}</h3>
                    
                    <div className="hall-details">
                      <p className="detail-item">
                        <strong>Price:</strong> {formatCurrency(hall.hallPrice)}
                      </p>
                      <p className="detail-item">
                        <strong>Capacity:</strong> {hall.capacity || 0} people
                      </p>
                      <p className="detail-item">
                        <strong>Opening Hours:</strong> {hall.openingHours || "Not specified"}
                      </p>
                      {hall.location?.city && (
                        <p className="detail-item">
                          <strong>Location:</strong> {hall.location.city}
                          {hall.location.district && `, ${hall.location.district}`}
                        </p>
                      )}
                      {hall.hallType && (
                        <p className="detail-item">
                          <strong>Type:</strong> {hall.hallType}
                        </p>
                      )}
                      {hall.description && (
                        <p className="detail-item description">
                          <strong>Description:</strong> {hall.description.length > 100 
                            ? `${hall.description.substring(0, 100)}...` 
                            : hall.description}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    {hall.features && hall.features.length > 0 && (
                      <div className="hall-features">
                        <strong>Features:</strong>
                        <div className="features-tags">
                          {hall.features.slice(0, 3).map((feature, index) => (
                            <span key={index} className="feature-tag">{feature}</span>
                          ))}
                          {hall.features.length > 3 && (
                            <span className="feature-tag more">+{hall.features.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Packages Count */}
                    <div className="packages-count">
                      <strong>Packages:</strong> {hall.packages?.length || 0}
                    </div>

                    {/* Status */}
                    <div className="hall-status">
                      <span className={`status-badge ${hall.isAvailable ? 'available' : 'unavailable'}`}>
                        {hall.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                      </span>
                      <span className="created-date">
                        Added: {new Date(hall.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button className="btn view" onClick={() => handleView(hall)}>
                      <FaEye /> View
                    </button>
                    <button className="btn edit" onClick={() => handleEdit(hall._id)}>
                      <FaEdit /> Edit
                    </button>
                    <button 
                      className={`btn toggle ${hall.isAvailable ? 'unavailable' : 'available'}`}
                      onClick={() => toggleAvailability(hall._id, hall.isAvailable, hall.hallName)}
                    >
                      {hall.isAvailable ? <FaToggleOff /> : <FaToggleOn />}
                      {hall.isAvailable ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="btn delete" 
                      onClick={() => handleDelete(hall._id, hall.hallName)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Modal for Viewing Hall Details */}
      {showModal && selectedHall && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedHall.hallName}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Hall Images */}
              {selectedHall.images && selectedHall.images.length > 0 && (
                <div className="hall-detail-section">
                  <h3>Images</h3>
                  <div className="images-grid">
                    {selectedHall.images.map((image, index) => (
                      <img key={index} src={image} alt={`${selectedHall.hallName} ${index + 1}`} className="detail-image" />
                    ))}
                  </div>
                </div>
              )}

              <div className="hall-detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Price:</strong> {formatCurrency(selectedHall.hallPrice)}
                  </div>
                  <div className="detail-item">
                    <strong>Capacity:</strong> {selectedHall.capacity} people
                  </div>
                  <div className="detail-item">
                    <strong>Opening Hours:</strong> {selectedHall.openingHours}
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong> {selectedHall.hallType || 'Not specified'}
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong> 
                    <span className={`status-badge ${selectedHall.isAvailable ? 'available' : 'unavailable'}`}>
                      {selectedHall.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {selectedHall.isFeatured && (
                    <div className="detail-item">
                      <strong>Featured:</strong> 
                      <span className="status-badge featured">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedHall.location && (selectedHall.location.address || selectedHall.location.city) && (
                <div className="hall-detail-section">
                  <h3>Location</h3>
                  <div className="detail-grid">
                    {selectedHall.location.address && (
                      <div className="detail-item">
                        <strong>Address:</strong> {selectedHall.location.address}
                      </div>
                    )}
                    {selectedHall.location.city && (
                      <div className="detail-item">
                        <strong>City:</strong> {selectedHall.location.city}
                      </div>
                    )}
                    {selectedHall.location.district && (
                      <div className="detail-item">
                        <strong>District:</strong> {selectedHall.location.district}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedHall.description && (
                <div className="hall-detail-section">
                  <h3>Description</h3>
                  <p>{selectedHall.description}</p>
                </div>
              )}

              {selectedHall.features && selectedHall.features.length > 0 && (
                <div className="hall-detail-section">
                  <h3>Features ({selectedHall.features.length})</h3>
                  <ul className="features-list">
                    {selectedHall.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Packages Section */}
              <div className="hall-detail-section">
                <h3>Packages ({selectedHall.packages?.length || 0})</h3>
                {selectedHall.packages && selectedHall.packages.length > 0 ? (
                  <div className="packages-grid">
                    {selectedHall.packages.map((pkg) => (
                      <div key={pkg._id} className="package-card">
                        <h4>{pkg.packageName}</h4>
                        <p><strong>Price:</strong> {formatCurrency(pkg.packagePrice)}</p>
                        {pkg.duration && <p><strong>Duration:</strong> {pkg.duration}</p>}
                        {pkg.description && <p><strong>Description:</strong> {pkg.description}</p>}
                        <span className={`status-badge ${pkg.isActive ? 'active' : 'inactive'}`}>
                          {pkg.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No packages available for this hall.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => handleEdit(selectedHall._id)}>
                <FaEdit /> Edit Hall
              </button>
              <button 
                className={`btn ${selectedHall.isAvailable ? 'btn-warning' : 'btn-success'}`}
                onClick={() => {
                  toggleAvailability(selectedHall._id, selectedHall.isAvailable, selectedHall.hallName);
                  closeModal();
                }}
              >
                {selectedHall.isAvailable ? <FaToggleOff /> : <FaToggleOn />}
                {selectedHall.isAvailable ? ' Deactivate' : ' Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewHalls;
