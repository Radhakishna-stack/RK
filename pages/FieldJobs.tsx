import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, CheckCircle2, Clock, AlertCircle, ArrowLeft, Zap, Battery } from 'lucide-react';
import { FieldServiceJob, FieldJobStatus } from '../types';
import { fieldServiceManager } from '../services/fieldServiceManager';
import { locationService } from '../services/locationService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface FieldJobsProps {
    onNavigate: (page: string, jobId?: string) => void;
    employeeId: string;
    employeeName: string;
}

const FieldJobs: React.FC<FieldJobsProps> = ({ onNavigate, employeeId, employeeName }) => {
    const [jobs, setJobs] = useState<FieldServiceJob[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [battery, setBattery] = useState<number | null>(null);

    useEffect(() => {
        loadJobs();
        checkBattery();

        // Subscribe to job updates
        const unsubscribe = fieldServiceManager.subscribe(() => {
            loadJobs();
        });

        // Refresh every 10 seconds
        const interval = setInterval(loadJobs, 10000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [employeeId]);

    const loadJobs = () => {
        const activeJobs = fieldServiceManager.getEmployeeJobs(employeeId, true);
        setJobs(activeJobs.sort((a, b) => {
            // Sort by priority and date
            const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }));
    };

    const checkBattery = async () => {
        const level = await locationService.getBatteryLevel();
        setBattery(level);
    };

    const acceptJob = (job: FieldServiceJob) => {
        fieldServiceManager.updateJobStatus(job.id, FieldJobStatus.ACCEPTED, employeeId);
        startGPSTracking(job.id);
    };

    const startGPSTracking = (jobId: string) => {
        const success = locationService.startTracking(
            (lat, lng, accuracy) => {
                setCurrentLocation({ lat, lng });

                // Update employee location in system
                fieldServiceManager.updateEmployeeLocation(
                    employeeId,
                    employeeName,
                    lat,
                    lng,
                    accuracy,
                    jobId,
                    battery || undefined
                );
            },
            (error) => {
                console.error('GPS error:', error);
                alert(`GPS Error: ${error.message}`);
            }
        );

        if (success) {
            setIsTracking(true);
        }
    };

    const stopGPSTracking = () => {
        locationService.stopTracking();
        setIsTracking(false);
    };

    const navigateToCustomer = (lat: number, lng: number) => {
        // Open Google Maps with destination
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    const callCustomer = (phone: string) => {
        window.location.href = `tel:${phone}`;
    };

    const updateStatus = (jobId: string, status: FieldJobStatus) => {
        fieldServiceManager.updateJobStatus(jobId, status, employeeId);

        if (status === FieldJobStatus.COMPLETED || status === FieldJobStatus.CANCELLED) {
            stopGPSTracking();
        }
    };

    const getStatusColor = (status: FieldJobStatus): string => {
        switch (status) {
            case FieldJobStatus.ASSIGNED: return 'text-yellow-600 bg-yellow-50';
            case FieldJobStatus.ACCEPTED: return 'text-blue-600 bg-blue-50';
            case FieldJobStatus.EN_ROUTE: return 'text-indigo-600 bg-indigo-50';
            case FieldJobStatus.ARRIVED: return 'text-purple-600 bg-purple-50';
            case FieldJobStatus.IN_PROGRESS: return 'text-orange-600 bg-orange-50';
            case FieldJobStatus.RETURNING: return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getPriorityColor = (priority: string): 'danger' | 'warning' | 'info' | 'neutral' => {
        switch (priority) {
            case 'Urgent': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            default: return 'neutral';
        }
    };

    const calculateDistance = (lat: number, lng: number): string => {
        if (!currentLocation) return 'Unknown';
        const distance = locationService.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            lat,
            lng
        );
        return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
    };

    if (jobs.length === 0) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Field Jobs</h1>
                        <p className="text-sm text-slate-600">Service assignments</p>
                    </div>
                    {isTracking && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                            GPS Active
                        </div>
                    )}
                </div>

                <Card className="text-center py-16">
                    <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Jobs</h3>
                    <p className="text-slate-600">You're all caught up! New jobs will appear here.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Field Jobs</h1>
                    <p className="text-sm text-slate-600">{jobs.length} active assignment{jobs.length !== 1 ? 's' : ''}</p>
                </div>
                {isTracking && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                        GPS Active
                        {battery !== null && (
                            <span className="ml-1 opacity-75">• {battery}%</span>
                        )}
                    </div>
                )}
            </div>

            {/* Job Cards */}
            <div className="space-y-4">
                {jobs.map((job) => (
                    <Card key={job.id} padding="none" className="overflow-hidden">
                        {/* Priority Banner */}
                        <div className={`px-4 py-2 ${job.priority === 'Urgent' ? 'bg-red-50 border-b border-red-200' :
                                job.priority === 'High' ? 'bg-orange-50 border-b border-orange-200' :
                                    job.priority === 'Medium' ? 'bg-blue-50 border-b border-blue-200' :
                                        'bg-slate-50 border-b border-slate-200'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant={getPriorityColor(job.priority)} size="sm">
                                        {job.priority} Priority
                                    </Badge>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${getStatusColor(job.status)}`}>
                                        {job.status}
                                    </span>
                                </div>
                                {currentLocation && (
                                    <span className="text-xs font-semibold text-slate-600">
                                        {calculateDistance(job.location.lat, job.location.lng)} away
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Customer Info */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{job.customerName}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <span className="font-semibold">{job.bikeNumber}</span>
                                    <span>•</span>
                                    <span>{job.customerPhone}</span>
                                </div>
                            </div>

                            {/* Issue Description */}
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Issue:</p>
                                <p className="text-slate-900">{job.issueDescription}</p>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{job.location.address}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                                {/* Call Customer */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => callCustomer(job.customerPhone)}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call
                                </Button>

                                {/* Navigate */}
                                <Button
                                    size="sm"
                                    onClick={() => navigateToCustomer(job.location.lat, job.location.lng)}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Navigation className="w-4 h-4" />
                                    Navigate
                                </Button>
                            </div>

                            {/* Status Actions */}
                            <div className="space-y-2">
                                {job.status === FieldJobStatus.ASSIGNED && (
                                    <Button
                                        onClick={() => acceptJob(job)}
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Accept Job & Start GPS
                                    </Button>
                                )}

                                {job.status === FieldJobStatus.ACCEPTED && (
                                    <Button
                                        onClick={() => updateStatus(job.id, FieldJobStatus.EN_ROUTE)}
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Start Journey
                                    </Button>
                                )}

                                {job.status === FieldJobStatus.EN_ROUTE && (
                                    <Button
                                        onClick={() => updateStatus(job.id, FieldJobStatus.ARRIVED)}
                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        I've Arrived
                                    </Button>
                                )}

                                {job.status === FieldJobStatus.ARRIVED && (
                                    <Button
                                        onClick={() => updateStatus(job.id, FieldJobStatus.IN_PROGRESS)}
                                        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Start Inspection
                                    </Button>
                                )}

                                {job.status === FieldJobStatus.IN_PROGRESS && (
                                    <Button
                                        onClick={() => updateStatus(job.id, FieldJobStatus.RETURNING)}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Returning to Store
                                    </Button>
                                )}

                                {job.status === FieldJobStatus.RETURNING && (
                                    <Button
                                        onClick={() => updateStatus(job.id, FieldJobStatus.COMPLETED)}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark Complete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* GPS Status Footer */}
            {isTracking && (
                <div className="fixed bottom-20 left-0 right-0 px-6">
                    <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                <div>
                                    <p className="font-semibold">GPS Tracking Active</p>
                                    <p className="text-xs text-green-100">Location updating every 15s</p>
                                </div>
                            </div>
                            {battery !== null && battery < 20 && (
                                <div className="flex items-center gap-1 text-yellow-300">
                                    <Battery className="w-4 h-4" />
                                    <span className="text-xs font-semibold">{battery}%</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default FieldJobs;
