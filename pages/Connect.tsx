import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Phone, User, Bike, Clock, CheckCircle2, Truck, Package } from 'lucide-react';
import { dbService } from '../db';
import { PickupBooking, PickupStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const ConnectPage: React.FC = () => {
   const [bookings, setBookings] = useState<PickupBooking[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [staffList, setStaffList] = useState<any[]>([]);
   const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
   const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
   const [selectedStaffId, setSelectedStaffId] = useState('');
   const [statusFilter, setStatusFilter] = useState<'all' | PickupStatus>('all');

   const [formData, setFormData] = useState({
      customerName: '',
      phone: '',
      bikeNumber: '',
      address: '',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTime: '10:00',
      serviceType: 'pickup'
   });

   useEffect(() => {
      loadData();
      loadStaff();
   }, []);

   const loadStaff = async () => {
      const staff = await dbService.getSalesmen(); // Using salesmen as "Field Staff"
      setStaffList(staff);
   };

   const loadData = async () => {
      setLoading(true);
      try {
         const data = await dbService.getPickupBookings();
         setBookings(data);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleAssignStaff = async () => {
      if (!selectedBookingId || !selectedStaffId) return;

      const staffMember = staffList.find(s => s.id === selectedStaffId);
      await dbService.updatePickupBooking(selectedBookingId, {
         staffId: selectedStaffId,
         staffName: staffMember?.name
      });

      setAssignmentModalOpen(false);
      setSelectedBookingId(null);
      setSelectedStaffId('');
      loadData();
   };

   // ... (existing handlers)

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         await dbService.addPickupBooking({
            ...formData,
            status: 'pending' as PickupStatus
         });

         await loadData();
         setIsModalOpen(false);
         setFormData({
            customerName: '',
            phone: '',
            bikeNumber: '',
            address: '',
            pickupDate: new Date().toISOString().split('T')[0],
            pickupTime: '10:00',
            serviceType: 'pickup'
         });
      } catch (err) {
         alert('Failed to create booking. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const updateStatus = async (id: string, status: PickupStatus) => {
      await dbService.updatePickupBooking(id, { status });
      loadData();
   };

   const filteredBookings = bookings.filter(booking =>
      statusFilter === 'all' || booking.status === statusFilter
   );

   const statusCounts = {
      pending: bookings.filter(b => b.status === 'pending').length,
      'in-transit': bookings.filter(b => b.status === 'in-transit').length,
      completed: bookings.filter(b => b.status === 'completed').length
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading bookings...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Pickup & Delivery</h1>
               <p className="text-sm text-slate-600 mt-1">{bookings.length} total bookings</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
               <Plus className="w-5 h-5 mr-2" />
               New Booking
            </Button>
         </div>

         {/* Active Count */}
         <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Truck className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-sm text-blue-100 mb-1">Active Pickups/Deliveries</p>
                  <h2 className="text-4xl font-bold">{statusCounts.pending + statusCounts['in-transit']}</h2>
               </div>
            </div>
         </Card>

         {/* Status Tabs */}
         <div className="flex gap-2 overflow-x-auto pb-2">
            <button
               onClick={() => setStatusFilter('all')}
               className={`
            px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${statusFilter === 'all'
                     ? 'bg-blue-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               All ({bookings.length})
            </button>
            <button
               onClick={() => setStatusFilter('pending')}
               className={`
            px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${statusFilter === 'pending'
                     ? 'bg-amber-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               Pending ({statusCounts.pending})
            </button>
            <button
               onClick={() => setStatusFilter('in-transit')}
               className={`
            px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${statusFilter === 'in-transit'
                     ? 'bg-blue-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               In Transit ({statusCounts['in-transit']})
            </button>
            <button
               onClick={() => setStatusFilter('completed')}
               className={`
            px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${statusFilter === 'completed'
                     ? 'bg-green-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               Completed ({statusCounts.completed})
            </button>
         </div>

         {/* Bookings List */}
         <div className="space-y-3">
            {filteredBookings.length === 0 ? (
               <Card>
                  <div className="text-center py-12">
                     <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {statusFilter !== 'all' ? `No ${statusFilter} bookings` : 'No bookings yet'}
                     </h3>
                     <p className="text-slate-600 mb-4">
                        {statusFilter !== 'all' ? 'Try a different filter' : 'Create your first pickup or delivery booking'}
                     </p>
                     {statusFilter === 'all' && (
                        <Button onClick={() => setIsModalOpen(true)}>
                           <Plus className="w-5 h-5 mr-2" />
                           Create First Booking
                        </Button>
                     )}
                  </div>
               </Card>
            ) : (
               filteredBookings
                  .sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime())
                  .map((booking) => (
                     <Card key={booking.id} padding="md">
                        <div className="space-y-3">
                           <div className="flex items-start justify-between">
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">{booking.customerName}</h3>
                                    <Badge
                                       variant={
                                          booking.status === 'completed' ? 'success' :
                                             booking.status === 'in-transit' ? 'info' : 'warning'
                                       }
                                       size="sm"
                                    >
                                       {booking.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                       {booking.status === 'in-transit' && <Truck className="w-3 h-3 mr-1" />}
                                       {booking.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                       {booking.status || 'Pending'}
                                    </Badge>
                                 </div>

                                 <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                       <Phone className="w-4 h-4" />
                                       <span>{booking.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                       <Bike className="w-4 h-4" />
                                       <span>{booking.bikeNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                       <MapPin className="w-4 h-4" />
                                       <span className="line-clamp-2">{booking.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                       <Clock className="w-4 h-4" />
                                       <span>{new Date(booking.pickupDate).toLocaleDateString()} at {booking.pickupTime}</span>
                                    </div>
                                 </div>
                              </div>

                              <Badge variant={booking.serviceType === 'pickup' ? 'info' : 'neutral'}>
                                 {booking.serviceType === 'pickup' ? (
                                    <><Package className="w-3 h-3 mr-1" />Pickup</>
                                 ) : (
                                    <><Truck className="w-3 h-3 mr-1" />Delivery</>
                                 )}
                              </Badge>
                           </div>

                           {/* Status Update Buttons */}
                           <div className="flex gap-2 pt-3 border-t border-slate-200 mt-3">
                              {booking.status === 'pending' && (
                                 <>
                                    <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                          setSelectedBookingId(booking.id);
                                          setAssignmentModalOpen(true);
                                       }}
                                       className="flex-1"
                                    >
                                       <User className="w-3 h-3 mr-1" />
                                       {booking.staffName ? 'Reassign' : 'Assign Staff'}
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="secondary"
                                       onClick={() => updateStatus(booking.id, 'in-transit')}
                                       className="flex-1"
                                    >
                                       <Truck className="w-3 h-3 mr-1" />
                                       Start
                                    </Button>
                                    <Button
                                       size="sm"
                                       onClick={() => updateStatus(booking.id, 'completed')}
                                       className="flex-1"
                                    >
                                       <CheckCircle2 className="w-3 h-3 mr-1" />
                                       Done
                                    </Button>
                                 </>
                              )}
                              {booking.status === 'in-transit' && (
                                 <Button
                                    size="sm"
                                    onClick={() => updateStatus(booking.id, 'completed')}
                                    className="w-full"
                                 >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Mark as Completed
                                 </Button>
                              )}
                              {booking.staffName && (
                                 <div className="w-full text-xs text-center text-slate-500 mt-1 flex items-center justify-center gap-1">
                                    <User className="w-3 h-3" />
                                    Assigned to: <span className="font-semibold">{booking.staffName}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </Card>
                  ))
            )}
         </div>

         {/* Create Booking Modal */}
         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="New Pickup/Delivery Booking"
            size="md"
         >
            {/* ... Existing Create Form ... */}
            <form onSubmit={handleSubmit} className="space-y-4">
               {/* ... (Keep existing form content) ... */}
               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                     Service Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                     {[
                        { value: 'pickup', label: 'Pickup', icon: Package },
                        { value: 'delivery', label: 'Delivery', icon: Truck }
                     ].map((type) => (
                        <button
                           key={type.value}
                           type="button"
                           onClick={() => setFormData({ ...formData, serviceType: type.value })}
                           className={`
                    p-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                    ${formData.serviceType === type.value
                                 ? 'bg-blue-600 text-white shadow-md'
                                 : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                        >
                           <type.icon className="w-4 h-4" />
                           {type.label}
                        </button>
                     ))}
                  </div>
               </div>

               <Input
                  label="Customer Name"
                  type="text"
                  required
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  icon={<User className="w-5 h-5" />}
               />

               <div className="grid grid-cols-2 gap-4">
                  <Input
                     label="Phone"
                     type="tel"
                     required
                     placeholder="Phone number"
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     icon={<Phone className="w-5 h-5" />}
                  />

                  <Input
                     label="Bike Number"
                     type="text"
                     required
                     placeholder="KA-01-AB-1234"
                     value={formData.bikeNumber}
                     onChange={(e) => setFormData({ ...formData, bikeNumber: e.target.value })}
                     icon={<Bike className="w-5 h-5" />}
                  />
               </div>

               <Input
                  label="Address"
                  type="text"
                  required
                  placeholder="Enter pickup/delivery address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  icon={<MapPin className="w-5 h-5" />}
               />

               <div className="grid grid-cols-2 gap-4">
                  <Input
                     label="Date"
                     type="date"
                     required
                     value={formData.pickupDate}
                     onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  />

                  <Input
                     label="Time"
                     type="time"
                     required
                     value={formData.pickupTime}
                     onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  />
               </div>

               <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1"
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     isLoading={isSubmitting}
                     className="flex-1"
                  >
                     Create Booking
                  </Button>
               </div>
            </form>
         </Modal>

         {/* Assignment Modal */}
         <Modal
            isOpen={assignmentModalOpen}
            onClose={() => setAssignmentModalOpen(false)}
            title="Assign Staff"
            size="sm"
         >
            <div className="space-y-4">
               <p className="text-sm text-slate-600">Select a team member to handle this request.</p>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                  {staffList.map((staff) => (
                     <button
                        key={staff.id}
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedStaffId === staff.id
                           ? 'border-blue-600 bg-blue-50 text-blue-700'
                           : 'border-slate-200 hover:bg-slate-50'
                           }`}
                     >
                        <span className="font-semibold">{staff.name}</span>
                        {selectedStaffId === staff.id && <CheckCircle2 className="w-4 h-4" />}
                     </button>
                  ))}
                  {staffList.length === 0 && (
                     <div className="text-center py-4 text-slate-500 text-sm">
                        No staff members found. Add them in Staff Control.
                     </div>
                  )}
               </div>
               <div className="flex gap-2 pt-4">
                  <Button variant="ghost" className="flex-1" onClick={() => setAssignmentModalOpen(false)}>
                     Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAssignStaff} disabled={!selectedStaffId}>
                     Confirm Assignment
                  </Button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default ConnectPage;