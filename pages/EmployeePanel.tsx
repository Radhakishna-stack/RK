import React, { useState, useEffect } from 'react';
import { Hammer, Play, CheckCircle2, Clock, RefreshCw, AlertCircle, Bike } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, PickupBooking, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface EmployeePanelProps {
  userRole: string;
  onNavigate: (page: string) => void;
}

const EmployeePanel: React.FC<EmployeePanelProps> = ({ userRole, onNavigate }) => {
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [pickups, setPickups] = useState<PickupBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'pickups'>('jobs');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, pickupsData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getPickupBookings()
      ]);

      // Filter jobs assigned to current user or pending
      const myJobs = jobsData.filter(job =>
        job.status === 'pending' || job.status === 'in-progress'
      );
      setJobs(myJobs);

      const activePickups = pickupsData.filter(p =>
        p.status === 'pending' || p.status === 'in-transit'
      );
      setPickups(activePickups);
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
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${activeTab === 'jobs'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
        >
          Service Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('pickups')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${activeTab === 'pickups'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
        >
          Pickups ({pickups.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'jobs' ? (
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
        ) : (
          pickups.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Bike className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No active pickups</h3>
                <p className="text-slate-600">No pickups assigned. Check back later.</p>
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
                        <p><strong>Address:</strong> {pickup.address}</p>
                        <p><strong>Time:</strong> {pickup.pickupTime}</p>
                      </div>
                    </div>
                  </div>

                  {pickup.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <Button
                        size="sm"
                        onClick={() => updatePickupStatus(pickup.id, 'in-transit')}
                        className="flex-1"
                      >
                        Start Pickup
                      </Button>
                    </div>
                  )}
                  {pickup.status === 'in-transit' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <Button
                        size="sm"
                        onClick={() => updatePickupStatus(pickup.id, 'completed')}
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete Pickup
                      </Button>
                    </div>
                  )}
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
