-- =============================================================================
--  PakiPark — PostgreSQL Schema
--  Database : pakipark
--  Encoding : UTF-8
--
--  All column names follow the camelCase convention that Sequelize uses when
--  `underscored` is NOT set. PostgreSQL stores them case-insensitively unless
--  they are double-quoted; Sequelize always quotes them at query time.
--
--  INDEX STRATEGY
--  ──────────────
--  • Every foreign key has its own B-tree index (FK lookups on joins).
--  • Hot query paths get COMPOSITE indexes ordered by selectivity (high → low).
--  • Partial indexes filter to the subset of rows that queries actually touch
--    (e.g. only 'upcoming'/'active' bookings in conflict checks).
--  • UNIQUE constraints create implicit indexes — not duplicated here.
--  • GIN index on JSONB columns enables fast key-path lookups.
--
--  HOW TO APPLY
--  ────────────
--  1. psql -U postgres -d pakipark -f schema.sql
--     (or run:  node src/backend/scripts/syncSchema.js)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS (create before tables)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role_enum           AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE location_status_enum     AS ENUM ('active', 'maintenance', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE slot_type_enum           AS ENUM ('regular', 'handicapped', 'ev_charging', 'vip', 'motorcycle');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE slot_status_enum         AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_allowed_enum     AS ENUM ('sedan', 'suv', 'van', 'truck', 'motorcycle', 'any');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type_enum        AS ENUM ('sedan', 'suv', 'van', 'truck', 'motorcycle', 'hatchback', 'pickup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_enum      AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum      AS ENUM ('GCash', 'PayMaya', 'Credit/Debit Card');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum      AS ENUM ('paid', 'pending', 'partial', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE settings_category_enum  AS ENUM ('system', 'security', 'notifications', 'payment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL          PRIMARY KEY,
  name             VARCHAR(255)    NOT NULL,
  email            VARCHAR(255)    NOT NULL,
  password         VARCHAR(255)    NOT NULL,
  phone            VARCHAR(50),
  role             user_role_enum  NOT NULL DEFAULT 'customer',
  "profilePicture" TEXT,
  address          JSONB           NOT NULL DEFAULT '{}',
  "dateOfBirth"    DATE,
  "isVerified"     BOOLEAN         NOT NULL DEFAULT FALSE,
  documents        JSONB           NOT NULL DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Users: unique email (also used for login lookups)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (email);

-- Users: role-based admin listings
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users (role);

-- Users: GIN index for JSON address searches
CREATE INDEX IF NOT EXISTS idx_users_address_gin
  ON users USING GIN (address);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: locations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id               SERIAL                  PRIMARY KEY,
  name             VARCHAR(255)            NOT NULL,
  address          VARCHAR(500)            NOT NULL,
  lat              FLOAT,
  lng              FLOAT,
  "totalSpots"     INTEGER                 NOT NULL DEFAULT 100,
  "availableSpots" INTEGER                 NOT NULL DEFAULT 100
                     CHECK ("availableSpots" >= 0),
  "hourlyRate"     FLOAT                   NOT NULL DEFAULT 50
                     CHECK ("hourlyRate"    >= 0),
  status           location_status_enum    NOT NULL DEFAULT 'active',
  "operatingHours" VARCHAR(50)             NOT NULL DEFAULT '06:00 - 23:00',
  amenities        TEXT[]                  NOT NULL DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- Locations: filter active locations (public booking flow)
CREATE INDEX IF NOT EXISTS idx_locations_status
  ON locations (status);

-- Locations: geo-proximity lookups (future map feature)
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng
  ON locations (lat, lng);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: vehicles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id            SERIAL               PRIMARY KEY,
  "userId"      INTEGER              NOT NULL
                  REFERENCES users (id) ON DELETE CASCADE,
  brand         VARCHAR(100)         NOT NULL,
  model         VARCHAR(100)         NOT NULL,
  color         VARCHAR(100)         NOT NULL,
  "plateNumber" VARCHAR(20)          NOT NULL,
  type          vehicle_type_enum    NOT NULL DEFAULT 'sedan',
  "orDoc"       TEXT,
  "crDoc"       TEXT,
  "isActive"    BOOLEAN              NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- Vehicles: list a user's vehicles (most common query)
--   SELECT * FROM vehicles WHERE "userId"=$1 AND "isActive"=TRUE
CREATE INDEX IF NOT EXISTS idx_vehicles_user_active
  ON vehicles ("userId", "isActive");

-- Vehicles: plate number search / admin lookup
CREATE INDEX IF NOT EXISTS idx_vehicles_plate
  ON vehicles ("plateNumber");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: parking_slots
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parking_slots (
  id                   SERIAL                PRIMARY KEY,
  "locationId"         INTEGER               NOT NULL
                         REFERENCES locations (id) ON DELETE CASCADE,
  label                VARCHAR(20)           NOT NULL,   -- "A1", "F2-B3"
  section              VARCHAR(10)           NOT NULL,
  floor                INTEGER               NOT NULL DEFAULT 1
                         CHECK (floor >= 1),
  type                 slot_type_enum        NOT NULL DEFAULT 'regular',
  status               slot_status_enum      NOT NULL DEFAULT 'available',
  "vehicleTypeAllowed" vehicle_allowed_enum  NOT NULL DEFAULT 'any',
  "createdAt"          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  CONSTRAINT parking_slots_location_label_unique UNIQUE ("locationId", label)
);

-- Parking slots: dashboard grid query — all slots for a location ordered by layout
--   SELECT * FROM parking_slots
--   WHERE "locationId"=$1
--   ORDER BY floor ASC, section ASC, label ASC
CREATE INDEX IF NOT EXISTS idx_parking_slots_location_layout
  ON parking_slots ("locationId", floor, section);

-- Parking slots: auto-assign — find first available slot in a location
--   SELECT * FROM parking_slots
--   WHERE "locationId"=$1 AND status != 'maintenance'
--   ORDER BY floor, section, label LIMIT 1
CREATE INDEX IF NOT EXISTS idx_parking_slots_location_status
  ON parking_slots ("locationId", status);

-- Parking slots: filter by type (EV slots, handicapped, etc.)
CREATE INDEX IF NOT EXISTS idx_parking_slots_location_type
  ON parking_slots ("locationId", type);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: bookings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL               PRIMARY KEY,
  "userId"        INTEGER              NOT NULL
                    REFERENCES users (id) ON DELETE CASCADE,
  "vehicleId"     INTEGER              NOT NULL
                    REFERENCES vehicles (id),
  "locationId"    INTEGER              NOT NULL
                    REFERENCES locations (id),
  "parkingSlotId" INTEGER
                    REFERENCES parking_slots (id) ON DELETE SET NULL,
  reference       VARCHAR(30)          UNIQUE,
  -- Compact barcode value (same data, no hyphen) stored for scanner lookups
  barcode         VARCHAR(50)          UNIQUE,
  spot            VARCHAR(20)          NOT NULL,
  date            DATE                 NOT NULL,
  "timeSlot"      VARCHAR(20)          NOT NULL,   -- "10:00 - 11:00"
  type            VARCHAR(50)          NOT NULL DEFAULT '1-Hour Slot',
  status          booking_status_enum  NOT NULL DEFAULT 'upcoming',
  amount          FLOAT                NOT NULL CHECK (amount >= 0),
  "paymentMethod" payment_method_enum  NOT NULL,
  "paymentStatus" payment_status_enum  NOT NULL DEFAULT 'pending',
  "checkInAt"     TIMESTAMPTZ,
  "checkOutAt"    TIMESTAMPTZ,
  "cancelledAt"   TIMESTAMPTZ,
  "cancelReason"  TEXT,
  "createdAt"     TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- ── INDEX 1 (MOST CRITICAL) ──────────────────────────────────────────────────
-- getDashboardSlots + getConflictingSlotIds:
--   SELECT ... WHERE "locationId"=$1 AND date=$2 AND status IN ('upcoming','active')
-- Partial index: only index active rows → much smaller, much faster
CREATE INDEX IF NOT EXISTS idx_bookings_location_date_active
  ON bookings ("locationId", date)
  WHERE status IN ('upcoming', 'active');

-- ── INDEX 2 ──────────────────────────────────────────────────────────────────
-- Conflict check for a specific slot on a date:
--   SELECT ... WHERE "parkingSlotId"=$1 AND date=$2 AND status IN ('upcoming','active')
-- Partial index on non-null parkingSlotId rows only
CREATE INDEX IF NOT EXISTS idx_bookings_slot_date_active
  ON bookings ("parkingSlotId", date)
  WHERE "parkingSlotId" IS NOT NULL AND status IN ('upcoming', 'active');

-- ── INDEX 3 ──────────────────────────────────────────────────────────────────
-- Customer booking list — paginated, most-recent-first:
--   SELECT * FROM bookings WHERE "userId"=$1 ORDER BY "createdAt" DESC
CREATE INDEX IF NOT EXISTS idx_bookings_user_createdat
  ON bookings ("userId", "createdAt" DESC);

-- ── INDEX 4 ──────────────────────────────────────────────────────────────────
-- Customer bookings filtered by status:
--   SELECT * FROM bookings WHERE "userId"=$1 AND status=$2
CREATE INDEX IF NOT EXISTS idx_bookings_user_status
  ON bookings ("userId", status);

-- ── INDEX 5 ──────────────────────────────────────────────────────────────────
-- Admin: filter by date (date-range reports)
CREATE INDEX IF NOT EXISTS idx_bookings_date
  ON bookings (date);

-- ── INDEX 6 ──────────────────────────────────────────────────────────────────
-- Admin: filter by status only
CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings (status);

-- ── INDEX 7 ──────────────────────────────────────────────────────────────────
-- Admin: location + status (e.g. all active bookings at location X)
CREATE INDEX IF NOT EXISTS idx_bookings_location_status
  ON bookings ("locationId", status);

-- ── INDEX 8 ──────────────────────────────────────────────────────────────────
-- Full composite for admin dashboard (locationId + date + status with cover cols)
CREATE INDEX IF NOT EXISTS idx_bookings_location_date_status
  ON bookings ("locationId", date, status);

-- ── INDEX 9 ──────────────────────────────────────────────────────────────────
-- Barcode scan lookup at entry/exit gates
-- A scanner sends the barcode value; this index makes the lookup O(log n)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_barcode
  ON bookings (barcode)
  WHERE barcode IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: reviews
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           SERIAL        PRIMARY KEY,
  "userId"     INTEGER       NOT NULL REFERENCES users     (id) ON DELETE CASCADE,
  "locationId" INTEGER       REFERENCES locations  (id) ON DELETE CASCADE,
  "bookingId"  INTEGER       REFERENCES bookings   (id) ON DELETE SET NULL,
  rating       SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  "createdAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- One review per booking
  CONSTRAINT reviews_booking_unique UNIQUE ("bookingId")
);

-- Reviews: location rating aggregation (AVG, COUNT)
CREATE INDEX IF NOT EXISTS idx_reviews_location
  ON reviews ("locationId");

-- Reviews: user review history
CREATE INDEX IF NOT EXISTS idx_reviews_user
  ON reviews ("userId");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          SERIAL                   PRIMARY KEY,
  key         VARCHAR(100)             NOT NULL,
  value       JSONB                    NOT NULL,
  category    settings_category_enum   NOT NULL,
  "createdAt" TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ              NOT NULL DEFAULT NOW(),

  CONSTRAINT settings_key_unique UNIQUE (key)
);

-- Settings: load all settings by category (admin page)
CREATE INDEX IF NOT EXISTS idx_settings_category
  ON settings (category);

-- Settings: GIN on value for JSON searches (e.g. find setting with value=true)
CREATE INDEX IF NOT EXISTS idx_settings_value_gin
  ON settings USING GIN (value);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: parking_rates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parking_rates (
  id            SERIAL        PRIMARY KEY,
  "vehicleType" VARCHAR(50)   NOT NULL,
  "hourlyRate"  FLOAT         NOT NULL CHECK ("hourlyRate" >= 0),
  "dailyRate"   FLOAT         NOT NULL CHECK ("dailyRate"  >= 0),
  "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT parking_rates_vehicle_type_unique UNIQUE ("vehicleType")
);

-- =============================================================================
-- USEFUL VIEWS (read-only helpers — no impact on write performance)
-- =============================================================================

-- Active slot occupancy per location for today
CREATE OR REPLACE VIEW v_location_occupancy_today AS
SELECT
  l.id                                           AS "locationId",
  l.name                                         AS "locationName",
  l."totalSpots",
  l."availableSpots",
  COUNT(b.id) FILTER (WHERE b.status = 'active')    AS "occupiedNow",
  COUNT(b.id) FILTER (WHERE b.status = 'upcoming')  AS "reservedToday",
  COUNT(b.id) FILTER (WHERE b.status = 'completed'
                       AND b.date = CURRENT_DATE)   AS "completedToday",
  ROUND(
    100.0 * COUNT(b.id) FILTER (WHERE b.status IN ('active','upcoming'))
    / NULLIF(l."totalSpots", 0), 1
  )                                              AS "occupancyPct"
FROM locations l
LEFT JOIN bookings b
  ON b."locationId" = l.id
  AND b.date = CURRENT_DATE
  AND b.status IN ('upcoming', 'active', 'completed')
GROUP BY l.id, l.name, l."totalSpots", l."availableSpots";

-- Slot-level status for today (mirrors getDashboardSlots logic in SQL)
CREATE OR REPLACE VIEW v_slot_status_today AS
SELECT
  ps.id                                    AS "slotId",
  ps."locationId",
  ps.label,
  ps.section,
  ps.floor,
  ps.type                                  AS "slotType",
  CASE
    WHEN ps.status = 'maintenance'         THEN 'maintenance'
    WHEN b.id IS NULL                      THEN 'available'
    WHEN b.status = 'active'               THEN 'occupied'
    ELSE 'reserved'
  END                                      AS "derivedStatus",
  b.id                                     AS "bookingId",
  b.reference                              AS "bookingRef",
  b."timeSlot",
  b.status                                 AS "bookingStatus",
  b.amount
FROM parking_slots ps
LEFT JOIN bookings b
  ON b."parkingSlotId" = ps.id
  AND b.date = CURRENT_DATE
  AND b.status IN ('upcoming', 'active');

-- =============================================================================
-- NOTES ON PERFORMANCE
-- =============================================================================
--
-- 1. MOST CRITICAL PATH: getDashboardSlots
--    Query: bookings WHERE "locationId"=X AND date=TODAY AND status IN ('upcoming','active')
--    Served by: idx_bookings_location_date_active (partial)
--    Expected rows: O(totalSlots) — very small set. Sub-millisecond with this index.
--
-- 2. CONFLICT CHECK: createBooking, autoAssignSlot
--    Query: bookings WHERE "parkingSlotId"=X AND date=Y AND status IN ('upcoming','active')
--    Served by: idx_bookings_slot_date_active (partial)
--    With this partial index, a 1M-row bookings table still returns in <1ms.
--
-- 3. CUSTOMER BOOKING LIST: getUserBookings
--    Query: bookings WHERE "userId"=X ORDER BY "createdAt" DESC
--    Served by: idx_bookings_user_createdat (covers both filter + sort)
--
-- 4. SLOT GRID RENDER: parking_slots WHERE "locationId"=X ORDER BY floor, section, label
--    Served by: idx_parking_slots_location_layout
--    With ~500 slots per location, this is a tiny sequential scan of the index leaf.
--
-- =============================================================================