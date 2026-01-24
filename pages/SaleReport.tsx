
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Download, TrendingUp, DollarSign, Users, FileText, Filter, ChevronDown, FileSpreadsheet, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
   const [showExportMenu, setShowExportMenu] = useState(false);
   const exportMenuRef = useRef<HTMLDivElement>(null);

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
      setShowExportMenu(false);
   };

   const handleExcelExport = () => {
      const csvHeaders = ['Invoice ID', 'Date', 'Customer Name', 'Bike Number', 'Amount', 'Payment Status', 'Payment Mode'];
      const csvRows = filteredInvoices.map(inv => [
         inv.id,
         new Date(inv.date).toLocaleDateString('en-IN'),
         inv.customerName,
         inv.bikeNumber,
         inv.finalAmount || 0,
         inv.paymentStatus,
         inv.paymentMode || 'N/A'
      ]);

      const csvContent = [
         csvHeaders.join(','),
         ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setShowExportMenu(false);
   };

   const handlePDFExport = () => {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Report', 14, 20);

      // Date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateRange = startDate && endDate
         ? `${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`
         : 'All Time';
      doc.text(`Period: ${dateRange}`, 14, 28);

      // Summary stats box
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 35, 180, 30, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 16, 42);

      doc.setFont('helvetica', 'normal');
      doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`, 16, 48);
      doc.text(`Collected: ₹${paidAmount.toLocaleString('en-IN')}`, 16, 54);
      doc.text(`Pending: ₹${pendingAmount.toLocaleString('en-IN')}`, 16, 60);
      doc.text(`Total Customers: ${totalCustomers}`, 110, 48);
      doc.text(`Total Invoices: ${filteredInvoices.length}`, 110, 54);

      // Transaction table
      autoTable(doc, {
         startY: 72,
         head: [['Invoice ID', 'Date', 'Customer', 'Bike No.', 'Amount', 'Status']],
         body: filteredInvoices.map(inv => [
            inv.id,
            new Date(inv.date).toLocaleDateString('en-IN'),
            inv.customerName,
            inv.bikeNumber,
            `₹${inv.finalAmount?.toLocaleString('en-IN')}`,
            inv.paymentStatus
         ]),
         headStyles: {
            fillColor: [59, 130, 246],
            fontSize: 9,
            fontStyle: 'bold'
         },
         bodyStyles: {
            fontSize: 8
         },
         alternateRowStyles: {
            fillColor: [248, 250, 252]
         },
         margin: { top: 72 }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      for (let i = 1; i <= pageCount; i++) {
         doc.setPage(i);
         doc.text(
            `Generated on ${new Date().toLocaleDateString('en-IN')} - Page ${i} of ${pageCount}`,
            14,
            doc.internal.pageSize.height - 10
         );
      }

      doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setShowExportMenu(false);
   };

   // Close export menu when clicking outside
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setShowExportMenu(false);
         }
      };

      if (showExportMenu) {
         document.addEventListener('mousedown', handleClickOutside);
         return () => document.removeEventListener('mousedown', handleClickOutside);
      }
   }, [showExportMenu]);

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
               <div className="relative" ref={exportMenuRef}>
                  <button
                     onClick={() => setShowExportMenu(!showExportMenu)}
                     className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
                  >
                     <Download className="w-4 h-4" />
                     Export
                     <ChevronDown className="w-4 h-4" />
                  </button>

                  {showExportMenu && (
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-20">
                        <button
                           onClick={handleExcelExport}
                           className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 transition-colors"
                        >
                           <FileSpreadsheet className="w-4 h-4 text-green-600" />
                           <span className="text-sm font-medium text-slate-900">Excel (CSV)</span>
                        </button>
                        <button
                           onClick={handlePDFExport}
                           className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 transition-colors"
                        >
                           <FileText className="w-4 h-4 text-red-600" />
                           <span className="text-sm font-medium text-slate-900">PDF</span>
                        </button>
                        <button
                           onClick={handlePrint}
                           className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                           <Printer className="w-4 h-4 text-slate-600" />
                           <span className="text-sm font-medium text-slate-900">Print</span>
                        </button>
                     </div>
                  )}
               </div>
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
