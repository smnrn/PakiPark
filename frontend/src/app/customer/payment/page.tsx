'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export default function PaymentPage() {
  const router = useRouter();
  const [showAddCard, setShowAddCard] = useState(false);

  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/26', isDefault: true, holderName: 'Juan Dela Cruz' },
    { id: '2', type: 'gcash', phoneNumber: '+63 912 345 6789', isDefault: false },
  ]);

  const recentTransactions = [
    { id: '1', location: 'SM City Mall', amount: 200, date: '2026-02-18', time: '10:30 AM', method: 'Visa ****4242' },
  ];

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) return toast.error('Please fill in all details');
    toast.success('Payment method added!');
    setPaymentMethods([...paymentMethods, {
      id: Date.now().toString(), type: 'card', brand: cardData.number.startsWith('4') ? 'Visa' : 'Mastercard',
      last4: cardData.number.slice(-4), expiry: cardData.expiry, isDefault: paymentMethods.length === 0, holderName: cardData.name
    }]);
    setCardData({ number: '', name: '', expiry: '', cvv: '' });
    setShowAddCard(false);
  };

  const handleDeleteMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault && paymentMethods.length > 1) return toast.error('Cannot delete default payment method.');
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
    toast.success('Payment method removed!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/customer/home')} className="gap-2">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 object-contain" unoptimized />
          </div>
          <h1 className="text-xl font-bold text-[#1e3d5a]">Payment Methods</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1e3d5a]">Payment Methods</h2>
              <Button onClick={() => setShowAddCard(!showAddCard)} className="bg-[#ee6b20] gap-2"><Plus className="size-4" /> Add New</Button>
            </div>
            {showAddCard && (
              <form onSubmit={handleAddCard} className="p-6 bg-gray-50 border-b space-y-4">
                <Input placeholder="1234 5678 9012 3456" value={cardData.number} onChange={e => setCardData(c => ({...c, number: e.target.value}))} />
                <Input placeholder="Cardholder Name" value={cardData.name} onChange={e => setCardData(c => ({...c, name: e.target.value}))} />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM/YY" value={cardData.expiry} onChange={e => setCardData(c => ({...c, expiry: e.target.value}))} />
                  <Input placeholder="CVV" value={cardData.cvv} onChange={e => setCardData(c => ({...c, cvv: e.target.value}))} />
                </div>
                <div className="flex gap-3"><Button type="submit" className="flex-1 bg-[#ee6b20]">Add Card</Button></div>
              </form>
            )}
            <div className="p-6 space-y-4">
              {paymentMethods.map(method => (
                <div key={method.id} className={`p-4 border-2 rounded-xl flex justify-between ${method.isDefault ? 'border-[#ee6b20] bg-[#ee6b20]/5' : 'border-gray-200'}`}>
                  <div className="flex gap-4">
                    <div className="size-12 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-lg flex items-center justify-center"><CreditCard className="size-6 text-white" /></div>
                    <div>
                      <p className="font-bold text-[#1e3d5a]">{method.type === 'card' ? `${method.brand} •••• ${method.last4}` : 'GCash'} {method.isDefault && <Star className="inline size-3 text-green-700" />}</p>
                      {method.type === 'card' && <p className="text-sm text-gray-500">Expires {method.expiry}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => handleDeleteMethod(method.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold mb-4">This Month</h3>
            <div><p className="text-sm opacity-80">Total Spent</p><p className="text-3xl font-bold">₱530</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
