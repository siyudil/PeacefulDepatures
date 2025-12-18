
// src/pages/ClientPackages.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ClientPackages.css";

function ClientPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/packages");

      if (response.data.success && Array.isArray(response.data.packages)) {
        setPackages(response.data.packages);
        setError(null);
      } else {
        setPackages([]);
        setError(response.data.message || "Failed to fetch packages");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error fetching packages");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to Review page: http://localhost:3000/reviews
  const navigateToReviewPage = (pkg = null) => {
    if (pkg) {
      localStorage.setItem('selectedPackageForReview', JSON.stringify(pkg));
    }
    navigate('/reviews');
  };

  // Handle Add Review button click for specific package
  const handleAddReview = (pkg) => {
    setSelectedPackage(pkg);
    setShowReviewModal(true);
  };

  // Quick Review Modal Component
  const QuickReviewModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Review for {selectedPackage?.PackageName}</h2>
          <button 
            className="close-btn"
            onClick={() => {
              setShowReviewModal(false);
              setSelectedPackage(null);
            }}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p>Share your experience with the <strong>{selectedPackage?.PackageName}</strong> package</p>
          
          <div className="review-options">
            <button 
              className="btn btn-primary"
              onClick={() => {
                navigateToReviewPage(selectedPackage);
                setShowReviewModal(false);
              }}
            >
              ⭐ Write a Review
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => {
                navigateToReviewPage(selectedPackage);
                setShowReviewModal(false);
              }}
            >
              💬 Give Feedback
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={() => {
                setShowReviewModal(false);
                setSelectedPackage(null);
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleDownloadPDF = async (pkg) => {
    try {
      setDownloadStatus(prev => ({
        ...prev,
        [pkg._id]: { loading: true, success: false, error: '' }
      }));

      const response = await axios.get(
        `http://localhost:5000/api/packages/${pkg._id}/pdf`,
        {
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pkg.PackageName?.replace(/\s+/g, '_') || 'package'}_${pkg.PackageId || pkg._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus(prev => ({
        ...prev,
        [pkg._id]: { loading: false, success: true, error: '' }
      }));

      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[pkg._id];
          return newStatus;
        });
      }, 3000);

    } catch (error) {
      setDownloadStatus(prev => ({
        ...prev,
        [pkg._id]: { loading: false, success: false, error: error.message }
      }));

      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[pkg._id];
          return newStatus;
        });
      }, 3000);

      alert('Error downloading PDF. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "LKR 0";
    return `LKR ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const calculateTotalPrice = (pkg) => {
    const basePrice = parseFloat(pkg.BasePrice) || 0;
    const additionalServicesPrice = parseFloat(pkg.AdditionalServicesPrice) || 0;
    return basePrice + additionalServicesPrice;
  };

  // Filter packages based on search and filters
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.PackageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.Description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || pkg.PackageType?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const packageTypes = ["All", "Basic", "Standard", "Premium", "Luxury", "Custom"];

  const renderPackageCard = (pkg) => {
    const totalPrice = calculateTotalPrice(pkg);
    const isUnavailable = pkg.Availability?.toLowerCase() === 'unavailable';
    const downloadInfo = downloadStatus[pkg._id];

    return (
      <div key={pkg._id} className={`client-package-card ${isUnavailable ? 'unavailable' : ''}`}>
        {downloadInfo && (
          <div className={`download-status ${downloadInfo.success ? 'success' : downloadInfo.error ? 'error' : 'loading'}`}>
            {downloadInfo.loading ? '⏳ Downloading...' : 
             downloadInfo.success ? '✅ Downloaded' : '❌ Failed'}
          </div>
        )}

        {pkg.isPopular && <div className="popular-badge">Most Popular</div>}
        
        {isUnavailable && (
          <div className="unavailable-badge">
            UNAVAILABLE
          </div>
        )}

        <div className="package-image-section">
          {pkg.PackageImage ? (
            <img 
              src={pkg.PackageImage} 
              alt={pkg.PackageName || "Package Image"}
              className="package-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`image-placeholder ${pkg.PackageImage ? 'hidden' : ''}`}>
            📦 Package
            <div className="placeholder-id">{pkg.PackageId}</div>
          </div>
        </div>

        <div className="package-content">
          <div className="package-header">
            <h3 className="package-name">{pkg.PackageName || "Unnamed Package"}</h3>
            <div className="package-meta">
              <span className="package-id">ID: {pkg.PackageId || "N/A"}</span>
              {pkg.averageRating && (
                <span className="package-rating">
                  ⭐ {pkg.averageRating} ({pkg.reviewCount || 0} reviews)
                </span>
              )}
            </div>
          </div>

          <div className="package-details">
            <div className="package-type-badge">
              <span className={`type-badge ${pkg.PackageType?.toLowerCase() || 'basic'}`}>
                {pkg.PackageType || "Basic"}
              </span>
            </div>

            <div className="detail-item description-item">
              <span className="detail-label">Description:</span>
              <p className="detail-value description">{pkg.Description || "No description available"}</p>
            </div>

            {pkg.features && pkg.features.length > 0 && (
              <div className="package-features">
                <h4>Package Includes:</h4>
                <ul>
                  {pkg.features.slice(0, 4).map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                  {pkg.features.length > 4 && (
                    <li className="more-features">+ {pkg.features.length - 4} more services</li>
                  )}
                </ul>
              </div>
            )}

            <div className="pricing-section">
              <div className="detail-item">
                <span className="detail-label">Total Price:</span>
                <span className="detail-value total-price">{formatCurrency(totalPrice)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{pkg.Duration || "N/A"} days</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Availability:</span>
              <span className={`availability-status ${pkg.Availability?.toLowerCase() || "available"}`}>
                {pkg.Availability || "Available"}
              </span>
            </div>
          </div>

          {/* Package Actions */}
          <div className="package-actions">
            <button 
              className="action-btn download-btn"
              onClick={() => handleDownloadPDF(pkg)}
              disabled={isUnavailable || downloadInfo?.loading}
            >
              {downloadInfo?.loading ? '⏳ Downloading...' : '📄 Download PDF'}
            </button>
            
            <button 
              className="action-btn review-btn"
              onClick={() => handleAddReview(pkg)}
              disabled={isUnavailable}
              title="Add Review for this Package"
            >
              ⭐ Add Review
            </button>
            
            <button 
              className="action-btn contact-btn"
              onClick={() => alert(`Contact us for more information about ${pkg.PackageName}`)}
              title="Contact for Details"
            >
              📞 Contact Us
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="client-packages-page">
      {/* Header with Review buttons */}
      <div className="client-header">
        <div className="header-content">
          <h1 className="page-title">Our Funeral Packages</h1>
          <div className="header-actions">
            <button 
              className="btn add-reviews-btn"
              onClick={() => navigateToReviewPage()}
            >
              ⭐ Add Reviews & Feedback
            </button>
            
            <button 
              className="btn view-reviews-btn"
              onClick={() => navigateToReviewPage()}
            >
              📝 View All Reviews
            </button>
          </div>
        </div>
        <p className="subtitle">Browse our comprehensive funeral service packages</p>
        {!loading && !error && (
          <div className="package-stats">
            <span className="stat-item">
              Total Packages: <strong>{packages.length}</strong>
            </span>
            <span className="stat-item">
              Available: <strong>{packages.filter(pkg => pkg.Availability?.toLowerCase() !== 'unavailable').length}</strong>
            </span>
            <span className="stat-item">
              With Reviews: <strong>{packages.filter(pkg => pkg.reviewCount > 0).length}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Search and Filter Section */}
      {!loading && !error && packages.length > 0 && (
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search packages by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            {packageTypes.map(type => (
              <option key={type} value={type.toLowerCase()}>
                {type}
              </option>
            ))}
          </select>

          <button 
            className="btn clear-filters-btn"
            onClick={() => {
              setSearchTerm("");
              setFilterType("all");
            }}
            disabled={!searchTerm && filterType === "all"}
          >
            🗑️ Clear Filters
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading packages...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h3>❌ Error Loading Packages</h3>
          <p>{error}</p>
          <button onClick={fetchPackages} className="btn btn-primary">
            🔄 Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="packages-section-header">
            <h2>
              {searchTerm || filterType !== "all" ? "Filtered Packages" : "All Packages"} 
              <span className="results-count">({filteredPackages.length})</span>
            </h2>
            <div className="section-actions">
              <button onClick={fetchPackages} className="btn btn-secondary">
                🔄 Refresh
              </button>
            </div>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Packages Found</h3>
              <p>
                {searchTerm || filterType !== "all" 
                  ? "No packages match your search criteria. Try adjusting your filters."
                  : "We're currently updating our service packages. Please check back later."
                }
              </p>
              <div className="empty-state-actions">
                {(searchTerm || filterType !== "all") && (
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                    }} 
                    className="btn btn-primary"
                  >
                    Show All Packages
                  </button>
                )}
                <button onClick={fetchPackages} className="btn btn-secondary">
                  🔄 Refresh List
                </button>
              </div>
            </div>
          ) : (
            <div className="packages-grid">
              {filteredPackages.map(renderPackageCard)}
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      {showReviewModal && <QuickReviewModal />}
    </div>
  );
}

export default ClientPackages;