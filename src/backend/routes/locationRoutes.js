const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { getLocations, getLocation, createLocation, updateLocation, deleteLocation } = require('../controllers/locationController');

// Public/customer routes
router.get('/', protect, getLocations);
router.get('/:id', protect, getLocation);

// Admin routes
router.post('/', protect, adminOnly, createLocation);
router.put('/:id', protect, adminOnly, updateLocation);
router.delete('/:id', protect, adminOnly, deleteLocation);

module.exports = router;
