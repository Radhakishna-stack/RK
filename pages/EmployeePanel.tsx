import React, { useState, useEffect } from 'react';
import { Hammer, Play, CheckCircle2, Clock, RefreshCw, AlertCircle, Bike, Navigation } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, PickupBooking, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getCurrentUser } from '../auth';

interface EmployeePanelProps {
  userRole: string;
  onNavigate?: (path: string) => void;
}

const EmployeePanel: React.FC<EmployeePanelProps> = ({ userRole, onNavigate }) => {
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [pickups, setPickups] = useState<PickupBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PickupBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'pickups' | 'requests'>('jobs');
  const [gpsError, setGpsError] = useState('');

  // ... (GPS Logic) ...

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const [jobsData, pickupsData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getPickupBookings()
      ]);

      const myJobs = jobsData.filter(job =>
        job.status === 'pending' || job.status === 'in-progress'
      );
      setJobs(myJobs);

      // Filter by Staff ID
      const myPickups = pickupsData.filter(p =>
        (p.status === 'pending' || p.status === 'in-transit') && p.staffId === currentUser.id
      );
      setPickups(myPickups);

      // Available Requests (Unassigned)
      const unassigned = pickupsData.filter(p =>
        p.status === 'pending' && !p.staffId
      );
      setRequests(unassigned);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (id: string, status: ComplaintStatus) => {
    await dbService.updateComplaint(id, { status });
    loadData();
  };

  const updatePickupStatus = async (id: string, status: PickupStatus) => {
    await dbService.updatePickupBooking(id, { status });
    loadData();
  };

  const claimJob = async (id: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (window.confirm('Accept this pickup request?')) {
      await dbService.updatePickupBooking(id, {
        staffId: currentUser.id,
        staffName: currentUser.name
      });
      loadData();
      setActiveTab('pickups');
    }
  };

  const openNavigation = (address: string) => {
    // Open Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Work</h1>
        <p className="text-sm text-slate-600 mt-1">Active jobs and pickups assigned to you</p>

        {gpsError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {gpsError}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
          <div>
            <p className="text-sm text-blue-100 mb-1">Service Jobs</p>
            <h2 className="text-4xl font-bold">{jobs.length}</h2>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
          <div>
            <p className="text-sm text-green-100 mb-1">Pickups</p>
            <h2 className="text-4xl font-bold">{pickups.length}</h2>
          </div>
        </Card>
      </div>

      {/* Field Jobs Quick Access */}
      <Card
        className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white cursor-pointer hover:shadow-xl transition-all"
        onClick={() => onNavigate('field_jobs')}
      >
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

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap
            ${activeTab === 'jobs'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
        >
          Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('pickups')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap
            ${activeTab === 'pickups'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
        >
          Pickups ({pickups.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap
            ${activeTab === 'requests'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
        >
          New Requests ({requests.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'jobs' && (
          jobs.length === 0 ? (
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
                          variant={
                            job.status === 'pending' ? 'warning' :
                              job.status === 'in-progress' ? 'info' :
                                job.status === 'ready' ? 'success' : 'neutral'
                          }
                          size="sm"
                        >
                          {job.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {job.status === 'in-progress' && <RefreshCw className="w-3 h-3 mr-1" />}
                          {job.status === 'ready' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {job.status || 'Pending'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4" />
                          <span>{job.customerName}</span>
                        </div>
                        <p className="text-slate-700 mt-2">{job.complaint}</p>
                        {job.estimatedCost && (
                          <p className="font-semibold text-blue-600 mt-2">
                            Est. Cost: ₹{job.estimatedCost.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    {job.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.id, 'in-progress')}
                        className="flex-1"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Work
                      </Button>
                    )}
                    {job.status === 'in-progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.id, 'ready')}
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )
        )}

        {activeTab === 'pickups' && (
          pickups.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Bike className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No active pickups</h3>
                <p className="text-slate-600">You don't have any assigned pickups.</p>
              </div>
            </Card>
          ) : (
            pickups.map((pickup) => (
              <Card key={pickup.id} padding="md">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{pickup.customerName}</h3>
                        <Badge
                          variant={pickup.status === 'pending' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {pickup.status || 'Pending'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Bike:</strong> {pickup.bikeNumber}</p>
                        <p className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-blue-600" />
                          {pickup.address}
                        </p>
                        <p><strong>Time:</strong> {pickup.pickupTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openNavigation(pickup.address)}
                      className="flex-1"
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Navigate
                    </Button>
                    {pickup.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updatePickupStatus(pickup.id, 'in-transit')}
                        className="flex-1"
                      >
                        Start Pickup
                      </Button>
                    )}
                    {pickup.status === 'in-transit' && (
                      <Button
                        size="sm"
                        onClick={() => updatePickupStatus(pickup.id, 'completed')}
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )
        )}

        {activeTab === 'requests' && (
          requests.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No new requests</h3>
                <p className="text-slate-600">Check back later for new pickup requests.</p>
              </div>
            </Card>
          ) : (
            requests.map((req) => (
              <Card key={req.id} padding="md">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{req.customerName}</h3>
                        <Badge variant="neutral" size="sm">Unassigned</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Location:</strong> {req.address}</p>
                        <p><strong>Time:</strong> {req.pickupTime || req.timeRange}</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => claimJob(req.id)}>
                    Accept Job
                  </Button>
                </div>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default EmployeePanel;
