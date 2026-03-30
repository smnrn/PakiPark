import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { LocationsModule } from './locations/locations.module';
import { ParkingSlotsModule } from './parking-slots/parking-slots.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BookingsModule,
    VehiclesModule,
    LocationsModule,
    ParkingSlotsModule,
    AnalyticsModule,
    ReviewsModule,
    SettingsModule,
    UsersModule,
    LogsModule,
  ],
})
export class AppModule {}
