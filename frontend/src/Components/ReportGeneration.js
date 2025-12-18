import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import axios from 'axios';
import AdminHeader from './admin/AdminHeader';
import AdminSidebar from './admin/AdminSidebar';
import './ReportGeneration.css';

// Import with error handling
let jsPDF;
let html2canvas;

try {
  // Correct way to import jsPDF
  jsPDF = require('jspdf').jsPDF || require('jspdf').default;
  html2canvas = require('html2canvas');
} catch (error) {
  console.warn('PDF libraries not available:', error);
}

const ReportGeneration = () => {
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [, setStaff] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    staff: {
      startDate: '',
      endDate: '',
      department: 'all',
      gender: 'all'
    },
    vendors: {
      startDate: '',
      endDate: '',
      serviceType: 'all',
      status: 'all'
    },
    assignments: {
      startDate: '',
      endDate: '',
      status: 'all',
      priority: 'all',
      staffId: 'all'
    }
  });

  const API_URL = 'http://localhost:5000/api/reports';
  const STAFF_API_URL = 'http://localhost:5000/api/staff';

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(STAFF_API_URL);
      const staffMembers = response.data.staff.filter(person => person.role === 'Staff');
      setStaff(staffMembers);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const currentFilters = filters[activeTab];
      const queryParams = new URLSearchParams();
      
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key] && currentFilters[key] !== 'all') {
          queryParams.append(key, currentFilters[key]);
        }
      });

      const response = await axios.get(`${API_URL}/${activeTab}?${queryParams}`);
      setReportData(response.data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    // Check if PDF libraries are available
    if (!jsPDF || !html2canvas) {
      alert('PDF export is not available. Please make sure jspdf and html2canvas are installed.');
      return;
    }

    setPdfLoading(true);
    try {
      const element = document.getElementById('report-content');
      if (!element) {
        throw new Error('Report content not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF instance - fixed constructor call
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80);
      pdf.text(reportData.metadata.title, 105, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date(reportData.metadata.generatedAt).toLocaleString()}`, 15, 25);

      // Add filters if available
      let yPosition = 35;
      if (reportData.metadata.filters) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Filters:', 15, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        Object.entries(reportData.metadata.filters).forEach(([key, value]) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${key}: ${value}`, 20, yPosition);
          yPosition += 5;
        });
        yPosition += 10;
      }

      // Add the main content
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate available height for content
      const contentStartY = yPosition;
      const availableHeight = pageHeight - contentStartY - 20; // 20mm margin at bottom
      
      if (imgHeight <= availableHeight) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', 10, contentStartY, imgWidth - 20, imgHeight);
      } else {
        // Content needs multiple pages
        let currentHeight = 0;
        while (currentHeight < imgHeight) {
          if (currentHeight > 0) {
            pdf.addPage();
          }
          
          const pageHeightToUse = Math.min(availableHeight, imgHeight - currentHeight);
          pdf.addImage(
            imgData, 
            'PNG', 
            10, 
            currentHeight === 0 ? contentStartY : 10, 
            imgWidth - 20, 
            pageHeightToUse,
            undefined,
            undefined,
            0,
            -currentHeight
          );
          
          currentHeight += availableHeight;
        }
      }

      // Add page numbers
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
      }

      // Save the PDF
      const fileName = `${reportData.metadata.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
      
    } finally {
      setPdfLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.details) {
      alert('No data available to export');
      return;
    }
    
    try {
      const headers = Object.keys(reportData.details[0]).join(',');
      const rows = reportData.details.map(item => 
        Object.values(item).map(value => 
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      ).join('\n');
      
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${reportData.metadata.title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV: ' + error.message);
    }
  };

  // Filter rendering functions
  const renderStaffFilters = () => (
    <div className="filter-group">
      <div className="filter-item">
        <label>Start Date:</label>
        <input 
          type="date" 
          value={filters.staff.startDate}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            staff: { ...prev.staff, startDate: e.target.value }
          }))}
        />
      </div>
      <div className="filter-item">
        <label>End Date:</label>
        <input 
          type="date" 
          value={filters.staff.endDate}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            staff: { ...prev.staff, endDate: e.target.value }
          }))}
        />
      </div>
      <div className="filter-item">
        <label>Department:</label>
        <select 
          value={filters.staff.department}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            staff: { ...prev.staff, department: e.target.value }
          }))}
        >
          <option value="all">All Departments</option>
          <option value="embalming">Embalming</option>
          <option value="coordination">Coordination</option>
          <option value="transport">Transport</option>
        </select>
      </div>
      <div className="filter-item">
        <label>Gender:</label>
        <select 
          value={filters.staff.gender}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            staff: { ...prev.staff, gender: e.target.value }
          }))}
        >
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
    </div>
  );

  const renderVendorFilters = () => (
    <div className="filter-group">
      <div className="filter-item">
        <label>Start Date:</label>
        <input 
          type="date" 
          value={filters.vendors.startDate}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            vendors: { ...prev.vendors, startDate: e.target.value }
          }))}
        />
      </div>
      <div className="filter-item">
        <label>End Date:</label>
        <input 
          type="date" 
          value={filters.vendors.endDate}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            vendors: { ...prev.vendors, endDate: e.target.value }
          }))}
        />
      </div>
      <div className="filter-item">
        <label>Service Type:</label>
        <select 
          value={filters.vendors.serviceType}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            vendors: { ...prev.vendors, serviceType: e.target.value }
          }))}
        >
          <option value="all">All Services</option>
          <option value="florist">Florist</option>
          <option value="catering">Catering</option>
          <option value="transport">Transport</option>
        </select>
      </div>
      <div className="filter-item">
        <label>Status:</label>
        <select 
          value={filters.vendors.status}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            vendors: { ...prev.vendors, status: e.target.value }
          }))}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );

  const renderAssignmentFilters = () => (
    <div className="filter-group">
      <div className="filter-item">
        <label>Start Date:</label>
        <input 
          type="date" 
          value={filters.assignments.startDate}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            assignments: { ...prev.assignments, startDate: e.target.value }
          }))}
        />
      </div>
      <div className="filter-item">
        <label>End Date:</label>
        <input 
          type="date" 
          value={filters.assignments.endDate}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            assignments: { ...prev.assignments, endDate: e.target.value }
          }))}
        />
      </div>
      <div className="filter-item">
        <label>Status:</label>
        <select 
          value={filters.assignments.status}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            assignments: { ...prev.assignments, status: e.target.value }
          }))}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
        </select>
      </div>
      <div className="filter-item">
        <label>Priority:</label>
        <select 
          value={filters.assignments.priority}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            assignments: { ...prev.assignments, priority: e.target.value }
          }))}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );

  // Helper function to format cell value
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      // If it's an object, handle common cases
      if (Array.isArray(value)) return value.join(', ');
      if (value instanceof Date) return value.toLocaleString();
      // Handle status and priority objects that we know about
      if (value.scheduled !== undefined && value.completed !== undefined) {
        return `Scheduled: ${value.scheduled}, In Progress: ${value.inProgress || 0}, Completed: ${value.completed}, Cancelled: ${value.cancelled || 0}`;
      }
      if (value.low !== undefined && value.medium !== undefined) {
        return `Low: ${value.low}, Medium: ${value.medium}, High: ${value.high || 0}, Urgent: ${value.urgent || 0}`;
      }
      // For other objects, stringify them
      return JSON.stringify(value);
    }
    return value.toString();
  };

  // Report content rendering function
  const renderReportContent = () => {
    if (!reportData) {
      return <div className="no-data">No data available for the selected report.</div>;
    }

    // Handle case where details might be an object instead of an array
    const details = Array.isArray(reportData.details) 
      ? reportData.details 
      : [reportData.details || {}];

    return (
      <div className="report-content">
        {reportData.summary && (
          <div className="report-summary">
            <h3>Summary</h3>
            <div className="summary-grid">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="summary-item">
                  <span className="summary-label">{key}:</span>
                  <span className="summary-value">{formatCellValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="report-details">
          <h3>Details</h3>
          {details && details.length > 0 && Object.keys(details[0]).length > 0 ? (
            <table className="report-table">
              <thead>
                <tr>
                  {Object.keys(details[0]).map(key => (
                    <th key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.map((item, index) => (
                  <tr key={index}>
                    {Object.entries(item).map(([key, value]) => (
                      <td key={`${index}-${key}`}>
                        {formatCellValue(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">No detailed data available.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="report-generation">
      <AdminHeader />
      <div className="dashboard-container">
        <AdminSidebar />
        <div className="main-content">
          {/* Top Menu Buttons */}
          <div className="top-menu">
            <Link to="/dashboard" className="menu-btn">Dashboard</Link>
            <Link to="/staff" className="menu-btn">Staff</Link>
            <Link to="/vendors" className="menu-btn">Vendors</Link>
            <Link to="/assignments" className="menu-btn">Assignments</Link>
            <Link to="/reports" className="menu-btn active">Reports</Link>
          </div>

          {/* Report Type Tabs */}
          <div className="report-tabs">
            <button 
              className={`tab-button ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              📊 Staff Report
            </button>
            <button 
              className={`tab-button ${activeTab === 'vendors' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendors')}
            >
              🏢 Vendor Report
            </button>
            <button 
              className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              📋 Assignment Report
            </button>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <h3>Report Filters</h3>
            {activeTab === 'staff' && renderStaffFilters()}
            {activeTab === 'vendors' && renderVendorFilters()}
            {activeTab === 'assignments' && renderAssignmentFilters()}
            
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              
              {reportData && (
                <div className="export-buttons">
                  <button 
                    className="btn btn-secondary"
                    onClick={exportToPDF}
                    disabled={!reportData || pdfLoading}
                  >
                    {pdfLoading ? 'Generating PDF...' : 'Export to PDF'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={exportToCSV}
                    disabled={!reportData}
                  >
                    Export to CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Report Content */}
          {reportData && (
            <div id="report-content" className="report-content">
              <h2>{reportData.metadata.title}</h2>
              <p className="report-meta">
                Generated: {new Date(reportData.metadata.generatedAt).toLocaleString()}
              </p>
              
              {reportData.metadata.filters && Object.keys(reportData.metadata.filters).length > 0 && (
                <div className="report-filters">
                  <h4>Filters Applied:</h4>
                  <ul>
                    {Object.entries(reportData.metadata.filters).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {value || 'All'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {renderReportContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

    export default ReportGeneration;