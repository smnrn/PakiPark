'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Car, Plus, Trash2, CheckCircle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { vehiclesService } from '@/services/vehiclesService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ plateNumber: '', brand: '', model: '', type: 'Sedan', color: '' });

  const load = async () => {
    try { setVehicles(await vehiclesService.getMyVehicles()); }
    catch { toast.error('Failed to load vehicles'); }
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await vehiclesService.updateVehicle(editingId, formData);
        toast.success('Vehicle updated');
      } else {
        await vehiclesService.addVehicle(formData);
        toast.success('Vehicle added');
      }
      setFormData({ plateNumber: '', brand: '', model: '', type: 'Sedan', color: '' });
      setShowAddForm(false); setEditingId(null);
      load();
    } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
  };

  const handleDelete = async (id: string, plate: string) => {
    if (!confirm(`Delete vehicle ${plate}?`)) return;
    try {
      await vehiclesService.deleteVehicle(id);
      toast.success('Deleted successfully');
      load();
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const editVehicle = (v: any) => {
    setFormData({ plateNumber: v.plateNumber, brand: v.brand, model: v.model, type: v.type, color: v.color });
    setEditingId(v.id || v._id);
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/customer/home')} className="gap-2">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 object-contain" unoptimized />
          </div>
          <h1 className="text-xl font-bold text-[#1e3d5a]">My Vehicles</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#1e3d5a]">Manage Vehicles</h2>
          <Button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setFormData({ plateNumber: '', brand: '', model: '', type: 'Sedan', color: '' }); }} className="bg-[#ee6b20] gap-2">
            {showAddForm ? 'Cancel' : <><Plus className="size-4" /> Add Vehicle</>}
          </Button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-bold">Plate Number</label><Input value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})} required placeholder="ABC 1234" /></div>
              <div className="space-y-1"><label className="text-sm font-bold">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-10 border rounded-xl px-3 text-sm focus:ring-[#1e3d5a]">
                  {['Sedan', 'SUV', 'Van', 'Pickup', 'Motorcycle'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-sm font-bold">Brand</label><Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required placeholder="Toyota" /></div>
              <div className="space-y-1"><label className="text-sm font-bold">Model</label><Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required placeholder="Vios" /></div>
            </div>
            <div className="pt-2"><Button type="submit" className="w-full bg-[#1e3d5a]">{editingId ? 'Update Vehicle' : 'Add Vehicle'}</Button></div>
          </form>
        )}

        {vehicles.length === 0 && !showAddForm ? (
          <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-100">
            <Car className="size-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-500">No vehicles added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map(v => (
              <div key={v.id || v._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Car className="size-6" /></div>
                  <div>
                    <h3 className="font-black text-lg text-[#1e3d5a]">{v.plateNumber}</h3>
                    <p className="text-sm text-gray-500">{v.brand} {v.model} • {v.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => editVehicle(v)} className="text-gray-500 hover:text-[#ee6b20]"><Edit2 className="size-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id || v._id, v.plateNumber)} className="text-red-500 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
