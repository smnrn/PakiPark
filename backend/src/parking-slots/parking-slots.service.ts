import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';
import { windowsOverlap, isNoShowBooking, computeTimingMeta, deriveDashboardStatus, recommendedPollIntervalMs } from '../common/utils';

function sizeForType(type: string) {
  if (type === 'motorcycle') return 'compact';
  if (type === 'ev_charging' || type === 'vip') return 'large';
  return 'standard';
}

function buildSlots(locationId: number, sections: string[], slotsPerSection: number, floors: number) {
  const slots: any[] = [];
  for (let floor = 1; floor <= floors; floor++) {
    for (const section of sections) {
      for (let i = 1; i <= slotsPerSection; i++) {
        const shortLabel = `${section}${i}`;
        const label = floors > 1 ? `F${floor}-${shortLabel}` : shortLabel;
        const isHandicapped = i === 1 && section === sections[0];
        const isEV = i === slotsPerSection && section === sections[sections.length - 1];
        const type = isHandicapped ? 'handicapped' : isEV ? 'ev_charging' : 'regular';
        slots.push({ locationId, label, section, floor, type, size: sizeForType(type), status: 'available', vehicleTypeAllowed: 'any' });
      }
    }
  }
  return slots;
}

@Injectable()
export class ParkingSlotsService {
  private ParkingSlot: any;
  private Booking: any;
  private Location: any;

  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.ParkingSlot = this.sequelize.model('ParkingSlot');
    this.Booking     = this.sequelize.model('Booking');
    this.Location    = this.sequelize.model('Location');
  }

  async getSlotsByLocation(locationId: string) {
    const slots = await this.ParkingSlot.findAll({
      where: { locationId }, order: [['floor', 'ASC'], ['section', 'ASC'], ['label', 'ASC']],
    });
    return slots.map((s: any) => s.toJSON());
  }

  async getAvailableSlots(locationId: string, date: string, timeSlot: string) {
    if (!date || !timeSlot) throw new BadRequestException('date and timeSlot query params are required');
    const allBookings = await this.Booking.findAll({
      where: { locationId, date, status: { [Op.in]: ['upcoming', 'active'] }, parkingSlotId: { [Op.not]: null } },
      attributes: ['parkingSlotId', 'timeSlot', 'status', 'date'], raw: true,
    });
    const conflictingIds = allBookings
      .filter((b: any) => {
        if (!windowsOverlap(b.timeSlot, timeSlot)) return false;
        if (b.status === 'active') return true;
        if (b.status === 'upcoming') return !isNoShowBooking(b);
        return false;
      })
      .map((b: any) => b.parkingSlotId);

    const where: any = { locationId, status: { [Op.notIn]: ['maintenance'] } };
    if (conflictingIds.length > 0) where.id = { [Op.notIn]: conflictingIds };
    const slots = await this.ParkingSlot.findAll({ where, order: [['floor', 'ASC'], ['section', 'ASC'], ['label', 'ASC']] });
    return slots.map((s: any) => s.toJSON());
  }

  async getDashboardSlots(locationId: string, date?: string) {
    const queryDate = date ?? new Date().toISOString().split('T')[0];
    const [slots, bookings] = await Promise.all([
      this.ParkingSlot.findAll({ where: { locationId }, order: [['floor', 'ASC'], ['section', 'ASC'], ['label', 'ASC']], raw: true }),
      this.Booking.findAll({
        where: { locationId, date: queryDate, status: { [Op.in]: ['upcoming', 'active'] }, parkingSlotId: { [Op.not]: null } },
        attributes: ['id', 'parkingSlotId', 'reference', 'timeSlot', 'status', 'amount', 'paymentMethod', 'userName', 'userPhone', 'userEmail', 'vehiclePlate', 'vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleColor'],
        raw: true,
      }),
    ]);
    const bookingMap: any = {};
    bookings.forEach((b: any) => { bookingMap[b.parkingSlotId] = b; });
    const timingMetas: any[] = [];
    const result = slots.map((sj: any) => {
      const booking = bookingMap[sj.id] || null;
      const timingMeta = computeTimingMeta(booking);
      const derivedStatus = deriveDashboardStatus(sj.status, booking, timingMeta);
      if (timingMeta) timingMetas.push(timingMeta);
      return {
        ...sj, derivedStatus,
        booking: booking ? {
          _id: String(booking.id), reference: booking.reference, timeSlot: booking.timeSlot,
          status: booking.status, amount: booking.amount, paymentMethod: booking.paymentMethod, timing: timingMeta,
          user: booking.userName ? { name: booking.userName, phone: booking.userPhone, email: booking.userEmail } : null,
          vehicle: booking.vehiclePlate ? { plateNumber: booking.vehiclePlate, type: booking.vehicleType, brand: booking.vehicleBrand, model: booking.vehicleModel, color: booking.vehicleColor } : null,
        } : null,
      };
    });
    return { data: result, recommendedPollMs: recommendedPollIntervalMs(timingMetas), serverTime: new Date().toISOString() };
  }

  async getSlot(id: string) {
    const slot = await this.ParkingSlot.findByPk(parseInt(id));
    if (!slot) throw new NotFoundException('Slot not found');
    return slot.toJSON();
  }

  async createSlot(dto: any) {
    const slot = await this.ParkingSlot.create(dto);
    return slot.toJSON();
  }

  async updateSlot(id: string, dto: any) {
    const slot = await this.ParkingSlot.findByPk(parseInt(id));
    if (!slot) throw new NotFoundException('Slot not found');
    await slot.update(dto);
    return slot.toJSON();
  }

  async deleteSlot(id: string) {
    const slot = await this.ParkingSlot.findByPk(parseInt(id));
    if (!slot) throw new NotFoundException('Slot not found');
    await slot.destroy();
    return { message: 'Slot deleted' };
  }

  async generateSlots(dto: any) {
    const { locationId, sections, slotsPerSection, floors } = dto;
    if (!locationId || !sections?.length || !slotsPerSection || !floors) {
      throw new BadRequestException('locationId, sections, slotsPerSection, floors are required');
    }
    await this.ParkingSlot.destroy({ where: { locationId } });
    const slotData = buildSlots(parseInt(locationId), sections, parseInt(slotsPerSection), parseInt(floors));
    const created  = await this.ParkingSlot.bulkCreate(slotData, { returning: true });
    try {
      const location = await this.Location.findByPk(locationId);
      if (location) await location.update({ totalSpots: created.length, availableSpots: created.length });
    } catch (_) {}
    return { slots: created.map((s: any) => s.toJSON()), message: `${created.length} slots generated for location ${locationId}` };
  }
}
