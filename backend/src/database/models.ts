import { Sequelize, DataTypes, Model } from 'sequelize';

// ── Model definitions ────────────────────────────────────────────────────────
// All models are defined here and registered on the shared Sequelize instance.
// No ORM associations — loosely coupled by design (see original models/index.js).

export function defineModels(sequelize: Sequelize) {
  // ── User ────────────────────────────────────────────────────────────────────
  const User = sequelize.define('User', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:           { type: DataTypes.STRING,  allowNull: false },
    email:          { type: DataTypes.STRING,  allowNull: false, unique: true },
    password:       { type: DataTypes.STRING,  allowNull: false },
    phone:          { type: DataTypes.STRING },
    role:           { type: DataTypes.ENUM('customer', 'admin', 'teller', 'business_partner'), defaultValue: 'customer' },
    profilePicture: { type: DataTypes.TEXT,    defaultValue: null },
    address:        { type: DataTypes.JSONB,   defaultValue: {} },
    dateOfBirth:    { type: DataTypes.DATEONLY },
    isVerified:     { type: DataTypes.BOOLEAN, defaultValue: false },
    documents:      { type: DataTypes.JSONB,   defaultValue: {} },
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { name: 'users_email_unique',  unique: true, fields: ['email'] },
      { name: 'idx_users_role',      fields: ['role'] },
      { name: 'idx_users_name',      fields: ['name'] },
    ],
  });

  // ── Vehicle ─────────────────────────────────────────────────────────────────
  const Vehicle = sequelize.define('Vehicle', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:      { type: DataTypes.INTEGER, allowNull: false },
    brand:       { type: DataTypes.STRING(60) },
    model:       { type: DataTypes.STRING(60) },
    plateNumber: { type: DataTypes.STRING(20), allowNull: false },
    type:        { type: DataTypes.STRING(20), defaultValue: 'Sedan' },
    color:       { type: DataTypes.STRING(30) },
    isDefault:   { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [
      { name: 'idx_vehicles_user', fields: ['userId'] },
    ],
  });

  // ── Location ─────────────────────────────────────────────────────────────────
  const Location = sequelize.define('Location', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:           { type: DataTypes.STRING,  allowNull: false },
    address:        { type: DataTypes.TEXT },
    totalSpots:     { type: DataTypes.INTEGER, defaultValue: 0 },
    availableSpots: { type: DataTypes.INTEGER, defaultValue: 0 },
    pricePerHour:   { type: DataTypes.FLOAT,   defaultValue: 0 },
    imageUrl:       { type: DataTypes.TEXT },
    operatingHours: { type: DataTypes.JSONB,   defaultValue: {} },
    amenities:      { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    coordinates:    { type: DataTypes.JSONB,   defaultValue: {} },
    ownerId:        { type: DataTypes.INTEGER },
    isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'locations',
    timestamps: true,
  });

  // ── ParkingSlot ──────────────────────────────────────────────────────────────
  const ParkingSlot = sequelize.define('ParkingSlot', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    slotLabel:  { type: DataTypes.STRING(20), allowNull: false },
    type:       { type: DataTypes.STRING(20), defaultValue: 'standard' },
    isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
    row:        { type: DataTypes.INTEGER },
    col:        { type: DataTypes.INTEGER },
  }, {
    tableName: 'parking_slots',
    timestamps: true,
    indexes: [
      { name: 'idx_parking_slots_location', fields: ['locationId'] },
    ],
  });

  // ── Booking ─────────────────────────────────────────────────────────────────
  const Booking = sequelize.define('Booking', {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:        { type: DataTypes.INTEGER, allowNull: false },
    vehicleId:     { type: DataTypes.INTEGER, allowNull: false },
    locationId:    { type: DataTypes.INTEGER, allowNull: false },
    parkingSlotId: { type: DataTypes.INTEGER, allowNull: true },
    reference:     { type: DataTypes.STRING(30), unique: true },
    barcode:       { type: DataTypes.STRING(50), allowNull: true, unique: true },
    spot:          { type: DataTypes.STRING(20), allowNull: false },
    date:          { type: DataTypes.DATEONLY,   allowNull: false },
    timeSlot:      { type: DataTypes.STRING(20), allowNull: false },
    type:          { type: DataTypes.STRING(50), defaultValue: '1-Hour Slot' },
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
      defaultValue: 'upcoming',
    },
    amount:        { type: DataTypes.FLOAT, allowNull: false },
    paymentMethod: { type: DataTypes.ENUM('GCash', 'PayMaya', 'Credit/Debit Card'), allowNull: false },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'pending', 'partial', 'refunded'),
      defaultValue: 'pending',
    },
    checkInAt:    { type: DataTypes.DATE, allowNull: true },
    checkOutAt:   { type: DataTypes.DATE, allowNull: true },
    cancelledAt:  { type: DataTypes.DATE, allowNull: true },
    cancelReason: { type: DataTypes.TEXT, allowNull: true },
    finalAmount:  { type: DataTypes.FLOAT, allowNull: true },
    userName:        { type: DataTypes.STRING(120), allowNull: true },
    userEmail:       { type: DataTypes.STRING(200), allowNull: true },
    userPhone:       { type: DataTypes.STRING(30),  allowNull: true },
    vehicleBrand:    { type: DataTypes.STRING(60),  allowNull: true },
    vehicleModel:    { type: DataTypes.STRING(60),  allowNull: true },
    vehiclePlate:    { type: DataTypes.STRING(20),  allowNull: true },
    vehicleType:     { type: DataTypes.STRING(20),  allowNull: true },
    vehicleColor:    { type: DataTypes.STRING(30),  allowNull: true },
    locationName:    { type: DataTypes.STRING(200), allowNull: true },
    locationAddress: { type: DataTypes.STRING(400), allowNull: true },
  }, {
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      { name: 'bookings_reference_unique',         unique: true, fields: ['reference'] },
      { name: 'bookings_barcode_unique',           unique: true, fields: ['barcode'] },
      { name: 'idx_bookings_location_date_status', fields: ['locationId', 'date', 'status'] },
      { name: 'idx_bookings_slot_date_status',     fields: ['parkingSlotId', 'date', 'status'] },
      { name: 'idx_bookings_user_createdat',       fields: ['userId', 'createdAt'] },
      { name: 'idx_bookings_user_status',          fields: ['userId', 'status'] },
      { name: 'idx_bookings_date',                 fields: ['date'] },
      { name: 'idx_bookings_status',               fields: ['status'] },
      { name: 'idx_bookings_location_status',      fields: ['locationId', 'status'] },
      { name: 'idx_bookings_vehicle_type',         fields: ['vehicleType'] },
      { name: 'idx_bookings_barcode',              fields: ['barcode'] },
    ],
  });

  // Auto-generate reference + barcode on create
  Booking.addHook('beforeCreate', async (booking: any) => {
    const [[row]]: any = await sequelize.query("SELECT nextval('booking_reference_seq') AS n");
    const padded = String(row.n).padStart(8, '0');
    booking.reference = `PKP-${padded}`;
    booking.barcode   = `PKP${padded}`;
  });

  // ── Review ──────────────────────────────────────────────────────────────────
  const Review = sequelize.define('Review', {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:       { type: DataTypes.INTEGER, allowNull: false },
    locationId:   { type: DataTypes.INTEGER, allowNull: false },
    bookingId:    { type: DataTypes.INTEGER, allowNull: true },
    rating:       { type: DataTypes.INTEGER, allowNull: false },
    comment:      { type: DataTypes.TEXT },
    userName:     { type: DataTypes.STRING(120) },
    locationName: { type: DataTypes.STRING(200) },
  }, {
    tableName: 'reviews',
    timestamps: true,
  });

  // ── Settings ─────────────────────────────────────────────────────────────────
  const Settings = sequelize.define('Settings', {
    id:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key:   { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.JSONB, defaultValue: {} },
  }, {
    tableName: 'settings',
    timestamps: true,
  });

  // ── ParkingRate ──────────────────────────────────────────────────────────────
  const ParkingRate = sequelize.define('ParkingRate', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    type:       { type: DataTypes.STRING(20) },
    rate:       { type: DataTypes.FLOAT },
  }, {
    tableName: 'parking_rates',
    timestamps: true,
  });

  // ── TransactionLog ───────────────────────────────────────────────────────────
  const TransactionLog = sequelize.define('TransactionLog', {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookingId: { type: DataTypes.INTEGER },
    userId:    { type: DataTypes.INTEGER },
    type:      { type: DataTypes.STRING(30) },
    amount:    { type: DataTypes.FLOAT },
    details:   { type: DataTypes.JSONB, defaultValue: {} },
  }, {
    tableName: 'transaction_logs',
    timestamps: true,
  });

  // ── ActivityLog ──────────────────────────────────────────────────────────────
  const ActivityLog = sequelize.define('ActivityLog', {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    adminId:   { type: DataTypes.INTEGER },
    action:    { type: DataTypes.STRING(100) },
    targetType:{ type: DataTypes.STRING(50) },
    targetId:  { type: DataTypes.INTEGER },
    details:   { type: DataTypes.JSONB, defaultValue: {} },
  }, {
    tableName: 'activity_logs',
    timestamps: true,
  });

  // Register toJSON helpers (expose _id alias for frontend compatibility)
  const modelsWithId = [User, Vehicle, Location, ParkingSlot, Booking, Review, Settings, ParkingRate, TransactionLog, ActivityLog];
  modelsWithId.forEach((M: any) => {
    const proto = M.prototype as any;
    proto.toJSON = function () {
      const v: any = Object.assign({}, this.get());
      v._id = String(v.id);
      if (M === User) delete v.password;
      return v;
    };
  });

  return { User, Vehicle, Location, ParkingSlot, Booking, Review, Settings, ParkingRate, TransactionLog, ActivityLog };
}
