const express = require('express');
const router = express.Router();
const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByStaff,
  getTodayAssignments,
  updateAssignmentStatus
} = require('../Controllers/workAssignmentController');

router.get('/', getAllAssignments);
router.get('/today', getTodayAssignments);
router.get('/staff/:staffId', getAssignmentsByStaff);
router.get('/:id', getAssignmentById);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.patch('/:id/status', updateAssignmentStatus);
router.delete('/:id', deleteAssignment);

module.exports = router;