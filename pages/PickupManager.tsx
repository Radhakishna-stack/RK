import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, MapPin, User, Phone, Bike, Clock, CheckCircle2, Truck, X, RefreshCw, ArrowLeft, Navigation, UserCheck, AlertCircle } from 'lucide-react';
import { dbService } from '../db';
import { PickupRequest, PickupStatus, Salesman } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface PickupManagerProps {
    onNavigate: (tab: string) => void;
}

const STATUS_COLORS: Record<PickupStatus, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Assigned': 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-purple-100 text-purple-800',
    'Picked Up': 'bg-green-100 text-green-800',
    'Delivered': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

const STATUS_ICON: Record<PickupStatus, React.ReactNode> = {
    'Pending': <Clock className="w-3.5 h-3.5" />,
    'Assigned': <UserCheck className="w-3.5 h-3.5" />,
    'In Transit': <Truck className="w-3.5 h-3.5" />,
    'Picked Up': <CheckCircle2 className="w-3.5 h-3.5" />,
    'Delivered': <CheckCircle2 className="w-3.5 h-3.5" />,
    'Cancelled': <X className="w-3.5 h-3.5" />,
};

const PickupManager: React.FC<PickupManagerProps> = ({ onNavigate }) => {
    const [tab, setTab] = useState<'requests' | 'create' | 'tracking'>('requests');
    const [pickups, setPickups] = useState<PickupRequest[]>([]);
    const [employees, setEmployees] = useState<Salesman[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
    const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Create form state
    const [form, setForm] = useState({
        customerName: '', customerPhone: '', bikeNumber: '',
        issueDescription: '', locationLink: '', notes: ''
    });
    const [creating, setCreating] = useState(false);

    const loadData = useCallback(async () => {
        const [p, e] = await Promise.all([dbService.getPickupRequests(), dbService.getSalesmen()]);
        setPickups(p);
        setEmployees(e);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh tracking tab every 10 seconds
    useEffect(() => {
        if (tab === 'tracking') {
            trackingIntervalRef.current = setInterval(loadData, 10000);
        } else {
            if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
        }
        return () => { if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current); };
    }, [tab, loadData]);

    const handleCreate = async () => {
        if (!form.customerName || !form.customerPhone || !form.bikeNumber || !form.issueDescription) {
            alert('Please fill all required fields'); return;
        }
        setCreating(true);
        await dbService.addPickupRequest(form);
        setForm({ customerName: '', customerPhone: '', bikeNumber: '', issueDescription: '', locationLink: '', notes: '' });
        await loadData();
        setCreating(false);
        setTab('requests');
        alert('Pickup request created!');
    };

    const handleAssign = async (pickupId: string, empId: string) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;
        await dbService.updatePickupRequest(pickupId, {
            status: 'Assigned',
            assignedEmployeeId: empId,
            assignedEmployeeName: emp.name
        });
        setShowAssignModal(null);
        await loadData();
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this pickup request?')) return;
        await dbService.updatePickupRequest(id, { status: 'Cancelled' });
        await loadData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this pickup?')) return;
        await dbService.deletePickupRequest(id);
        await loadData();
    };

    const inTransit = pickups.filter(p => p.status === 'In Transit');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-4 pb-24">
            <button onClick={() => onNavigate('more')} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pickup Manager</h1>
                    <p className="text-sm text-slate-600">{pickups.filter(p => p.status === 'Pending').length} pending · {inTransit.length} in transit</p>
                </div>
                <Button onClick={() => setTab('create')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Request
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {(['requests', 'create', 'tracking'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all capitalize ${tab === t ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                        {t === 'tracking' ? '📍 Live Tracking' : t === 'create' ? '+ Create' : 'All Requests'}
                    </button>
                ))}
            </div>

            {/* ─── REQUESTS TAB ─── */}
            {tab === 'requests' && (
                <div className="space-y-3">
                    {pickups.length === 0 ? (
                        <Card className="bg-slate-50">
                            <div className="text-center py-10">
                                <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-600 font-semibold">No pickup requests yet</p>
                                <p className="text-slate-500 text-sm mt-1">Create one after receiving a WhatsApp from a customer</p>
                            </div>
                        </Card>
                    ) : (
                        pickups.map(pickup => (
                            <Card key={pickup.id} padding="sm">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-900">{pickup.customerName}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[pickup.status]}`}>
                                                    {STATUS_ICON[pickup.status]} {pickup.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{pickup.customerPhone}</span>
                                                <span className="flex items-center gap-1 font-mono text-xs font-bold">{pickup.bikeNumber}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(pickup.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-2.5">{pickup.issueDescription}</p>

                                    {pickup.locationLink && (
                                        <a href={pickup.locationLink} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                                            <MapPin className="w-4 h-4" /> View Customer Location
                                        </a>
                                    )}

                                    {pickup.assignedEmployeeName && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 rounded-xl p-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                            <span>Assigned to <strong className="text-blue-800">{pickup.assignedEmployeeName}</strong></span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-1">
                                        {pickup.status === 'Pending' && (
                                            <Button size="sm" onClick={() => setShowAssignModal(pickup.id)} className="flex-1">
                                                <UserCheck className="w-4 h-4 mr-1" /> Assign Employee
                                            </Button>
                                        )}
                                        {(pickup.status === 'Pending' || pickup.status === 'Assigned') && (
                                            <Button size="sm" variant="secondary" onClick={() => handleCancel(pickup.id)} className="flex-1">
                                                Cancel
                                            </Button>
                                        )}
                                        {pickup.status === 'In Transit' && (
                                            <button onClick={() => setTab('tracking')}
                                                className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                                                <Navigation className="w-4 h-4" /> Track Live
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* ─── CREATE TAB ─── */}
            {tab === 'create' && (
                <Card>
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">New Pickup Request</h3>
                        <p className="text-sm text-slate-600">Fill this after receiving the customer's WhatsApp message.</p>

                        {[
                            { key: 'customerName', label: 'Customer Name *', placeholder: 'From WhatsApp', icon: <User className="w-4 h-4" /> },
                            { key: 'customerPhone', label: 'Phone Number *', placeholder: 'Mobile number', icon: <Phone className="w-4 h-4" /> },
                            { key: 'bikeNumber', label: 'Bike Number *', placeholder: 'TN 01 AB 1234', icon: <Bike className="w-4 h-4" />, mono: true },
                            { key: 'locationLink', label: 'Google Maps Link', placeholder: 'Paste link from WhatsApp', icon: <MapPin className="w-4 h-4" /> },
                        ].map(({ key, label, placeholder, icon, mono }) => (
                            <div key={key}>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
                                    <input
                                        type="text"
                                        value={(form as any)[key]}
                                        onChange={e => setForm({ ...form, [key]: key === 'bikeNumber' ? e.target.value.toUpperCase() : e.target.value })}
                                        placeholder={placeholder}
                                        className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${mono ? 'font-mono' : ''}`}
                                    />
                                </div>
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Description *</label>
                            <textarea
                                value={form.issueDescription}
                                onChange={e => setForm({ ...form, issueDescription: e.target.value })}
                                placeholder="What's the problem with the vehicle?"
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (Optional)</label>
                            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Any additional notes" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>

                        <Button onClick={handleCreate} disabled={creating} className="w-full">
                            {creating ? 'Creating...' : 'Create Pickup Request'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* ─── TRACKING TAB ─── */}
            {tab === 'tracking' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Auto-refreshes every 10 seconds
                        </p>
                        <button onClick={loadData} className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                    </div>

                    {inTransit.length === 0 ? (
                        <Card className="bg-slate-50">
                            <div className="text-center py-10">
                                <Navigation className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-600 font-semibold">No active pickups</p>
                                <p className="text-slate-500 text-sm mt-1">Employees on pickup will appear here with their live location</p>
                            </div>
                        </Card>
                    ) : (
                        inTransit.map(pickup => {
                            const hasLocation = pickup.employeeLocation;
                            const mapsLink = hasLocation
                                ? `https://maps.google.com/?q=${pickup.employeeLocation!.lat},${pickup.employeeLocation!.lng}`
                                : null;
                            const custLink = pickup.locationLink || null;
                            const timeSince = hasLocation
                                ? Math.round((Date.now() - new Date(pickup.employeeLocation!.updatedAt).getTime()) / 1000)
                                : null;

                            return (
                                <Card key={pickup.id}>
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-slate-900">{pickup.customerName}</h3>
                                                <p className="text-sm text-slate-600">{pickup.bikeNumber}</p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                                                <Truck className="w-3.5 h-3.5" /> In Transit
                                            </span>
                                        </div>

                                        {pickup.assignedEmployeeName && (
                                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 text-sm">
                                                <User className="w-4 h-4 text-blue-600" />
                                                <span className="text-slate-700">Employee: <strong>{pickup.assignedEmployeeName}</strong></span>
                                            </div>
                                        )}

                                        {hasLocation ? (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-green-800 flex items-center gap-1.5">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                        Live Location Active
                                                    </span>
                                                    <span className="text-xs text-green-700">{timeSince !== null ? `${timeSince}s ago` : ''}</span>
                                                </div>
                                                <div className="text-xs text-green-700 font-mono">
                                                    {pickup.employeeLocation!.lat.toFixed(5)}, {pickup.employeeLocation!.lng.toFixed(5)}
                                                </div>
                                                <a href={mapsLink!} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 py-2 bg-green-600 text-white rounded-xl justify-center font-bold text-sm hover:bg-green-700 transition-colors">
                                                    <Navigation className="w-4 h-4" /> Track on Google Maps
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                Employee hasn't started GPS sharing yet
                                            </div>
                                        )}

                                        {custLink && (
                                            <a href={custLink} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                                                <MapPin className="w-4 h-4" /> Customer's Location
                                            </a>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* ─── ASSIGN MODAL ─── */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
                    <Card className="w-full max-w-sm">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 text-lg">Assign Employee</h3>
                                <button onClick={() => setShowAssignModal(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {employees.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">No employees found</p>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {employees.map(emp => (
                                        <button key={emp.id} onClick={() => handleAssign(showAssignModal, emp.id)}
                                            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{emp.name}</p>
                                                <p className="text-xs text-slate-500">{emp.phone || 'No phone'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PickupManager;
