// Routes/PackageRoutes.js
const express = require("express");
const router = express.Router();
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

// Import controller functions
const {
  getAllPackages,
  addPackage,
  getById,
  updatePackage,
  deletePackage,
  getNextPackageId,
  searchPackages,
  getPackagesByAvailability,
  getPackageStats,
  getPackagesWithServices
} = require("../Controllers/PackageController");

// ==================== SIMPLIFIED UPLOAD MIDDLEWARE ==================== //
let upload;

try {
  // Try to load upload middleware - adjust path as needed
  const multer = require('multer');
  
  // Simple multer configuration as fallback
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      // Create unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'package-' + uniqueSuffix + '-' + file.originalname);
    }
  });

  // File filter for images only
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  console.log('✅ Multer upload middleware initialized successfully');

} catch (error) {
  console.error('❌ Error loading multer:', error.message);
  
  // Fallback middleware that doesn't process files
  upload = {
    single: (fieldName) => (req, res, next) => {
      console.log('⚠️ Using fallback upload middleware - file processing disabled');
      req.file = null;
      next();
    }
  };
  console.log('⚠️ Fallback upload middleware activated');
}

// ==================== MOCK DATA (Keep as backup) ==================== //
const getMockPackage = (id) => ({
  _id: id || 'mock_id',
  PackageName: "Premium Funeral Package",
  PackageId: "PKG0002",
  PackageType: "Basic",
  Description: "Comprehensive funeral package with premium services",
  PackagePrice: 55500,
  BasePrice: 55500,
  FinalPrice: 77777,
  Duration: 7,
  Availability: "Available",
  PackageImage: "/uploads/sample-package.jpg",
  AdditionalServices: [
    { id: 1, name: "Flower Arrangements", price: 5000, included: true },
    { id: 2, name: "Transportation", price: 8000, included: true },
    { id: 3, name: "Catering", price: 0, included: false },
    { id: 4, name: "Photography", price: 0, included: false },
    { id: 5, name: "Videography", price: 0, included: false }
  ],
  ServicesTotal: 13000,
  SubTotal: 68500,
  Discount: 3425,
  DiscountPercentage: 5,
  GrandTotal: 65075,
  HasDiscount: true,
  Currency: "LKR",
  createdAt: new Date(),
  updatedAt: new Date()
});

const getMockPackages = () => [
  getMockPackage('1'),
  {
    ...getMockPackage('2'),
    PackageName: "Standard Package",
    PackageId: "PKG0003",
    Description: "Standard funeral package with essential services",
    PackagePrice: 30000,
    BasePrice: 30000,
    FinalPrice: 30000,
    Duration: 30,
    AdditionalServices: [
      { id: 1, name: "Flower Arrangements", price: 0, included: false },
      { id: 2, name: "Transportation", price: 5000, included: true },
      { id: 3, name: "Catering", price: 0, included: false },
      { id: 4, name: "Photography", price: 0, included: false },
      { id: 5, name: "Videography", price: 0, included: false }
    ],
    ServicesTotal: 5000,
    SubTotal: 35000,
    Discount: 1750,
    DiscountPercentage: 5,
    GrandTotal: 33250,
    HasDiscount: true
  },
  {
    ...getMockPackage('3'),
    PackageName: "Basic Cremation",
    PackageId: "PKG0004",
    PackageType: "Basic",
    Description: "Simple cremation service package",
    PackagePrice: 15000,
    BasePrice: 15000,
    FinalPrice: 15000,
    Duration: 15,
    AdditionalServices: [
      { id: 1, name: "Flower Arrangements", price: 0, included: false },
      { id: 2, name: "Transportation", price: 0, included: false },
      { id: 3, name: "Catering", price: 0, included: false },
      { id: 4, name: "Photography", price: 0, included: false },
      { id: 5, name: "Videography", price: 0, included: false }
    ],
    ServicesTotal: 0,
    SubTotal: 15000,
    Discount: 0,
    DiscountPercentage: 0,
    GrandTotal: 15000,
    HasDiscount: false
  }
];

// ==================== DYNAMIC PACKAGE MODEL ==================== //
let Package;
let dbConnected = false;

const checkDBConnection = () => mongoose.connection.readyState === 1;

const loadPackageModel = () => {
  const possiblePaths = [
    "../Models/Package", "../models/Package",
    "../Models/packageModel", "../models/packageModel", 
    "../Models/PackageModel", "../models/PackageModel",
    "../Model/Package", "../model/Package"
  ];

  for (const modelPath of possiblePaths) {
    try {
      const loadedModel = require(modelPath);
      if (loadedModel && loadedModel.modelName) {
        Package = loadedModel;
        dbConnected = checkDBConnection();
        console.log(`✅ Package model loaded from: ${modelPath}`);
        return true;
      }
    } catch { continue; }
  }

  console.warn("⚠️ Package model not found, offline mode active");
  return false;
};

loadPackageModel();

// ==================== ENHANCED PDF SERVICE ==================== //
class PDFService {
  static async generatePackagePDF(pkg, isOffline = false) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.rect(0, 0, 612, 100).fill('#2c3e50');
        doc.fontSize(24).fillColor('#fff').text('PACKAGE DETAILS', 0, 40, { align: 'center' });
        doc.fontSize(10).fillColor(isOffline ? '#f39c12' : '#2ecc71')
           .text(isOffline ? '⚡ OFFLINE MODE' : '🌐 ONLINE MODE', 450, 20);

        let y = 120;
        const safeText = (text) => text || 'Not specified';

        doc.fontSize(20).fillColor('#e74c3c').text(safeText(pkg.PackageName), 50, y);
        y += 40;
        doc.fontSize(12).fillColor('#7f8c8d')
           .text(`Package ID: ${safeText(pkg.PackageId)}`, 50, y)
           .text(`Type: ${safeText(pkg.PackageType)}`, 250, y);
        y += 25;

        // Enhanced Pricing Information with Additional Services
        const packagePrice = Number(pkg.PackagePrice || pkg.BasePrice) || 0;
        const finalPrice = Number(pkg.GrandTotal || pkg.FinalPrice) || 0;
        const servicesTotal = Number(pkg.ServicesTotal) || 0;
        const discount = Number(pkg.Discount) || 0;
        const discountPercentage = Number(pkg.DiscountPercentage) || 0;

        doc.fontSize(16).fillColor('#2c3e50').text('Pricing Information:', 50, y);
        y += 25;

        // Package Price
        doc.fontSize(14).fillColor('#7f8c8d').text(`Package Price: Rs. ${packagePrice.toLocaleString()}`, 70, y);
        y += 20;

        // Additional Services
        if (pkg.AdditionalServices && Array.isArray(pkg.AdditionalServices)) {
          const includedServices = pkg.AdditionalServices.filter(service => service.included);
          if (includedServices.length > 0) {
            doc.fontSize(14).fillColor('#7f8c8d').text('Additional Services:', 70, y);
            y += 20;
            
            includedServices.forEach(service => {
              doc.fontSize(12).fillColor('#34495e')
                 .text(`• ${service.name}: Rs. ${(service.price || 0).toLocaleString()}`, 90, y);
              y += 18;
            });
            
            doc.fontSize(12).fillColor('#7f8c8d')
               .text(`Services Total: Rs. ${servicesTotal.toLocaleString()}`, 70, y);
            y += 20;
            
            doc.fontSize(14).fillColor('#2c3e50').text(`Subtotal: Rs. ${(packagePrice + servicesTotal).toLocaleString()}`, 70, y);
            y += 20;
            
            if (discount > 0) {
              doc.fontSize(12).fillColor('#e74c3c')
                 .text(`Discount (${discountPercentage}%): - Rs. ${discount.toLocaleString()}`, 70, y);
              y += 20;
            }
          }
        }

        // Final Price
        doc.fontSize(18).fillColor('#27ae60').text(`Grand Total: Rs. ${finalPrice.toLocaleString()}`, 70, y);
        y += 40;

        // Duration and Availability
        doc.fontSize(14).fillColor('#2c3e50')
           .text(`Duration: ${(pkg.Duration || 0).toLocaleString()} days`, 50, y)
           .text(`Availability: ${safeText(pkg.Availability)}`, 300, y);
        y += 40;

        // Description
        doc.fontSize(16).fillColor('#2c3e50').text('Package Description:', 50, y); 
        y += 25;
        doc.fontSize(11).fillColor('#34495e').text(safeText(pkg.Description), 50, y, { width: 500, lineGap: 5 });
        y += 100;

        // Included Services Summary
        if (pkg.AdditionalServices && Array.isArray(pkg.AdditionalServices)) {
          const includedServices = pkg.AdditionalServices.filter(service => service.included);
          if (includedServices.length > 0) {
            doc.fontSize(16).fillColor('#2c3e50').text('Included Services:', 50, y); 
            y += 25;
            includedServices.forEach(service => { 
              doc.fontSize(12).fillColor('#34495e').text(`✓ ${service.name}`, 70, y); 
              y += 20; 
            });
            y += 20;
          }
        }

        // Footer
        doc.fontSize(9).fillColor('#95a5a6')
           .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 750);
        doc.end();
      } catch (err) { 
        reject(err); 
      }
    });
  }

  static async generateAllPackagesPDF(packages, isOffline = false) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.rect(0, 0, 612, 80).fill('#2c3e50');
        doc.fontSize(20).fillColor('#fff').text('FUNERAL PACKAGES CATALOG', 0, 30, { align: 'center' });
        doc.fontSize(10).fillColor(isOffline ? '#f39c12' : '#2ecc71')
           .text(isOffline ? '⚡ OFFLINE MODE' : '🌐 ONLINE MODE', 450, 15);

        let y = 100;
        packages.forEach((pkg, i) => {
          if (y > 700) { 
            doc.addPage(); 
            y = 100; 
          }
          const safeText = (text) => text || 'Not specified';
          
          // Package Name
          doc.fontSize(16).fillColor('#2c3e50').text(`${i + 1}. ${safeText(pkg.PackageName)}`, 50, y); 
          y += 25;
          
          // Package Details
          doc.fontSize(10).fillColor('#7f8c8d')
             .text(`ID: ${safeText(pkg.PackageId)} | Type: ${safeText(pkg.PackageType)}`, 70, y); 
          y += 18;
          
          doc.text(`Duration: ${(pkg.Duration || 0).toLocaleString()} days`, 70, y); 
          y += 18;
          
          // Enhanced Pricing with Services Info
          const packagePrice = Number(pkg.PackagePrice || pkg.BasePrice) || 0;
          const finalPrice = Number(pkg.GrandTotal || pkg.FinalPrice) || 0;
          const servicesCount = pkg.AdditionalServices 
            ? pkg.AdditionalServices.filter(s => s.included).length 
            : 0;
          const discount = Number(pkg.Discount) || 0;
          
          doc.fontSize(12).fillColor('#27ae60').text(`Price: Rs. ${finalPrice.toLocaleString()}`, 70, y);
          
          if (servicesCount > 0) {
            doc.fontSize(9).fillColor('#3498db').text(`(+${servicesCount} services)`, 150, y);
          }
          
          if (discount > 0) {
            doc.fontSize(10).fillColor('#e74c3c').text(`(Save Rs. ${discount.toLocaleString()})`, 220, y);
          }
          y += 20;
          
          // Availability
          const availability = pkg.Availability || 'Unknown';
          const statusColor = availability === 'Available' ? '#27ae60' : '#e74c3c';
          doc.fontSize(10).fillColor(statusColor).text(`Status: ${safeText(availability)}`, 70, y); 
          y += 20;
          
          // Description
          const description = pkg.Description;
          const shortDesc = description && description.length > 120 ? description.substring(0, 120) + '...' : (description || 'No description available');
          doc.fontSize(9).fillColor('#7f8c8d').text(`Description: ${shortDesc}`, 70, y, { width: 470 }); 
          y += 35;
          
          // Separator
          doc.moveTo(50, y).lineTo(550, y).stroke('#bdc3c7').strokeWidth(0.5); 
          y += 20;
        });

        doc.fontSize(9).fillColor('#95a5a6')
           .text(`Generated on: ${new Date().toLocaleDateString()} | Total Packages: ${packages.length}`, 50, 750, { align: 'center' });
        doc.end();
      } catch (err) { 
        reject(err); 
      }
    });
  }
}

// ==================== ENHANCED ROUTES ==================== //

// ---- FEATURE ROUTES (must be first) ----
router.get("/search", searchPackages);
router.get("/availability/:status", getPackagesByAvailability);
router.get("/stats/overview", getPackageStats);
router.get("/with-services", getPackagesWithServices); // NEW: Get packages with additional services

// ---- ENHANCED PDF ROUTES ----
router.get("/pdf/all", async (req, res) => {
  try {
    let packages;
    let isOffline = false;

    if (dbConnected && Package) {
      packages = await Package.find().sort({ createdAt: -1 });
    } else {
      packages = getMockPackages();
      isOffline = true;
    }

    const pdfBuffer = await PDFService.generateAllPackagesPDF(packages, isOffline);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="all-packages-catalog.pdf"',
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    let packageData;
    let isOffline = false;

    if (dbConnected && Package) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        packageData = await Package.findById(id);
      } else {
        packageData = await Package.findOne({ PackageId: id });
      }
    }

    if (!packageData) {
      packageData = getMockPackage(id);
      isOffline = true;
    }

    const pdfBuffer = await PDFService.generatePackagePDF(packageData, isOffline);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="package-${packageData.PackageId || id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

// ---- CRUD ROUTES ----
router.get("/", getAllPackages);
router.get("/next-id", getNextPackageId);
router.post("/", upload.single('packageImage'), addPackage);
router.get("/:id", getById);
router.put("/:id", upload.single('packageImage'), updatePackage);
router.delete("/:id", deletePackage);

// ---- ENHANCED HEALTH ROUTE ----
router.get("/health/status", async (req, res) => {
  try {
    let packageStats = {};
    
    if (dbConnected && Package) {
      const totalPackages = await Package.countDocuments();
      const packagesWithServices = await Package.countDocuments({ 
        'AdditionalServices.0': { $exists: true } 
      });
      const packagesWithDiscount = await Package.countDocuments({ HasDiscount: true });
      
      packageStats = {
        totalPackages,
        packagesWithServices,
        packagesWithDiscount,
        packagesWithServicesPercentage: totalPackages > 0 ? Math.round((packagesWithServices / totalPackages) * 100) : 0
      };
    }

    res.json({
      success: true,
      database: dbConnected ? 'Connected' : 'Disconnected',
      model: Package ? 'Loaded' : 'Not found',
      upload: upload ? 'Available' : 'Fallback',
      packageStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: true,
      database: dbConnected ? 'Connected' : 'Disconnected',
      model: Package ? 'Loaded' : 'Not found',
      upload: upload ? 'Available' : 'Fallback',
      packageStats: {},
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ---- DB CONNECTION MONITOR ----
mongoose.connection.on('connected', () => { 
  dbConnected = true; 
  console.log('🔄 Database connected'); 
});

mongoose.connection.on('disconnected', () => { 
  dbConnected = false; 
  console.log('🔄 Database disconnected'); 
});

setInterval(() => {
  const status = checkDBConnection();
  if (status !== dbConnected) { 
    dbConnected = status; 
    console.log(`🔄 Database status changed: ${dbConnected ? 'Connected' : 'Disconnected'}`); 
  }
}, 30000);

module.exports = router;






