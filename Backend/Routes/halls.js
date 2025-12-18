
const express = require('express');
const router = express.Router();

// Basic hall routes
router.get('/', (req, res) => res.json({ 
  success: true, 
  halls: [], 
  message: 'Basic hall routes working' 
}));

router.post('/', (req, res) => {
  console.log('Hall creation attempt:', req.body);
  res.json({ 
    success: true, 
    message: 'Hall created successfully (demo)',
    hall: req.body
  });
});

module.exports = router;
    