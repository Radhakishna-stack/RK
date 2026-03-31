import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hammer, Play, CheckCircle2, Clock, AlertCircle, Bike,
  ArrowLeft, Truck, Navigation, UserCheck, MapPin, Phone,
  Package, RefreshCw, ChevronRight, Wrench, Star
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, PickupRequest, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getCurrentUser } from '../auth';

interface EmployeePanelProps {
  userRole: string;
  onNavigate?: (path: string) => void;
}

// ─── Stage pill for job cards ─────────────────────────────────────────────────

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; }> = {
  [ComplaintStatus.NEW]:        { label: '🆕 New',          bg: 'bg-slate-100',   text: 'text-slate-700' },
  [ComplaintStatus.PENDING]:    { label: '🆕 New',          bg: 'bg-slate-100',   text: 'text-slate-700' },
  [ComplaintStatus.ASSIGNED]:   { label: '🔧 Assigned',    bg: 'bg-blue-100',    text: 'text-blue-700' },
  [ComplaintStatus.ACCEPTED]:   { label: '✅ Accepted',    bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  [ComplaintStatus.IN_PROGRESS]:{ label: '⚙️ Working',     bg: 'bg-amber-100',   text: 'text-amber-700' },
  [ComplaintStatus.READY]:      { label: '🔍 Ready for QC', bg: 'bg-green-100',  text: 'text-green-700' },
  [ComplaintStatus.DELIVERED]:  { label: '🏁 Delivered',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  [ComplaintStatus.COMPLETED]:  { label: '🏁 Delivered',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  [ComplaintStatus.CANCELLED]:  { label: '✕ Cancelled',    bg: 'bg-red-100',     text: 'text-red-600' },
};

function elapsedLabel(isoDate: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Pickup status colors ─────────────────────────────────────────────────────

const PICKUP_STATUS_COLORS: Record<PickupStatus, string> = {
  // New 6-stage values
  'New':        'bg-sky-100 text-sky-800',
  'En Route':   'bg-orange-100 text-orange-800',
  'At Pickup':  'bg-emerald-100 text-emerald-800',
  'Completed':  'bg-slate-100 text-slate-700',
  // Legacy kept for backward compat
  'Pending':    'bg-yellow-100 text-yellow-800',
  'Assigned':   'bg-blue-100 text-blue-800',
  'Accepted':   'bg-indigo-100 text-indigo-800',
  'In Transit': 'bg-purple-100 text-purple-800',
  'Picked Up':  'bg-green-100 text-green-800',
  'Delivered':  'bg-emerald-100 text-emerald-800',
  'Cancelled':  'bg-red-100 text-red-800',
};


// ─── Main Component ───────────────────────────────────────────────────────────

const EmployeePanel: React.FC<EmployeePanelProps> = ({ userRole, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'pickups'>('jobs');
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [trackingPickupId, setTrackingPickupId] = useState<string | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsPollRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = getCurrentUser();

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [jobsData, pickupsData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getPickupRequests()
      ]);

      // Only show THIS mechanic's jobs (excluding closed stages)
      const myJobs = jobsData.filter(j =>
        j.assignedMechanicId === currentUser?.id &&
        j.status !== ComplaintStatus.DELIVERED &&
        j.status !== ComplaintStatus.COMPLETED &&
        j.status !== ComplaintStatus.CANCELLED
      );
      setJobs(myJobs);

      // Pickups assigned to this employee
      const myPickups = pickupsData.filter(p =>
        (p.assignedEmployeeId === currentUser?.id || (!p.assignedEmployeeId && p.status === 'Pending')) &&
        p.status !== 'Cancelled' && p.status !== 'Delivered'
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

  // ── GPS Tracking ──────────────────────────────────────────────────────────

  const startGpsTracking = (pickupId: string) => {
    if (!navigator.geolocation) { setGpsError('GPS not supported on this device'); return; }
    setTrackingPickupId(pickupId);
    const savePos = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      dbService.updateEmployeeGpsLocation(pickupId, latitude, longitude);
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

  // ── Job Actions ───────────────────────────────────────────────────────────

  const updateJobStatus = async (id: string, status: ComplaintStatus) => {
    await dbService.updateComplaintStatus(id, status);
    loadData();
  };

  // ── Pickup Actions ────────────────────────────────────────────────────────

  const handlePickupAction = async (pickup: PickupRequest, action: PickupStatus) => {
    if (action === 'In Transit') {
      await dbService.updatePickupRequest({ ...pickup, status: 'In Transit' });
      startGpsTracking(pickup.id);
    } else if (action === 'Picked Up') {
      stopGpsTracking();
      await dbService.updatePickupRequest({ ...pickup, status: 'Picked Up' });
    } else {
      await dbService.updatePickupRequest({ ...pickup, status: action });
    }
    await loadData();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Wrench className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading your jobs…</p>
        </div>
      </div>
    );
  }

  const activeJobs    = jobs.filter(j => j.status === ComplaintStatus.IN_PROGRESS);
  const pendingJobs   = jobs.filter(j => j.status === ComplaintStatus.ASSIGNED || j.status === ComplaintStatus.NEW || j.status === ComplaintStatus.PENDING);
  const acceptedJobs  = jobs.filter(j => j.status === ComplaintStatus.ACCEPTED);
  const readyJobs     = jobs.filter(j => j.status === ComplaintStatus.READY);

  return (
    <div className="space-y-4 pb-28">

      {/* Back nav */}
      {onNavigate && (
        <button onClick={() => onNavigate('more')}
          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Work</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {currentUser?.name && <span className="text-blue-600 font-semibold">{currentUser.name} · </span>}
          {jobs.length} active job{jobs.length !== 1 ? 's' : ''}
        </p>
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

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === 'jobs' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}>
          <Hammer className="w-4 h-4" /> Service Jobs
          {jobs.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'jobs' ? 'bg-white/30' : 'bg-blue-100 text-blue-700'}`}>{jobs.length}</span>}
        </button>
        <button onClick={() => setActiveTab('pickups')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === 'pickups' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}>
          <Truck className="w-4 h-4" /> Pickups
          {pickups.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'pickups' ? 'bg-white/30' : 'bg-purple-100 text-purple-700'}`}>{pickups.length}</span>}
        </button>
      </div>

      {/* ─── SERVICE JOBS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'To Accept', count: pendingJobs.length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Accepted', count: acceptedJobs.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { label: 'Working', count: activeJobs.length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Ready', count: readyJobs.length, color: 'bg-green-50 text-green-700 border-green-200' },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl p-2 text-center ${s.color}`}>
                <p className="text-lg font-black">{s.count}</p>
                <p className="text-[10px] font-semibold leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Field jobs shortcut */}
          {onNavigate && (
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white cursor-pointer hover:shadow-xl transition-all"
              onClick={() => onNavigate('field_jobs')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100">Field Service</p>
                  <h3 className="text-lg font-bold">GPS Jobs</h3>
                  <p className="text-xs text-purple-200 mt-0.5">Live navigation to customer</p>
                </div>
                <div className="flex items-center gap-2">
                  <Bike className="w-7 h-7 opacity-80" />
                  <ChevronRight className="w-5 h-5 opacity-60" />
                </div>
              </div>
            </Card>
          )}

          {/* Job list */}
          {jobs.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">All caught up!</h3>
                <p className="text-slate-500 text-sm">No active jobs assigned to you right now.</p>
              </div>
            </Card>
          ) : (
            jobs.map((job) => {
              const stage = STAGE_CONFIG[job.status] ?? STAGE_CONFIG[ComplaintStatus.NEW];
              return (
                <Card key={job.id} padding="md">
                  <div className="space-y-3">
                    {/* Job header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Bike className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <h3 className="text-base font-bold text-slate-900">{job.bikeNumber}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${stage.bg} ${stage.text}`}>
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{job.customerName}</p>
                        {job.customerPhone && (
                          <a href={`tel:${job.customerPhone}`} className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {job.customerPhone}
                          </a>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {job.estimatedCost > 0 && (
                          <>
                            <p className="text-[10px] text-slate-400">Est. Cost</p>
                            <p className="text-base font-bold text-slate-900">₹{job.estimatedCost.toLocaleString()}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Issue details */}
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 line-clamp-2">{job.details}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{elapsedLabel(job.createdAt)}</span>
                      {job.dueDate && (
                        <span className={`flex items-center gap-1 ${new Date(job.dueDate) < new Date() ? 'text-red-500 font-semibold' : ''}`}>
                          ⏰ {new Date(job.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>

                    {/* ── THE KEY MECHANIC CTA ── */}
                    <div className="pt-2 border-t border-slate-100">
                      {job.status === ComplaintStatus.ASSIGNED && (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-md shadow-blue-200"
                          onClick={() => updateJobStatus(job.id, ComplaintStatus.ACCEPTED)}>
                          <UserCheck className="w-5 h-5 mr-2" /> Accept This Job
                        </Button>
                      )}
                      {job.status === ComplaintStatus.ACCEPTED && (
                        <Button
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-3 rounded-xl shadow-md shadow-amber-200"
                          onClick={() => updateJobStatus(job.id, ComplaintStatus.IN_PROGRESS)}>
                          <Play className="w-5 h-5 mr-2" /> Start Work
                        </Button>
                      )}
                      {job.status === ComplaintStatus.IN_PROGRESS && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 rounded-xl shadow-md shadow-green-200"
                          onClick={() => updateJobStatus(job.id, ComplaintStatus.READY)}>
                          <CheckCircle2 className="w-5 h-5 mr-2" /> Mark Ready for Delivery
                        </Button>
                      )}
                      {(job.status === ComplaintStatus.NEW || job.status === ComplaintStatus.PENDING) && (
                        <p className="text-center text-xs text-slate-400 py-1">⏳ Awaiting admin to assign you to this job</p>
                      )}
                      {job.status === ComplaintStatus.READY && (
                        <p className="text-center text-xs text-green-600 font-semibold py-1">✅ Waiting for manager QC check</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ─── PICKUPS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'pickups' && (
        <div className="space-y-3">
          {pickups.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No pickups assigned</h3>
                <p className="text-slate-500 text-sm">Your manager will assign a pickup to you.</p>
              </div>
            </Card>
          ) : (
            pickups.map(pickup => {
              const isMyTracking = trackingPickupId === pickup.id;
              return (
                <Card key={pickup.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{pickup.customerName}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5" />
                          <a href={`tel:${pickup.customerPhone}`} className="text-blue-600 font-semibold">{pickup.customerPhone}</a>
                          <span className="font-mono text-xs font-bold text-slate-700">{pickup.bikeNumber}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PICKUP_STATUS_COLORS[pickup.status]}`}>
                        {pickup.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2">{pickup.issueDescription}</p>
                    {pickup.locationLink && (
                      <a href={pickup.locationLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                        <MapPin className="w-4 h-4" /> Open Customer Location
                      </a>
                    )}
                    {isMyTracking && (
                      <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 font-semibold">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        GPS tracking active — manager can see your location
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      {pickup.status === 'Assigned' && (
                        <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => handlePickupAction(pickup, 'Accepted')}>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept Pickup
                        </Button>
                      )}
                      {pickup.status === 'Accepted' && (
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => handlePickupAction(pickup, 'In Transit')}>
                          <Navigation className="w-4 h-4 mr-1.5" /> Start Journey
                        </Button>
                      )}
                      {pickup.status === 'In Transit' && (
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handlePickupAction(pickup, 'Picked Up')}>
                          <Package className="w-4 h-4 mr-1.5" /> Picked Up ✓
                        </Button>
                      )}
                      {pickup.status === 'Picked Up' && (
                        <Button size="sm" className="flex-1"
                          onClick={() => handlePickupAction(pickup, 'Delivered')}>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Delivered to Shop
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeePanel;
