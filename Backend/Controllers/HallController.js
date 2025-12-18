const Hall = require('../models/Hall');

// Create new hall
const createHall = async (req, res) => {
  try {
    const { 
      hallName, 
      hallPrice, 
      capacity, 
      openingHours, 
      description, 
      features, 
      isAvailable,
      hallType,
      location,
      facilities,
      images,
      tags,
      specialNotes,
      isFeatured
    } = req.body;

    // Enhanced Validation
    if (!hallName || !hallPrice || !capacity || !openingHours) {
      return res.status(400).json({
        success: false,
        message: 'Hall name, price, capacity, and opening hours are required'
      });
    }

    // Check if hall name already exists
    const existingHall = await Hall.findOne({ 
      hallName: { $regex: new RegExp(`^${hallName}$`, 'i') } 
    });

    if (existingHall) {
      return res.status(400).json({
        success: false,
        message: 'Hall with this name already exists'
      });
    }

    // Validate price and capacity
    if (hallPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }

    if (capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be at least 1'
      });
    }

    const newHall = new Hall({
      hallName: hallName.trim(),
      hallPrice: parseFloat(hallPrice),
      capacity: parseInt(capacity),
      openingHours: openingHours.trim(),
      description: description ? description.trim() : '',
      features: features || [],
      hallType: hallType || 'standard',
      location: location || {},
      facilities: facilities || {},
      images: images || [],
      tags: tags || [],
      specialNotes: specialNotes || '',
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isFeatured: isFeatured || false
    });

    const savedHall = await newHall.save();

    res.status(201).json({
      success: true,
      message: 'Hall created successfully',
      hall: savedHall
    });
  } catch (error) {
    console.error('Create hall error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Hall with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating hall',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all halls with filtering, sorting, and pagination
const getAllHalls = async (req, res) => {
  try {
    const {
      search,
      availability,
      minPrice,
      maxPrice,
      minCapacity,
      maxCapacity,
      hallType,
      city,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { hallName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Availability filter
    if (availability && availability !== 'all') {
      filter.isAvailable = availability === 'available';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.hallPrice = {};
      if (minPrice) filter.hallPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.hallPrice.$lte = parseFloat(maxPrice);
    }

    // Capacity range filter
    if (minCapacity || maxCapacity) {
      filter.capacity = {};
      if (minCapacity) filter.capacity.$gte = parseInt(minCapacity);
      if (maxCapacity) filter.capacity.$lte = parseInt(maxCapacity);
    }

    // Additional filters
    if (hallType) filter.hallType = hallType;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

    // Sort configuration
    const sortConfig = {};
    const validSortFields = ['hallName', 'hallPrice', 'capacity', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortConfig[sortField] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Limit to 100 max
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const halls = await Hall.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalHalls = await Hall.countDocuments(filter);
    const totalPages = Math.ceil(totalHalls / limitNum);

    res.status(200).json({
      success: true,
      halls,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalHalls,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum
      },
      filters: {
        search,
        availability,
        minPrice,
        maxPrice,
        minCapacity,
        maxCapacity,
        hallType,
        city,
        isFeatured
      }
    });
  } catch (error) {
    console.error('Get halls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching halls',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single hall by ID
const getHallById = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.status(200).json({
      success: true,
      hall
    });
  } catch (error) {
    console.error('Get hall error:', error);
    
    // Invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid hall ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching hall',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update hall
const updateHall = async (req, res) => {
  try {
    const {
      hallName,
      hallPrice,
      capacity,
      openingHours,
      description,
      features,
      isAvailable,
      hallType,
      location,
      facilities,
      images,
      tags,
      specialNotes,
      isFeatured
    } = req.body;

    // Check if hall exists and get current data
    const existingHall = await Hall.findById(req.params.id);
    if (!existingHall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    // Check for duplicate hall name (excluding current hall)
    if (hallName && hallName !== existingHall.hallName) {
      const duplicateHall = await Hall.findOne({ 
        hallName: { $regex: new RegExp(`^${hallName}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (duplicateHall) {
        return res.status(400).json({
          success: false,
          message: 'Hall with this name already exists'
        });
      }
    }

    // Validate numeric fields
    if (hallPrice !== undefined && hallPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }

    if (capacity !== undefined && capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be at least 1'
      });
    }

    const updateData = {
      ...(hallName && { hallName: hallName.trim() }),
      ...(hallPrice !== undefined && { hallPrice: parseFloat(hallPrice) }),
      ...(capacity !== undefined && { capacity: parseInt(capacity) }),
      ...(openingHours && { openingHours: openingHours.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(features !== undefined && { features }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(hallType !== undefined && { hallType }),
      ...(location !== undefined && { location }),
      ...(facilities !== undefined && { facilities }),
      ...(images !== undefined && { images }),
      ...(tags !== undefined && { tags }),
      ...(specialNotes !== undefined && { specialNotes: specialNotes.trim() }),
      ...(isFeatured !== undefined && { isFeatured }),
      updatedAt: Date.now()
    };

    const updatedHall = await Hall.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Hall updated successfully',
      hall: updatedHall
    });
  } catch (error) {
    console.error('Update hall error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid hall ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating hall',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete hall
const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hall deleted successfully',
      deletedHall: {
        id: hall._id,
        name: hall.hallName
      }
    });
  } catch (error) {
    console.error('Delete hall error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid hall ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting hall',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Toggle hall availability
const toggleAvailability = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    hall.isAvailable = !hall.isAvailable;
    const updatedHall = await hall.save();

    res.status(200).json({
      success: true,
      message: `Hall ${updatedHall.isAvailable ? 'activated' : 'deactivated'} successfully`,
      hall: updatedHall
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid hall ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating hall availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Bulk update halls availability
const bulkUpdateAvailability = async (req, res) => {
  try {
    const { hallIds, isAvailable } = req.body;

    if (!hallIds || !Array.isArray(hallIds) || hallIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Hall IDs array is required'
      });
    }

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean'
      });
    }

    const result = await Hall.updateMany(
      { _id: { $in: hallIds } },
      { $set: { isAvailable } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully ${isAvailable ? 'activated' : 'deactivated'} ${result.modifiedCount} hall(s)`,
      modifiedCount: result.modifiedCount,
      totalSelected: hallIds.length
    });
  } catch (error) {
    console.error('Bulk update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating hall availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get hall statistics
const getHallStatistics = async (req, res) => {
  try {
    const totalHalls = await Hall.countDocuments();
    const availableHalls = await Hall.countDocuments({ isAvailable: true });
    const unavailableHalls = await Hall.countDocuments({ isAvailable: false });
    const featuredHalls = await Hall.countDocuments({ isFeatured: true });
    
    const capacityStats = await Hall.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          avgCapacity: { $avg: '$capacity' },
          maxCapacity: { $max: '$capacity' },
          minCapacity: { $min: '$capacity' }
        }
      }
    ]);

    const priceStats = await Hall.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$hallPrice' },
          maxPrice: { $max: '$hallPrice' },
          minPrice: { $min: '$hallPrice' },
          totalRevenuePotential: { $sum: '$hallPrice' }
        }
      }
    ]);

    // Get halls by features count
    const featureStats = await Hall.aggregate([
      { $unwind: '$features' },
      {
        $group: {
          _id: '$features',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Hall type distribution
    const typeStats = await Hall.aggregate([
      {
        $group: {
          _id: '$hallType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // City distribution
    const cityStats = await Hall.aggregate([
      {
        $match: { 'location.city': { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalHalls,
        availableHalls,
        unavailableHalls,
        featuredHalls,
        availabilityRate: totalHalls > 0 ? (availableHalls / totalHalls * 100).toFixed(2) : 0,
        featuredRate: totalHalls > 0 ? (featuredHalls / totalHalls * 100).toFixed(2) : 0,
        capacity: capacityStats[0] || {},
        pricing: priceStats[0] || {},
        features: featureStats,
        types: typeStats,
        cities: cityStats
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hall statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Search halls with autocomplete
const searchHalls = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const halls = await Hall.find({
      $or: [
        { hallName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.district': { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .select('hallName capacity hallPrice isAvailable openingHours features location images hallType')
    .limit(parseInt(limit))
    .sort({ hallName: 1 });

    res.status(200).json({
      success: true,
      results: halls,
      count: halls.length
    });
  } catch (error) {
    console.error('Search halls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching halls',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all halls for view page (simple version without pagination)
const viewAllHalls = async (req, res) => {
  try {
    const halls = await Hall.find()
      .sort({ createdAt: -1 })
      .select('-__v'); // Exclude version key

    res.status(200).json({
      success: true,
      halls,
      count: halls.length,
      message: 'Halls retrieved successfully'
    });
  } catch (error) {
    console.error('View all halls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching halls for view page',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// NEW: Get featured halls
const getFeaturedHalls = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const featuredHalls = await Hall.find({ 
      isFeatured: true, 
      isAvailable: true 
    })
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      halls: featuredHalls,
      count: featuredHalls.length
    });
  } catch (error) {
    console.error('Get featured halls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured halls',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// NEW: Get halls by capacity range
const getHallsByCapacity = async (req, res) => {
  try {
    const { min, max } = req.params;
    
    const halls = await Hall.find({
      capacity: { $gte: parseInt(min), $lte: parseInt(max) },
      isAvailable: true
    }).sort({ capacity: 1 });

    res.status(200).json({
      success: true,
      halls,
      count: halls.length,
      capacityRange: { min: parseInt(min), max: parseInt(max) }
    });
  } catch (error) {
    console.error('Get halls by capacity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching halls by capacity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// NEW: Add image to hall
const addHallImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const { id } = req.params;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const hall = await Hall.findByIdAndUpdate(
      id,
      { $push: { images: imageUrl } },
      { new: true }
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image added successfully',
      hall
    });
  } catch (error) {
    console.error('Add hall image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding image to hall',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// NEW: Get available halls count
const getAvailableHallsCount = async (req, res) => {
  try {
    const availableCount = await Hall.countDocuments({ isAvailable: true });
    const totalCount = await Hall.countDocuments();
    const featuredCount = await Hall.countDocuments({ isFeatured: true });

    res.status(200).json({
      success: true,
      counts: {
        available: availableCount,
        total: totalCount,
        unavailable: totalCount - availableCount,
        featured: featuredCount
      }
    });
  } catch (error) {
    console.error('Get available halls count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hall counts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createHall,
  getAllHalls,
  getHallById,
  updateHall,
  deleteHall,
  toggleAvailability,
  bulkUpdateAvailability,
  getHallStatistics,
  searchHalls,
  viewAllHalls,
  getFeaturedHalls,
  getHallsByCapacity,
  addHallImage,
  getAvailableHallsCount
};