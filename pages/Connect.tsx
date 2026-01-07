
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MessageCircle, QrCode, Smartphone, Map as MapIcon, Link2, Loader2, Calendar, 
  Trash2, MapPin, Zap, CheckCircle2, X, Navigation, RefreshCw, Send, ShieldCheck,
  Users, ChevronRight, Info, AlertTriangle, Settings2, Clock, Check, BarChart,
  Receipt, Share2, ExternalLink, Phone, ArrowRight, User, ClipboardList,
  MessageSquare, LayoutGrid, Clock3
} from 'lucide-react';
import { dbService } from '../db';
import { Invoice, Customer, PickupBooking, PickupStatus, Salesman, StaffLocation, PickupSlot, Complaint } from '../types';

// Helper to calculate distance between two coordinates in KM
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(1));
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

const ConnectPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<PickupBooking[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wa_connect' | 'dispatch' | 'share_hub'>('wa_connect');
  
  // WhatsApp Linking State
  const [waStatus, setWaStatus] = useState(dbService.getWADeviceStatus());
  const [linkingDevice, setLinkingDevice] = useState(false);
  
  // Booking & Sharing UI State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSlotManagerOpen, setIsSlotManagerOpen] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<PickupBooking | null>(null);
  const [rawLocationText, setRawLocationText] = useState('');
  
  const [quickMsg, setQuickMsg] = useState({ phone: '', text: '' });
  
  const [availableSlots, setAvailableSlots] = useState<PickupSlot[]>([]);
  const [bookingForm, setBookingForm] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    slotId: '',
    timeRange: '',
    lat: 18.5204,
    lng: 73.8567,
    address: ''
  });

  const [slotDateInput, setSlotDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [slotCapacityInput, setSlotCapacityInput] = useState(3);

  const [liveLocations, setLiveLocations] = useState<Record<string, StaffLocation>>({});
  const simulationTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
        const bookingsData = await dbService.getPickupBookings();
        const activeOnes = bookingsData.filter(b => b.status === PickupStatus.ON_THE_WAY);
        for (const b of activeOnes) {
            const loc = await dbService.getLiveStaffTracking(b.id);
            if (loc) {
                setLiveLocations(prev => ({ ...prev, [b.id]: loc }));
            }
        }
        setBookings(bookingsData);
    }, 5000);
    return () => {
        clearInterval(interval);
        Object.values(simulationTimers.current).forEach(t => clearInterval(t));
    };
  }, []);

  useEffect(() => {
    dbService.getSlotsByDate(bookingForm.date).then(slots => {
      setAvailableSlots(slots);
      if (slots.length > 0) {
        const open = slots.find(s => s.bookedCount < s.capacity);
        if (open) {
          setBookingForm(prev => ({ ...prev, slotId: open.id, timeRange: open.timeRange }));
        }
      } else {
        setBookingForm(prev => ({ ...prev, slotId: '', timeRange: '' }));
      }
    });
  }, [bookingForm.date, isBookingModalOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custData, bookData, staffData, invData, compData] = await Promise.all([
        dbService.getCustomers(),
        dbService.getPickupBookings(),
        dbService.getSalesmen(),
        dbService.getInvoices(),
        dbService.getComplaints()
      ]);
      setCustomers(custData);
      setBookings(bookData);
      setSalesmen(staffData);
      setInvoices(invData);
      setComplaints(compData);
      
      staffData.forEach((s, i) => {
         dbService.updateStaffLocation({
            staffId: s.id,
            staffName: s.name,
            bookingId: 'IDLE',
            lat: 18.5204 + (i * 0.005),
            lng: 73.8567 + (i * 0.005),
            lastUpdated: new Date().toISOString()
         });
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDevice = () => {
    setLinkingDevice(true);
    setTimeout(() => {
      const newStatus = { connected: true, lastSeen: new Date().toISOString(), deviceName: 'Admin Main iPhone' };
      setWaStatus(newStatus);
      dbService.setWADeviceStatus(newStatus);
      setLinkingDevice(false);
    }, 3000);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === bookingForm.customerId);
    if (!cust) return;

    if (bookingForm.slotId) {
      const slot = availableSlots.find(s => s.id === bookingForm.slotId);
      if (slot && slot.bookedCount >= slot.capacity) {
        alert("This slot is already full. Please select another time.");
        return;
      }
    }

    await dbService.addPickupBooking({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      bikeNumber: cust.bikeNumber,
      date: bookingForm.date,
      slotId: bookingForm.slotId,
      timeRange: bookingForm.timeRange,
      location: { lat: bookingForm.lat, lng: bookingForm.lng, address: bookingForm.address }
    });
    
    setIsBookingModalOpen(false);
    setRawLocationText('');
    loadData();
  };

  const updateStatus = async (id: string, status: PickupStatus, staffId?: string, staffName?: string) => {
    await dbService.updatePickupStatus(id, status, staffId, staffName);
    if (status === PickupStatus.ON_THE_WAY) {
        const booking = bookings.find(b => b.id === id);
        if (booking) {
            const lastLoc = liveLocations[`IDLE_${booking.staffId}`] || { lat: booking.location.lat - 0.01, lng: booking.location.lng - 0.01 };
            let currentLat = lastLoc.lat;
            let currentLng = lastLoc.lng;
            const timer = setInterval(() => {
                currentLat += (booking.location.lat - currentLat) * 0.15;
                currentLng += (booking.location.lng - currentLng) * 0.15;
                dbService.updateStaffLocation({
                    staffId: booking.staffId || 'SYS',
                    staffName: booking.staffName || 'Staff',
                    bookingId: id,
                    lat: currentLat,
                    lng: currentLng,
                    lastUpdated: new Date().toISOString()
                });
            }, 5000);
            simulationTimers.current[id] = timer;
        }
    } else if (status === PickupStatus.PICKED_UP || status === PickupStatus.DELIVERED || status === PickupStatus.CANCELLED) {
        if (simulationTimers.current[id]) {
            clearInterval(simulationTimers.current[id]);
            delete simulationTimers.current[id];
        }
        const booking = bookings.find(b => b.id === id);
        if (booking) {
            setLiveLocations(prev => {
                const n = { ...prev };
                delete n[id];
                return n;
            });
        }
    }
    loadData();
  };

  const handleShareBill = (inv: Invoice) => {
    const customer = customers.find(c => c.name === inv.customerName || c.bikeNumber === inv.bikeNumber);
    const phone = customer?.phone || '';
    const message = `Hi ${inv.customerName}, your bike ${inv.bikeNumber} service is complete! ✅\n\nTotal Amount: ₹${inv.finalAmount.toLocaleString()}\nStatus: ${inv.paymentStatus}\n\nYou can view your detailed bill here: [BILL-LINK]\n\nThank you for choosing Moto Gear SRK! 🏍️`;
    dbService.sendWhatsApp(phone, message);
  };

  const handleShareJobCard = (comp: Complaint) => {
    const customer = customers.find(c => c.name === comp.customerName || c.bikeNumber === comp.bikeNumber);
    const phone = customer?.phone || '';
    const message = `Hi ${comp.customerName}, a new Job Card has been opened for your bike ${comp.bikeNumber} at Moto Gear SRK. 🛠️\n\nReported Issues: ${comp.details}\nEst. Budget: ₹${comp.estimatedCost.toLocaleString()}\nStatus: ${comp.status}\n\nWe will notify you once the work is in progress. Ride safe!`;
    dbService.sendWhatsApp(phone, message);
  };

  const handleQuickSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.phone || !quickMsg.text) return;
    dbService.sendWhatsApp(quickMsg.phone, quickMsg.text);
    setQuickMsg({ ...quickMsg, text: '' });
  };

  const transactionFeed = useMemo(() => {
    const items = [
      ...invoices.map(inv => ({ type: 'BILL' as const, data: inv, date: inv.date })),
      ...complaints.map(comp => ({ type: 'JOB' as const, data: comp, date: comp.createdAt }))
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, complaints]);

  // Function to initialize slots for a specific date
  const initSlots = async () => {
    setLoading(true);
    try {
      await dbService.initSlotsForDate(slotDateInput, slotCapacityInput);
      const slots = await dbService.getSlotsByDate(bookingForm.date);
      setAvailableSlots(slots);
      setIsSlotManagerOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to initialize slots.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get distance string for a specific staff member and booking
  const getStaffDistance = (staffId: string, booking: PickupBooking): string => {
    const staffLoc = Object.values(liveLocations).find(l => l.staffId === staffId);
    if (!staffLoc) return "---";
    const dist = calculateDistance(staffLoc.lat, staffLoc.lng, booking.location.lat, booking.location.lng);
    return `${dist} km`;
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto">
      <header className="px-1 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Connect Hub</h2>
           <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${waStatus.connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {waStatus.connected ? 'WhatsApp Linked' : 'Device Not Linked'}
              </p>
           </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsSlotManagerOpen(true)} className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl active:scale-95 transition-all">
            <Clock className="w-5 h-5" />
          </button>
          <button onClick={() => setIsBookingModalOpen(true)} className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl active:scale-95 transition-all">
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mx-1 border border-slate-200">
        <TabButton active={activeTab === 'wa_connect'} onClick={() => setActiveTab('wa_connect')} icon={<Smartphone className="w-4 h-4" />} label="WA CONNECT" />
        <TabButton active={activeTab === 'dispatch'} onClick={() => setActiveTab('dispatch')} icon={<MapIcon className="w-4 h-4" />} label="LOGISTICS" />
        <TabButton active={activeTab === 'share_hub'} onClick={() => setActiveTab('share_hub')} icon={<MessageCircle className="w-4 h-4" />} label="SHARE HUB" />
      </div>

      {activeTab === 'wa_connect' && (
        <div className="space-y-6 animate-in fade-in duration-300 px-1">
           {!waStatus.connected ? (
             <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                   <QrCode className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Link Admin WhatsApp</h3>
                   <p className="text-xs text-slate-400 font-medium px-4">Link device to automate pickups and tracking alerts.</p>
                </div>
                <button onClick={handleLinkDevice} disabled={linkingDevice} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                   {linkingDevice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                   {linkingDevice ? 'Linking Device...' : 'Link Device Now'}
                </button>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                   <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                         <div>
                            <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md mb-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
                               <span className="text-[9px] font-black uppercase tracking-widest">Active Link</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">{waStatus.deviceName}</h3>
                         </div>
                         <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-emerald-200 mb-1">Signal</p>
                            <span className="text-lg font-black">Strong</span>
                         </div>
                         <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-emerald-200 mb-1">Status</p>
                            <span className="text-lg font-black">Linked</span>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="bg-white rounded-[32px] border border-slate-100 p-6">
                   <button onClick={() => setWaStatus({connected: false})} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                      <Trash2 className="w-4 h-4" /> Unlink WhatsApp Session
                   </button>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'dispatch' && (
        <div className="space-y-6 px-1 animate-in fade-in duration-300">
           <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <BarChart className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Load Balance</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {bookings.filter(b => b.status === PickupStatus.SCHEDULED || b.status === PickupStatus.ON_THE_WAY).length} Pending Tasks
                    </p>
                 </div>
              </div>
              <button onClick={() => setIsSlotManagerOpen(true)} className="text-[10px] font-black uppercase bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-slate-600">
                 Config Slots
              </button>
           </div>

           <div className="space-y-4">
              {bookings.filter(b => b.status !== PickupStatus.DELIVERED && b.status !== PickupStatus.CANCELLED).map(booking => {
                  const staffLoc = liveLocations[booking.id];
                  const dist = staffLoc ? calculateDistance(staffLoc.lat, staffLoc.lng, booking.location.lat, booking.location.lng) : null;
                  return (
                    <div key={booking.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-4 group transition-all hover:border-blue-200">
                       <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                                  booking.status === PickupStatus.ON_THE_WAY ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' : 
                                  booking.status === PickupStatus.PICKED_UP ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>{booking.status}</span>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-1">{booking.bikeNumber}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{booking.customerName} • {booking.timeRange}</p>
                             </div>
                             {dist !== null && (
                                <div className="text-right">
                                   <p className="text-xl font-black text-blue-600 tracking-tighter">{dist} km</p>
                                   <p className="text-[8px] font-black text-slate-300 uppercase">Live Tracking</p>
                                </div>
                             )}
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 mb-4">
                             <MapPin className="w-4 h-4 text-slate-400" />
                             <p className="text-[10px] font-bold text-slate-500 truncate">{booking.location.address}</p>
                          </div>
                          <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                             {!booking.staffId ? (
                                <button onClick={() => { setSelectedBookingForAssign(booking); setIsAssignmentModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                   <Users className="w-4 h-4" /> Assign Staff
                                </button>
                             ) : (
                                <div className="flex-1 flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">{booking.staffName?.charAt(0)}</div>
                                      <p className="text-[11px] font-black uppercase text-slate-900">{booking.staffName}</p>
                                   </div>
                                   <button onClick={() => { setSelectedBookingForAssign(booking); setIsAssignmentModalOpen(true); }} className="p-2 text-slate-300"><RefreshCw className="w-4 h-4" /></button>
                                </div>
                             )}
                             <div className="flex gap-2">
                                {booking.status === PickupStatus.SCHEDULED && booking.staffId && (
                                   <button onClick={() => updateStatus(booking.id, PickupStatus.ON_THE_WAY)} className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Dispatch</button>
                                )}
                                {booking.status === PickupStatus.ON_THE_WAY && (
                                   <button onClick={() => updateStatus(booking.id, PickupStatus.PICKED_UP)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Picked Up</button>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  );
              })}
           </div>
        </div>
      )}

      {activeTab === 'share_hub' && (
        <div className="space-y-6 px-1 animate-in fade-in duration-300">
           {/* Unified Send Center */}
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                       <Zap className="w-5 h-5 fill-emerald-600" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-slate-900 uppercase">Instant WhatsApp Link</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">One-click customer sharing</p>
                    </div>
                 </div>
                 <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 transition-all">
                    <ExternalLink className="w-4 h-4" />
                 </button>
              </div>

              {/* Template Quick Tags */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                 <TemplateTag label="Send Bill" onClick={() => setQuickMsg({...quickMsg, text: "Hi! Your bike service bill is ready. You can pay online or at the counter. Total: ₹"}) } />
                 <TemplateTag label="Job Started" onClick={() => setQuickMsg({...quickMsg, text: "Work has started on your bike. We'll update you soon! 🛠️"}) } />
                 <TemplateTag label="Ready for Pickup" onClick={() => setQuickMsg({...quickMsg, text: "Good news! Your bike is ready for pickup. Come over anytime! 🏍️"}) } />
              </div>

              <form onSubmit={handleQuickSend} className="space-y-3">
                 <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                       type="tel" 
                       placeholder="CUSTOMER PHONE (E.G. 91234...)"
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-emerald-500/5 outline-none"
                       value={quickMsg.phone}
                       onChange={e => setQuickMsg({ ...quickMsg, phone: e.target.value })}
                    />
                 </div>
                 <textarea 
                    placeholder="TYPE MESSAGE OR SELECT TEMPLATE..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-emerald-500/5 outline-none resize-none h-24"
                    value={quickMsg.text}
                    onChange={e => setQuickMsg({ ...quickMsg, text: e.target.value })}
                 />
                 <button 
                   type="submit"
                   disabled={!quickMsg.phone || !quickMsg.text}
                   className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/10"
                 >
                    <MessageSquare className="w-4 h-4" /> Share Directly
                 </button>
              </form>
           </div>

           {/* Transaction Feed (Unified Bills & Job Cards) */}
           <div className="space-y-4">
              <div className="flex justify-between items-center ml-2">
                 <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Share Transaction Link</h4>
                 <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-blue-500 uppercase">Live Feed</span>
                 </div>
              </div>

              {transactionFeed.length === 0 ? (
                 <div className="bg-white p-12 rounded-[40px] border border-dashed border-slate-200 text-center space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transactions available to share</p>
                 </div>
              ) : (
                transactionFeed.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'BILL' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {item.type === 'BILL' ? <Receipt className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                        </div>
                        <div>
                           <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.data.customerName}</h4>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{(item.data as any).bikeNumber}</span>
                              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                              <span className="text-[10px] font-black text-slate-900">
                                ₹{item.type === 'BILL' ? (item.data as Invoice).finalAmount.toLocaleString() : (item.data as Complaint).estimatedCost.toLocaleString()}
                              </span>
                           </div>
                        </div>
                     </div>
                     <button 
                       onClick={() => item.type === 'BILL' ? handleShareBill(item.data as Invoice) : handleShareJobCard(item.data as Complaint)}
                       className={`p-3 rounded-2xl transition-all active:scale-90 ${item.type === 'BILL' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}
                     >
                        <Share2 className="w-5 h-5" />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Slot Manager Modal */}
      {isSlotManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Create Daily Slots</h3>
                 <button onClick={() => setIsSlotManagerOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                    <input type="date" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700" value={slotDateInput} onChange={e => setSlotDateInput(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Availability (Bikes per Slot)</label>
                    <div className="flex gap-4 items-center">
                       <input type="range" min="1" max="10" className="flex-1" value={slotCapacityInput} onChange={e => setSlotCapacityInput(parseInt(e.target.value))} />
                       <span className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">{slotCapacityInput}</span>
                    </div>
                 </div>
                 <button onClick={initSlots} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">Initialize Windows</button>
              </div>
           </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && selectedBookingForAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Assign Nearest Staff</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target: {selectedBookingForAssign.bikeNumber}</p>
                 </div>
                 <button onClick={() => setIsAssignmentModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                 {salesmen.map(staff => {
                    const isBusy = salesmen.some(s => s.id === staff.id && s.status === 'On Task');
                    const dist = getStaffDistance(staff.id, selectedBookingForAssign);
                    return (
                       <button key={staff.id} onClick={() => { updateStatus(selectedBookingForAssign.id, PickupStatus.SCHEDULED, staff.id, staff.name); setIsAssignmentModalOpen(false); }} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-all group active:scale-95">
                          <div className="flex items-center gap-4 text-left">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isBusy ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{staff.name.charAt(0)}</div>
                             <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{staff.name}</p>
                                <div className="flex items-center gap-2">
                                   <span className={`text-[9px] font-black uppercase ${isBusy ? 'text-amber-500' : 'text-emerald-500'}`}>{isBusy ? 'Busy' : 'Available'}</span>
                                   <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dist}</span>
                                </div>
                             </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                       </button>
                    );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Pickup</h3>
                 <button onClick={() => setIsBookingModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleBookingSubmit} className="p-8 space-y-6">
                 <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 space-y-3">
                    <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
                       <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">WhatsApp Link Fill</span>
                    </div>
                    <textarea placeholder="Paste WhatsApp Maps Link here..." className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-[10px] font-bold outline-none resize-none h-20" value={rawLocationText} onChange={e => setRawLocationText(e.target.value)} />
                    {dbService.parseLocationFromLink(rawLocationText) && (
                       <div className="flex items-center gap-2 text-emerald-600 animate-in zoom-in-95">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Coordinates Found!</span>
                       </div>
                    )}
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Customer</label>
                    <select required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-700 uppercase" value={bookingForm.customerId} onChange={e => setBookingForm({...bookingForm, customerId: e.target.value})}>
                       <option value="">Choose Customer...</option>
                       {customers.map(c => <option key={c.id} value={c.id}>{c.bikeNumber} - {c.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pickup Date</label>
                       <input type="date" required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Window</label>
                       {availableSlots.length > 0 ? (
                         <select required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700" value={bookingForm.slotId} onChange={e => {
                             const s = availableSlots.find(slot => slot.id === e.target.value);
                             setBookingForm({...bookingForm, slotId: e.target.value, timeRange: s?.timeRange || ''});
                           }}>
                            {availableSlots.map(s => (
                              <option key={s.id} value={s.id} disabled={s.bookedCount >= s.capacity}>
                                {s.timeRange} ({s.capacity - s.bookedCount} left)
                              </option>
                            ))}
                         </select>
                       ) : (
                         <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 border border-red-100">
                           <AlertTriangle className="w-4 h-4" /> Init Slots First
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                    <textarea required rows={2} placeholder="Enter customer's pickup address..." className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-700 uppercase resize-none" value={bookingForm.address} onChange={e => setBookingForm({...bookingForm, address: e.target.value})} />
                 </div>
                 <button type="submit" disabled={!bookingForm.slotId} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                    Confirm Dispatch Request
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
    {icon} {label}
  </button>
);

const TemplateTag: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
  <button 
    type="button"
    onClick={onClick}
    className="whitespace-nowrap px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all active:scale-95"
  >
    {label}
  </button>
);

export default ConnectPage;
