'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, User, Mail, Phone, Lock, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usersService } from '@/services/usersService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    usersService.getProfile().then(p => {
      setProfile({ name: p.name || '', email: p.email || '', phone: p.phone || '' });
    }).catch(() => {
      // Fallback to local storage if API is not fully up
      setProfile({
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        phone: localStorage.getItem('userPhone') || '',
      });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersService.updateProfile(profile);
      // Update local storage
      localStorage.setItem('userName', profile.name);
      localStorage.setItem('userEmail', profile.email);
      localStorage.setItem('userPhone', profile.phone);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
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
          <h1 className="text-xl font-bold text-[#1e3d5a]">My Profile</h1>
        </div>
      </header>
      
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="size-20 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                {profile.name.charAt(0).toUpperCase() || <User />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1e3d5a]">{profile.name || 'User'}</h2>
                <p className="text-sm text-gray-500">Customer Account</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className="text-[#ee6b20]">
              <Edit3 className="size-4 mr-2" /> {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={!isEditing} className={`pl-10 h-12 ${!isEditing && 'bg-gray-50 border-transparent font-medium text-gray-700'}`} />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} disabled={!isEditing} className={`pl-10 h-12 ${!isEditing && 'bg-gray-50 border-transparent font-medium text-gray-700'}`} />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className={`pl-10 h-12 ${!isEditing && 'bg-gray-50 border-transparent font-medium text-gray-700'}`} />
              </div>
            </div>

            {isEditing && <Button type="submit" className="w-full h-12 bg-[#1e3d5a] font-bold mt-4">Save Changes</Button>}
          </form>
        </div>
      </main>
    </div>
  );
}
