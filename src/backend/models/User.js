const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:           { type: DataTypes.STRING,  allowNull: false },
    email:          { type: DataTypes.STRING,  allowNull: false, unique: true },
    password:       { type: DataTypes.STRING,  allowNull: false },
    phone:          { type: DataTypes.STRING },
    role:           { type: DataTypes.ENUM('customer', 'admin', 'teller', 'business_partner'), defaultValue: 'customer' },
    profilePicture: { type: DataTypes.TEXT,    defaultValue: null },
    // { street, city, province }
    address:        { type: DataTypes.JSONB,   defaultValue: {} },
    dateOfBirth:    { type: DataTypes.DATEONLY },
    isVerified:     { type: DataTypes.BOOLEAN, defaultValue: false },
    // { businessPermit, dtiSec, proofOfOwnership }
    documents:      { type: DataTypes.JSONB,   defaultValue: {} },
  },
  {
    tableName:  'users',
    timestamps: true,
    indexes: [
      // ── Login / auth lookup ────────────────────────────────────────────
      { name: 'users_email_unique', unique: true, fields: ['email'] },

      // ── Admin management: filter by role ──────────────────────────────
      { name: 'idx_users_role', fields: ['role'] },

      // ── Profile search by name (LIKE queries benefit from this) ────────
      { name: 'idx_users_name', fields: ['name'] },
    ],
  }
);

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = String(values.id);
  delete values.password;
  return values;
};

module.exports = User;