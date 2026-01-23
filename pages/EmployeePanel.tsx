
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Hammer, Play, CheckCircle, CheckCircle2, Package, Clock, 
  ChevronRight, ArrowRight, Star, Settings, 
  Zap, Search, Bike, ClipboardList, RefreshCcw,
  Navigation, MapPin, Map as MapIcon, X, LocateFixed,
  Phone, ExternalLink, Compass, ShieldCheck,
  Truck, ArrowUpRight, History, Ban, FileText,
  Activity, Radio, PlayCircle, Wrench, MoreVertical,
  AlertCircle, BellRing, Check, MessageCircle, UserCheck, Users, RefreshCw,
  Grip, Navigation2, MoveUp, MoveUpRight, MoveUpLeft, Flag, MapPinOff,
  Timer, Gauge, TimerReset
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, PickupBooking, PickupStatus, StaffLocation, Salesman } from '../types';
import L from 'leaflet';

interface EmployeePanelProps {
  onNavigate: (tab: string, query?: string) => void;
  userRole: string;
}

// --- Interactive Map Component ---
const InteractiveLogisticsMap: React.FC<{
  technicianPos: { lat: number, lng: number } | null;
  destinationPos: { lat: number, lng: number };
  onClose: () => void;
}> = ({ technicianPos, destinationPos, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const techMarker = useRef<L.Marker | null>(null);
  const destMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([destinationPos.lat, destinationPos.lng], 15);

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    // Destination Marker (Red)
    const destIcon = L.divIcon({
      html: `<div class="bg-slate-900 border-4 border-white shadow-xl rounded-2xl w-10 h-10 flex items-center justify-center text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    destMarker.current = L.marker([destinationPos.lat, destinationPos.lng], { icon: destIcon }).addTo(leafletMap.current);

    return () => {
      leafletMap.current?.remove();
    };
  }, []);

  // Update Technician Position & Route
  useEffect(() => {
    if (!leafletMap.current || !technicianPos) return;

    const techIcon = L.divIcon({
      html: `<div class="leaflet-marker-pulse w-10 h-10 flex items-center justify-center border-4 border-white shadow-2xl rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18 3.5 4.5a2 2 0 0 1 2-2.3l14 .7a2 2 0 0 1 1.9 2.7L19 18H5ZM5 18l-2 3M19 18l2 3M12 18v3"/></svg></div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (techMarker.current) {
      techMarker.current.setLatLng([technicianPos.lat, technicianPos.lng]);
    } else {
      techMarker.current = L.marker([technicianPos.lat, technicianPos.lng], { icon: techIcon }).addTo(leafletMap.current);
    }

    // Draw/Update Route
    const points: [number, number][] = [
      [technicianPos.lat, technicianPos.lng],
      [destinationPos.lat, destinationPos.lng]
    ];

    if (routeLine.current) {
      routeLine.current.setLatLngs(points);
    } else {
      routeLine.current = L.polyline(points, { 
        color: '#3b82f6', 
        weight: 6, 
        opacity: 0.6,
        dashArray: '10, 15' 
      }).addTo(leafletMap.current);
    }

    // Auto-center view to encompass both points
    const bounds = L.latLngBounds(points);
    leafletMap.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });

  }, [technicianPos]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full bg-slate-100 z-0" />
      
      {/* Zoom Controls HUD */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
         <button onClick={() => leafletMap.current?.zoomIn()} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center font-black text-slate-800 text-xl border border-slate-100 active:scale-90 transition-all">+</button>
         <button onClick={() => leafletMap.current?.zoomOut()} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center font-black text-slate-800 text-xl border border-slate-100 active:scale-90 transition-all">-</button>
      </div>

      {/* Recenter HUD */}
      <button 
        onClick={() => technicianPos && leafletMap.current?.setView([technicianPos.lat, technicianPos.lng], 17)}
        className="absolute left-6 bottom-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all z-10 border-4 border-white"
      >
        <LocateFixed className="w-7 h-7" />
      </button>
    </div>
  );
};

const EmployeePanel: React.FC<EmployeePanelProps> = ({ onNavigate, userRole }) => {
  const [activeTab, setActiveTab] = useState<'workshop' | 'logistics' | 'history'>('workshop');
  const [workshopJobs, setWorkshopJobs] = useState<Complaint[]>([]);
  const [logisticsJobs, setLogisticsJobs] = useState<PickupBooking[]>([]);
  const [historyJobs, setHistoryJobs] = useState<Complaint[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [stats, setStats] = useState({ pending: 0, completedToday: 0, inProgress: 0 });
  const [newJobAlert, setNewJobAlert] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Navigation State
  const [activeNavigation, setActiveNavigation] = useState<PickupBooking | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);

  // Tracking Refs
  const watchIdRef = useRef<number | null>(null);
  const lastJobCount = useRef(0);
  const syncInterval = useRef<any>(null);

  // Reassignment State
  const [selectedBookingForReassign, setSelectedBookingForReassign] = useState<PickupBooking | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  // Helper to calculate distance between two coordinates in KM
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(2));
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const [compData, pickupData, staffData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getPickupBookings(),
        dbService.getSalesmen()
      ]);

      const workshop = compData.filter(c => c.status === ComplaintStatus.PENDING || c.status === ComplaintStatus.IN_PROGRESS);
      const history = compData.filter(c => c.status === ComplaintStatus.COMPLETED || c.status === ComplaintStatus.CANCELLED);
      const pendingCount = compData.filter(c => c.status === ComplaintStatus.PENDING).length;
      const inProgressCount = compData.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length;
      
      const logistics = pickupData.filter(b => 
        b.status === PickupStatus.SCHEDULED || 
        b.status === PickupStatus.ON_THE_WAY || 
        b.status === PickupStatus.PICKED_UP ||
        b.status === PickupStatus.DELIVERING
      );

      if (silent && workshop.length > lastJobCount.current && lastJobCount.current > 0) {
        setNewJobAlert(true);
        setTimeout(() => setNewJobAlert(false), 5000);
      }
      lastJobCount.current = workshop.length;

      setWorkshopJobs(workshop);
      setHistoryJobs(history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLogisticsJobs(logistics);
      setSalesmen(staffData);
      setStats({
        pending: pendingCount,
        inProgress: inProgressCount,
        completedToday: compData.filter(c => {
          const isDone = c.status === ComplaintStatus.COMPLETED;
          const isToday = new Date(c.createdAt).toDateString() === new Date().toDateString();
          return isDone && isToday;
        }).length
      });
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const startTracking = (booking: PickupBooking) => {
    if (watchIdRef.current) return;
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentCoords(newCoords);
          const dist = calculateDistance(newCoords.lat, newCoords.lng, booking.location.lat, booking.location.lng);
          setCurrentDistance(dist);
          dbService.updateStaffLocation({
            staffId: booking.staffId || 'TECH-UNKN',
            staffName: booking.staffName || 'Technician',
            bookingId: booking.id,
            lat: newCoords.lat,
            lng: newCoords.lng,
            lastUpdated: new Date().toISOString()
          });
        },
        (err) => console.error("GPS Watch Error:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    loadData();
    syncInterval.current = setInterval(() => loadData(true), 4000); 
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('mg_')) loadData(true);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
      window.removeEventListener('storage', handleStorageChange);
      stopTracking();
    };
  }, [loadData]);

  useEffect(() => {
    const activeTrackingJob = logisticsJobs.find(j => j.status === PickupStatus.ON_THE_WAY || j.status === PickupStatus.DELIVERING);
    if (activeTrackingJob) startTracking(activeTrackingJob);
    else {
      stopTracking();
      if (!activeNavigation) {
        setCurrentCoords(null);
        setCurrentDistance(0);
      }
    }
  }, [logisticsJobs, activeNavigation]);

  const handleUpdateStatus = async (id: string, status: ComplaintStatus) => {
    setWorkshopJobs(prev => prev.map(job => job.id === id ? { ...job, status } : job));
    setActiveMenuId(null);
    try {
      await dbService.updateComplaintStatus(id, status);
      loadData(true);
    } catch (err) {
      alert("Status sync failed. Retrying...");
      loadData(true);
    }
  };

  const handleUpdateLogistics = async (id: string, status: PickupStatus) => {
    setLogisticsJobs(prev => prev.map(job => job.id === id ? { ...job, status } : job));
    await dbService.updatePickupStatus(id, status);
    if (status === PickupStatus.PICKED_UP || status === PickupStatus.DELIVERED || status === PickupStatus.CANCELLED) {
      stopTracking();
      setActiveNavigation(null);
    }
    loadData(true);
  };

  const openExternalMaps = (lat: number, lng: number, address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getManeuver = () => {
    if (currentDistance < 0.2) return { icon: <Flag className="w-10 h-10" />, text: "Arriving at destination", dist: "200m" };
    if (currentDistance < 0.8) return { icon: <MoveUpRight className="w-10 h-10" />, text: "Turn Right on next junction", dist: "600m" };
    if (currentDistance < 1.5) return { icon: <MoveUpLeft className="w-10 h-10" />, text: "Slight Left in 1.2 KM", dist: "1.2km" };
    return { icon: <MoveUp className="w-10 h-10" />, text: "Continue straight", dist: "Go for 2.4 KM" };
  };

  const currentManeuver = getManeuver();

  const activeFocusJobs = useMemo(() => workshopJobs.filter(j => j.status === ComplaintStatus.IN_PROGRESS), [workshopJobs]);
  const upcomingQueueJobs = useMemo(() => workshopJobs.filter(j => j.status === ComplaintStatus.PENDING), [workshopJobs]);

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-700 relative max-w-lg mx-auto px-1">
      
      {/* Interactive Navigation HUD Overlay */}
      {activeNavigation && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-in slide-in-from-bottom-full duration-500 text-slate-900 overflow-hidden">
           {/* HUD Header */}
           <div className="p-6 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between z-20">
              <button onClick={() => setActiveNavigation(null)} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all"><X className="w-6 h-6 text-slate-900" /></button>
              <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Active Navigation</span>
                 </div>
                 <p className="text-xs font-bold text-slate-500 mt-0.5">{activeNavigation.bikeNumber} • {activeNavigation.customerName}</p>
              </div>
              <a href={`tel:${activeNavigation.customerPhone}`} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"><Phone className="w-6 h-6" /></a>
           </div>

           {/* Interactive Map Interface */}
           <div className="flex-1 relative">
              <InteractiveLogisticsMap 
                technicianPos={currentCoords}
                destinationPos={{ lat: activeNavigation.location.lat, lng: activeNavigation.location.lng }}
                onClose={() => setActiveNavigation(null)}
              />

              {/* Floating Instruction Card */}
              <div className="absolute top-6 inset-x-6 z-10 pointer-events-none">
                 <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-2xl flex items-center gap-6 border border-white/10 animate-in slide-in-from-top-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl">{currentManeuver.icon}</div>
                    <div className="flex-1">
                       <p className="text-4xl font-black tracking-tight">{currentManeuver.dist}</p>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-tight leading-tight mt-1">{currentManeuver.text}</p>
                    </div>
                 </div>
              </div>

              {/* Progress HUD Bar */}
              <div className="absolute bottom-40 inset-x-6 z-10">
                 <div className="bg-white/90 backdrop-blur-md p-4 rounded-[28px] border border-slate-100 shadow-2xl space-y-3">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Trip Progress</span>
                       <span className="text-[10px] font-black text-blue-600 uppercase">{currentDistance} KM Left</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-600 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                         style={{ width: `${Math.max(10, 100 - (currentDistance / 5) * 100)}%` }} 
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Bottom Dashboard */}
           <div className="bg-white border-t border-slate-100 p-8 rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] space-y-8 z-20">
              <div className="grid grid-cols-3 gap-4">
                 <div className="text-center">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Speed</p>
                    <p className="text-xl font-black text-slate-800">24 <span className="text-[10px]">km/h</span></p>
                 </div>
                 <div className="text-center border-x border-slate-100 px-4">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Arrival</p>
                    <p className="text-xl font-black text-blue-600">{currentDistance > 0 ? `${Math.ceil(currentDistance * 4)}m` : '--'}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Signal</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                       {[1,2,3,4].map(i => <div key={i} className={`w-1.5 h-3 rounded-full ${i <= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>)}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setActiveNavigation(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Stop Trip</button>
                 {activeNavigation.status === PickupStatus.ON_THE_WAY && (
                    <button onClick={() => handleUpdateLogistics(activeNavigation.id, PickupStatus.PICKED_UP)} className="flex-[2] py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                       <CheckCircle2 className="w-5 h-5" /> Confirm Pickup
                    </button>
                 )}
                 {activeNavigation.status === PickupStatus.DELIVERING && (
                    <button onClick={() => handleUpdateLogistics(activeNavigation.id, PickupStatus.DELIVERED)} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                       <Flag className="w-5 h-5" /> Confirm Delivery
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Main Terminal Header */}
      <header className="px-1 flex justify-between items-center py-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-slate-800 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover opacity-80" alt="tech" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Tech Terminal</h2>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Technician Active</span>
            </div>
          </div>
        </div>
        <button onClick={() => loadData()} className={`p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 active:scale-95 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
           <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Sub-Tab Nav */}
      <div className="bg-slate-100/50 p-1.5 rounded-[24px] flex gap-1 border border-slate-100 mx-1">
        <TabButton systemActive={activeTab === 'workshop'} onClick={() => setActiveTab('workshop')} icon={<Hammer className="w-4 h-4" />} label="Workshop" badge={workshopJobs.length > 0 ? workshopJobs.length : undefined} />
        <TabButton systemActive={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} icon={<Truck className="w-4 h-4" />} label="Logistics" badge={logisticsJobs.length > 0 ? logisticsJobs.length : undefined} />
        <TabButton systemActive={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4" />} label="History" />
      </div>

      {loading && !isSyncing ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-300">
           <Activity className="w-12 h-12 animate-spin text-blue-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Authenticating Terminal...</p>
        </div>
      ) : (
        <>
          {activeTab === 'workshop' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Workshop Pulse */}
              <section className="px-1 grid grid-cols-3 gap-3">
                 <PulseMetric label="Awaiting" value={stats.pending} color="text-amber-500" bgColor="bg-amber-50" icon={<ClipboardList className="w-4 h-4" />} />
                 <PulseMetric label="Active" value={stats.inProgress} color="text-blue-500" bgColor="bg-blue-50" icon={<Activity className="w-4 h-4" />} />
                 <PulseMetric label="Done Today" value={stats.completedToday} color="text-emerald-500" bgColor="bg-emerald-50" icon={<CheckCircle2 className="w-4 h-4" />} />
              </section>

              {/* CURRENT FOCUS */}
              {activeFocusJobs.length > 0 && (
                <section className="space-y-4 px-1">
                  <div className="flex items-center gap-2 mb-2">
                     <Timer className="w-4 h-4 text-blue-600" />
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Work Focus</h3>
                  </div>
                  <div className="space-y-4">
                    {activeFocusJobs.map(job => (
                      <JobCard key={job.id} job={job} onNavigate={onNavigate} onUpdateStatus={handleUpdateStatus} isFocus />
                    ))}
                  </div>
                </section>
              )}

              {/* WORKSHOP QUEUE */}
              <section className="space-y-4 px-1 pb-10">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-slate-400" />
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Workshop Queue</h3>
                   </div>
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{upcomingQueueJobs.length} Ready for Start</span>
                </div>
                {upcomingQueueJobs.length > 0 ? (
                  upcomingQueueJobs.map(job => (
                    <JobCard key={job.id} job={job} onNavigate={onNavigate} onUpdateStatus={handleUpdateStatus} />
                  ))
                ) : !activeFocusJobs.length && (
                  <div className="bg-white border-2 border-dashed border-slate-100 rounded-[32px] p-20 text-center space-y-4">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Wrench className="w-10 h-10 text-slate-200" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Queue Empty</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase">Awaiting customer arrivals</p>
                     </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'logistics' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <section className="space-y-4 px-1 pb-10">
                   {logisticsJobs.length > 0 ? logisticsJobs.map(job => (
                     <div key={job.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group">
                        <div className="p-6">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase ${job.status === PickupStatus.ON_THE_WAY || job.status === PickupStatus.DELIVERING ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{job.status}</span>
                                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mt-1">{job.bikeNumber}</h3>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.customerName}</p>
                              </div>
                              <div className="flex gap-2">
                                 <a href={`tel:${job.customerPhone}`} className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-90 transition-all border border-blue-100"><Phone className="w-5 h-5" /></a>
                                 <button onClick={() => dbService.sendWhatsApp(job.customerPhone, "Hi, I am from Moto Gear SRK. I am coming for your bike logistics request.")} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl active:scale-90 transition-all border border-emerald-100"><MessageCircle className="w-5 h-5" /></button>
                              </div>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 mb-6 gap-2">
                              <div className="flex items-center gap-3 overflow-hidden"><MapPin className="w-5 h-5 text-blue-500 shrink-0" /><p className="text-[11px] font-bold text-slate-600 truncate">{job.location.address}</p></div>
                              <button onClick={() => openExternalMaps(job.location.lat, job.location.lng, job.location.address)} className="bg-white p-2 rounded-lg border border-slate-200 text-blue-600 shadow-sm active:scale-90 transition-all shrink-0"><ExternalLink className="w-4 h-4" /></button>
                           </div>
                           <div className="flex gap-3">
                              <button 
                                onClick={() => setActiveNavigation(job)} 
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95"
                              > 
                                <MapIcon className="w-4 h-4 fill-white" /> In-App Nav 
                              </button>
                              {job.status === PickupStatus.SCHEDULED && (
                                <button onClick={() => handleUpdateLogistics(job.id, PickupStatus.ON_THE_WAY)} className="bg-slate-900 text-white px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Start Pickup</button>
                              )}
                              {job.status === PickupStatus.PICKED_UP && (
                                <button onClick={() => handleUpdateLogistics(job.id, PickupStatus.AT_CENTER)} className="bg-slate-900 text-white px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">At Center</button>
                              )}
                           </div>
                        </div>
                     </div>
                   )) : (
                     <div className="bg-white border-2 border-dashed border-slate-100 rounded-[32px] p-20 text-center space-y-4">
                        <Truck className="w-12 h-12 text-slate-200 mx-auto" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Logistics</p>
                     </div>
                   )}
                </section>
             </div>
          )}

          {activeTab === 'history' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 px-1 pb-20">
                {historyJobs.length > 0 ? historyJobs.map(job => (
                  <div key={job.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${job.status === ComplaintStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                           {job.status === ComplaintStatus.COMPLETED ? <CheckCircle className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{job.bikeNumber}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{job.customerName} • {new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-slate-200" />
                  </div>
                )) : (
                  <div className="bg-white border-2 border-dashed border-slate-100 rounded-[32px] p-20 text-center space-y-4">
                     <History className="w-12 h-12 text-slate-200 mx-auto" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History is Empty</p>
                  </div>
                )}
             </div>
          )}
        </>
      )}

      {/* Real-time Status Footer HUD */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] no-print">
         <div className="bg-slate-900/90 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/5 shadow-2xl flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`}></div>
               <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">{isSyncing ? 'Polling' : 'Sync OK'}</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-center gap-4">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Tasks: {workshopJobs.length}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">E: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const TabButton: React.FC<{ systemActive: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }> = ({ systemActive, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative ${
      systemActive ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'
    }`}
  >
    {icon} {label}
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        {badge}
      </span>
    )}
  </button>
);

const PulseMetric: React.FC<{ label: string, value: number, color: string, bgColor: string, icon: React.ReactNode }> = ({ label, value, color, bgColor, icon }) => (
  <div className={`p-4 rounded-[28px] border border-slate-100 bg-white shadow-sm flex flex-col items-center gap-1`}>
     <div className={`w-8 h-8 rounded-xl ${bgColor} ${color} flex items-center justify-center mb-1`}>{icon}</div>
     <p className={`text-xl font-black ${color} tracking-tighter`}>{value}</p>
     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

const JobCard: React.FC<{ job: Complaint, onNavigate: any, onUpdateStatus: any, isFocus?: boolean }> = ({ job, onNavigate, onUpdateStatus, isFocus }) => {
  const isPending = job.status === ComplaintStatus.PENDING;
  const isInProgress = job.status === ComplaintStatus.IN_PROGRESS;
  const timeInSystem = useMemo(() => {
     const start = new Date(job.createdAt).getTime();
     const now = new Date().getTime();
     const diffHrs = Math.floor((now - start) / (1000 * 60 * 60));
     const diffMins = Math.floor((now - start) / (1000 * 60)) % 60;
     return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  }, [job.createdAt]);

  return (
    <div className={`bg-white rounded-[32px] border ${isFocus ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-xl' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all group relative`}>
      {isFocus && (
        <div className="absolute top-0 right-0 p-3">
           <div className="bg-blue-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
              <Activity className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase">Live Task</span>
           </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-slate-50 ${isFocus ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{job.bikeNumber}</h4>
                 {isFocus && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.customerName}</p>
                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                <p className="text-[9px] font-black text-blue-600 flex items-center gap-1 uppercase">
                   <Timer className="w-3 h-3" /> {timeInSystem} In
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${isPending ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {job.status}
             </div>
             {job.odometerReading && (
               <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                  <Gauge className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase">{job.odometerReading.toLocaleString()} KM</span>
               </div>
             )}
          </div>
        </div>

        {/* Process Roadmap */}
        <div className="mb-6 grid grid-cols-4 gap-2">
           <ProcessStep label="Intake" active={true} complete={true} />
           <ProcessStep label="Repair" active={isInProgress} complete={false} />
           <ProcessStep label="Test" active={false} complete={false} />
           <ProcessStep label="Ready" active={false} complete={false} />
        </div>

        <div className="mb-6 bg-slate-50 p-5 rounded-[24px] border border-slate-100/50 relative overflow-hidden group-hover:bg-slate-100/50 transition-colors">
           <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Report</span>
           </div>
           <p className="text-sm font-bold text-slate-700 leading-relaxed italic line-clamp-2 italic">
             "{job.details}"
           </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
           {isPending ? (
             <button 
               onClick={() => onUpdateStatus(job.id, ComplaintStatus.IN_PROGRESS)}
               className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
             >
               <PlayCircle className="w-4 h-4" /> Start Repair
             </button>
           ) : (
             <button 
               onClick={() => { if(window.confirm("Complete Service & Mark for Delivery?")) onUpdateStatus(job.id, ComplaintStatus.COMPLETED); }}
               className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
             >
               <CheckCircle className="w-4 h-4" /> Mark Done
             </button>
           )}
           <button 
             onClick={() => onNavigate('items', job.details.split(' ')[0])}
             className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
             <Package className="w-4 h-4" /> Source Parts
           </button>
        </div>
      </div>
    </div>
  );
};

const ProcessStep: React.FC<{ label: string, active: boolean, complete: boolean }> = ({ label, active, complete }) => (
  <div className="flex flex-col items-center gap-1.5">
     <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${
        complete ? 'bg-emerald-500' : active ? 'bg-blue-500 animate-pulse' : 'bg-slate-100'
     }`}></div>
     <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${
        complete ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-slate-300'
     }`}>{label}</span>
  </div>
);

export default EmployeePanel;
