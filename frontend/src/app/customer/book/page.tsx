'use client';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Clock, CheckCircle, MapPin, CreditCard, Share2,
  Download, Car, AlertTriangle, Timer, LayoutGrid, Loader2,
  Zap, Star, Bike, Wallet, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { bookingService } from '@/services/bookingService';
import { parkingSlotService, ParkingSlot } from '@/services/parkingSlotService';
import { vehiclesService } from '@/services/vehiclesService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) slots.push(`${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`);
  return slots;
}
function todayStr(): string { return new Date().toISOString().split('T')[0]; }

function BookParkingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const locationId = searchParams.get('locationId');
  const locationName = searchParams.get('locationName') || 'Parking Location';
  const queryVehicleId = searchParams.get('vehicleId');
  const HOURLY_RATE = Number(searchParams.get('hourlyRate')) || 50;

  const [activeVehicle, setActiveVehicle] = useState<any>({ _id: '', plate: '---', model: 'No Vehicle', type: 'Sedan' });
  
  useEffect(() => {
    vehiclesService.getMyVehicles().then(v => {
      const target = v.find((x: any) => x._id === queryVehicleId || x.id === queryVehicleId) || v[0];
      if (target) setActiveVehicle({
        _id: target._id || target.id,
        plate: target.plateNumber,
        model: `${target.brand} ${target.model}`.trim(),
        type: target.type
      });
    }).catch(() => {});
  }, [queryVehicleId]);

  const [currentStep, setCurrentStep] = useState<'timeslot' | 'confirmation'>('timeslot');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [showFloorModal, setShowFloorModal] = useState(false);
  const [availableFloors, setAvailableFloors] = useState<number[]>([1, 2, 3]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [allSlots, setAllSlots] = useState<ParkingSlot[]>([]);

  const [bookingData, setBookingData] = useState({
    date: todayStr(),
    selectedSlot: '',
    selectedParkingSlot: null as ParkingSlot | null,
    paymentMethod: 'GCash',
  });

  const [ticketRef, setTicketRef] = useState('PKP-XXXXXXXX');

  const timeSlots = useMemo(() => {
    if (bookingData.date !== todayStr()) return generateTimeSlots();
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    return generateTimeSlots().filter(s => {
      const [h, m] = s.split(' - ')[0].split(':').map(Number);
      return h * 60 + m > nowMin;
    });
  }, [bookingData.date]);

  const handleOpenFloorModal = async () => {
    setIsLoadingFloors(true); setShowFloorModal(true);
    try {
      if (locationId) {
        const slots = await parkingSlotService.getAvailableSlots(locationId, bookingData.date, bookingData.selectedSlot);
        setAllSlots(slots);
        const floors = [...new Set(slots.filter(s => s.status === 'available').map(s => s.floor))].sort((a, b) => a - b);
        setAvailableFloors(floors.length > 0 ? floors : [1, 2, 3]);
      }
    } catch { setAvailableFloors([1,2,3]); setAllSlots([]); }
    finally { setIsLoadingFloors(false); }
  };

  const handleFloorConfirm = (floor: number | null) => {
    let assigned: ParkingSlot | null = allSlots.filter(s => s.status === 'available').find(s => floor === null || s.floor === floor) || null;
    if (!assigned) assigned = allSlots.find(s => s.status === 'available') || null;
    setBookingData(prev => ({ ...prev, selectedParkingSlot: assigned }));
    setShowFloorModal(false);
    setCurrentStep('confirmation');
  };

  const handleConfirmPay = async () => {
    if (!activeVehicle._id) return toast.error('Vehicle required. Please save a vehicle in Profile first.');
    if (!locationId) return toast.error('Location ID is missing.');
    if (!bookingData.selectedSlot) return toast.error('Please select a time slot.');

    setIsConfirming(true);
    try {
      const result = await bookingService.createBooking({
        vehicleId: activeVehicle._id,
        locationId,
        spot: bookingData.selectedParkingSlot?.label || 'Auto-Assigned',
        date: bookingData.date,
        timeSlot: bookingData.selectedSlot,
        amount: HOURLY_RATE,
        paymentMethod: bookingData.paymentMethod,
        ...(bookingData.selectedParkingSlot ? { parkingSlotId: bookingData.selectedParkingSlot._id || bookingData.selectedParkingSlot.id } : {}),
      } as any);

      setTicketRef(result.reference || 'PKP-XXXXXXXX');
      toast.success('Booking confirmed! 🎉');
      setIsConfirming(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setIsConfirming(false);
      toast.error(err?.message || 'Booking failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-5 py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="size-5" /></button>
          <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-6 w-auto" unoptimized />
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-2 rounded-2xl max-w-[200px]">
          <MapPin className="size-3.5 text-[#ee6b20] shrink-0" />
          <span className="text-xs font-bold text-[#1e3d5a] truncate">{locationName}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 lg:p-8">
        {currentStep === 'timeslot' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm shadow-gray-200/40 p-7 lg:p-10 mb-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-[#1e3d5a] mb-8">Reserve a <span className="text-[#ee6b20]">1-Hour</span> Slot</h2>
            <form onSubmit={e => { e.preventDefault(); if (bookingData.selectedSlot) handleOpenFloorModal(); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Date</label>
                <Input type="date" value={bookingData.date} min={todayStr()} onChange={e => setBookingData({ ...bookingData, date: e.target.value, selectedSlot: '' })} required className="h-14 bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Choose Slot</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {timeSlots.map(slot => (
                    <button type="button" key={slot} onClick={() => setBookingData({ ...bookingData, selectedSlot: slot })}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${bookingData.selectedSlot === slot ? 'border-[#ee6b20] bg-orange-50 text-[#ee6b20] shadow-md' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-[#ee6b20]/40'} `}>
                      <Clock className={`size-4 mx-auto mb-1 ${bookingData.selectedSlot === slot ? 'text-[#ee6b20]' : 'text-gray-400'}`} />
                      {slot}
                    </button>
                  ))}
                  {timeSlots.length === 0 && <p className="col-span-full py-4 text-center text-sm text-gray-400">All slots for this day have passed.</p>}
                </div>
              </div>
              <Button type="submit" disabled={!bookingData.selectedSlot} className="w-full bg-[#ee6b20] h-14 rounded-xl font-bold">Next</Button>
            </form>
          </div>
        )}

        {showFloorModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
              <h3 className="text-2xl font-bold text-[#1e3d5a] mb-6 text-center">{isLoadingFloors ? 'Loading...' : 'Preferred Floor?'}</h3>
              {!isLoadingFloors && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {availableFloors.map(floor => (
                      <button key={floor} type="button" onClick={() => handleFloorConfirm(floor)} className="p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-[#ee6b20] hover:bg-orange-50 hover:text-[#ee6b20] font-bold">
                        Floor {floor}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => handleFloorConfirm(null)} className="w-full h-14 rounded-2xl border-2 border-[#1e3d5a] bg-[#1e3d5a] text-white font-bold text-sm">Auto-Assign Best Spot</button>
                </>
              )}
            </div>
          </div>
        )}

        {currentStep === 'confirmation' && !showSuccessModal && (
          <div className="bg-white rounded-[2.5rem] shadow-sm p-7 border border-gray-100 max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-[#1e3d5a] text-center">Confirm & Pay</h2>
            <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><strong className="text-[#1e3d5a]">{locationName}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Vehicle</span><strong className="text-[#1e3d5a]">{activeVehicle.plate}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Dates</span><strong className="text-[#1e3d5a]">{bookingData.date} · {bookingData.selectedSlot}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Spot</span><strong className="text-[#ee6b20]">{bookingData.selectedParkingSlot?.label || 'Auto'}</strong></div>
              <div className="pt-3 border-t"><div className="flex justify-between items-center"><span className="font-bold text-[#1e3d5a]">Total Due</span><span className="text-2xl font-black text-[#ee6b20]">₱{HOURLY_RATE}</span></div></div>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                {['GCash', 'PayMaya', 'Credit/Debit Card'].map(m => (
                  <button key={m} type="button" onClick={() => setBookingData(p => ({...p, paymentMethod: m}))}
                    className={`h-12 rounded-xl text-sm font-bold border-2 ${bookingData.paymentMethod === m ? 'border-[#ee6b20] bg-orange-50 text-[#ee6b20]' : 'border-gray-100 bg-white'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            
            <Button onClick={handleConfirmPay} disabled={isConfirming} className="w-full h-14 bg-[#ee6b20] font-bold mt-6">{isConfirming ? 'Processing...' : `Pay ₱${HOURLY_RATE}`}</Button>
            <Button variant="ghost" onClick={() => setCurrentStep('timeslot')} className="w-full">Back</Button>
          </div>
        )}

        {showSuccessModal && (
          <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-xl p-8 text-center animate-in zoom-in-95">
            <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#1e3d5a] mb-2">Booking Success!</h2>
            <p className="text-gray-500 mb-6">Your spot is secured. Reference: <strong className="font-mono text-[#ee6b20]">{ticketRef}</strong></p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/customer/bookings')} className="w-full bg-[#1e3d5a] h-14 rounded-2xl">View My Bookings</Button>
              <Button onClick={() => router.push('/customer/home')} variant="outline" className="w-full h-14 rounded-2xl border-gray-200">Return to Home</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookParkingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="size-8 animate-spin text-[#ee6b20]" />
      </div>
    }>
      <BookParkingContent />
    </Suspense>
  );
}
