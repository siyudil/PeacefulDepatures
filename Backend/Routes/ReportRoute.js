const express = require('express');
const router = express.Router();
const {
  generateStaffReport,
  generateVendorReport,
  generateAssignmentReport,
  generateComprehensiveReport
} = require('../Controllers/ReportController');

router.get('/staff', generateStaffReport);
router.get('/vendors', generateVendorReport);
router.get('/assignments', generateAssignmentReport);
router.get('/comprehensive', generateComprehensiveReport);

module.exports = router;