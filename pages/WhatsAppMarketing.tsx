import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Users, CheckCircle2, Smartphone } from 'lucide-react';
import { dbService } from '../db';
import { Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const WhatsAppMarketingPage: React.FC = () => {
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedSegment, setSelectedSegment] = useState<'all' | 'vip' | 'regular'>('all');
   const [message, setMessage] = useState('');
   const [sendingCount, setSendingCount] = useState(0);

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);
      try {
         const data = await dbService.getCustomers();
         setCustomers(data);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const getFilteredCustomers = () => {
      if (selectedSegment === 'vip') {
         return customers.filter(c => (c.loyaltyPoints || 0) >= 100);
      } else if (selectedSegment === 'regular') {
         return customers.filter(c => (c.loyaltyPoints || 0) < 100);
      }
      return customers;
   };

   const handleBroadcast = () => {
      const filtered = getFilteredCustomers();
      if (!message.trim()) {
         alert('Please enter a message');
         return;
      }

      if (filtered.length === 0) {
         alert('No customers in selected segment');
         return;
      }

      setSendingCount(filtered.length);

      // Simulate sending
      filtered.forEach((customer, index) => {
         setTimeout(() => {
            const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            if (index === 0) {
               window.open(whatsappUrl, '_blank');
            }
         }, index * 100);
      });

      setTimeout(() => {
         alert(`Message queued for ${filtered.length} customers. Opening WhatsApp for first customer.`);
         setSendingCount(0);
      }, filtered.length * 100 + 500);
   };

   const quickTemplates = [
      {
         label: 'Service Reminder',
         message: 'Hi {name}, it\'s time for your bike service! Book your slot now and get 10% off. - SRK Bike Service'
      },
      {
         label: 'Payment Reminder',
         message: 'Hi {name}, you have a pending payment of ₹{amount}. Please clear it at your earliest convenience. - SRK Bike Service'
      },
      {
         label: 'Special Offer',
         message: 'Hi {name}, enjoy 20% off on all spare parts this week! Visit us now. - SRK Bike Service'
      },
      {
         label: 'Thank You',
         message: 'Thank you for choosing SRK Bike Service, {name}! Your satisfaction is our priority. 🙏'
      }
   ];

   const filteredCustomers = getFilteredCustomers();

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading customers...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Header */}
         <div>
            <h1 className="text-2xl font-bold text-slate-900">WhatsApp Marketing</h1>
            <p className="text-sm text-slate-600 mt-1">Send bulk messages to customers</p>
         </div>

         {/* Customer Count */}
         <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-sm text-green-100 mb-1">Total Customers</p>
                  <h2 className="text-4xl font-bold">{customers.length}</h2>
               </div>
            </div>
         </Card>

         {/* Segment Tabs */}
         <div className="flex gap-2">
            <button
               onClick={() => setSelectedSegment('all')}
               className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${selectedSegment === 'all'
                     ? 'bg-blue-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               All ({customers.length})
            </button>
            <button
               onClick={() => setSelectedSegment('vip')}
               className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${selectedSegment === 'vip'
                     ? 'bg-blue-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               VIP ({customers.filter(c => (c.loyaltyPoints || 0) >= 100).length})
            </button>
            <button
               onClick={() => setSelectedSegment('regular')}
               className={`
            flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${selectedSegment === 'regular'
                     ? 'bg-blue-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               Regular ({customers.filter(c => (c.loyaltyPoints || 0) < 100).length})
            </button>
         </div>

         {/* Quick Templates */}
         <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Templates</h3>
            <div className="grid grid-cols-2 gap-2">
               {quickTemplates.map((template) => (
                  <button
                     key={template.label}
                     onClick={() => setMessage(template.message)}
                     className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                  >
                     <p className="text-xs font-semibold text-slate-900">{template.label}</p>
                  </button>
               ))}
            </div>
         </div>

         {/* Message Compose */}
         <Card>
            <div className="space-y-3">
               <label className="block text-sm font-semibold text-slate-700">
                  Compose Message
               </label>
               <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here... Use {name} for customer name."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
               />
               <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-slate-600">
                     Will send to <strong>{filteredCustomers.length}</strong> customer{filteredCustomers.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                     onClick={handleBroadcast}
                     isLoading={sendingCount > 0}
                     disabled={!message.trim() || filteredCustomers.length === 0}
                  >
                     <Send className="w-5 h-5 mr-2" />
                     Send via WhatsApp
                  </Button>
               </div>
            </div>
         </Card>

         {/* Recipients Preview */}
         <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
               Recipients ({filteredCustomers.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
               {filteredCustomers.slice(0, 10).map((customer) => (
                  <Card key={customer.id} padding="sm">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-600" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">{customer.name}</p>
                              <p className="text-xs text-slate-600">{customer.phone}</p>
                           </div>
                        </div>
                        {customer.loyaltyPoints && customer.loyaltyPoints >= 100 && (
                           <Badge variant="warning" size="sm">VIP</Badge>
                        )}
                     </div>
                  </Card>
               ))}
               {filteredCustomers.length > 10 && (
                  <p className="text-xs text-slate-600 text-center py-2">
                     + {filteredCustomers.length - 10} more customers
                  </p>
               )}
            </div>
         </div>
      </div>
   );
};

export default WhatsAppMarketingPage;
