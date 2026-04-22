/**
 * uploadController.js
 *
 * Handles:
 *   POST /api/uploads/avatar     — customer profile picture
 *   POST /api/uploads/vehicle/:vehicleId/or  — Official Receipt doc
 *   POST /api/uploads/vehicle/:vehicleId/cr  — Certificate of Registration doc
 *   DELETE /api/uploads/:id      — delete an upload record + disk file
 */

const path = require('path');
const fs   = require('fs');
const { User, Vehicle, Upload } = require('../models/index');

// Build a public URL from the filename and sub-folder
function buildUrl(req, folder, filename) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${folder}/${filename}`;
}

// ── POST /api/uploads/avatar ─────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const url = buildUrl(req, 'avatars', req.file.filename);

    // Persist upload record
    const upload = await Upload.create({
      userId:       req.user.id,
      entityType:   'user_avatar',
      entityId:     req.user.id,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url,
    });

    // Update user profile picture URL
    const user = await User.findByPk(req.user.id);
    if (user) await user.update({ profilePicture: url });

    res.json({ success: true, data: { url, upload: upload.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/uploads/vehicle/:vehicleId/or ──────────────────────────────────
const uploadOrDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const vehicleId = parseInt(req.params.vehicleId, 10);
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId: req.user.id } });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const url = buildUrl(req, 'vehicles', req.file.filename);

    const upload = await Upload.create({
      userId:       req.user.id,
      entityType:   'vehicle_or',
      entityId:     vehicleId,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url,
    });

    // Save the URL on the vehicle row
    await vehicle.update({ orDoc: url });

    res.json({ success: true, data: { url, upload: upload.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/uploads/vehicle/:vehicleId/cr ──────────────────────────────────
const uploadCrDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const vehicleId = parseInt(req.params.vehicleId, 10);
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId: req.user.id } });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const url = buildUrl(req, 'vehicles', req.file.filename);

    const upload = await Upload.create({
      userId:       req.user.id,
      entityType:   'vehicle_cr',
      entityId:     vehicleId,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url,
    });

    await vehicle.update({ crDoc: url });

    res.json({ success: true, data: { url, upload: upload.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/uploads/:id ──────────────────────────────────────────────────
const deleteUpload = async (req, res) => {
  try {
    const record = await Upload.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Upload not found' });
    }

    // Delete the physical file
    const folder = record.entityType === 'user_avatar' ? 'avatars' : 'vehicles';
    const filePath = path.join(__dirname, '..', 'uploads', folder, record.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await record.destroy();
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/uploads/my ─────────────────────────────────────────────────────
const getMyUploads = async (req, res) => {
  try {
    const uploads = await Upload.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: uploads.map(u => u.toJSON()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { uploadAvatar, uploadOrDoc, uploadCrDoc, deleteUpload, getMyUploads };
