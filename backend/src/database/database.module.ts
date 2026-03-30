import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

// ── Performance indexes (idempotent) ─────────────────────────────────────────
const PERFORMANCE_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_bookings_location_date_active
     ON bookings ("locationId", date)
     WHERE status IN ('upcoming', 'active')`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_slot_date_active
     ON bookings ("parkingSlotId", date)
     WHERE "parkingSlotId" IS NOT NULL AND status IN ('upcoming', 'active')`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_user_createdat
     ON bookings ("userId", "createdAt" DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_barcode
     ON bookings (barcode)
     WHERE barcode IS NOT NULL`,
];

export const SEQUELIZE = 'SEQUELIZE';

const dbUrl  = (process.env.DATABASE_URL ?? '').trim();
const useSSL = dbUrl.length > 0;
const connStr = useSSL
  ? dbUrl
  : `postgres://${process.env.DB_USER ?? 'postgres'}:${process.env.DB_PASS ?? 'postgres'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? 5432}/${process.env.DB_NAME ?? 'pakipark'}`;

const sequelizeInstance = new Sequelize(connStr, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development'
    ? (sql: string) => { if (!sql.includes('Executing')) console.log('[SQL]', sql); }
    : false,
  dialectOptions: useSSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
});

import { defineModels } from './models';
defineModels(sequelizeInstance);

@Global()
@Module({
  providers: [
    {
      provide: SEQUELIZE,
      useValue: sequelizeInstance,
    },
  ],
  exports: [SEQUELIZE],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  async onModuleInit() {
    try {
      await sequelizeInstance.authenticate();
      this.logger.log(`✅ PostgreSQL connected ${useSSL ? '(Supabase/SSL)' : '(local)'}`);

      try {
        await sequelizeInstance.sync({ alter: true });
        this.logger.log('✅ All tables synced (alter mode)');
      } catch (syncErr: any) {
        this.logger.warn(`⚠️  Schema sync skipped (${syncErr.message.split('\n')[0]})`);
      }

      for (const sql of PERFORMANCE_INDEXES) {
        try {
          await sequelizeInstance.query(sql);
        } catch (e: any) {
          this.logger.warn(`⚠️  Index skipped: ${e.message.split('\n')[0]}`);
        }
      }
      this.logger.log('✅ Performance indexes verified');
    } catch (error: any) {
      this.logger.error(`❌ PostgreSQL Error: ${error.message}`);
      process.exit(1);
    }
  }
}
