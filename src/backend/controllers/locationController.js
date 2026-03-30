const { Op } = require('sequelize');
const { Location, Booking } = require('../models/index');

// ── Helper: compute live availableSpots from the bookings table ───────────────
// This prevents the stored counter from permanently drifting when bookings
// are created / cancelled / completed outside normal flow (seed, migration, etc.)
const recomputeAvailableSpots = async (locationId, totalSpots) => {
  const activeCount = await Booking.count({
    where: {
      locationId,
      status: { [Op.in]: ['upcoming', 'active'] },
    },
  });
  return Math.max(0, totalSpots - activeCount);
};

// GET /api/locations
const getLocations = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const locations = await Location.findAll({ where, order: [['name', 'ASC']] });

    // Recompute availableSpots from live booking data for each location
    const enriched = await Promise.all(
      locations.map(async (loc) => {
        const json = loc.toJSON();
        json.availableSpots = await recomputeAvailableSpots(loc.id, loc.totalSpots);
        return json;
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/locations/:id
const getLocation = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    const json = location.toJSON();
    json.availableSpots = await recomputeAvailableSpots(location.id, location.totalSpots);
    res.json({ success: true, data: json });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/locations (admin)
const createLocation = async (req, res) => {
  try {
    const { totalSpots, ...rest } = req.body;
    const ts = parseInt(totalSpots) || 100;
    const location = await Location.create({ ...rest, totalSpots: ts, availableSpots: ts });
    res.status(201).json({ success: true, data: location.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/locations/:id (admin)
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

    // If totalSpots is being updated, recompute availableSpots from live data
    const updates = { ...req.body };
    if (updates.totalSpots !== undefined) {
      const newTotal = parseInt(updates.totalSpots) || location.totalSpots;
      updates.availableSpots = await recomputeAvailableSpots(location.id, newTotal);
    }

    await location.update(updates);
    const json = location.toJSON();
    // Return the live availableSpots so the UI is immediately accurate
    json.availableSpots = await recomputeAvailableSpots(location.id, location.totalSpots);
    res.json({ success: true, data: json });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/locations/:id (admin)
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    await location.destroy();
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLocations, getLocation, createLocation, updateLocation, deleteLocation };