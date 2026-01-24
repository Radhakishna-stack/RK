import React, { useState, useEffect } from 'react';
import { Bell, Plus, Send, User, Bike, Calendar, MessageCircle, ArrowLeft, Search, Filter } from 'lucide-react';
import { dbService } from '../db';
import { ServiceReminder, Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { AutocompleteDropdown } from '../components/AutocompleteDropdown';

interface RemindersPageProps {
   onNavigate: (tab: string) => void;
}

const RemindersPage: React.FC<RemindersPageProps> = ({ onNavigate }) => {
   const [reminders, setReminders] = useState<ServiceReminder[]>([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [loading, setLoading] = useState(true);
   const [customers, setCustomers] = useState<Customer[]>([]);

   // Filter state
   const [filterType, setFilterType] = useState<'all' | 'thisMonth' | 'nextMonth' | 'custom'>('all');
   const [customDate, setCustomDate] = useState({ start: '', end: '' });

   // Autocomplete state
   const [showNameDropdown, setShowNameDropdown] = useState(false);
   const [showBikeDropdown, setShowBikeDropdown] = useState(false);
   const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
   const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

   const [formData, setFormData] = useState({
      customerName: '',
      phone: '',
      bikeNumber: '',
      serviceDate: new Date().toISOString().split('T')[0],
      message: ''
   });

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);
      try {
         const [remindersData, customersData] = await Promise.all([
            dbService.getReminders(),
            dbService.getCustomers()
         ]);
         setReminders(remindersData);
         setCustomers(customersData);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         await dbService.addReminder(formData);
         await loadData();
         setIsModalOpen(false);
         setFormData({
            customerName: '',
            phone: '',
            bikeNumber: '',
            serviceDate: new Date().toISOString().split('T')[0],
            message: ''
         });
      } catch (err) {
         alert('Failed to add reminder. Please try again.');
      }
   };

   const sendReminder = (reminder: ServiceReminder) => {
      const message = reminder.message || `Hi ${reminder.customerName}, it's time for your bike service! Book your slot now. - SRK Bike Service`;
      const whatsappUrl = `https://wa.me/${reminder.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
   };

   // Filter Logic
   const getFilteredReminders = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return reminders.filter(r => {
         const rDate = new Date(r.serviceDate);

         if (filterType === 'thisMonth') {
            return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
         }
         if (filterType === 'nextMonth') {
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            return rDate.getMonth() === nextMonth && rDate.getFullYear() === nextYear;
         }
         if (filterType === 'custom' && customDate.start && customDate.end) {
            const start = new Date(customDate.start);
            const end = new Date(customDate.end);
            return rDate >= start && rDate <= end;
         }
         return true;
      }).sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
   };

   // Autocomplete Handlers
   const handleNameChange = (val: string) => {
      setFormData({ ...formData, customerName: val });
      if (val.trim()) {
         const filtered = customers.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
         setFilteredCustomers(filtered);
         setShowNameDropdown(filtered.length > 0);
      } else {
         setShowNameDropdown(false);
      }
   };

   const selectCustomer = (customer: Customer) => {
      setFormData({
         ...formData,
         customerName: customer.name,
         phone: customer.phone || '',
         bikeNumber: customer.bikeNumber
      });
      setShowNameDropdown(false);
      setShowBikeDropdown(false);
   };

   const filteredReminders = getFilteredReminders();

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading reminders...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">Service Reminders</h1>
                  <p className="text-sm text-slate-600 mt-1">{filteredReminders.length} reminders found</p>
               </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
               <Plus className="w-5 h-5 mr-2" />
               Add Reminder
            </Button>
         </div>

         <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bell className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-sm text-amber-100 mb-1">Pending Reminders</p>
                  <h2 className="text-4xl font-bold">{reminders.length}</h2>
               </div>
            </div>
         </Card>

         {/* Filter Section */}
         <div className="flex gap-2 overflow-x-auto pb-2">
            <button
               onClick={() => setFilterType('all')}
               className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
               All
            </button>
            <button
               onClick={() => setFilterType('thisMonth')}
               className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${filterType === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
               This Month
            </button>
            <button
               onClick={() => setFilterType('nextMonth')}
               className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${filterType === 'nextMonth' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
               Next Month
            </button>
         </div>

         <div className="space-y-3">
            {filteredReminders.length === 0 ? (
               <Card>
                  <div className="text-center py-12">
                     <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">No reminders found</h3>
                     <p className="text-slate-600">Try changing filters or add a new reminder</p>
                  </div>
               </Card>
            ) : (
               filteredReminders.map((reminder) => (
                  <Card key={reminder.id} padding="md">
                     <div className="space-y-3">
                        <div className="flex items-start justify-between">
                           <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{reminder.customerName}</h3>
                              <div className="space-y-1 text-sm text-slate-600">
                                 <div className="flex items-center gap-2">
                                    <Bike className="w-4 h-4" />
                                    <span>{reminder.bikeNumber}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Service due: {new Date(reminder.serviceDate).toLocaleDateString()}</span>
                                 </div>
                                 {reminder.message && (
                                    <div className="flex items-start gap-2 mt-2">
                                       <MessageCircle className="w-4 h-4 mt-0.5" />
                                       <span className="text-slate-700">{reminder.message}</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                           <Badge variant="warning" size="sm">
                              Pending
                           </Badge>
                        </div>

                        <Button
                           onClick={() => sendReminder(reminder)}
                           className="w-full"
                           size="sm"
                        >
                           <Send className="w-4 h-4 mr-2" />
                           Send Reminder via WhatsApp
                        </Button>
                     </div>
                  </Card>
               ))
            )}
         </div>

         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add Service Reminder"
            size="md"
         >
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <Input
                     type="text"
                     required
                     placeholder="Search customer..."
                     value={formData.customerName}
                     onChange={(e) => handleNameChange(e.target.value)}
                     icon={<User className="w-5 h-5" />}
                  />
                  <AutocompleteDropdown
                     show={showNameDropdown}
                     customers={filteredCustomers}
                     onSelect={selectCustomer}
                     displayField="name"
                  />
               </div>

               <Input
                  label="Phone"
                  type="tel"
                  required
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

               <Input
                  label="Service Due Date"
                  type="date"
                  required
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
               />

               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                     Custom Message (Optional)
                  </label>
                  <textarea
                     value={formData.message}
                     onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                     placeholder="Enter custom reminder message..."
                     className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                     rows={3}
                  />
               </div>

               <div className="border-t border-slate-200 pt-4 flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                     Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                     Add Reminder
                  </Button>
               </div>
            </form>
         </Modal>
      </div>
   );
};

export default RemindersPage;
