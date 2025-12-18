const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const packageSchema = new Schema(
  {
    PackageImage: {
      type: String,
      default: "",
      trim: true,
    },
    PackageName: {
      type: String,
      required: true,
      trim: true,
    },
    PackageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    PackageType: {
      type: String,
      required: true,
      trim: true,
    },
    Description: {
      type: String,
      required: true,
      trim: true,
    },
    // Package Price (base price without services)
    PackagePrice: {
      type: Number,
      required: false, // Make optional temporarily for existing data
      min: 0,
      default: 0
    },
    FinalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    Duration: {
      type: Number,
      required: true,
      min: 1,
    },
    Availability: {
      type: String,
      required: true,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },
    // Additional Services Array
    AdditionalServices: {
      type: [{
        id: {
          type: Number,
          required: true
        },
        name: {
          type: String,
          required: true,
          trim: true
        },
        price: {
          type: Number,
          required: true,
          min: 0,
          default: 0
        },
        included: {
          type: Boolean,
          required: true,
          default: false
        }
      }],
      default: []
    },
    // Pricing Breakdown
    ServicesTotal: {
      type: Number,
      required: false, // Make optional temporarily for existing data
      min: 0,
      default: 0
    },
    SubTotal: {
      type: Number,
      required: false, // Make optional temporarily for existing data
      min: 0,
      default: 0
    },
    Discount: {
      type: Number,
      required: false, // Make optional temporarily for existing data
      min: 0,
      default: 0
    },
    DiscountPercentage: {
      type: Number,
      required: false, // Make optional temporarily for existing data
      min: 0,
      max: 100,
      default: 0
    },
    GrandTotal: {
      type: Number,
      required: false, // Make optional temporarily for existing data
      min: 0,
      default: 0
    },
    HasDiscount: {
      type: Boolean,
      required: false, // Make optional temporarily for existing data
      default: false
    },
    Currency: {
      type: String,
      required: false, // Make optional temporarily for existing data
      default: "LKR",
      enum: ["LKR", "USD"]
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for discount calculation with null check
packageSchema.virtual('discountAmount').get(function() {
  return this.Discount || 0;
});

// Virtual for formatted price display with null checks
packageSchema.virtual('formattedPackagePrice').get(function() {
  const price = this.PackagePrice || this.FinalPrice || 0;
  return `Rs. ${price.toLocaleString()}`;
});

packageSchema.virtual('formattedServicesTotal').get(function() {
  const total = this.ServicesTotal || 0;
  return `Rs. ${total.toLocaleString()}`;
});

packageSchema.virtual('formattedSubTotal').get(function() {
  const subtotal = this.SubTotal || (this.PackagePrice || this.FinalPrice || 0) + (this.ServicesTotal || 0);
  return `Rs. ${subtotal.toLocaleString()}`;
});

packageSchema.virtual('formattedDiscount').get(function() {
  const discount = this.Discount || 0;
  return `Rs. ${discount.toLocaleString()}`;
});

packageSchema.virtual('formattedGrandTotal').get(function() {
  const total = this.GrandTotal || this.FinalPrice || 0;
  return `Rs. ${total.toLocaleString()}`;
});

// Virtual for included services count
packageSchema.virtual('includedServicesCount').get(function() {
  if (!this.AdditionalServices || !Array.isArray(this.AdditionalServices)) {
    return 0;
  }
  return this.AdditionalServices.filter(service => service.included).length;
});

// Virtual for service names (comma separated)
packageSchema.virtual('serviceNames').get(function() {
  if (!this.AdditionalServices || !Array.isArray(this.AdditionalServices)) {
    return '';
  }
  const includedServices = this.AdditionalServices
    .filter(service => service.included)
    .map(service => service.name);
  return includedServices.join(', ');
});

// Virtual for total savings (discount amount)
packageSchema.virtual('totalSavings').get(function() {
  return this.Discount || 0;
});

// Virtual for formatted savings
packageSchema.virtual('formattedSavings').get(function() {
  const savings = this.Discount || 0;
  return `Rs. ${savings.toLocaleString()}`;
});

// Virtual for service details summary
packageSchema.virtual('servicesSummary').get(function() {
  if (!this.AdditionalServices || !Array.isArray(this.AdditionalServices)) {
    return 'No additional services';
  }
  
  const includedServices = this.AdditionalServices.filter(service => service.included);
  if (includedServices.length === 0) {
    return 'No additional services';
  }
  
  return `${includedServices.length} service${includedServices.length > 1 ? 's' : ''} included`;
});

// Pre-save middleware to calculate pricing automatically with null checks
packageSchema.pre('save', function(next) {
  // Set default PackagePrice from FinalPrice if not exists
  if (!this.PackagePrice && this.FinalPrice) {
    this.PackagePrice = this.FinalPrice;
  }
  
  // Calculate ServicesTotal from included services
  let servicesTotal = 0;
  if (this.AdditionalServices && Array.isArray(this.AdditionalServices)) {
    servicesTotal = this.AdditionalServices
      .filter(service => service.included)
      .reduce((total, service) => total + (service.price || 0), 0);
  }
  this.ServicesTotal = servicesTotal;
  
  // Calculate SubTotal
  const packagePrice = this.PackagePrice || this.FinalPrice || 0;
  this.SubTotal = packagePrice + servicesTotal;
  
  // Apply 5% discount if services are included
  const includedCount = this.includedServicesCount;
  if (includedCount > 0) {
    this.DiscountPercentage = 5;
    this.Discount = this.SubTotal * (this.DiscountPercentage / 100);
    this.HasDiscount = true;
  } else {
    this.DiscountPercentage = 0;
    this.Discount = 0;
    this.HasDiscount = false;
  }
  
  // Calculate GrandTotal
  this.GrandTotal = this.SubTotal - this.Discount;
  
  // Ensure FinalPrice matches GrandTotal for new packages
  if (!this.FinalPrice || this.isModified('GrandTotal')) {
    this.FinalPrice = this.GrandTotal;
  }
  
  // Set default currency if not set
  if (!this.Currency) {
    this.Currency = "LKR";
  }
  
  next();
});

// Static method to find packages with additional services
packageSchema.statics.findWithServices = function() {
  return this.find({ 
    'AdditionalServices.0': { $exists: true },
    'AdditionalServices.included': true 
  });
};

// Static method to find packages with discount
packageSchema.statics.findWithDiscount = function() {
  return this.find({ HasDiscount: true });
};

// Static method to find packages by price range
packageSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    $or: [
      { GrandTotal: { $gte: minPrice, $lte: maxPrice } },
      { FinalPrice: { $gte: minPrice, $lte: maxPrice } }
    ]
  });
};

// Static method to get pricing statistics
packageSchema.statics.getPricingStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPackages: { $sum: 1 },
        avgPackagePrice: { $avg: "$PackagePrice" },
        avgFinalPrice: { $avg: "$FinalPrice" },
        avgGrandTotal: { $avg: "$GrandTotal" },
        maxPrice: { $max: "$FinalPrice" },
        minPrice: { $min: "$FinalPrice" },
        totalDiscountGiven: { $sum: "$Discount" },
        packagesWithDiscount: {
          $sum: { $cond: [{ $eq: ["$HasDiscount", true] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : null;
};

// Instance method to add a service
packageSchema.methods.addService = function(serviceData) {
  if (!this.AdditionalServices) {
    this.AdditionalServices = [];
  }
  
  const newService = {
    id: serviceData.id || Date.now(),
    name: serviceData.name,
    price: serviceData.price || 0,
    included: serviceData.included !== undefined ? serviceData.included : true
  };
  
  this.AdditionalServices.push(newService);
  return this.save();
};

// Instance method to remove a service
packageSchema.methods.removeService = function(serviceId) {
  if (!this.AdditionalServices) {
    return Promise.resolve(this);
  }
  
  this.AdditionalServices = this.AdditionalServices.filter(
    service => service.id !== serviceId
  );
  return this.save();
};

// Instance method to toggle service inclusion
packageSchema.methods.toggleService = function(serviceId, included) {
  if (!this.AdditionalServices) {
    return Promise.resolve(this);
  }
  
  const service = this.AdditionalServices.find(s => s.id === serviceId);
  if (service) {
    service.included = included !== undefined ? included : !service.included;
  }
  
  return this.save();
};

// Instance method to update service price
packageSchema.methods.updateServicePrice = function(serviceId, price) {
  if (!this.AdditionalServices) {
    return Promise.resolve(this);
  }
  
  const service = this.AdditionalServices.find(s => s.id === serviceId);
  if (service) {
    service.price = Math.max(0, price);
  }
  
  return this.save();
};

// Instance method to get included services
packageSchema.methods.getIncludedServices = function() {
  if (!this.AdditionalServices || !Array.isArray(this.AdditionalServices)) {
    return [];
  }
  return this.AdditionalServices.filter(service => service.included);
};

// Instance method to get excluded services
packageSchema.methods.getExcludedServices = function() {
  if (!this.AdditionalServices || !Array.isArray(this.AdditionalServices)) {
    return [];
  }
  return this.AdditionalServices.filter(service => !service.included);
};

// Instance method to calculate pricing breakdown with null checks
packageSchema.methods.calculatePricing = function() {
  const packagePrice = this.PackagePrice || this.FinalPrice || 0;
  
  const servicesTotal = this.AdditionalServices
    ? this.AdditionalServices
        .filter(service => service.included)
        .reduce((total, service) => total + (service.price || 0), 0)
    : 0;
    
  const subTotal = packagePrice + servicesTotal;
  const discount = servicesTotal > 0 ? subTotal * 0.05 : 0;
  const grandTotal = subTotal - discount;
  
  return {
    packagePrice,
    servicesTotal,
    subTotal,
    discount,
    grandTotal,
    discountPercentage: servicesTotal > 0 ? 5 : 0,
    hasDiscount: servicesTotal > 0,
    savings: discount
  };
};

// Instance method to apply custom discount
packageSchema.methods.applyCustomDiscount = function(discountPercentage) {
  const packagePrice = this.PackagePrice || this.FinalPrice || 0;
  const servicesTotal = this.ServicesTotal || 0;
  const subTotal = packagePrice + servicesTotal;
  
  const validDiscount = Math.max(0, Math.min(100, discountPercentage));
  this.DiscountPercentage = validDiscount;
  this.Discount = subTotal * (validDiscount / 100);
  this.GrandTotal = subTotal - this.Discount;
  this.FinalPrice = this.GrandTotal;
  this.HasDiscount = validDiscount > 0;
  
  return this.save();
};

// Instance method to reset to default pricing
packageSchema.methods.resetPricing = function() {
  const packagePrice = this.PackagePrice || this.FinalPrice || 0;
  
  this.ServicesTotal = 0;
  this.SubTotal = packagePrice;
  this.Discount = 0;
  this.DiscountPercentage = 0;
  this.GrandTotal = packagePrice;
  this.FinalPrice = packagePrice;
  this.HasDiscount = false;
  
  // Reset all services to not included
  if (this.AdditionalServices && Array.isArray(this.AdditionalServices)) {
    this.AdditionalServices.forEach(service => {
      service.included = false;
    });
  }
  
  return this.save();
};

// Ensure virtual fields are serialized with safe defaults
packageSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove internal fields when serializing to JSON
    delete ret.__v;
    
    // Ensure all new fields have safe default values for existing data
    if (!ret.PackagePrice && ret.FinalPrice) {
      ret.PackagePrice = ret.FinalPrice;
    }
    if (!ret.ServicesTotal) {
      ret.ServicesTotal = 0;
    }
    if (!ret.SubTotal) {
      ret.SubTotal = (ret.PackagePrice || ret.FinalPrice || 0) + (ret.ServicesTotal || 0);
    }
    if (!ret.Discount) {
      ret.Discount = 0;
    }
    if (!ret.DiscountPercentage) {
      ret.DiscountPercentage = 0;
    }
    if (!ret.GrandTotal) {
      ret.GrandTotal = ret.FinalPrice || 0;
    }
    if (!ret.HasDiscount) {
      ret.HasDiscount = false;
    }
    if (!ret.Currency) {
      ret.Currency = "LKR";
    }
    if (!ret.AdditionalServices) {
      ret.AdditionalServices = [];
    }
    
    // Add calculated fields for easier frontend consumption
    ret.calculatedFields = {
      savings: ret.Discount || 0,
      effectivePrice: ret.GrandTotal || ret.FinalPrice || 0,
      hasServices: (ret.includedServicesCount || 0) > 0,
      servicesCount: ret.includedServicesCount || 0
    };
    
    return ret;
  }
});

// Add query helpers
packageSchema.query.byServiceName = function(serviceName) {
  return this.where({ 'AdditionalServices.name': serviceName });
};

packageSchema.query.available = function() {
  return this.where({ Availability: 'Available' });
};

packageSchema.query.withDiscount = function() {
  return this.where({ HasDiscount: true });
};

packageSchema.query.byType = function(packageType) {
  return this.where({ PackageType: packageType });
};

module.exports = mongoose.model("Package", packageSchema);


