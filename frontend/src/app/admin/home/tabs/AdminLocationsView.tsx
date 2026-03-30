'use client';
import { useState, useEffect } from 'react';
import { locationsService } from '@/services/locationsService';
import { MapPin, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLocationsView() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ name: '', address: '', totalSpots: '100' });

  const load = async () => {
    setIsLoading(true);
    try { setLocations(await locationsService.getLocations()); }
    catch { toast.error('Could not load locations'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await locationsService.createLocation(form);
      toast.success('Location added!');
      setShowAdd(false);
      setForm({ name: '', address: '', totalSpots: '100' });
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await locationsService.deleteLocation(id); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1e3d5a]">Parking Locations</h2>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className={`size-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-[#ee6b20] text-white rounded-xl text-sm font-bold">
            <Plus className="size-4" />Add Location
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-[#ee6b20]/30 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-[#1e3d5a]">New Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Location name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
            <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
            <input type="number" placeholder="Total Spots" value={form.totalSpots} onChange={e => setForm({ ...form, totalSpots: e.target.value })}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-[#1e3d5a] text-white rounded-xl text-sm font-bold hover:bg-[#2a5373]">Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <div className="col-span-3 text-center py-10"><RefreshCw className="size-6 text-[#ee6b20] animate-spin mx-auto" /></div> :
         locations.length === 0 ? <div className="col-span-3 text-center py-10 text-gray-400 text-sm">No locations found</div> :
         locations.map((loc: any) => (
          <div key={loc.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
                <MapPin className="size-5 text-[#1e3d5a]" />
              </div>
              <button onClick={() => handleDelete(String(loc.id), loc.name)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
            <h3 className="font-bold text-[#1e3d5a] mb-1">{loc.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{loc.address}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{loc.availableSpots ?? loc.totalSpots} available</span>
              <span className="text-gray-400">/ {loc.totalSpots} total</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#ee6b20] rounded-full" style={{ width: `${Math.round(((loc.totalSpots - (loc.availableSpots ?? 0)) / loc.totalSpots) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
