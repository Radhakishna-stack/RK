import React, { useState, useEffect } from 'react';
import { Hammer, Play, CheckCircle2, Clock, RefreshCw, AlertCircle, Bike } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus } from '../types';
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
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');

  // GPS Tracking Logic
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError('GPS not supported on this device');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('GPS Updated:', latitude, longitude);
      },
      (error) => {
        setGpsError('Failed to get location: ' + error.message);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const jobsData = await dbService.getComplaints();
      const myJobs = jobsData.filter(job =>
        job.status === ComplaintStatus.PENDING || job.status === ComplaintStatus.IN_PROGRESS
      );
      setJobs(myJobs);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (id: string, status: ComplaintStatus) => {
    await dbService.updateComplaintStatus(id, status);
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
        <p className="text-sm text-slate-600 mt-1">Active service jobs assigned to you</p>

        {gpsError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {gpsError}
          </div>
        )}
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
        <div>
          <p className="text-sm text-blue-100 mb-1">Service Jobs</p>
          <h2 className="text-4xl font-bold">{jobs.length}</h2>
        </div>
      </Card>

      {/* Field Jobs Quick Access */}
      {onNavigate && (
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
      )}

      {/* Jobs List */}
      <div className="space-y-3">
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
                        variant={
                          job.status === ComplaintStatus.PENDING ? 'warning' :
                            job.status === ComplaintStatus.IN_PROGRESS ? 'info' :
                              job.status === ComplaintStatus.COMPLETED ? 'success' : 'neutral'
                        }
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
                  {job.status === ComplaintStatus.PENDING && (
                    <Button
                      size="sm"
                      onClick={() => updateJobStatus(job.id, ComplaintStatus.IN_PROGRESS)}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start Work
                    </Button>
                  )}
                  {job.status === ComplaintStatus.IN_PROGRESS && (
                    <Button
                      size="sm"
                      onClick={() => updateJobStatus(job.id, ComplaintStatus.COMPLETED)}
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
        )}
      </div>
    </div>
  );
};

export default EmployeePanel;
