const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Report Identification
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['staff', 'vendors', 'assignments', 'comprehensive', 'custom']
  },

  // Report Configuration
  filters: {
    dateRange: {
      startDate: Date,
      endDate: Date
    },
    departments: [String],
    genders: [String],
    statuses: [String],
    priorities: [String],
    staffIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }],
    customFilters: mongoose.Schema.Types.Mixed
  },

  // Report Data
  summary: {
    totalRecords: Number,
    statistics: mongoose.Schema.Types.Mixed,
    chartsData: mongoose.Schema.Types.Mixed
  },
  
  detailedData: [mongoose.Schema.Types.Mixed],
  
  // Generated Report Files
  generatedFiles: {
    pdf: {
      filename: String,
      filePath: String,
      fileSize: Number,
      generatedAt: Date
    },
    csv: {
      filename: String,
      filePath: String,
      fileSize: Number,
      generatedAt: Date
    },
    excel: {
      filename: String,
      filePath: String,
      fileSize: Number,
      generatedAt: Date
    }
  },

  // Report Metadata
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // If you have user authentication
    required: true
  },
  
  generationDate: {
    type: Date,
    default: Date.now
  },
  
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    scheduleType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']
    },
    nextRun: Date,
    lastRun: Date
  },

  // Report Settings
  settings: {
    includeCharts: {
      type: Boolean,
      default: true
    },
    includeSummary: {
      type: Boolean,
      default: true
    },
    includeDetails: {
      type: Boolean,
      default: true
    },
    format: {
      type: String,
      enum: ['detailed', 'summary', 'analytical'],
      default: 'detailed'
    },
    dataRefresh: {
      type: String,
      enum: ['realtime', 'cached', 'scheduled'],
      default: 'realtime'
    }
  },

  // Access Control
  accessLevel: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'private'
  },
  
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'share'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Report Status and Tracking
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'archived'],
    default: 'completed'
  },
  
  generationTime: {
    startTime: Date,
    endTime: Date,
    duration: Number // in milliseconds
  },
  
  errorLog: {
    hasError: {
      type: Boolean,
      default: false
    },
    errorMessage: String,
    errorStack: String,
    retryCount: {
      type: Number,
      default: 0
    }
  },

  // Versioning and History
  version: {
    type: Number,
    default: 1
  },
  
  previousVersions: [{
    version: Number,
    reportId: String,
    generatedAt: Date,
    changes: String
  }],

  // Analytics and Usage
  viewCount: {
    type: Number,
    default: 0
  },
  
  lastViewed: Date,
  
  downloads: {
    pdf: {
      count: {
        type: Number,
        default: 0
      },
      lastDownloaded: Date
    },
    csv: {
      count: {
        type: Number,
        default: 0
      },
      lastDownloaded: Date
    },
    excel: {
      count: {
        type: Number,
        default: 0
      },
      lastDownloaded: Date
    }
  },

  // Tags and Categorization
  tags: [String],
  category: {
    type: String,
    enum: ['operational', 'financial', 'hr', 'analytical', 'compliance', 'custom'],
    default: 'operational'
  },

  // Notifications
  notifications: {
    onCompletion: {
      type: Boolean,
      default: false
    },
    onError: {
      type: Boolean,
      default: true
    },
    recipients: [String] // email addresses
  },

  // Data Retention
  retentionPeriod: {
    type: Number, // in days
    default: 365
  },
  
  autoDeleteDate: Date,

  // Audit Trail
  createdBy: {
    type: String,
    required: true
  },
  
  updatedBy: String,
  
  updateHistory: [{
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: String,
    changes: mongoose.Schema.Types.Mixed
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for report age
reportSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.generationDate) / (1000 * 60 * 60 * 24));
});

// Virtual for report status
reportSchema.virtual('isExpired').get(function() {
  if (this.autoDeleteDate) {
    return new Date() > this.autoDeleteDate;
  }
  return false;
});

// Virtual for total downloads
reportSchema.virtual('totalDownloads').get(function() {
  return (this.downloads.pdf.count || 0) + 
         (this.downloads.csv.count || 0) + 
         (this.downloads.excel.count || 0);
});

// Indexes for better performance
reportSchema.index({ reportId: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ generationDate: -1 });
reportSchema.index({ 'filters.dateRange.startDate': 1, 'filters.dateRange.endDate': 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ 'schedule.nextRun': 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ generatedBy: 1 });

// Pre-save middleware to generate report ID and set auto-delete date
reportSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate unique report ID
    if (!this.reportId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      this.reportId = RPT-${timestamp}-${random}.toUpperCase();
    }
    
    // Set auto-delete date based on retention period
    if (this.retentionPeriod && !this.autoDeleteDate) {
      const deleteDate = new Date(this.generationDate);
      deleteDate.setDate(deleteDate.getDate() + this.retentionPeriod);
      this.autoDeleteDate = deleteDate;
    }
  }
  
  // Update generation time duration
  if (this.generationTime && this.generationTime.startTime && this.generationTime.endTime) {
    this.generationTime.duration = 
      new Date(this.generationTime.endTime) - new Date(this.generationTime.startTime);
  }
  
  next();
});

// Static method to find reports by type and date range
reportSchema.statics.findByTypeAndDateRange = function(reportType, startDate, endDate) {
  return this.find({
    reportType: reportType,
    generationDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'completed'
  }).sort({ generationDate: -1 });
};

// Static method to get report statistics
reportSchema.statics.getReportStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$reportType',
        totalReports: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { 
          $sum: {
            $add: [
              { $ifNull: ['$downloads.pdf.count', 0] },
              { $ifNull: ['$downloads.csv.count', 0] },
              { $ifNull: ['$downloads.excel.count', 0] }
            ]
          }
        },
        avgGenerationTime: { $avg: '$generationTime.duration' },
        lastGenerated: { $max: '$generationDate' }
      }
    }
  ]);
};

// Instance method to log view
reportSchema.methods.logView = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Instance method to log download
reportSchema.methods.logDownload = function(fileType) {
  if (this.downloads[fileType]) {
    this.downloads[fileType].count += 1;
    this.downloads[fileType].lastDownloaded = new Date();
    return this.save();
  }
  return Promise.reject(new Error(Invalid file type: ${fileType}));
};

// Instance method to clone report configuration
reportSchema.methods.clone = function(newTitle) {
  const clonedReport = this.toObject();
  delete clonedReport._id;
  delete clonedReport.reportId;
  delete clonedReport.generationDate;
  delete clonedReport.viewCount;
  delete clonedReport.downloads;
  delete clonedReport.lastViewed;
  delete clonedReport.generationTime;
  
  clonedReport.title = newTitle || ${this.title} (Copy);
  clonedReport.version = 1;
  clonedReport.previousVersions = [];
  clonedReport.updateHistory = [];
  
  return clonedReport;
};

// Instance method to check if report can be regenerated
reportSchema.methods.canRegenerate = function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.generationDate < oneHourAgo || this.status === 'failed';
};

// Middleware to update version history when report is modified
reportSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    if (!this.updateHistory) {
      this.updateHistory = [];
    }
    
    this.updateHistory.push({
      updatedAt: new Date(),
      updatedBy: this.updatedBy || 'system',
      changes: this.getChanges()
    });
    
    this.version += 1;
  }
  next();
});

// Method to get changes between current and previous version
reportSchema.methods.getChanges = function() {
  // This would compare current document with previous version
  // For simplicity, returning modified paths
  return this.modifiedPaths();
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;