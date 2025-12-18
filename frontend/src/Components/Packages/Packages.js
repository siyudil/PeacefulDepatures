// src/pages/PackagesPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";
import "./Packages.css";

function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({});
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

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

  const handleDownloadPDF = async (pkg) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/packages/${pkg._id}/pdf`,
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
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
        [pkg._id]: { success: true, error: '' }
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
        [pkg._id]: { success: false, error: error.message }
      }));

      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[pkg._id];
          return newStatus;
        });
      }, 3000);

      showNotification('Error downloading PDF. Please try again.', 'error');
    }
  };

  const handleDelete = async (pkgId) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/packages/${pkgId}`);
      setPackages((prev) => prev.filter((pkg) => pkg._id !== pkgId));
      showNotification('Package deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete package", 'error');
    }
  };

  const handleUpdate = (pkg) => {
    if (pkg.Availability?.toLowerCase() === 'unavailable') {
      showNotification('Cannot update an unavailable package!', 'error');
      return;
    }
    navigate(`/update-package/${pkg._id}`, { state: { package: pkg } });
  };

  const handleAddPackage = () => {
    navigate("/add-package");
  };

  const handleDownloadAllPackages = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/packages/pdf/all',
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_packages_catalog_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification(`✅ Successfully downloaded all ${packages.length} packages`, 'success');
      
    } catch (error) {
      showNotification('Error downloading all packages. Please try again.', 'error');
    }
  };

  // Handle Halls navigation
  const handleHallsNavigation = () => {
    navigate("/admin/halls");
  };

  // NEW: Handle Report & Analysis navigation
  const handleReportsNavigation = () => {
    navigate("/package-reports");
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

  const renderPackageCard = (pkg) => {
    const totalPrice = calculateTotalPrice(pkg);
    const isUnavailable = pkg.Availability?.toLowerCase() === 'unavailable';

    return (
      <div key={pkg._id} className={`package-card ${isUnavailable ? 'unavailable' : ''}`}>
        {downloadStatus[pkg._id] && (
          <div className={`download-status ${downloadStatus[pkg._id].success ? 'success' : 'error'}`}>
            {downloadStatus[pkg._id].success ? '✅ Downloaded' : '❌ Failed'}
          </div>
        )}

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
            <p className="package-id">ID: {pkg.PackageId || "N/A"}</p>
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

          <div className="package-actions">
            <button 
              className="action-btn download-btn"
              onClick={() => handleDownloadPDF(pkg)}
              disabled={isUnavailable}
            >
              📄 Download PDF
            </button>
            <button 
              className="action-btn update-btn"
              onClick={() => handleUpdate(pkg)}
              disabled={isUnavailable}
            >
              ✏️ Update
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={() => handleDelete(pkg._id)}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          {/* UPDATED: Page Header with Report & Analysis Button */}
          <div className="page-header">
            <div className="header-title-section">
              <h1>📦 Package Management</h1>
              {!loading && !error && (
                <div className="package-count">
                  Available Packages: {packages.filter(pkg => pkg.Availability?.toLowerCase() !== 'unavailable').length}
                </div>
              )}
            </div>
            
            <div className="header-actions">
              <div className="action-buttons-group">
                {/* NEW: Report & Analysis Button */}
                <button 
                  className="btn btn-reports"
                  onClick={handleReportsNavigation}
                  title="View Package Reports and Analytics"
                >
                  📊 Report & Analysis
                </button>
                
                <button 
                  className="btn btn-halls"
                  onClick={handleHallsNavigation}
                  title="Manage Funeral Halls"
                >
                  🏛️ Manage Halls
                </button>
                
                {!loading && !error && packages.length > 0 && (
                  <button 
                    onClick={handleDownloadAllPackages} 
                    className="btn btn-download-all"
                    title="Download all packages as PDF"
                  >
                    📚 Download All
                  </button>
                )}
                
                <button 
                  onClick={handleAddPackage} 
                  className="btn btn-primary"
                  title="Add new package"
                >
                  ➕ Add Package
                </button>
              </div>
            </div>
          </div>

          {loading && <div className="loading-state">Loading packages...</div>}

          {error && (
            <div className="error-state">
              <h3>Error Loading Packages</h3>
              <p>{error}</p>
              <button onClick={fetchPackages} className="btn btn-primary">Retry</button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="packages-section-header">
                <h2>
                  All Packages 
                  <span className="package-count-badge">({packages.length})</span>
                </h2>
              </div>

              {packages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <h3>No Packages Found</h3>
                  <p>Create your first package to get started.</p>
                  <div className="empty-state-actions">
                    <button onClick={handleAddPackage} className="btn btn-primary">
                      Create First Package
                    </button>
                    <button onClick={handleHallsNavigation} className="btn btn-secondary">
                      🏛️ Manage Halls Instead
                    </button>
                    <button onClick={handleReportsNavigation} className="btn btn-reports">
                      📊 View Reports
                    </button>
                  </div>
                </div>
              ) : (
                <div className="packages-grid">
                  {packages.map(renderPackageCard)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackagesPage;