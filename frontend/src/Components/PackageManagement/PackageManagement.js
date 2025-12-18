import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";

function PackageManagement() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all packages
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/packages");
      if (res.data?.success) {
        setPackages(res.data.packages || []);
      } else {
        setError("Failed to fetch packages");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error fetching packages");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate("/add-package");
  };

  const handleUpdate = (packageItem) => {
    // Navigate to update page with package data
    navigate("/update-package", { 
      state: { 
        package: packageItem 
      } 
    });
  };

  const handleDelete = async (packageId, packageName) => {
    if (!window.confirm(`Are you sure you want to delete "${packageName}"?`)) {
      return;
    }

    try {
      const res = await axios.delete(`http://localhost:5000/api/packages/${packageId}`);
      if (res.data.success) {
        alert("Package deleted successfully!");
        fetchPackages(); // Refresh the list
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error deleting package";
      setError(errorMsg);
      alert(`Delete failed: ${errorMsg}`);
    }
  };

  const handleViewDetails = (packageItem) => {
    // You can implement a details view or modal here
    alert(`Package Details:\nName: ${packageItem.PackageName}\nID: ${packageItem.PackageId}\nType: ${packageItem.PackageType}\nPrice: $${packageItem.FinalPrice}\nDuration: ${packageItem.Duration} days`);
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <div className="page-header">
            <h1>Package Management</h1>
            <button 
              onClick={handleCreateNew}
              className="btn-primary"
            >
              Create New Package
            </button>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
          
          {loading ? (
            <div className="loading">Loading packages...</div>
          ) : (
            <div className="packages-container">
              {packages.length === 0 ? (
                <div className="no-packages">
                  <p>No packages found. Create your first package!</p>
                </div>
              ) : (
                <div className="packages-grid">
                  {packages.map((pkg) => (
                    <div key={pkg._id || pkg.PackageId} className="package-card">
                      <div className="package-header">
                        <h3 className="package-name">{pkg.PackageName}</h3>
                        <span className={`status-badge ${pkg.Availability?.toLowerCase()}`}>
                          {pkg.Availability}
                        </span>
                      </div>
                      
                      <div className="package-details">
                        <div className="detail-row">
                          <span className="label">Package ID:</span>
                          <span className="value">{pkg.PackageId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Type:</span>
                          <span className="value">{pkg.PackageType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Duration:</span>
                          <span className="value">{pkg.Duration} days</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Base Price:</span>
                          <span className="value">${pkg.BasePrice}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Final Price:</span>
                          <span className="value">${pkg.FinalPrice}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Description:</span>
                          <span className="value description">{pkg.Description}</span>
                        </div>
                      </div>

                      <div className="package-actions">
                        <button 
                          onClick={() => handleViewDetails(pkg)}
                          className="btn-view"
                          title="View Details"
                        >
                          👁️ View
                        </button>
                        <button 
                          onClick={() => handleUpdate(pkg)}
                          className="btn-update"
                          title="Edit Package"
                        >
                          ✏️ Update
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg._id || pkg.PackageId, pkg.PackageName)}
                          className="btn-delete"
                          title="Delete Package"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackageManagement;