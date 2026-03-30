import { Module } from '@nestjs/common';
import { ParkingSlotsController } from './parking-slots.controller';
import { ParkingSlotsService } from './parking-slots.service';

@Module({ controllers: [ParkingSlotsController], providers: [ParkingSlotsService] })
export class ParkingSlotsModule {}
