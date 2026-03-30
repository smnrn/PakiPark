const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyVehicles, addVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');

router.get('/', protect, getMyVehicles);
router.post('/', protect, addVehicle);
router.put('/:id', protect, updateVehicle);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;
