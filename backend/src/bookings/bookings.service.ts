import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';
import { formatBooking, isNoShowBooking, windowsOverlap, computeRefundPolicy, todayStr } from '../common/utils';

const RATE_PER_HOUR = 15;
const FREE_HOURS    = 2;

@Injectable()
export class BookingsService {
  private Booking: any;
  private Location: any;
  private Vehicle: any;
  private ParkingSlot: any;
  private User: any;

  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.Booking     = this.sequelize.model('Booking');
    this.Location    = this.sequelize.model('Location');
    this.Vehicle     = this.sequelize.model('Vehicle');
    this.ParkingSlot = this.sequelize.model('ParkingSlot');
    this.User        = this.sequelize.model('User');
  }

  private async getConflictingSlotIds(locationId: number, date: string, timeSlot: string): Promise<number[]> {
    const bookings = await this.Booking.findAll({
      where: { locationId, date, status: { [Op.in]: ['upcoming', 'active'] }, parkingSlotId: { [Op.not]: null } },
      attributes: ['parkingSlotId', 'timeSlot', 'status', 'date'],
      raw: true,
    });
    return bookings
      .filter((b: any) => {
        if (!windowsOverlap(b.timeSlot, timeSlot)) return false;
        if (b.status === 'active') return true;
        if (b.status === 'upcoming') return !isNoShowBooking(b);
        return false;
      })
      .map((b: any) => b.parkingSlotId);
  }

  async createBooking(dto: any) {
    const { userId, vehicleId, locationId, parkingSlotId, spot, date, timeSlot, amount, paymentMethod, preferredFloor } = dto;

    let resolvedSlotId = parkingSlotId ? parseInt(parkingSlotId) : null;
    let resolvedSpot   = spot;

    if (!resolvedSlotId) {
      const conflictingIds = await this.getConflictingSlotIds(parseInt(locationId), date, timeSlot);
      const where: any = { locationId: parseInt(locationId) };
      if (preferredFloor) where.floor = parseInt(preferredFloor);
      if (conflictingIds.length > 0) where.id = { [Op.notIn]: conflictingIds };
      const assigned = await this.ParkingSlot.findOne({ where, order: [['floor', 'ASC'], ['section', 'ASC'], ['label', 'ASC']] });
      if (assigned) { resolvedSlotId = assigned.id; resolvedSpot = assigned.label; }
      else resolvedSpot = spot || 'TBD';
    } else {
      const slot = await this.ParkingSlot.findByPk(resolvedSlotId, { attributes: ['id', 'label'] });
      if (slot) resolvedSpot = slot.label;
    }
    if (!resolvedSpot) resolvedSpot = 'TBD';

    if (resolvedSlotId) {
      const conflictIds = await this.getConflictingSlotIds(parseInt(locationId), date, timeSlot);
      if (conflictIds.includes(resolvedSlotId)) {
        throw new BadRequestException('This parking slot is already taken for the requested time window.');
      }
    }

    const [user, vehicle, location] = await Promise.all([
      this.User.findByPk(parseInt(userId),      { attributes: ['id', 'name', 'email', 'phone'] }),
      this.Vehicle.findByPk(parseInt(vehicleId), { attributes: ['id', 'brand', 'model', 'plateNumber', 'type', 'color'] }),
      this.Location.findByPk(parseInt(locationId), { attributes: ['id', 'name', 'address'] }),
    ]);

    const booking = await this.Booking.create({
      userId: parseInt(userId), vehicleId: parseInt(vehicleId), locationId: parseInt(locationId),
      parkingSlotId: resolvedSlotId, spot: resolvedSpot, date, timeSlot, amount, paymentMethod,
      paymentStatus: 'paid', status: 'upcoming',
      userName: user?.name || null, userEmail: user?.email || null, userPhone: user?.phone || null,
      vehicleBrand: vehicle?.brand || null, vehicleModel: vehicle?.model || null, vehiclePlate: vehicle?.plateNumber || null,
      vehicleType: vehicle?.type || null, vehicleColor: vehicle?.color || null,
      locationName: location?.name || null, locationAddress: location?.address || null,
    });

    await this.Location.decrement('availableSpots', { by: 1, where: { id: locationId } });
    return formatBooking(booking.toJSON());
  }

  async getMyBookings(userId: number, query: any) {
    const { status, page = 1, limit = 20 } = query;
    const where: any = { userId };
    if (status && status !== 'all') where.status = status;
    const { rows: bookings, count: total } = await this.Booking.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit), raw: true,
    });
    return { bookings: bookings.map(formatBooking), total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
  }

  async getAllBookings(query: any) {
    const { status, search, date, locationId, page = 1, limit = 20 } = query;
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (date) where.date = date;
    if (locationId) where.locationId = parseInt(locationId);
    if (search) {
      const term = `%${search}%`;
      where[Op.or] = [
        { reference: { [Op.iLike]: term } }, { barcode: { [Op.iLike]: term } },
        { userName: { [Op.iLike]: term } }, { vehiclePlate: { [Op.iLike]: term } },
        { locationName: { [Op.iLike]: term } }, { spot: { [Op.iLike]: term } },
      ];
    }
    const { rows: bookings, count: total } = await this.Booking.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit), raw: true,
    });
    return { bookings: bookings.map(formatBooking), total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
  }

  async getBookingById(id: number, userId: number, isStaff: boolean) {
    const booking = await this.Booking.findOne({
      where: { id, ...(!isStaff ? { userId } : {}) }, raw: true,
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return formatBooking(booking);
  }

  async cancelBooking(bookingId: string, userId: number, reason?: string) {
    const booking = await this.Booking.findOne({ where: { id: parseInt(bookingId), userId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'cancelled') throw new BadRequestException('Booking already cancelled');
    if (booking.status === 'completed') throw new BadRequestException('Cannot cancel a completed booking');

    const wasNoShow    = isNoShowBooking(booking.toJSON());
    const policy       = computeRefundPolicy(booking.toJSON());
    const refundAmount = Math.floor(booking.amount * policy.refundPct / 100);
    const newPaymentStatus = policy.refundPct === 100 ? 'refunded' : policy.refundPct === 50 ? 'partial' : 'paid';
    const cancelReason = reason ? `${reason} — ${policy.label}` : `User cancelled — ${policy.label}`;

    await booking.update({ status: 'cancelled', cancelledAt: new Date(), cancelReason, paymentStatus: newPaymentStatus });
    if (!wasNoShow) await this.Location.increment('availableSpots', { by: 1, where: { id: booking.locationId } });

    return { ...formatBooking(booking.toJSON()), refundAmount, refundPolicy: { refundPct: policy.refundPct, refundType: policy.refundType, label: policy.label } };
  }

  async updateBookingStatus(bookingId: string, status: string, cancelNote = 'Admin action') {
    const booking = await this.Booking.findByPk(parseInt(bookingId));
    if (!booking) throw new NotFoundException('Booking not found');

    const allowed: any = { upcoming: ['active', 'cancelled'], active: ['completed', 'cancelled'], completed: [], cancelled: [] };
    if (!allowed[booking.status]?.includes(status)) {
      throw new BadRequestException(`Cannot move booking from '${booking.status}' → '${status}'`);
    }

    if (status === 'completed') await this.Location.increment('availableSpots', { by: 1, where: { id: booking.locationId } });
    if (status === 'cancelled' && !isNoShowBooking(booking.toJSON())) {
      await this.Location.increment('availableSpots', { by: 1, where: { id: booking.locationId } });
    }

    await booking.update({
      status,
      ...(status === 'cancelled' ? { cancelledAt: new Date(), cancelReason: cancelNote } : {}),
      ...(status === 'active'    ? { checkInAt:   new Date() } : {}),
      ...(status === 'completed' ? { checkOutAt:  new Date() } : {}),
    });

    const updated = await this.Booking.findByPk(booking.id);
    return formatBooking(updated.toJSON());
  }

  async checkOutBooking(bookingId: string, adminId: number) {
    const booking = await this.Booking.findByPk(parseInt(bookingId));
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'active') throw new BadRequestException(`Cannot check out booking with status '${booking.status}'`);

    const checkInAt   = booking.checkInAt ? new Date(booking.checkInAt) : new Date();
    const checkOutAt  = new Date();
    const elapsedMs   = Math.max(0, checkOutAt.getTime() - checkInAt.getTime());
    const elapsedHrs  = elapsedMs / (1000 * 60 * 60);
    const overtimeHrs = Math.max(0, elapsedHrs - FREE_HOURS);
    const billableHrs = Math.ceil(overtimeHrs);
    const finalAmount = billableHrs * RATE_PER_HOUR;

    await booking.update({ status: 'completed', checkOutAt, finalAmount });
    if (booking.locationId) await this.Location.increment('availableSpots', { by: 1, where: { id: booking.locationId } });

    const updated   = await this.Booking.findByPk(booking.id);
    const formatted = formatBooking(updated.toJSON());

    const durationMins = Math.round(elapsedMs / 60000);
    const overtimeMins = Math.max(0, durationMins - FREE_HOURS * 60);

    return {
      ...formatted,
      billing: {
        checkInAt: checkInAt.toISOString(), checkOutAt: checkOutAt.toISOString(),
        durationMins,
        durationLabel: durationMins < 60 ? `${durationMins} min` : `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
        freeHours: FREE_HOURS, overtimeMins,
        overtimeLabel: overtimeMins <= 0 ? 'None' : overtimeMins < 60 ? `${overtimeMins} min` : `${Math.floor(overtimeMins / 60)}h ${overtimeMins % 60}m`,
        ratePerHour: RATE_PER_HOUR, billableHours: billableHrs, finalAmount,
      },
    };
  }

  async getAvailableSlots(locationId: string, date: string) {
    const allSlots: string[] = [];
    for (let h = 6; h <= 22; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`);
    }
    const bookedRecords = await this.Booking.findAll({
      where: { locationId, date, status: { [Op.in]: ['upcoming', 'active'] } },
      attributes: ['timeSlot', 'spot', 'status', 'date'], raw: true,
    });
    const slotOccupancy: Record<string, number> = {};
    bookedRecords.filter((b: any) => !isNoShowBooking(b)).forEach((b: any) => {
      slotOccupancy[b.timeSlot] = (slotOccupancy[b.timeSlot] || 0) + 1;
    });
    const location   = await this.Location.findByPk(locationId, { attributes: ['totalSpots'] });
    const totalSpots = location?.totalSpots || 100;
    return allSlots.map(slot => ({ slot, booked: slotOccupancy[slot] || 0, available: totalSpots - (slotOccupancy[slot] || 0), isFull: (slotOccupancy[slot] || 0) >= totalSpots }));
  }
}
