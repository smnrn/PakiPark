'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Clock, Car, ChevronRight, LogOut, User, Calendar, Bell, Search } from 'lucide-react';
import { bookingService, type Booking } from '@/services/bookingService';
import { locationsService } from '@/services/locationsService';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

export default function CustomerHomePage() {
  const router = useRouter();
  const userName  = typeof window !== 'undefined' ? (localStorage.getItem('userName') ?? 'Customer') : 'Customer';
  const [locations, setLocations]       = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoadingLoc, setIsLoadingLoc] = useState(true);

  useEffect(() => {
    locationsService.getLocations().then(locs => { setLocations(locs.slice(0, 6)); }).catch(() => {}).finally(() => setIsLoadingLoc(false));
    bookingService.getMyBookings({ page: 1 }).then(data => setRecentBookings((data.bookings ?? []).slice(0, 3))).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = {
    upcoming:  'bg-blue-100 text-blue-700',
    active:    'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      {/* Header */}
      <header className="bg-[#1e3d5a] text-white px-6 py-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png" alt="PakiPark" width={100} height={32} className="h-8 object-contain brightness-0 invert" unoptimized />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-xl relative">
              <Bell className="size-5" />
            </button>
            <button onClick={() => router.push('/customer/profile')} className="p-2 hover:bg-white/10 rounded-xl">
              <User className="size-5" />
            </button>
            <button onClick={() => authService.logout()} className="p-2 hover:bg-red-500/20 rounded-xl">
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hero greeting */}
        <div className="bg-gradient-to-r from-[#1e3d5a] to-[#2a5373] rounded-3xl p-7 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ee6b20]/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
          <div className="relative z-10">
            <p className="text-white/60 text-sm font-medium mb-1">Good day,</p>
            <h1 className="text-3xl font-black mb-3">{userName} 👋</h1>
            <p className="text-white/70 text-sm mb-5">Ready to find your perfect parking spot?</p>
            <button onClick={() => router.push('/customer/find-parking')}
              className="bg-[#ee6b20] hover:bg-[#d95a10] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-[#ee6b20]/30">
              <Search className="size-4" />Find Parking
            </button>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'My Bookings', icon: <Calendar className="size-6" />,  path: '/customer/bookings' },
            { label: 'My Vehicles', icon: <Car className="size-6" />,       path: '/customer/vehicles' },
            { label: 'Profile',     icon: <User className="size-6" />,      path: '/customer/profile' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.path)}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-[#ee6b20]/30 hover:-translate-y-0.5 transition-all">
              <div className="size-12 bg-[#f4f7fa] rounded-xl flex items-center justify-center text-[#1e3d5a]">{item.icon}</div>
              <span className="text-xs font-bold text-[#1e3d5a]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Nearby locations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#1e3d5a]">Parking Locations</h2>
            <button onClick={() => router.push('/customer/find-parking')} className="text-[#ee6b20] text-sm font-bold flex items-center gap-1">
              View all <ChevronRight className="size-4" />
            </button>
          </div>
          {isLoadingLoc ? (
            <div className="flex justify-center py-10"><div className="size-8 border-4 border-[#1e3d5a] border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc: any) => (
                <div key={loc.id} onClick={() => router.push(`/customer/find-parking?locationId=${loc.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-lg hover:border-[#ee6b20]/30 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="size-5 text-[#1e3d5a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1e3d5a] text-sm">{loc.name}</h3>
                      <p className="text-xs text-gray-400">{loc.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${(loc.availableSpots ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {loc.availableSpots ?? 0} spots free
                    </span>
                    <span className="text-gray-400">/ {loc.totalSpots} total</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1e3d5a] to-[#ee6b20] rounded-full"
                      style={{ width: `${Math.round(((loc.totalSpots - (loc.availableSpots ?? 0)) / (loc.totalSpots || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        {recentBookings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-[#1e3d5a]">Recent Bookings</h2>
              <button onClick={() => router.push('/customer/bookings')} className="text-[#ee6b20] text-sm font-bold flex items-center gap-1">
                View all <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentBookings.map(b => (
                <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push('/customer/bookings')}>
                  <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
                    <Clock className="size-5 text-[#1e3d5a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1e3d5a] text-sm">{b.reference}</p>
                    <p className="text-xs text-gray-400 truncate">{b.date} · {b.timeSlot}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor[b.status] ?? statusColor.upcoming}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
