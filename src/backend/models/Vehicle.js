const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:      { type: DataTypes.INTEGER, allowNull: false },
    brand:       { type: DataTypes.STRING,  allowNull: false },
    model:       { type: DataTypes.STRING,  allowNull: false },
    color:       { type: DataTypes.STRING,  allowNull: false },
    plateNumber: { type: DataTypes.STRING,  allowNull: false },
    type: {
      type: DataTypes.ENUM('sedan', 'suv', 'van', 'truck', 'motorcycle', 'hatchback', 'pickup'),
      defaultValue: 'sedan',
    },
    orDoc:    { type: DataTypes.TEXT,    defaultValue: null },
    crDoc:    { type: DataTypes.TEXT,    defaultValue: null },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName:  'vehicles',
    timestamps: true,
    indexes: [
      // ── User's vehicles list ───────────────────────────────────────────
      // SELECT * FROM vehicles WHERE "userId"=$1 AND "isActive"=true
      { name: 'idx_vehicles_user_active', fields: ['userId', 'isActive'] },

      // ── Plate number lookup (admin search, conflict checks) ────────────
      { name: 'idx_vehicles_plate', fields: ['plateNumber'] },
    ],
  }
);

Vehicle.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = String(values.id);
  return values;
};

module.exports = Vehicle;
