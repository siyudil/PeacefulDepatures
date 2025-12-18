// components/PackagesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./PackagesPage.css";
import Nav from "../Nav/Nav";

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState({});
  const [isClientView, setIsClientView] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const userRole = localStorage.getItem('userRole') || 'client';
    const isAdmin = userRole === 'admin';
    setIsClientView(!isAdmin);
    
    console.log(`👤 User role: ${userRole}, Client view: ${!isAdmin}`);
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching packages...');
      const response = await axios.get('http://localhost:5000/api/packages');
      
      let packagesData = [];
      if (response.data && response.data.packages) {
        packagesData = response.data.packages;
      } else if (response.data && Array.isArray(response.data)) {
        packagesData = response.data;
      } else if (response.data && response.data.data) {
        packagesData = response.data.data;
      } else {
        packagesData = [];
      }

      console.log('📦 Packages data received:', packagesData);

      const processedPackages = packagesData.map(pkg => ({
        ...pkg,
        PackageImage: pkg.PackageImage ? 
          (pkg.PackageImage.startsWith('http') ? 
            pkg.PackageImage : 
            `http://localhost:5000${pkg.PackageImage}`
          ) : null
      }));

      console.log('🖼️ Processed packages with images:', processedPackages);
      setPackages(processedPackages);
      setError('');
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      setError(error.response?.data?.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (packageData) => {
    try {
      console.log('📄 Downloading PDF for package:', packageData._id);
      
      const response = await axios.get(
        `http://localhost:5000/api/packages/${packageData._id}/pdf`,
        {
          responseType: 'blob',
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${packageData.PackageName?.replace(/\s+/g, '_') || 'package'}_${packageData.PackageId || packageData._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus(prev => ({
        ...prev,
        [packageData._id]: {
          success: true,
          error: '',
          timestamp: new Date().toISOString()
        }
      }));

      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[packageData._id];
          return newStatus;
        });
      }, 3000);

    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      
      setDownloadStatus(prev => ({
        ...prev,
        [packageData._id]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));

      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[packageData._id];
          return newStatus;
        });
      }, 3000);

      alert('Error downloading PDF. Please try again.');
    }
  };

  const handleUpdatePackage = (packageData) => {
    if (isClientView) return;
    console.log('Update package:', packageData);
    // Navigate to update package page
    navigate(`/update-package/${packageData._id}`);
  };

  const handleDeletePackage = async (packageId, packageName) => {
    if (isClientView) return;
    if (window.confirm(`Are you sure you want to delete "${packageName}"?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/packages/${packageId}`);
        setPackages(prev => prev.filter(pkg => pkg._id !== packageId));
        alert('Package deleted successfully!');
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting package. Please try again.');
      }
    }
  };

  const downloadAllPackages = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/packages/pdf/all',
        {
          responseType: 'blob',
          timeout: 60000,
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

      alert(`✅ Successfully downloaded all ${packages.length} packages`);
      
    } catch (error) {
      console.error('Error downloading all packages:', error);
      alert('Error downloading all packages. Please try again.');
    }
  };

  // NEW: Navigate to Halls page
  const handleNavigateToHalls = () => {
    navigate('/halls');
  };

  // NEW: Navigate to Add Package page
  const handleAddNewPackage = () => {
    navigate('/add-package');
  };

  const handleImageError = (e, packageData) => {
    console.error('❌ Image failed to load:', packageData.PackageImage);
    e.target.style.display = 'none';
    
    const card = e.target.closest('.package-card');
    if (card) {
      const placeholder = card.querySelector('.image-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  };

  const handleImageLoad = (e) => {
    console.log('✅ Image loaded successfully');
    const card = e.target.closest('.package-card');
    if (card) {
      const placeholder = card.querySelector('.image-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading packages...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-message">
        <h3>❌ Error Loading Packages</h3>
        <p>{error}</p>
      </div>
      <button onClick={fetchPackages} className="btn btn-primary">
        🔄 Retry
      </button>
    </div>
  );

  return (
    <div className="packages-page">
      <Nav />
      <div className="packages-header">
        <div className="header-content">
          <h1>{isClientView ? "📦 Our Funeral Packages" : "📦 Package Management"}</h1>
          <p>
            {isClientView 
              ? "Browse our comprehensive funeral service packages" 
              : "Manage and download your funeral packages"
            }
          </p>
          {!isClientView && (
            <div className="package-stats">
              Available Packages: {packages.filter(pkg => pkg.Availability?.toLowerCase() !== 'unavailable').length}
            </div>
          )}
        </div>
        
        {!isClientView && (
          <div className="bulk-actions">
            {/* NEW: Halls Navigation Button */}
            <button 
              className="btn btn-secondary halls-btn"
              onClick={handleNavigateToHalls}
            >
              🏛️ Halls
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={downloadAllPackages}
              disabled={packages.length === 0}
            >
              📚 Download All as PDF ({packages.length})
            </button>

            {/* NEW: Add Package Button */}
            <button 
              className="btn btn-primary"
              onClick={handleAddNewPackage}
            >
              ➕ Add New Package
            </button>
          </div>
        )}
      </div>

      {!isClientView && (
        <div className="debug-info">
          <strong>Debug Info:</strong> {packages.length} packages loaded | 
          Packages with images: {packages.filter(p => p.PackageImage).length} |
          View: {isClientView ? 'Client' : 'Admin'}
        </div>
      )}

      <div className="packages-grid">
        {packages.map(pkg => (
          <div key={pkg._id} className="package-card">
            {downloadStatus[pkg._id] && (
              <div className={`download-status ${downloadStatus[pkg._id].success ? 'success' : 'error'}`}>
                {downloadStatus[pkg._id].success ? '✅ Downloaded' : '❌ Failed'}
              </div>
            )}

            {pkg.isPopular && <div className="popular-badge">Most Popular</div>}
            
            {pkg.Availability?.toLowerCase() === 'unavailable' && (
              <div className="unavailable-badge">Currently Unavailable</div>
            )}
            
            <div className="package-image-container">
              {pkg.PackageImage ? (
                <div className="package-image">
                  <img 
                    src={pkg.PackageImage} 
                    alt={pkg.PackageName || "Package Image"}
                    onError={(e) => handleImageError(e, pkg)}
                    onLoad={handleImageLoad}
                  />
                </div>
              ) : null}
              
              <div 
                className="image-placeholder" 
                style={{ 
                  display: pkg.PackageImage ? 'none' : 'flex'
                }}
              >
                📦 Package
                <div className="placeholder-id">{pkg.PackageId}</div>
              </div>
            </div>

            <div className="package-header">
              <h3 className="package-name">{pkg.PackageName || "Unnamed Package"}</h3>
              <div className="package-id">Package ID: {pkg.PackageId || "N/A"}</div>
              <div className="package-price">
                LKR {pkg.FinalPrice?.toLocaleString() || pkg.PackagePrice?.toLocaleString() || "0"}
                {pkg.BasePrice > pkg.FinalPrice && (
                  <span className="discount-badge">
                    Save LKR {(pkg.BasePrice - pkg.FinalPrice)?.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="package-duration">{pkg.Duration || "0"} days service</div>
            </div>

            <div className="package-type">
              <span className={`type-badge ${pkg.PackageType?.toLowerCase() || 'basic'}`}>
                {pkg.PackageType || "Basic"}
              </span>
              <span className={`availability ${pkg.Availability?.toLowerCase() || 'available'}`}>
                {pkg.Availability || "Available"}
              </span>
            </div>

            <div className="package-description">
              <p>{pkg.Description || "Comprehensive funeral service package"}</p>
            </div>

            {pkg.features && pkg.features.length > 0 && (
              <div className="package-features">
                <h4>Package Includes:</h4>
                <ul>
                  {pkg.features.slice(0, 3).map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                  {pkg.features.length > 3 && (
                    <li className="more-features">+ {pkg.features.length - 3} more services</li>
                  )}
                </ul>
              </div>
            )}

            <div className="package-actions">
              <button 
                className="action-btn download-btn"
                onClick={() => handleDownloadPDF(pkg)}
                title="Download PDF Brochure"
                disabled={pkg.Availability?.toLowerCase() === 'unavailable'}
              >
                📄 Download PDF
              </button>

              {!isClientView && (
                <>
                  <button 
                    className="action-btn update-btn"
                    onClick={() => handleUpdatePackage(pkg)}
                    title="Update Package"
                    disabled={pkg.Availability?.toLowerCase() === 'unavailable'}
                  >
                    ✏️ Update
                  </button>

                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeletePackage(pkg._id, pkg.PackageName)}
                    title="Delete Package"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}

              {isClientView && (
                <button 
                  className="action-btn contact-btn"
                  onClick={() => alert('Please contact us for more information about this package.')}
                  title="Contact for Details"
                >
                  📞 Contact Us
                </button>
              )}
            </div>

            {!isClientView && (
              <div className="debug-package-info">
                <strong>Image URL:</strong> {pkg.PackageImage || 'No image'}
              </div>
            )}
          </div>
        ))}
      </div>

      {packages.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Packages Available</h3>
          <p>
            {isClientView 
              ? "We're currently updating our service packages. Please check back later or contact us for more information."
              : "There are no packages to display at the moment."
            }
          </p>
          <div className="empty-state-actions">
            <button onClick={fetchPackages} className="btn btn-primary">
              🔄 Refresh
            </button>
            {!isClientView && (
              <button onClick={handleAddNewPackage} className="btn btn-secondary">
                ➕ Add First Package
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
