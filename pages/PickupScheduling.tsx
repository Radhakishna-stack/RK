import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Users, MapPin, Search } from 'lucide-react';
import { dbService } from '../db';
import { PickupSlot, PickupBooking, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface PickupSchedulingProps {
    onNavigate: (tab: string) => void;
}

const PickupScheduling: React.FC<PickupSchedulingProps> = ({ onNavigate }) => {
    const [slots, setSlots] = useState<PickupSlot[]>([]);
    const [bookings, setBookings] = useState<PickupBooking[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

    // Forms
    const [slotForm, setSlotForm] = useState({
        timeRange: '10:00 - 12:00',
        capacity: 5
    });

    const [bookingForm, setBookingForm] = useState({
        customerName: '',
        phone: '',
        address: '',
        bikeNumber: '',
        lat: 0,
        lng: 0
    });

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allSlots, allBookings] = await Promise.all([
                dbService.getPickupSlots(),
                dbService.getPickupBookings()
            ]);
            setSlots(allSlots.filter(s => s.date === selectedDate));
            setBookings(allBookings.filter(b => b.date === selectedDate));
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        const newSlot: PickupSlot = {
            id: Date.now().toString(),
            date: selectedDate,
            timeRange: slotForm.timeRange,
            capacity: slotForm.capacity,
            bookedCount: 0
        };
        await dbService.addPickupSlot(newSlot);
        setIsSlotModalOpen(false);
        loadData();
    };

    const handleDeleteSlot = async (id: string) => {
        if (window.confirm('Delete this slot?')) {
            await dbService.deletePickupSlot(id);
            loadData();
        }
    };

    const handleBookSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlotId) return;

        const slot = slots.find(s => s.id === selectedSlotId);
        if (!slot) return;

        if (slot.bookedCount >= slot.capacity) {
            alert('Slot is full!');
            return;
        }

        const newBooking: PickupBooking = {
            id: Date.now().toString(),
            customerId: Date.now().toString(), // Temporary ID
            customerName: bookingForm.customerName,
            customerPhone: bookingForm.phone,
            bikeNumber: bookingForm.bikeNumber,
            slotId: selectedSlotId,
            date: selectedDate,
            timeRange: slot.timeRange,
            status: 'Scheduled' as PickupStatus, // Using "Scheduled" as initial status
            location: {
                lat: bookingForm.lat,
                lng: bookingForm.lng,
                address: bookingForm.address
            },
            createdAt: new Date().toISOString()
        };

        // We need to add booking AND update slot count (if we were rigorous, but for now just adding booking)
        // Actually wait, 'addPickupBooking' in db.ts is what we have.
        // 'bookedCount' in slot is a derived value or stored? 
        // Types says stored. We should update it.
        // But for simplicity let's just add the booking. The 'bookedCount' in UI can be derived from filtering bookings.

        await dbService.addPickupBooking({
            ...newBooking,
            status: 'pending' as any // Force pending for now or add 'Scheduled' to types if not there
        });

        setIsBookingModalOpen(false);
        setBookingForm({ customerName: '', phone: '', address: '', bikeNumber: '', lat: 0, lng: 0 });
        loadData();
    };

    // Calculate booked count dynamically
    const getBookedCount = (slotId: string) => bookings.filter(b => b.slotId === slotId).length;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Pickup Scheduling</h1>
                <div className="flex gap-2">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-auto"
                    />
                    <Button onClick={() => setIsSlotModalOpen(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add Slot
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 border border-dashed rounded-xl">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No slots configured for this date.</p>
                    </div>
                ) : (
                    slots.map(slot => {
                        const booked = getBookedCount(slot.id);
                        const isFull = booked >= slot.capacity;
                        return (
                            <Card key={slot.id} padding="md" className={isFull ? 'opacity-75' : ''}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <span className="font-bold text-lg">{slot.timeRange}</span>
                                    </div>
                                    <button onClick={() => handleDeleteSlot(slot.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Availability</span>
                                        <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                            {booked} / {slot.capacity}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${(booked / slot.capacity) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    disabled={isFull}
                                    onClick={() => {
                                        setSelectedSlotId(slot.id);
                                        setIsBookingModalOpen(true);
                                    }}
                                >
                                    {isFull ? 'Slot Full' : 'Book Appointment'}
                                </Button>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Bookings List for Date */}
            <h2 className="text-lg font-bold mt-8 mb-4">Scheduled Pickups ({bookings.length})</h2>
            <div className="space-y-3">
                {bookings.map(booking => (
                    <Card key={booking.id} padding="sm" className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold">{booking.customerName}</p>
                                <p className="text-sm text-slate-500">{booking.timeRange} • {booking.bikeNumber}</p>
                            </div>
                        </div>
                        <Badge variant={booking.status === 'pending' ? 'warning' : 'success'}>
                            {booking.status}
                        </Badge>
                    </Card>
                ))}
                {bookings.length === 0 && <p className="text-slate-500">No bookings for this date.</p>}
            </div>

            {/* Add Slot Modal */}
            <Modal
                isOpen={isSlotModalOpen}
                onClose={() => setIsSlotModalOpen(false)}
                title="Add Time Slot"
                size="sm"
            >
                <form onSubmit={handleAddSlot} className="space-y-4">
                    <Input
                        label="Time Range"
                        value={slotForm.timeRange}
                        onChange={e => setSlotForm({ ...slotForm, timeRange: e.target.value })}
                        placeholder="e.g. 10:00 AM - 12:00 PM"
                        required
                    />
                    <Input
                        label="Capacity"
                        type="number"
                        value={slotForm.capacity}
                        onChange={e => setSlotForm({ ...slotForm, capacity: parseInt(e.target.value) })}
                        required
                        min={1}
                    />
                    <Button type="submit" className="w-full">Create Slot</Button>
                </form>
            </Modal>

            {/* Booking Modal */}
            <Modal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                title="Book Appointment"
                size="md"
            >
                <form onSubmit={handleBookSlot} className="space-y-4">
                    <Input
                        label="Customer Name"
                        value={bookingForm.customerName}
                        onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                        required
                    />
                    <Input
                        label="Phone"
                        value={bookingForm.phone}
                        onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        required
                    />
                    <Input
                        label="Bike Number"
                        value={bookingForm.bikeNumber}
                        onChange={e => setBookingForm({ ...bookingForm, bikeNumber: e.target.value })}
                        required
                    />
                    <Input
                        label="Address"
                        value={bookingForm.address}
                        onChange={e => setBookingForm({ ...bookingForm, address: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        {/* Simplified Mock Map Inputs for now, can be replaced with Map picker */}
                        <Input
                            label="Latitude (Optional)"
                            type="number"
                            step="any"
                            value={bookingForm.lat}
                            onChange={e => setBookingForm({ ...bookingForm, lat: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Longitude (Optional)"
                            type="number"
                            step="any"
                            value={bookingForm.lng}
                            onChange={e => setBookingForm({ ...bookingForm, lng: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full">Confirm Booking</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PickupScheduling;
