const { Vehicle } = require('../models/index');

// GET /api/vehicles
const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { userId: req.user.id, isActive: true },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: vehicles.map((v) => v.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vehicles
const addVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ userId: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: vehicle.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await vehicle.update(req.body);
    res.json({ success: true, data: vehicle.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/vehicles/:id  (soft-delete via isActive = false)
const deleteVehicle = async (req, res) => {
  try {
    const count = await Vehicle.count({ where: { userId: req.user.id, isActive: true } });
    if (count <= 1) {
      return res
        .status(400)
        .json({ success: false, message: 'You must have at least one vehicle' });
    }

    const vehicle = await Vehicle.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    await vehicle.update({ isActive: false });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyVehicles, addVehicle, updateVehicle, deleteVehicle };
