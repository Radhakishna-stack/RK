import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Zap, Navigation, CheckCircle, AlertCircle, LayoutDashboard } from 'lucide-react';
import { dbService } from '../db';
import { fieldServiceManager } from '../services/fieldServiceManager';
import { PickupBooking, PickupStatus, Customer, Salesman } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface PickupSchedulingProps {
    onNavigate: (tab: string) => void;
}

const PickupScheduling: React.FC<PickupSchedulingProps> = ({ onNavigate }) => {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<PickupBooking[]>([]);
    const [salesmen, setSalesmen] = useState<Salesman[]>([]);

    // Form State
    const [mapsLink, setMapsLink] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
    const [serviceWindow, setServiceWindow] = useState('9-11');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [linkStatus, setLinkStatus] = useState<'idle' | 'analyzing' | 'valid' | 'invalid'>('idle');

    // Assign Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<PickupBooking | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState('');

    // Load Data
    useEffect(() => {
        const initData = async () => {
            const [cust, books, staff] = await Promise.all([
                dbService.getCustomers(),
                dbService.getPickupBookings(),
                dbService.getSalesmen()
            ]);
            setCustomers(cust);
            setBookings(books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setSalesmen(staff);
        };
        initData();
    }, []);

    // Handle Link Paste & Analysis
    useEffect(() => {
        if (!mapsLink) {
            setLinkStatus('idle');
            return;
        }

        const analyzeLink = async () => {
            setLinkStatus('analyzing');

            // 1. Try local regex parsing first (Instant)
            const localResult = dbService.parseLocationFromLink(mapsLink);
            if (localResult) {
                setCoordinates({ lat: localResult.lat, lng: localResult.lng });
                setLinkStatus('valid');
                if (localResult.address) setAddress(localResult.address);
                return;
            }

            // 2. Fallback to AI Analysis (Slower but eager)
            try {
                const aiResult = await dbService.resolveLocationViaAI(mapsLink);
                if (aiResult && 'lat' in aiResult) {
                    setCoordinates({ lat: aiResult.lat, lng: aiResult.lng });
                    setAddress(aiResult.address);
                    setLinkStatus('valid');
                } else {
                    setLinkStatus('invalid');
                }
            } catch (e) {
                console.error("Link analysis failed", e);
                setLinkStatus('invalid');
            }
        };

        const timer = setTimeout(analyzeLink, 800); // Debounce
        return () => clearTimeout(timer);
    }, [mapsLink]);

    const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const custId = e.target.value;
        setSelectedCustomerId(custId);
        const cust = customers.find(c => c.id === custId);
        if (cust) {
            if (cust.address && !address) setAddress(cust.address);
            if (cust.location && !coordinates) setCoordinates(cust.location);
        }
    };

    const handleConfirmDispatch = async () => {
        if (!selectedCustomerId || !address) {
            alert('Please select a customer and ensure address is filled.');
            return;
        }

        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer) return;

        setLoading(true);
        try {
            const newBooking: Partial<PickupBooking> = {
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                bikeNumber: customer.bikeNumber,
                slotId: `MANUAL-${Date.now()}`,
                date: pickupDate,
                timeRange: serviceWindow,
                location: {
                    lat: coordinates?.lat || 0,
                    lng: coordinates?.lng || 0,
                    address: address
                },
                mapsLink: mapsLink,
                status: PickupStatus.SCHEDULED
            };

            await dbService.addPickupBooking(newBooking);

            // Reset Form but keep date/window potentially? No, clear mostly.
            setMapsLink('');
            setSelectedCustomerId('');
            setAddress('');
            setCoordinates(null);
            setLinkStatus('idle');
            // alert('Dispatch Request Confirmed!');

            // Refresh bookings
            const updatedBookings = await dbService.getPickupBookings();
            setBookings(updatedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        } catch (error) {
            console.error(error);
            alert('Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssign = (booking: PickupBooking) => {
        setSelectedBookingForAssign(booking);
        setIsAssignModalOpen(true);
    };

    const handleAssignStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookingForAssign || !selectedStaffId) return;

        const staff = salesmen.find(s => s.id === selectedStaffId);
        if (!staff) return;

        setLoading(true);
        try {
            // 1. Create Field Service Job for Tracking
            const jobData = {
                customerId: selectedBookingForAssign.customerId,
                customerName: selectedBookingForAssign.customerName,
                customerPhone: selectedBookingForAssign.customerPhone,
                bikeNumber: selectedBookingForAssign.bikeNumber,
                issueDescription: `Pickup Request - ${selectedBookingForAssign.timeRange}`,
                location: selectedBookingForAssign.location,
                priority: 'High' as const,
                notes: selectedBookingForAssign.mapsLink ? `Maps Link: ${selectedBookingForAssign.mapsLink}` : ''
            };

            const job = fieldServiceManager.createJob(jobData);

            // 2. Assign Job to Staff
            fieldServiceManager.assignJob(job.id, staff.id, staff.name);

            // 3. Update Booking Status
            await dbService.updatePickupStatus(
                selectedBookingForAssign.id,
                PickupStatus.ON_THE_WAY,
                staff.id,
                staff.name
            );

            // 4. Refresh
            const updatedBookings = await dbService.getPickupBookings();
            setBookings(updatedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setIsAssignModalOpen(false);
            setSelectedStaffId('');
            setSelectedBookingForAssign(null);

            alert(`Dispatched to ${staff.name}! Tracking started.`);

        } catch (error) {
            console.error(error);
            alert('Failed to dispatch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 space-y-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Dispatch Request</h1>

            {/* WHATSAPP LINK FILL SECTION */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
                    <h3 className="font-bold text-blue-900 text-sm tracking-wider uppercase">WHATSAPP LINK FILL</h3>
                </div>

                <div className="relative">
                    <textarea
                        value={mapsLink}
                        onChange={(e) => setMapsLink(e.target.value)}
                        placeholder="Paste WhatsApp Maps Link here..."
                        className="w-full h-24 p-4 rounded-xl border border-blue-200 bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none shadow-inner transition-all"
                    />
                    {linkStatus === 'analyzing' && (
                        <div className="absolute bottom-4 right-4 text-xs text-blue-600 flex items-center gap-1 animate-pulse">
                            <Zap className="w-3 h-3" /> Analyzing...
                        </div>
                    )}
                    {linkStatus === 'valid' && (
                        <div className="absolute bottom-4 right-4 text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Location Found
                        </div>
                    )}
                    {linkStatus === 'invalid' && (
                        <div className="absolute bottom-4 right-4 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Invalid Link
                        </div>
                    )}
                </div>
            </div>

            {/* FORM FIELDS */}
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Select Customer
                    </label>
                    <div className="relative">
                        <select
                            value={selectedCustomerId}
                            onChange={handleCustomerSelect}
                            className="w-full p-4 pl-4 pr-10 appearance-none bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            <option value="">CHOOSE CUSTOMER...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} - {c.bikeNumber}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Pickup Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Service Window
                        </label>
                        <div className="relative">
                            <select
                                value={serviceWindow}
                                onChange={(e) => setServiceWindow(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="9-11">9-11 (Morning)</option>
                                <option value="11-1">11-1 (Mid-day)</option>
                                <option value="2-4">2-4 (Afternoon)</option>
                                <option value="4-6">4-6 (Unlikely)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Full Address
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="ENTER CUSTOMER'S PICKUP ADDRESS..."
                            className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 uppercase"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <MapPin className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTON */}
            <Button
                onClick={handleConfirmDispatch}
                disabled={loading}
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-transform active:scale-95"
            >
                {loading ? 'Processing...' : 'CONFIRM DISPATCH REQUEST'}
            </Button>

            {/* RECENT REQUESTS PREVIEW */}
            <div className="mt-12">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Dispatches</h3>
                <div className="space-y-3">
                    {bookings.slice(0, 5).map(booking => (
                        <Card key={booking.id} padding="sm" className="flex items-center justify-between group hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{booking.customerName}</p>
                                    <p className="text-xs text-slate-500 font-medium">{booking.date} • {booking.timeRange} • {booking.bikeNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={booking.status === PickupStatus.SCHEDULED ? 'warning' : 'success'}>
                                    {booking.status}
                                </Badge>
                                {booking.status === PickupStatus.SCHEDULED && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenAssign(booking)}
                                        className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                        Dispatch
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    {bookings.length === 0 && (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No recent dispatches
                        </div>
                    )}
                </div>
            </div>

            {/* ASSIGN MODAL */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Assign Delivery Staff"
                size="sm"
            >
                <form onSubmit={handleAssignStaff} className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Dispatching for <strong>{selectedBookingForAssign?.customerName}</strong>. This will start live tracking.
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Staff</label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                        >
                            <option value="">Choose Staff...</option>
                            {salesmen.filter(s => s.status !== 'Offline').map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button type="submit" className="w-full" disabled={!selectedStaffId}>
                        Start Dispatch Job
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default PickupScheduling;
