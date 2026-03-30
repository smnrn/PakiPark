const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Location = sequelize.define(
  'Location',
  {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:           { type: DataTypes.STRING,  allowNull: false },
    address:        { type: DataTypes.STRING,  allowNull: false },
    lat:            { type: DataTypes.FLOAT },
    lng:            { type: DataTypes.FLOAT },
    totalSpots:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    availableSpots: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    hourlyRate:     { type: DataTypes.FLOAT,   allowNull: false, defaultValue: 50 },
    status: {
      type: DataTypes.ENUM('active', 'maintenance', 'closed'),
      defaultValue: 'active',
    },
    operatingHours: { type: DataTypes.STRING, defaultValue: '06:00 - 23:00' },
    amenities:      { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
  },
  {
    tableName:  'locations',
    timestamps: true,
    indexes: [
      // ── Active locations list (most common public query) ───────────────
      { name: 'idx_locations_status', fields: ['status'] },

      // ── Geo-proximity lookup (if map search is added) ──────────────────
      { name: 'idx_locations_lat_lng', fields: ['lat', 'lng'] },
    ],
  }
);

Location.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = String(values.id);
  return values;
};

module.exports = Location;
