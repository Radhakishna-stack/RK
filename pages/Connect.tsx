import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MessageCircle, QrCode, Smartphone, Map as MapIcon, Link2, Loader2, Calendar, 
  Trash2, MapPin, Zap, CheckCircle2, X, Navigation, RefreshCw, Send, ShieldCheck,
  Users, ChevronRight, Info, AlertTriangle, Settings2, Clock, Check, BarChart,
  Receipt, Share2, ExternalLink, Phone, ArrowRight, User, ClipboardList,
  MessageSquare, LayoutGrid, Clock3, GripVertical, Star, Truck, Route,
  Sparkles, Wand2, Search, AlertCircle
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

// New Styled Mini Map Component for the dispatch list
const MiniMapPreview: React.FC<{ dist: number | null, staffName?: string }> = ({ dist, staffName }) => {
  // progress is 0 at center/start, 100 at destination. 
  // We assume a 5km max radius for stylized tracking progress.
  const progress = dist ? Math.min(90, Math.max(10, 100 - (dist / 5) * 100)) : 10;
  
  return (
    <div className="relative h-28 bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 mt-4 group">
       {/* Animated Grid Background */}
       <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
       
       {/* Origin Icon (Center) */}
       <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
             <LayoutGrid className="w-4 h-4 text-slate-400" />
          </div>
       </div>

       {/* Route Path Line */}
       <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line x1="12%" y1="50%" x2="88%" y2="50%" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="12%" y1="50%" x2={`${progress}%`} y2="50%" stroke="#3B82F6" strokeWidth="2" className="transition-all duration-1000" />
       </svg>

       {/* Staff Icon (Moving) */}
       <div 
         className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-10"
         style={{ left: `${progress}%` }}
       >
          <div className="relative -translate-x-1/2 flex flex-col items-center">
             <div className="bg-white px-2 py-0.5 rounded-lg shadow-xl border border-blue-100 mb-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <span className="text-[8px] font-black text-blue-600 uppercase">{staffName || 'Tech'}</span>
             </div>
             <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <Truck className="w-5 h-5 text-white" />
             </div>
             <div className="absolute -inset-1 bg-blue-400/30 rounded-full animate-ping"></div>
          </div>
       </div>

       {/* Destination Icon */}
       <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <div className="relative flex flex-col items-center">
             <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-4 h-4 text-red-500" />
             </div>
          </div>
       </div>

       {/* Floating Stats */}
       <div className="absolute bottom-2 right-4 flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1.5 shadow-sm">
             <Clock className="w-3 h-3 text-blue-500" />
             <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">ETA: {dist ? Math.ceil(dist * 4) : '--'}m</span>
          </div>
       </div>
    </div>
  );
};

const ConnectPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<PickupBooking[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wa_connect' | 'dispatch' | 'share_hub'>('wa_connect');
  
  const [waStatus, setWaStatus] = useState(dbService.getWADeviceStatus());
  const [linkingDevice, setLinkingDevice] = useState(false);
  
  const [trackingBooking, setTrackingBooking] = useState<PickupBooking | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSlotManagerOpen, setIsSlotManagerOpen] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<PickupBooking | null>(null);
  const [rawLocationText, setRawLocationText] = useState('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  
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

  const loadData = useCallback(async () => {
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
        const bookingsData = await dbService.getPickupBookings();
        const activeOnes = bookingsData.filter(item => item.status === PickupStatus.ON_THE_WAY || item.status === PickupStatus.DELIVERING);
        const newLocs: Record<string, StaffLocation> = {};
        for (const activeBooking of activeOnes) {
            const loc = await dbService.getLiveStaffTracking(activeBooking.id);
            if (loc) {
                newLocs[activeBooking.id] = loc;
            }
        }
        setLiveLocations(newLocs);
        setBookings(bookingsData);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

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

  // Handle automatic coordinate extraction
  useEffect(() => {
    if (!rawLocationText) return;
    const extracted = dbService.parseLocationFromLink(rawLocationText);
    if (extracted) {
      setBookingForm(prev => ({
        ...prev,
        lat: extracted.lat,
        lng: extracted.lng,
        address: prev.address || textToAddress(rawLocationText)
      }));
      setResolveError(null);
    }
  }, [rawLocationText]);

  const handleAIResolve = async () => {
    if (!rawLocationText) return;
    setIsResolvingLocation(true);
    setResolveError(null);
    try {
      const resolved: any = await dbService.resolveLocationViaAI(rawLocationText);
      if (resolved?.error === 'QUOTA_EXCEEDED') {
        setResolveError("AI Rate Limit Reached. Please click the link, and copy the full URL from your browser's address bar to continue.");
      } else if (resolved && 'lat' in resolved) {
        setBookingForm(prev => ({
          ...prev,
          lat: resolved.lat,
          lng: resolved.lng,
          address: resolved.address.toUpperCase()
        }));
      } else {
        setResolveError("AI could not parse this link. Try pasting the full browser URL.");
      }
    } catch (e) {
      setResolveError("Neural core is busy. Use the full Google Maps URL.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const textToAddress = (text: string) => {
    try {
      const placeMatch = text.match(/\/place\/([^\/]+)/);
      if (placeMatch) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).toUpperCase();
      }
    } catch (e) {}
    return '';
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
    setResolveError(null);
    loadData();
  };

  const updateStatus = async (id: string, status: PickupStatus, staffId?: string, staffName?: string) => {
    await dbService.updatePickupStatus(id, status, staffId, staffName);
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

  const isShortLink = (url: string) => url.includes('goo.gl') || url.includes('maps.app');

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
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
                  const isTracking = booking.status === PickupStatus.ON_THE_WAY || booking.status === PickupStatus.DELIVERING;
                  
                  return (
                    <div key={booking.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-4 group transition-all hover:border-blue-200">
                       <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                                  booking.status === PickupStatus.ON_THE_WAY ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' : 
                                  booking.status === PickupStatus.PICKED_UP ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>{booking.status}</span>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-1">{booking.bikeNumber}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{booking.customerName} • {booking.timeRange}</p>
                             </div>
                             {isTracking && (
                                <button 
                                  onClick={() => setTrackingBooking(booking)}
                                  className="flex flex-col items-end gap-1 group/track"
                                >
                                   <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full text-white animate-pulse">
                                      <Navigation className="w-3 h-3 fill-white" />
                                      <span className="text-[9px] font-black uppercase">Full Screen Track</span>
                                   </div>
                                   {dist !== null && <p className="text-[10px] font-black text-slate-400 group-hover/track:text-blue-600">{dist} km away</p>}
                                </button>
                             )}
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 mb-4">
                             <MapPin className="w-4 h-4 text-slate-400" />
                             <p className="text-[10px] font-bold text-slate-500 truncate">{booking.location.address}</p>
                          </div>

                          {/* New Enhanced Logistics Inline Mini Map */}
                          {isTracking && (
                            <div className="mb-4 animate-in slide-in-from-top-2 duration-500">
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                     <Route className="w-3.5 h-3.5 text-blue-600" />
                                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Mini-Map</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                     <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Proximity Active</span>
                                  </div>
                               </div>
                               <MiniMapPreview dist={dist} staffName={booking.staffName} />
                               <div className="mt-3 grid grid-cols-2 gap-3">
                                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                                     <Smartphone className="w-4 h-4 text-slate-400" />
                                     <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Signal Status</p>
                                        <p className="text-[10px] font-bold text-slate-700 uppercase">Technician Live</p>
                                     </div>
                                  </div>
                                  <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                                     <Clock3 className="w-4 h-4 text-blue-500" />
                                     <div>
                                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-tighter leading-none mb-1">Estimated Arrival</p>
                                        <p className="text-[10px] font-bold text-blue-900 uppercase">{dist ? Math.ceil(dist * 4) : '--'} Minutes</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                             {!booking.staffId ? (
                                <button onClick={() => { setSelectedBookingForAssign(booking); setIsAssignmentModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                   <Users className="w-4 h-4" /> Assign Staff
                                </button>
                             ) : (
                                <div className="flex-1 flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">{booking.staffName?.charAt(0)}</div>
                                      <div>
                                         <p className="text-[11px] font-black uppercase text-slate-900">{booking.staffName}</p>
                                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{booking.status === PickupStatus.SCHEDULED ? 'Awaiting Dispatch' : 'On Active Duty'}</p>
                                      </div>
                                   </div>
                                   <button onClick={() => { setSelectedBookingForAssign(booking); setIsAssignmentModalOpen(true); }} className="p-3 bg-slate-50 rounded-xl text-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-all active:scale-90">
                                      <RefreshCw className="w-4 h-4" />
                                   </button>
                                </div>
                             )}
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

      {/* Full Screen Live Tracker Modal */}
      {trackingBooking && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-in slide-in-from-bottom-full duration-500">
           <div className="p-6 flex items-center justify-between bg-white border-b border-slate-100 z-20">
              <button onClick={() => setTrackingBooking(null)} className="p-3 bg-slate-50 rounded-2xl active:scale-90 transition-all"><X className="w-6 h-6 text-slate-900" /></button>
              <div className="flex flex-col items-center">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">Full Screen Dispatch Monitor</h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-0.5">{trackingBooking.bikeNumber} • {trackingBooking.customerName}</p>
              </div>
              <div className="w-12"></div>
           </div>

           <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
              
              <div className="relative w-full h-full max-w-md">
                 {liveLocations[trackingBooking.id] && (
                   <div className="absolute transition-all duration-[4000ms] ease-linear" style={{
                      left: '45%',
                      top: '40%'
                   }}>
                      <div className="relative flex flex-col items-center">
                         <div className="bg-white px-3 py-1.5 rounded-full shadow-2xl border border-blue-100 mb-2 whitespace-nowrap animate-bounce">
                            <span className="text-[10px] font-black text-blue-600 uppercase">{trackingBooking.staffName} is in transit</span>
                         </div>
                         <div className="w-14 h-14 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                            <Truck className="w-7 h-7 text-white" />
                         </div>
                         <div className="w-6 h-6 bg-blue-600/30 rounded-full absolute bottom-[-4px] animate-ping"></div>
                      </div>
                   </div>
                 )}

                 <div className="absolute" style={{ left: '60%', top: '65%' }}>
                    <div className="flex flex-col items-center">
                       <div className="w-12 h-12 bg-slate-900 rounded-[18px] border-4 border-white shadow-2xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                       </div>
                       <div className="mt-2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Destination</div>
                    </div>
                 </div>

                 <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <path d="M 180 320 Q 240 400 240 520" stroke="blue" strokeWidth="4" fill="none" strokeDasharray="8 8" />
                 </svg>
              </div>

              <div className="absolute top-6 left-6 right-6 p-5 bg-white/90 backdrop-blur-md rounded-[32px] border border-white/20 shadow-2xl space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <Clock3 className="w-6 h-6 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Arrival</p>
                          <h4 className="text-xl font-black text-slate-900 leading-none">{liveLocations[trackingBooking.id] ? Math.ceil(calculateDistance(liveLocations[trackingBooking.id].lat, liveLocations[trackingBooking.id].lng, trackingBooking.location.lat, trackingBooking.location.lng) * 4) : '6-8'} Minutes</h4>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proximity</p>
                       <h4 className="text-xl font-black text-blue-600 leading-none">
                          {liveLocations[trackingBooking.id] ? calculateDistance(liveLocations[trackingBooking.id].lat, liveLocations[trackingBooking.id].lng, trackingBooking.location.lat, trackingBooking.location.lng) : '--'} km
                       </h4>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-white border-t border-slate-100 rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-10 space-y-8">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-2"></div>
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-[28px] overflow-hidden border-2 border-slate-50">
                       <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{trackingBooking.staffName}</h4>
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                             <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                             <span className="text-[9px] font-black text-amber-600">4.9</span>
                          </div>
                       </div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{trackingBooking.bikeNumber} • Dispatch Monitoring</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <a href={`tel:${trackingBooking.customerPhone}`} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm active:scale-95 transition-all border border-emerald-100"><Phone className="w-6 h-6" /></a>
                    <button onClick={() => dbService.sendWhatsApp(trackingBooking.customerPhone, "Hi, checking on your pickup progress.")} className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm active:scale-95 transition-all border border-blue-100"><MessageCircle className="w-6 h-6" /></button>
                 </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                       <MapPin className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup Location</p>
                       <p className="text-sm font-bold text-slate-700 leading-tight">{trackingBooking.location.address}</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setTrackingBooking(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-2xl"
              >
                 Return to Terminal
              </button>
           </div>
        </div>
      )}

      {/* Slot Manager Modal */}
      {isSlotManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Create Daily Slots</h3>
                 <button onClick={() => setIsSlotManagerOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
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
                 <button onClick={() => setIsAssignmentModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                 {salesmen.map(staff => {
                    const isBusy = salesmen.some(s => s.id === staff.id && s.status === 'On Task');
                    return (
                       <button key={staff.id} onClick={() => { updateStatus(selectedBookingForAssign.id, PickupStatus.SCHEDULED, staff.id, staff.name); setIsAssignmentModalOpen(false); }} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-all group active:scale-95">
                          <div className="flex items-center gap-4 text-left">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isBusy ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{staff.name.charAt(0)}</div>
                             <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{staff.name}</p>
                                <div className="flex items-center gap-2">
                                   <span className={`text-[9px] font-black uppercase ${isBusy ? 'text-amber-500' : 'text-emerald-500'}`}>{isBusy ? 'Busy' : 'Available'}</span>
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
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
                          <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">WhatsApp Link Fill</span>
                       </div>
                       {dbService.parseLocationFromLink(rawLocationText) && (
                          <div className="flex items-center gap-1 text-emerald-600 animate-in zoom-in-95">
                             <CheckCircle2 className="w-3 h-3" />
                             <span className="text-[8px] font-black uppercase tracking-widest">GPS Locked</span>
                          </div>
                       )}
                    </div>
                    <div className="space-y-3">
                       <textarea 
                         placeholder="Paste WhatsApp Maps Link here..." 
                         className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-[10px] font-bold outline-none resize-none h-20 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                         value={rawLocationText} 
                         onChange={e => setRawLocationText(e.target.value)} 
                       />
                       
                       {isShortLink(rawLocationText) && !dbService.parseLocationFromLink(rawLocationText) && (
                          <button 
                            type="button"
                            onClick={handleAIResolve}
                            disabled={isResolvingLocation}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                          >
                             {isResolvingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                             Smart Neural Resolve
                          </button>
                       )}

                       {resolveError && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                             <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                             <div>
                                <p className="text-[10px] font-black text-red-900 uppercase leading-none mb-1">Resolution Protocol Warning</p>
                                <p className="text-[9px] text-red-600 font-medium leading-relaxed">{resolveError}</p>
                             </div>
                          </div>
                       )}
                    </div>

                    {dbService.parseLocationFromLink(rawLocationText) && (
                       <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"><Navigation className="w-4 h-4 fill-emerald-600" /></div>
                             <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">GPS Lock Established</p>
                                <p className="text-[10px] font-bold text-emerald-700">{bookingForm.lat.toFixed(4)}, {bookingForm.lng.toFixed(4)}</p>
                             </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
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

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }> = ({ active, onClick, icon, label, badge }) => (
  <button onClick={onClick} className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-2 relative ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
    {icon} {label}
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        {badge}
      </span>
    )}
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