
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Download, TrendingUp, DollarSign, Users, FileText, Filter } from 'lucide-react';
import { dbService } from '../db';
import { Invoice } from '../types';
import { Card } from '../components/ui/Card';

interface SaleReportPageProps {
   onNavigate: (tab: string) => void;
}

const SaleReportPage: React.FC<SaleReportPageProps> = ({ onNavigate }) => {
   const [invoices, setInvoices] = useState<Invoice[]>([]);
   const [loading, setLoading] = useState(true);
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');
   const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('month');
   const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Unpaid'>('all');

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      try {
         const data = await dbService.getInvoices();
         setInvoices(data);

         // Set default date range to current month
         const now = new Date();
         const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
         setStartDate(firstDay.toISOString().split('T')[0]);
         setEndDate(now.toISOString().split('T')[0]);
      } catch (error) {
         console.error('Error loading invoices:', error);
      } finally {
         setLoading(false);
      }
   };

   const getFilteredInvoices = () => {
      let filtered = invoices;

      // Apply date filter
      if (startDate || endDate) {
         filtered = filtered.filter(inv => {
            const invDate = new Date(inv.date);
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            end.setHours(23, 59, 59, 999);

            return invDate >= start && invDate <= end;
         });
      }

      // Apply status filter
      if (statusFilter !== 'all') {
         filtered = filtered.filter(inv => inv.paymentStatus === statusFilter);
      }

      return filtered;
   };

   const setQuickFilter = (period: 'all' | 'today' | 'week' | 'month') => {
      setFilter(period);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (period) {
         case 'today':
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
            break;
         case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            setStartDate(weekAgo.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
            break;
         case 'month':
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
            break;
         case 'all':
            setStartDate('');
            setEndDate('');
            break;
      }
   };

   const filteredInvoices = getFilteredInvoices();

   // Calculate statistics
   const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
   const paidAmount = filteredInvoices
      .filter(inv => inv.paymentStatus === 'Paid')
      .reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
   const pendingAmount = filteredInvoices
      .filter(inv => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Unpaid')
      .reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
   const totalCustomers = new Set(filteredInvoices.map(inv => inv.bikeNumber)).size;

   const paidCount = filteredInvoices.filter(inv => inv.paymentStatus === 'Paid').length;
   const pendingCount = filteredInvoices.filter(inv => inv.paymentStatus === 'Pending').length;
   const unpaidCount = filteredInvoices.filter(inv => inv.paymentStatus === 'Unpaid').length;

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
   };

   const handlePrint = () => {
      window.print();
   };

   return (
      <div className="min-h-screen bg-slate-50 pb-6">
         {/* Header */}
         <div className="bg-white shadow-sm sticky top-0 z-10 no-print">
            <div className="flex items-center justify-between p-4">
               <div className="flex items-center gap-3">
                  <button onClick={() => onNavigate('home')} className="text-slate-700">
                     <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-xl font-bold text-slate-900">Sales Report</h1>
               </div>
               <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
               >
                  <Download className="w-4 h-4" />
                  Export
               </button>
            </div>

            {/* Filters */}
            <div className="px-4 pb-3 space-y-3">
               {/* Quick Filters */}
               <div className="flex gap-2 overflow-x-auto">
                  {(['all', 'today', 'week', 'month'] as const).map((period) => (
                     <button
                        key={period}
                        onClick={() => setQuickFilter(period)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === period
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                           }`}
                     >
                        {period === 'all' ? 'All Time' : period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                     </button>
                  ))}
               </div>

               {/* Date Range */}
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                     <Calendar className="w-4 h-4 text-slate-500" />
                     <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                  </div>
                  <span className="text-slate-400">to</span>
                  <div className="flex items-center gap-2 flex-1">
                     <Calendar className="w-4 h-4 text-slate-500" />
                     <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                  </div>
               </div>

               {/* Status Filter */}
               <div className="flex gap-2 overflow-x-auto">
                  {(['all', 'Paid', 'Pending', 'Unpaid'] as const).map((status) => (
                     <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusFilter === status
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                           }`}
                     >
                        {status === 'all' ? 'All Status' : status}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="p-4 space-y-4">
            {loading ? (
               <div className="text-center py-12">
                  <p className="text-slate-500">Loading report data...</p>
               </div>
            ) : (
               <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                     <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs text-blue-100 mb-1">Total Revenue</p>
                              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                           </div>
                        </div>
                     </Card>

                     <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs text-green-100 mb-1">Collected</p>
                              <p className="text-2xl font-bold">₹{paidAmount.toLocaleString()}</p>
                           </div>
                        </div>
                     </Card>

                     <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs text-amber-100 mb-1">Pending</p>
                              <p className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</p>
                           </div>
                        </div>
                     </Card>

                     <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <Users className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs text-purple-100 mb-1">Customers</p>
                              <p className="text-2xl font-bold">{totalCustomers}</p>
                           </div>
                        </div>
                     </Card>
                  </div>

                  {/* Payment Status Breakdown */}
                  <Card>
                     <h3 className="font-bold text-slate-900 mb-3">Payment Status</h3>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-slate-600">Paid</span>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">{paidCount} invoices</p>
                              <p className="text-xs text-green-600">₹{paidAmount.toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className="text-sm text-slate-600">Pending</span>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">{pendingCount} invoices</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-slate-600">Unpaid</span>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">{unpaidCount} invoices</p>
                           </div>
                        </div>
                     </div>
                  </Card>

                  {/* Recent Transactions */}
                  <Card>
                     <h3 className="font-bold text-slate-900 mb-3">Recent Transactions ({filteredInvoices.length})</h3>
                     <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredInvoices.length === 0 ? (
                           <p className="text-center text-slate-500 py-4">No transactions found for selected period</p>
                        ) : (
                           filteredInvoices.slice(0, 50).map((invoice) => (
                              <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                 <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{invoice.customerName}</p>
                                    <p className="text-xs text-slate-500">{invoice.bikeNumber} • {formatDate(invoice.date)}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">₹{invoice.finalAmount?.toLocaleString()}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${invoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                          invoice.paymentStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                             'bg-red-100 text-red-700'
                                       }`}>
                                       {invoice.paymentStatus}
                                    </span>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </Card>
               </>
            )}
         </div>

         {/* Print Styles */}
         <style>
            {`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}
         </style>
      </div>
   );
};

export default SaleReportPage;
