// src/Components/PackageReports/PackageReports.js (Simplest version)
import React, { useState, useEffect } from 'react';
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";
import './PackageReports.css';

const PackageReports = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState([]);

    const getMonthName = (monthIndex) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    };

    useEffect(() => {
        // Define packages and generate data directly in useEffect
        const packages = [
            { id: 1, name: "Basic Funeral Package" },
            { id: 2, name: "Standard Funeral Package" },
            { id: 3, name: "Premium Funeral Package" },
            { id: 4, name: "VIP Funeral Package" },
            { id: 5, name: "Cremation Service Package" },
            { id: 6, name: "Emergency Funeral Service" }
        ];

        const monthlyData = packages.map(pkg => ({
            ...pkg,
            usage: Math.floor(Math.random() * 50) + 10,
            revenue: Math.floor(Math.random() * 50000) + 10000
        }));

        setReportData(monthlyData);
    }, [selectedMonth, selectedYear]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const formatCurrency = (amount) => {
        return `LKR ${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const getUsagePercentage = (usage) => {
        const maxUsage = 60; // Maximum possible usage in our sample data
        return (usage / maxUsage) * 100;
    };

    return (
        <div className="admin-dashboard">
            <AdminHeader />
            <div className="admin-body">
                <AdminSidebar />
                <div className="admin-content">
                    <div className="package-reports-container">
                        <div className="reports-header">
                            <h1>Package Usage Reports & Analysis</h1>
                            <p>Monthly package booking statistics and analysis</p>
                        </div>

                        {/* Filters */}
                        <div className="filters-section">
                            <div className="filter-group">
                                <label htmlFor="monthSelect">Select Month:</label>
                                <select 
                                    id="monthSelect"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {getMonthName(i)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label htmlFor="yearSelect">Select Year:</label>
                                <select 
                                    id="yearSelect"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Statistics Summary */}
                        <div className="stats-summary">
                            <h3>Monthly Summary - {getMonthName(selectedMonth)} {selectedYear}</h3>
                            <div className="stats-grid">
                                {reportData.map((pkg, index) => (
                                    <div key={pkg.id} className="stat-card">
                                        <h4>{pkg.name}</h4>
                                        <p className="stat-number">{pkg.usage}</p>
                                        <span className="stat-label">Bookings</span>
                                        <div className="revenue">
                                            {formatCurrency(pkg.revenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Usage Bar Chart - Custom Implementation */}
                        <div className="chart-section">
                            <h3>Package Usage Visualization</h3>
                            <div className="custom-bar-chart">
                                {reportData.map((pkg, index) => (
                                    <div key={pkg.id} className="bar-item">
                                        <div className="bar-label">{pkg.name}</div>
                                        <div className="bar-container">
                                            <div 
                                                className="bar-fill"
                                                style={{ width: `${getUsagePercentage(pkg.usage)}%` }}
                                            >
                                                <span className="bar-value">{pkg.usage} bookings</span>
                                            </div>
                                        </div>
                                        <div className="bar-percentage">
                                            {Math.round(getUsagePercentage(pkg.usage))}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Analysis */}
                        <div className="revenue-section">
                            <h3>Revenue Analysis</h3>
                            <div className="revenue-grid">
                                {reportData.map((pkg, index) => (
                                    <div key={pkg.id} className="revenue-card">
                                        <h4>{pkg.name}</h4>
                                        <div className="revenue-amount">
                                            {formatCurrency(pkg.revenue)}
                                        </div>
                                        <div className="revenue-breakdown">
                                            <div className="breakdown-item">
                                                <span>Bookings:</span>
                                                <span>{pkg.usage}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Avg. Revenue:</span>
                                                <span>{formatCurrency(pkg.revenue / pkg.usage)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Reports Section */}
                        <div className="additional-reports">
                            <h3>Additional Analytics</h3>
                            <div className="report-cards">
                                <div className="report-card">
                                    <i className="fas fa-trend-up"></i>
                                    <h4>Trend Analysis</h4>
                                    <p>View package usage trends over time</p>
                                </div>
                                <div className="report-card">
                                    <i className="fas fa-money-bill-wave"></i>
                                    <h4>Revenue Report</h4>
                                    <p>Package revenue and profitability analysis</p>
                                </div>
                                <div className="report-card">
                                    <i className="fas fa-users"></i>
                                    <h4>Customer Demographics</h4>
                                    <p>Customer preferences and package popularity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageReports;