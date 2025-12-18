const mongoose = require("mongoose");
const Package = require("../Model/PackageModel");

// ✅ Check MongoDB connection status
const checkDBConnection = () => mongoose.connection.readyState === 1;

// ✅ Helper: Log and send consistent error responses
const handleServerError = (res, err, actionMessage = "Server error") => {
  console.error(`❌ ${actionMessage}:`, err);
  return res.status(500).json({
    success: false,
    message: `${actionMessage}`,
    error: err.message || "Unknown server error",
  });
};

// ✅ Get next available package ID
const getNextPackageId = async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const lastPackage = await Package.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNumber = 1;

    if (lastPackage && lastPackage.PackageId?.startsWith("PKG")) {
      const num = parseInt(lastPackage.PackageId.replace("PKG", "")) || 0;
      nextNumber = num + 1;
    }

    const nextPackageId = `PKG${nextNumber.toString().padStart(4, "0")}`;
    return res.status(200).json({ success: true, nextPackageId });
  } catch (error) {
    return handleServerError(res, error, "Error generating next package ID");
  }
};

// ✅ Get all packages
const getAllPackages = async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const packages = await Package.find().sort({ createdAt: -1 });
    console.log(`✅ Retrieved ${packages.length} packages`);
    return res.status(200).json({ success: true, count: packages.length, packages });
  } catch (err) {
    return handleServerError(res, err, "Error fetching packages");
  }
};

// ✅ Get package by ID
const getById = async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid package ID format" });
    }

    const packageData = await Package.findById(id);
    if (!packageData) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    return res.status(200).json({ success: true, package: packageData });
  } catch (err) {
    return handleServerError(res, err, "Error fetching package by ID");
  }
};

// ✅ Add a new package - UPDATED FOR ADDITIONAL SERVICES & PRICING
const addPackage = async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    console.log("📦 Request body:", req.body);
    console.log("📁 Request file:", req.file);

    // Use BOTH naming conventions to be safe
    const {
      name,                    // Frontend sends this
      PackageName,             // Backend expects this
      PackageId,
      PackageType,
      description,             // Frontend sends this  
      Description,             // Backend expects this
      PackagePrice,            // New field from frontend
      FinalPrice,              // Grand total from frontend
      Duration,
      Availability = "Available",
      additionalServices,      // New: Additional services array
      servicesTotal,           // New: Total of additional services
      subTotal,                // New: PackagePrice + servicesTotal
      discount,                // New: 5% discount amount
      grandTotal,              // New: Final total after discount
    } = req.body;

    // Use the field that exists (frontend sends 'name', backend expects 'PackageName')
    const finalPackageName = PackageName || name;
    const finalDescription = Description || description;

    let packageImage = "";
    if (req.file) {
      packageImage = `/uploads/${req.file.filename}`;
      console.log("✅ Image uploaded:", packageImage);
    } else if (req.body.packageImage) {
      packageImage = req.body.packageImage;
    }

    let finalPackageId = PackageId;
    if (!finalPackageId) {
      const lastPackage = await Package.findOne({}, {}, { sort: { createdAt: -1 } });
      let nextNumber = 1;
      if (lastPackage?.PackageId?.startsWith('PKG')) {
        const num = parseInt(lastPackage.PackageId.replace('PKG', '')) || 0;
        nextNumber = num + 1;
      }
      finalPackageId = `PKG${nextNumber.toString().padStart(4, '0')}`;
    }

    // Validation with correct field names
    if (!finalPackageName || !PackageType || !finalDescription) {
      return res.status(400).json({
        success: false,
        message: "Package Name, Package Type, and Description are required fields",
        missingFields: {
          packageName: !finalPackageName,
          packageType: !PackageType, 
          description: !finalDescription
        }
      });
    }

    // Validate numeric fields - updated for new pricing structure
    if (!PackagePrice || isNaN(PackagePrice) || Number(PackagePrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Package Price must be a positive amount in LKR"
      });
    }

    if (!Duration || isNaN(Duration) || Number(Duration) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive number"
      });
    }

    // Parse additional services
    let servicesData = [];
    try {
      servicesData = additionalServices ? JSON.parse(additionalServices) : [];
    } catch (err) {
      console.error("Error parsing additional services:", err);
      servicesData = [];
    }

    // Calculate values with fallbacks
    const packagePriceValue = Number(PackagePrice);
    const servicesTotalValue = Number(servicesTotal) || 0;
    const subTotalValue = Number(subTotal) || packagePriceValue;
    const discountValue = Number(discount) || 0;
    const finalPriceValue = Number(grandTotal) || Number(FinalPrice) || packagePriceValue;

    // Check if discount should be applied (when services are included)
    const hasDiscount = servicesData.length > 0;
    const discountPercentage = hasDiscount ? 5 : 0;

    const newPackage = new Package({
      PackageImage: packageImage.trim(),
      PackageName: finalPackageName.trim(),
      PackageId: finalPackageId,
      PackageType: PackageType.trim(),
      Description: finalDescription.trim(),
      // Pricing fields - updated structure
      PackagePrice: packagePriceValue,        // Base package price without services
      BasePrice: packagePriceValue,           // Keep for backward compatibility
      FinalPrice: finalPriceValue,            // Grand total after discount
      Duration: Number(Duration),
      Availability: Availability.trim(),
      // Additional services data
      AdditionalServices: servicesData,
      ServicesTotal: servicesTotalValue,
      SubTotal: subTotalValue,
      Discount: discountValue,
      DiscountPercentage: discountPercentage,
      GrandTotal: finalPriceValue,
      HasDiscount: hasDiscount,
      Currency: "LKR",
    });

    const savedPackage = await newPackage.save();
    console.log("✅ Package created successfully:", {
      id: savedPackage._id,
      name: savedPackage.PackageName,
      packageId: savedPackage.PackageId,
      packagePrice: `Rs. ${savedPackage.PackagePrice}`,
      servicesCount: servicesData.length,
      servicesTotal: `Rs. ${savedPackage.ServicesTotal}`,
      discount: savedPackage.Discount > 0 ? `Rs. ${savedPackage.Discount} (${savedPackage.DiscountPercentage}%)` : 'No discount',
      grandTotal: `Rs. ${savedPackage.GrandTotal}`
    });
    
    return res.status(201).json({
      success: true,
      message: servicesData.length > 0 
        ? "Package created successfully with additional services (5% discount applied!)"
        : "Package created successfully",
      package: savedPackage,
    });
  } catch (err) {
    console.error("❌ Error in addPackage:", err);
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: "Package ID already exists" 
      });
    }
    
    if (err.name === "ValidationError") {
      const errors = {};
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors 
      });
    }
    
    return handleServerError(res, err, "Error saving package");
  }
};

// ✅ Update package - UPDATED FOR ADDITIONAL SERVICES
const updatePackage = async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(503).json({ success: false, message: "Database connection unavailable" });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid package ID format" });
    }

    const existingPackage = await Package.findById(id);
    if (!existingPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    let updateData = { ...req.body };

    // Handle field name mapping
    if (updateData.name && !updateData.PackageName) {
      updateData.PackageName = updateData.name;
    }
    if (updateData.description && !updateData.Description) {
      updateData.Description = updateData.description;
    }

    // Handle additional services data
    if (updateData.additionalServices) {
      try {
        updateData.AdditionalServices = JSON.parse(updateData.additionalServices);
      } catch (err) {
        console.error("Error parsing additional services in update:", err);
      }
    }

    if (req.file) {
      updateData.PackageImage = `/uploads/${req.file.filename}`;
    } else if (req.body.packageImage === "") {
      updateData.PackageImage = "";
    }

    // Handle numeric fields
    if (updateData.PackagePrice) updateData.PackagePrice = Number(updateData.PackagePrice);
    if (updateData.BasePrice) updateData.BasePrice = Number(updateData.BasePrice);
    if (updateData.FinalPrice) updateData.FinalPrice = Number(updateData.FinalPrice);
    if (updateData.ServicesTotal) updateData.ServicesTotal = Number(updateData.ServicesTotal);
    if (updateData.SubTotal) updateData.SubTotal = Number(updateData.SubTotal);
    if (updateData.Discount) updateData.Discount = Number(updateData.Discount);
    if (updateData.GrandTotal) updateData.GrandTotal = Number(updateData.GrandTotal);
    if (updateData.Duration) updateData.Duration = Number(updateData.Duration);

    // Update discount flags
    if (updateData.AdditionalServices && Array.isArray(updateData.AdditionalServices)) {
      updateData.HasDiscount = updateData.AdditionalServices.length > 0;
      updateData.DiscountPercentage = updateData.HasDiscount ? 5 : 0;
    }

    ["PackageName", "PackageType", "Description", "Availability"].forEach((key) => {
      if (updateData[key]) updateData[key] = updateData[key].trim();
    });

    const updatedPackage = await Package.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (err) {
    return handleServerError(res, err, "Error updating package");
  }
};

// ✅ Delete package
const deletePackage = async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid package ID format" });
    }

    const deletedPackage = await Package.findByIdAndDelete(id);
    if (!deletedPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    console.log("🗑️ Package deleted:", deletedPackage.PackageName);
    return res.status(200).json({ success: true, message: "Package deleted successfully" });
  } catch (err) {
    return handleServerError(res, err, "Error deleting package");
  }
};

// ✅ Search packages by name or type
const searchPackages = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const regex = new RegExp(query, "i");
    const packages = await Package.find({
      $or: [
        { PackageName: regex }, 
        { PackageType: regex }, 
        { Description: regex },
        { 'AdditionalServices.name': regex } // Search in service names too
      ],
    });

    return res.status(200).json({ success: true, count: packages.length, packages });
  } catch (err) {
    return handleServerError(res, err, "Error searching packages");
  }
};

// ✅ Filter packages by availability
const getPackagesByAvailability = async (req, res) => {
  try {
    const { status } = req.params; // Available / Unavailable
    const packages = await Package.find({ Availability: status });
    return res.status(200).json({ success: true, count: packages.length, packages });
  } catch (err) {
    return handleServerError(res, err, "Error fetching packages by availability");
  }
};

// ✅ Get enhanced package statistics
const getPackageStats = async (req, res) => {
  try {
    const total = await Package.countDocuments();
    const available = await Package.countDocuments({ Availability: "Available" });
    const unavailable = total - available;
    const withServices = await Package.countDocuments({ 
      'AdditionalServices.0': { $exists: true } 
    });
    const withDiscount = await Package.countDocuments({ HasDiscount: true });

    return res.status(200).json({
      success: true,
      stats: { 
        total, 
        available, 
        unavailable,
        withServices,
        withDiscount,
        withServicesPercentage: total > 0 ? Math.round((withServices / total) * 100) : 0
      },
    });
  } catch (err) {
    return handleServerError(res, err, "Error fetching package stats");
  }
};

// ✅ Get packages with additional services
const getPackagesWithServices = async (req, res) => {
  try {
    const packages = await Package.find({ 
      'AdditionalServices.0': { $exists: true } 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({ 
      success: true, 
      count: packages.length, 
      packages 
    });
  } catch (err) {
    return handleServerError(res, err, "Error fetching packages with services");
  }
};

// ✅ Export all controllers
module.exports = {
  getAllPackages,
  getById,
  addPackage,
  updatePackage,
  deletePackage,
  getNextPackageId,
  searchPackages,
  getPackagesByAvailability,
  getPackageStats,
  getPackagesWithServices,
};











