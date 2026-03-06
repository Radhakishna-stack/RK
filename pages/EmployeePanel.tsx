import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hammer, Play, CheckCircle2, Clock, RefreshCw, AlertCircle, Bike,
  ArrowLeft, Truck, Navigation, UserCheck, MapPin, Phone, User, X, Package
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, PickupRequest, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getCurrentUser } from '../auth';

interface EmployeePanelProps {
  userRole: string;
  onNavigate?: (path: string) => void;
}

const PICKUP_STATUS_COLORS: Record<PickupStatus, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Assigned': 'bg-blue-100 text-blue-800',
  'Accepted': 'bg-indigo-100 text-indigo-800',
  'In Transit': 'bg-purple-100 text-purple-800',
  'Picked Up': 'bg-green-100 text-green-800',
  'Delivered': 'bg-emerald-100 text-emerald-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

const EmployeePanel: React.FC<EmployeePanelProps> = ({ userRole, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'pickups'>('jobs');
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');

  // GPS tracking state for active pickup
  const [trackingPickupId, setTrackingPickupId] = useState<string | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsPollRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = getCurrentUser();

  const loadData = useCallback(async () => {
    try {
      const [jobsData, pickupsData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getPickupRequests()
      ]);

      setJobs(jobsData.filter(j =>
        j.status === ComplaintStatus.PENDING || j.status === ComplaintStatus.IN_PROGRESS
      ));

      // Show pickups assigned to this employee
      const myPickups = pickupsData.filter(p =>
        p.assignedEmployeeId === currentUser?.id || !p.assignedEmployeeId && p.status === 'Pending'
      ).filter(p => p.status !== 'Cancelled' && p.status !== 'Delivered');

      setPickups(myPickups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start GPS tracking for a pickup (watchPosition + save every 10s)
  const startGpsTracking = (pickupId: string) => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
      return;
    }
    setTrackingPickupId(pickupId);

    const savePosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      dbService.updateEmployeeGpsLocation(pickupId, latitude, longitude);
    };

    // Immediate + continuous watch
    gpsWatchRef.current = navigator.geolocation.watchPosition(savePosition, () => { }, { enableHighAccuracy: true });

    // Also save on interval to guarantee 10s cadence
    gpsPollRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(savePosition, () => { }, { enableHighAccuracy: true });
    }, 10000);
  };

  const stopGpsTracking = () => {
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    if (gpsPollRef.current) clearInterval(gpsPollRef.current);
    setTrackingPickupId(null);
  };

  useEffect(() => () => { stopGpsTracking(); }, []);

  const updateJobStatus = async (id: string, status: ComplaintStatus) => {
    await dbService.updateComplaintStatus(id, status);
    loadData();
  };

  const handlePickupAction = async (pickup: PickupRequest, action: PickupStatus) => {
    if (action === 'In Transit') {
      await dbService.updatePickupRequest({ ...pickup, status: 'In Transit' });
      startGpsTracking(pickup.id);
    } else if (action === 'Picked Up') {
      stopGpsTracking();
      await dbService.updatePickupRequest({ ...pickup, status: 'Picked Up' });
    } else if (action === 'Delivered') {
      await dbService.updatePickupRequest({ ...pickup, status: 'Delivered' });
    } else {
      await dbService.updatePickupRequest({ ...pickup, status: action });
    }
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading work...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      {onNavigate && (
        <button onClick={() => onNavigate('more')} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Work</h1>
        <p className="text-sm text-slate-600 mt-1">Your assigned jobs and pickups</p>

        {gpsError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {gpsError}
          </div>
        )}

        {trackingPickupId && (
          <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            <span className="font-semibold">Live GPS tracking active</span>
            <span className="text-purple-500">— Manager can see your location</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
          <span className="flex items-center justify-center gap-1.5">
            <Hammer className="w-4 h-4" /> Service Jobs
            {jobs.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'jobs' ? 'bg-white/30' : 'bg-blue-100 text-blue-700'}`}>{jobs.length}</span>}
          </span>
        </button>
        <button onClick={() => setActiveTab('pickups')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'pickups' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
          <span className="flex items-center justify-center gap-1.5">
            <Truck className="w-4 h-4" /> Pickups
            {pickups.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'pickups' ? 'bg-white/30' : 'bg-purple-100 text-purple-700'}`}>{pickups.length}</span>}
          </span>
        </button>
      </div>

      {/* ─── SERVICE JOBS TAB ─── */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <div>
              <p className="text-sm text-blue-100 mb-1">Active Service Jobs</p>
              <h2 className="text-4xl font-bold">{jobs.length}</h2>
            </div>
          </Card>

          {/* Field Jobs Quick Access */}
          {onNavigate && (
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white cursor-pointer hover:shadow-xl transition-all"
              onClick={() => onNavigate('field_jobs')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Field Service</p>
                  <h3 className="text-xl font-bold">My GPS Jobs</h3>
                  <p className="text-sm text-purple-100 mt-1">View jobs with live navigation</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bike className="w-7 h-7" />
                </div>
              </div>
            </Card>
          )}

          {jobs.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Hammer className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No active jobs</h3>
                <p className="text-slate-600">You're all caught up! New jobs will appear here.</p>
              </div>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} padding="md">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{job.bikeNumber}</h3>
                        <Badge
                          variant={job.status === ComplaintStatus.PENDING ? 'warning' : job.status === ComplaintStatus.IN_PROGRESS ? 'info' : 'success'}
                          size="sm"
                        >
                          {job.status === ComplaintStatus.PENDING && <Clock className="w-3 h-3 mr-1" />}
                          {job.status === ComplaintStatus.IN_PROGRESS && <RefreshCw className="w-3 h-3 mr-1" />}
                          {job.status === ComplaintStatus.COMPLETED && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {job.status || 'Pending'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4" />
                          <span>{job.customerName}</span>
                        </div>
                        <p className="text-slate-700 mt-2">{job.details}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    {job.status === ComplaintStatus.PENDING && (
                      <Button size="sm" onClick={() => updateJobStatus(job.id, ComplaintStatus.IN_PROGRESS)} className="flex-1">
                        <Play className="w-4 h-4 mr-1" /> Start Work
                      </Button>
                    )}
                    {job.status === ComplaintStatus.IN_PROGRESS && (
                      <Button size="sm" onClick={() => updateJobStatus(job.id, ComplaintStatus.COMPLETED)} className="flex-1">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Ready
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ─── PICKUPS TAB ─── */}
      {activeTab === 'pickups' && (
        <div className="space-y-3">
          {pickups.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No pickups assigned</h3>
                <p className="text-slate-600">Your manager will assign a pickup request to you.</p>
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${PICKUP_STATUS_COLORS[pickup.status]}`}>
                        {pickup.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-2.5">{pickup.issueDescription}</p>

                    {pickup.locationLink && (
                      <a href={pickup.locationLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                        <MapPin className="w-4 h-4" /> Open Customer Location
                      </a>
                    )}

                    {isMyTracking && (
                      <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 font-semibold">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                        GPS tracking active — manager can see your location
                      </div>
                    )}

                    {/* Action Buttons */}
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
