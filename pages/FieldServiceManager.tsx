import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Clock, CheckCircle2, Plus, Filter, Activity } from 'lucide-react';
import L from 'leaflet';
import { FieldServiceJob, EmployeeLocation, Salesman, Customer, FieldJobStatus, EmployeeStatus } from '../types';
import { fieldServiceManager } from '../services/fieldServiceManager';
import { dbService } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import JobCreationForm from '../components/JobCreationForm';

interface FieldServiceManagerProps {
    onNavigate: (page: string) => void;
}

const FieldServiceManagerPage: React.FC<FieldServiceManagerProps> = ({ onNavigate }) => {
    const [jobs, setJobs] = useState<FieldServiceJob[]>([]);
    const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([]);
    const [employees, setEmployees] = useState<Salesman[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showCreateJob, setShowCreateJob] = useState(false);
    const [selectedJob, setSelectedJob] = useState<FieldServiceJob | null>(null);

    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<{ [key: string]: L.Marker }>({});

    useEffect(() => {
        initializeMap();
        loadData();

        // Subscribe to real-time updates
        const unsubscribe = fieldServiceManager.subscribe(() => {
            loadData();
            updateMapMarkers();
        });

        // Refresh data every 10 seconds
        const interval = setInterval(() => {
            loadData();
            updateMapMarkers();
        }, 10000);

        return () => {
            unsubscribe();
            clearInterval(interval);
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, []);

    const loadData = async () => {
        const activeJobs = fieldServiceManager.getAllJobs();
        const locations = fieldServiceManager.getAllEmployeeLocations();
        const salesmen = await dbService.getSalesmen();
        const customersList = await dbService.getCustomers();

        setJobs(activeJobs);
        setEmployeeLocations(locations);
        setEmployees(salesmen);
        setCustomers(customersList);
    };

    const initializeMap = () => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Default center (India)
        const center: [number, number] = [20.5937, 78.9629];

        const map = L.map(mapContainerRef.current).setView(center, 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        mapRef.current = map;

        // Resize map after initialization
        setTimeout(() => map.invalidateSize(), 100);
    };

    const updateMapMarkers = () => {
        if (!mapRef.current) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => (marker as any).remove());
        markersRef.current = {};

        const bounds: L.LatLngBounds = L.latLngBounds([]);

        // Add employee markers
        employeeLocations.forEach(location => {
            const { lat, lng } = location.location;

            // Color based on status
            const color =
                location.status === EmployeeStatus.ON_JOB ? '#EF4444' :
                    location.status === EmployeeStatus.AVAILABLE ? '#10B981' :
                        '#6B7280';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `
          <div style="
            background: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: white;
          ">
            👤
          </div>
        `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${location.employeeName}</strong><br/>
            Status: ${location.status}<br/>
            ${location.currentJobId ? `Job: ${location.currentJobId.substring(0, 10)}...` : 'No active job'}
            ${location.battery ? `<br/>Battery: ${location.battery}%` : ''}
          </div>
        `)
                .addTo(mapRef.current!);

            markersRef.current[`emp_${location.employeeId}`] = marker;
            bounds.extend([lat, lng]);
        });

        // Add customer/job markers
        jobs.forEach(job => {
            const { lat, lng } = job.location;

            const color =
                job.priority === 'Urgent' ? '#DC2626' :
                    job.priority === 'High' ? '#F59E0B' :
                        job.priority === 'Medium' ? '#3B82F6' :
                            '#6B7280';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `
          <div style="
            background: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
          ">
            📍
          </div>
        `,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(`
          <div style="min-width: 180px;">
            <strong>${job.customerName}</strong><br/>
            ${job.bikeNumber}<br/>
            Priority: ${job.priority}<br/>
            Status: ${job.status}<br/>
            ${job.assignedToName ? `Assigned to: ${job.assignedToName}` : 'Unassigned'}
          </div>
        `)
                .addTo(mapRef.current!);

            markersRef.current[`job_${job.id}`] = marker;
            bounds.extend([lat, lng]);
        });

        // Fit map to show all markers
        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    };

    useEffect(() => {
        updateMapMarkers();
    }, [employeeLocations, jobs]);

    const getStatusColor = (status: FieldJobStatus): string => {
        switch (status) {
            case FieldJobStatus.ASSIGNED: return 'bg-yellow-100 text-yellow-800';
            case FieldJobStatus.ACCEPTED: return 'bg-blue-100 text-blue-800';
            case FieldJobStatus.EN_ROUTE: return 'bg-indigo-100 text-indigo-800';
            case FieldJobStatus.ARRIVED: return 'bg-purple-100 text-purple-800';
            case FieldJobStatus.IN_PROGRESS: return 'bg-orange-100 text-orange-800';
            case FieldJobStatus.RETURNING: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityBadge = (priority: string): 'danger' | 'warning' | 'info' | 'neutral' => {
        switch (priority) {
            case 'Urgent': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            default: return 'neutral';
        }
    };

    const getTimeSince = (timestamp: string): string => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Field Service Manager</h1>
                        <p className="text-sm text-slate-600">Real-time tracking & job management</p>
                    </div>
                    <Button onClick={() => setShowCreateJob(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Job
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <Card className="bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Active Jobs</p>
                                <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Available</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {employeeLocations.filter(e => e.status === EmployeeStatus.AVAILABLE).length}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">On Job</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {employeeLocations.filter(e => e.status === EmployeeStatus.ON_JOB).length}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Completed Today</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {fieldServiceManager.getAllJobs().filter(j =>
                                        j.status === FieldJobStatus.COMPLETED &&
                                        new Date(j.completedAt || '').toDateString() === new Date().toDateString()
                                    ).length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Map */}
                <div className="flex-1 relative">
                    <div ref={mapContainerRef} className="w-full h-full" />

                    {/* Map Legend */}
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
                        <div className="font-semibold text-slate-900 mb-2">Legend</div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span>On Job</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-500 rounded-full" />
                            <span>Offline</span>
                        </div>
                    </div>
                </div>

                {/* Job List Sidebar */}
                <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto">
                    <div className="p-4 border-b border-slate-200">
                        <h2 className="font-semibold text-slate-900">Active Jobs</h2>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {jobs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No active jobs</p>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div
                                    key={job.id}
                                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedJob(job)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900">{job.customerName}</h3>
                                            <p className="text-sm text-slate-600">{job.bikeNumber}</p>
                                        </div>
                                        <Badge variant={getPriorityBadge(job.priority)} size="sm">
                                            {job.priority}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-slate-700 mb-2 line-clamp-2">{job.issueDescription}</p>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`px-2 py-1 rounded-full font-semibold ${getStatusColor(job.status)}`}>
                                            {job.status}
                                        </span>
                                        <span className="text-slate-500">{getTimeSince(job.createdAt)}</span>
                                    </div>

                                    {job.assignedToName && (
                                        <div className="mt-2 text-xs text-slate-600">
                                            Assigned to: <span className="font-semibold">{job.assignedToName}</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Job Modal */}
            {showCreateJob && (
                <JobCreationForm
                    onClose={() => setShowCreateJob(false)}
                    onJobCreated={() => {
                        setShowCreateJob(false);
                        loadData();
                        updateMapMarkers();
                    }}
                />
            )}
        </div>
    );
};

export default FieldServiceManagerPage;
