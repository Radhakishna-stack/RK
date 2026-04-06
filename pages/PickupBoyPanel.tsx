import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Truck, Navigation, CheckCircle2, Phone, MapPin, Package,
  ChevronRight, ArrowLeft, Clock, AlertCircle, Bike, RefreshCw,
  Home as HomeIcon
} from 'lucide-react';
import { dbService } from '../db';
import { PickupRequest, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getCurrentUser } from '../auth';

interface PickupBoyPanelProps {
  onNavigate?: (path: string) => void;
}

function elapsedLabel(isoDate: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_FLOW: Record<string, { next: PickupStatus; label: string; icon: React.ReactNode; color: string }> = {
  'Assigned': { next: 'Accepted', label: 'Accept Pickup', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' },
  'Pending': { next: 'Accepted', label: 'Accept Pickup', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' },
  'Accepted': { next: 'En Route', label: 'Start Journey', icon: <Navigation className="w-5 h-5" />, color: 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' },
  'En Route': { next: 'At Pickup', label: 'Arrived at Location', icon: <MapPin className="w-5 h-5" />, color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' },
  'At Pickup': { next: 'Picked Up', label: 'Bike Picked Up', icon: <Package className="w-5 h-5" />, color: 'bg-teal-600 hover:bg-teal-700 shadow-teal-200' },
  'In Transit': { next: 'Picked Up', label: 'Bike Picked Up', icon: <Package className="w-5 h-5" />, color: 'bg-teal-600 hover:bg-teal-700 shadow-teal-200' },
  'Picked Up': { next: 'Delivered', label: 'Delivered ✓', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-green-600 hover:bg-green-700 shadow-green-200' },
};

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
  'Accepted': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'En Route': 'bg-orange-100 text-orange-800 border-orange-200',
  'At Pickup': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'In Transit': 'bg-purple-100 text-purple-800 border-purple-200',
  'Picked Up': 'bg-green-100 text-green-800 border-green-200',
  'Delivered': 'bg-slate-100 text-slate-700 border-slate-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};

const PickupBoyPanel: React.FC<PickupBoyPanelProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingPickupId, setTrackingPickupId] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState('');
  const gpsWatchRef = useRef<number | null>(null);
  const gpsPollRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = getCurrentUser();

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const allPickups = await dbService.getPickupRequests();
      // Show pickups assigned to this user OR unassigned pending ones
      const myPickups = allPickups.filter(p =>
        p.assignedEmployeeId === currentUser?.id ||
        (!p.assignedEmployeeId && (p.status === 'Pending' || p.status === 'New'))
      );
      setPickups(myPickups);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
    const handleSync = () => loadData(true);
    window.addEventListener('mg_data_updated', handleSync);
    return () => window.removeEventListener('mg_data_updated', handleSync);
  }, [loadData]);

  // GPS Tracking
  const startGpsTracking = (pickupId: string) => {
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
    setTrackingPickupId(pickupId);
    const savePos = (pos: GeolocationPosition) => {
      dbService.updateEmployeeGpsLocation(pickupId, pos.coords.latitude, pos.coords.longitude);
    };
    gpsWatchRef.current = navigator.geolocation.watchPosition(savePos, () => {}, { enableHighAccuracy: true });
    gpsPollRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(savePos, () => {}, { enableHighAccuracy: true });
    }, 10000);
  };

  const stopGpsTracking = () => {
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    if (gpsPollRef.current) clearInterval(gpsPollRef.current);
    setTrackingPickupId(null);
  };

  useEffect(() => () => { stopGpsTracking(); }, []);

  const handleAction = async (pickup: PickupRequest, nextStatus: PickupStatus) => {
    // Start GPS when going En Route
    if (nextStatus === 'En Route') {
      startGpsTracking(pickup.id);
    }
    // Stop GPS when delivered or picked up
    if (nextStatus === 'Picked Up' || nextStatus === 'Delivered') {
      stopGpsTracking();
    }
    await dbService.updatePickupRequest({ ...pickup, status: nextStatus });
    await loadData();
  };

  const activePickups = pickups.filter(p =>
    p.status !== 'Delivered' && p.status !== 'Cancelled'
  );
  const completedPickups = pickups.filter(p =>
    p.status === 'Delivered' || p.status === 'Cancelled'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Truck className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading your pickups…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Pickups</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {currentUser?.name && <span className="text-orange-600 font-semibold">{currentUser.name} · </span>}
              {activePickups.length} active pickup{activePickups.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => loadData()} className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        {gpsError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />{gpsError}
          </div>
        )}
        {trackingPickupId && (
          <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="font-semibold">Live GPS tracking active</span>
            <span className="text-purple-500">— Manager can see your location</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'To Accept', count: activePickups.filter(p => p.status === 'Pending' || p.status === 'Assigned').length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'En Route', count: activePickups.filter(p => p.status === 'En Route' || p.status === 'Accepted' || p.status === 'In Transit').length, color: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: 'Picked Up', count: activePickups.filter(p => p.status === 'Picked Up' || p.status === 'At Pickup').length, color: 'bg-green-50 text-green-700 border-green-200' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-2.5 text-center ${s.color}`}>
            <p className="text-xl font-black">{s.count}</p>
            <p className="text-[10px] font-semibold leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === 'active' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}>
          <Truck className="w-4 h-4" /> Active
          {activePickups.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'active' ? 'bg-white/30' : 'bg-orange-100 text-orange-700'}`}>{activePickups.length}</span>}
        </button>
        <button onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === 'completed' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}>
          <CheckCircle2 className="w-4 h-4" /> Completed
          {completedPickups.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'completed' ? 'bg-white/30' : 'bg-slate-200 text-slate-700'}`}>{completedPickups.length}</span>}
        </button>
      </div>

      {/* Pickup Cards */}
      <div className="space-y-3">
        {(activeTab === 'active' ? activePickups : completedPickups).length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {activeTab === 'active' ? 'No active pickups' : 'No completed pickups yet'}
              </h3>
              <p className="text-slate-500 text-sm">
                {activeTab === 'active' ? 'Your manager will assign pickups to you.' : 'Completed pickups will appear here.'}
              </p>
            </div>
          </Card>
        ) : (
          (activeTab === 'active' ? activePickups : completedPickups).map(pickup => {
            const flow = STATUS_FLOW[pickup.status];
            const isTracking = trackingPickupId === pickup.id;

            return (
              <Card key={pickup.id} padding="md">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{pickup.customerName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[pickup.status] || 'bg-slate-100 text-slate-600'}`}>
                          {pickup.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded">{pickup.bikeNumber}</span>
                        {pickup.pickupType && (
                          <span className={`text-xs font-semibold ${pickup.pickupType === 'Emergency' ? 'text-red-600' : pickup.pickupType === 'Breakdown' ? 'text-orange-600' : 'text-slate-500'}`}>
                            {pickup.pickupType === 'Emergency' ? '🚨' : pickup.pickupType === 'Breakdown' ? '⚠️' : '📅'} {pickup.pickupType}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{elapsedLabel(pickup.createdAt)}
                    </span>
                  </div>

                  {/* Issue Description */}
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2">{pickup.issueDescription}</p>

                  {/* Quick Actions: Call + Location */}
                  <div className="flex gap-2">
                    <a href={`tel:${pickup.customerPhone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
                      <Phone className="w-4 h-4" /> Call Customer
                    </a>
                    {pickup.locationLink && (
                      <a href={pickup.locationLink} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors">
                        <MapPin className="w-4 h-4" /> Navigate
                      </a>
                    )}
                  </div>

                  {/* GPS Tracking Indicator */}
                  {isTracking && (
                    <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 font-semibold">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      GPS tracking active — manager can see your location
                    </div>
                  )}

                  {/* Primary CTA */}
                  {flow && (
                    <Button
                      className={`w-full text-white text-sm font-bold py-3 rounded-xl shadow-md ${flow.color}`}
                      onClick={() => handleAction(pickup, flow.next)}>
                      {flow.icon}
                      <span className="ml-2">{flow.label}</span>
                    </Button>
                  )}

                  {/* Completed State */}
                  {pickup.status === 'Delivered' && (
                    <p className="text-center text-xs text-green-600 font-semibold py-1">✅ Delivery completed</p>
                  )}
                  {pickup.status === 'Cancelled' && (
                    <p className="text-center text-xs text-red-500 font-semibold py-1">✗ Cancelled</p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PickupBoyPanel;
