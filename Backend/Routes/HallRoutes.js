// routes/halls.js
const express = require('express');
const router = express.Router();
const Hall = require('../models/hallModel');

// ✅ FIX: Correct the import path (usually lowercase)
const hallController = require('./controllers/hallController');
// If the above doesn't work, try:
// const hallController = require('../Controllers/HallController');

// GET /api/halls - Get all halls with filtering, sorting, and pagination
router.get('/', hallController.getAllHalls);

// GET /api/halls/view/all - Get all halls for view page (simple version without pagination)
router.get('/view/all', hallController.viewAllHalls);

// GET /api/halls/featured - Get featured halls
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const featuredHalls = await Hall.find({ 
      isFeatured: true, 
      isAvailable: true 
    })
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      halls: featuredHalls,
      count: featuredHalls.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured halls',
      error: error.message 
    });
  }
});

// GET /api/halls/search - Search halls with autocomplete
router.get('/search', hallController.searchHalls);

// GET /api/halls/capacity/:min/:max - Get halls by capacity range
router.get('/capacity/:min/:max', async (req, res) => {
  try {
    const { min, max } = req.params;
    const halls = await Hall.find({
      capacity: { $gte: parseInt(min), $lte: parseInt(max) },
      isAvailable: true
    }).sort({ capacity: 1 });
    
    res.json({
      success: true,
      halls,
      count: halls.length,
      capacityRange: { min: parseInt(min), max: parseInt(max) }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch halls by capacity',
      error: error.message 
    });
  }
});

// GET /api/halls/stats/overview - Get hall statistics
router.get('/stats/overview', hallController.getHallStatistics);

// GET /api/halls/statistics - Alternative statistics endpoint
router.get('/statistics', hallController.getHallStatistics);

// GET /api/halls/:id - Get single hall with enhanced data
router.get('/:id', hallController.getHallById);

// POST /api/halls - Create new hall with validation
router.post('/', hallController.createHall);

// PUT /api/halls/:id - Update hall with partial updates
router.put('/:id', hallController.updateHall);

// PATCH /api/halls/:id - Partial update for specific fields
router.patch('/:id', async (req, res) => {
  try {
    const allowedUpdates = [
      'isAvailable', 'isFeatured', 'specialNotes', 'tags'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates! Only specific fields can be updated via PATCH'
      });
    }

    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!hall) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hall not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Hall updated successfully',
      hall
    });

  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Update failed',
      error: error.message 
    });
  }
});

// DELETE /api/halls/:id - Delete hall
router.delete('/:id', hallController.deleteHall);

// PATCH /api/halls/:id/availability - Toggle hall availability
router.patch('/:id/availability', hallController.toggleAvailability);

// PATCH /api/halls/bulk/availability - Bulk update halls availability
router.patch('/bulk/availability', hallController.bulkUpdateAvailability);

// POST /api/halls/:id/images - Add image to hall
router.post('/:id/images', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      { $push: { images: imageUrl } },
      { new: true }
    );

    if (!hall) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hall not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Image added successfully',
      hall
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add image',
      error: error.message 
    });
  }
});

// GET /api/halls/admin/all - Admin endpoint to get all halls including unavailable ones
router.get('/admin/all', async (req, res) => {
  try {
    const halls = await Hall.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      halls,
      count: halls.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch halls for admin',
      error: error.message 
    });
  }
});

// GET /api/halls/available/count - Get count of available halls
router.get('/available/count', async (req, res) => {
  try {
    const availableCount = await Hall.countDocuments({ isAvailable: true });
    const totalCount = await Hall.countDocuments();
    
    res.json({
      success: true,
      available: availableCount,
      total: totalCount,
      unavailable: totalCount - availableCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch hall counts',
      error: error.message 
    });
  }
});

// GET /api/halls/types/list - Get all unique hall types
router.get('/types/list', async (req, res) => {
  try {
    const hallTypes = await Hall.distinct('hallType', { hallType: { $ne: null } });
    
    res.json({
      success: true,
      hallTypes,
      count: hallTypes.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch hall types',
      error: error.message 
    });
  }
});

// GET /api/halls/cities/list - Get all unique cities
router.get('/cities/list', async (req, res) => {
  try {
    const cities = await Hall.distinct('location.city', { 'location.city': { $ne: null } });
    
    res.json({
      success: true,
      cities,
      count: cities.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cities',
      error: error.message 
    });
  }
});

// ✅ NEW: Fallback route for /view/all in case controller is missing
router.get('/view/all/fallback', async (req, res) => {
  try {
    const halls = await Hall.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      halls,
      count: halls.length,
      message: 'Halls fetched successfully (fallback route)'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch halls',
      error: error.message 
    });
  }
});

module.exports = router;