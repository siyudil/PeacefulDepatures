import React from "react";
import { useNavigate } from "react-router-dom";
import "./Item.css";

function Item({ item, onDelete, onUpdate }) {
  const navigate = useNavigate();

  // Safety check
  if (!item) return <p className="error-message">Invalid package data</p>;

  const {
    PackageName,
    PackageId,
    PackageType,
    Description,
    BasePrice,
    FinalPrice,
    Duration,
    Availability,
  } = item;

  // Calculate discount percentage
  const discount = BasePrice && FinalPrice && BasePrice > FinalPrice 
    ? Math.round(((BasePrice - FinalPrice) / BasePrice) * 100) 
    : 0;

  // Handle update button click
  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(item);
    } else {
      navigate(`/update-package/${PackageId}`, { state: { package: item } });
    }
  };

  // Handle delete button click
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${PackageName}"?`)) {
      onDelete(item._id || PackageId);
    }
  };

  return (
    <div className="package-card">
      <div className="package-header">
        <div className="package-title-section">
          <h2 className="package-title">{PackageName}</h2>
          <span className="package-id">ID: {PackageId}</span>
        </div>
        {discount > 0 && (
          <span className="discount-badge">{discount}% OFF</span>
        )}
      </div>
      
      <div className="package-content">
        <div className="package-info">
          <div className="info-group">
            <span className="info-label">Package Type:</span>
            <span className="info-value package-type-tag">{PackageType}</span>
          </div>
          <div className="info-group">
            <span className="info-label">Description:</span>
            <p className="description">{Description}</p>
          </div>
          <div className="info-group">
            <span className="info-label">Duration:</span>
            <span className="info-value duration-text">
              ⏱️ {Duration} {typeof Duration === 'number' ? 'days' : ''}
            </span>
          </div>
        </div>

        <div className="package-pricing">
          <div className="price-group">
            <span className="price-label">Base Price:</span>
            <span className="base-price">${BasePrice}</span>
          </div>
          <div className="price-group">
            <span className="price-label">Final Price:</span>
            <span className="final-price">${FinalPrice}</span>
          </div>
          {discount > 0 && (
            <div className="price-group">
              <span className="price-label">You Save:</span>
              <span className="discount-amount">${BasePrice - FinalPrice}</span>
            </div>
          )}
        </div>

        <div className="package-availability">
          <span className={`availability-badge ${Availability ? 'available' : 'unavailable'}`}>
            <span className="status-dot"></span>
            {Availability ? 'Available' : 'Not Available'}
          </span>
        </div>
      </div>

      {/* Enhanced Update and Delete Buttons */}
      <div className="package-actions">
        <button 
          className="btn btn-update"
          onClick={handleUpdate}
          title="Edit this package"
        >
          <span className="btn-icon">✏️</span>
          Update Package
        </button>
        <button 
          className="btn btn-delete"
          onClick={handleDelete}
          title="Delete this package permanently"
        >
          <span className="btn-icon">🗑️</span>
          Delete Package
        </button>
      </div>
    </div>
  );
}

export default Item;