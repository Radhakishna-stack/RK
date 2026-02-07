import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Filter, Share2, ChevronDown, Download, Search, FileText, Smartphone } from 'lucide-react';
import { dbService } from '../db';
import { Customer, Invoice, PaymentReceipt } from '../types';
import { AutocompleteDropdown } from '../components/AutocompleteDropdown';
import { Card } from '../components/ui/Card';

interface PartyStatementPageProps {
   onNavigate: (tab: string) => void;
}

interface LedgerEntry {
   id: string;
   date: string;
   type: 'Invoice' | 'Payment';
   description: string;
   debit: number;  // Invoice Amount
   credit: number; // Payment Amount
   balance: number;
}

const PartyStatementPage: React.FC<PartyStatementPageProps> = ({ onNavigate }) => {
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

   // Search State
   const [searchTerm, setSearchTerm] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);
   const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

   // Ledger State
   const [entries, setEntries] = useState<LedgerEntry[]>([]);
   const [loading, setLoading] = useState(false);

   // Filters
   const [filterType, setFilterType] = useState<'thisMonth' | 'lastMonth' | 'custom' | 'all'>('thisMonth');
   const [customRange, setCustomRange] = useState({ start: '', end: '' });

   // Load Customers on Mount
   useEffect(() => {
      dbService.getCustomers().then(setCustomers);
   }, []);

   useEffect(() => {
      if (selectedCustomer) {
         fetchLedger();
      }
   }, [selectedCustomer, filterType, customRange]);

   const handleSearch = (val: string) => {
      setSearchTerm(val);
      if (val.trim()) {
         const filtered = customers.filter(c =>
            c.name.toLowerCase().includes(val.toLowerCase()) ||
            c.phone?.includes(val) ||
            c.bikeNumber.toLowerCase().includes(val.toLowerCase())
         );
         setFilteredCustomers(filtered);
         setShowDropdown(filtered.length > 0);
      } else {
         setShowDropdown(false);
      }
   };

   const selectCustomer = (customer: Customer) => {
      setSelectedCustomer(customer);
      setSearchTerm(customer.name);
      setShowDropdown(false);
   };

   const fetchLedger = async () => {
      if (!selectedCustomer) return;
      setLoading(true);

      try {
         const [invoices, receipts] = await Promise.all([
            dbService.getInvoices(),
            dbService.getPaymentReceipts()
         ]);

         // Filter by Customer - Use unique identifiers (ID and bikeNumber)
         const customerInvoices = invoices.filter(i =>
            i.bikeNumber === selectedCustomer.bikeNumber
         );

         const customerReceipts = receipts.filter(r =>
            r.customerId === selectedCustomer.id
         );

         // Convert to Ledger Entries
         let ledgerRows: LedgerEntry[] = [];

         customerInvoices.forEach(inv => {
            ledgerRows.push({
               id: inv.id,
               date: inv.date,
               type: 'Invoice',
               description: `Invoice #${inv.id}`,
               debit: inv.finalAmount,
               credit: 0,
               balance: 0
            });
         });

         customerReceipts.forEach(rcpt => {
            ledgerRows.push({
               id: rcpt.id,
               date: rcpt.date,
               type: 'Payment',
               description: `Payment Receipt #${rcpt.receiptNumber}`,
               debit: 0,
               credit: rcpt.totalAmount,
               balance: 0
            });
         });

         // Sort chronological
         ledgerRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

         // Filter Date Range
         const now = new Date();
         let startDate = new Date(0); // Epoch
         let endDate = new Date();

         if (filterType === 'thisMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
         } else if (filterType === 'lastMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
         } else if (filterType === 'custom' && customRange.start && customRange.end) {
            startDate = new Date(customRange.start);
            endDate = new Date(customRange.end);
            // Adjust end date to end of day
            endDate.setHours(23, 59, 59, 999);
         }

         const filteredRows = ledgerRows.filter(row => {
            const d = new Date(row.date);
            return d >= startDate && d <= endDate;
         });

         // Calculate Running Balance
         let runningBalance = 0;
         // Note: We might miss opening balance if we filter rows arbitrarily. 
         // Ideally, we calculate full balance then filter view. 
         // But for simple statement, let's show filtered transactions.

         // Recalculate full balance history to get opening balance for the period?
         // Let's do simple running balance for displayed rows for now, OR opening balance logic.
         // Better: Calculate ALL rows, then slice.
         ledgerRows.forEach(row => {
            runningBalance = runningBalance + row.debit - row.credit;
            row.balance = runningBalance;
         });

         // Now filter for display
         const displayRows = ledgerRows.filter(row => {
            if (filterType === 'all') return true;
            const d = new Date(row.date);
            return d >= startDate && d <= endDate;
         });

         setEntries(displayRows);

      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const calculateTotals = () => {
      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
      return { totalDebit, totalCredit, closingBalance: totalDebit - totalCredit };
   };

   const shareOnWhatsApp = () => {
      if (!selectedCustomer) return;
      const { totalDebit, totalCredit, closingBalance } = calculateTotals();
      const message = `*Statement for ${selectedCustomer.name}*\nFrom: ${customRange.start || 'Start'} To: ${customRange.end || 'Today'}\n\nTotal Billed: ₹${totalDebit}\nTotal Paid: ₹${totalCredit}\n*Outstanding Balance: ₹${closingBalance}*\n\nPlease pay the outstanding amount at your earliest convenience.`;
      const phone = selectedCustomer.phone;
      const url = `https://wa.me/${phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
   };

   const { totalDebit, totalCredit, closingBalance } = calculateTotals();

   return (
      <div className="flex flex-col h-screen bg-[#F0F8FF] overflow-hidden">
         {/* Header */}
         <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-20 relative no-print">
            <div className="flex items-center gap-3">
               <button onClick={() => onNavigate('home')} className="text-slate-700 p-1 -ml-1">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <h1 className="text-lg font-bold text-slate-800">Party Statement</h1>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={() => window.print()}
                  className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-md active:scale-95 transition-all"
                  title="Print / Save PDF"
               >
                  PDF
               </button>
               <button
                  onClick={shareOnWhatsApp}
                  disabled={!selectedCustomer}
                  className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                  title="Share on WhatsApp"
               >
                  <Share2 className="w-4 h-4" />
               </button>
            </div>
         </div>

         {/* Date Filter */}
         <div className="bg-white px-4 py-3 border-t border-slate-100 z-10 no-print space-y-3">
            <div className="flex items-center justify-between">
               <div className="relative flex-1 mr-4">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Select Party..."
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     value={searchTerm}
                     onChange={(e) => handleSearch(e.target.value)}
                  />
                  <AutocompleteDropdown
                     show={showDropdown}
                     customers={filteredCustomers}
                     onSelect={selectCustomer}
                     displayField="name"
                  />
               </div>

               <div className="flex items-center gap-2">
                  <select
                     value={filterType}
                     onChange={(e) => setFilterType(e.target.value as any)}
                     className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  >
                     <option value="thisMonth">This Month</option>
                     <option value="lastMonth">Last Month</option>
                     <option value="all">All Time</option>
                     <option value="custom">Custom Range</option>
                  </select>
               </div>
            </div>

            {filterType === 'custom' && (
               <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                     type="date"
                     value={customRange.start}
                     onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                     className="bg-transparent text-sm text-slate-600 outline-none"
                  />
                  <span className="text-slate-400 text-xs">TO</span>
                  <input
                     type="date"
                     value={customRange.end}
                     onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                     className="bg-transparent text-sm text-slate-600 outline-none"
                  />
               </div>
            )}
         </div>

         {/* Blue Background Gradient Area */}
         <div className="flex-1 bg-gradient-to-b from-blue-100/50 to-blue-50 p-4 relative overflow-y-auto">

            {!selectedCustomer ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Search className="w-12 h-12 mb-2 opacity-20" />
                  <p>Select a party to view statement</p>
               </div>
            ) : (
               <>
                  <Card className="mb-4 bg-white/80 backdrop-blur-sm">
                     <div className="p-4 border-b border-slate-100">
                        <div className="flex justify-between items-start">
                           <div>
                              <h2 className="font-bold text-lg text-slate-800">{selectedCustomer.name}</h2>
                              <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                              <p className="text-sm text-slate-500">{selectedCustomer.bikeNumber}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-slate-500 mb-1">Closing Balance</p>
                              <h3 className={`text-xl font-bold ${closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                 ₹{Math.abs(closingBalance).toFixed(2)} {closingBalance > 0 ? 'Dr' : 'Cr'}
                              </h3>
                           </div>
                        </div>
                     </div>
                     <div className="p-3 bg-slate-50 flex justify-between text-xs text-slate-500">
                        <div>Total Debit: <span className="font-semibold text-slate-700">₹{totalDebit}</span></div>
                        <div>Total Credit: <span className="font-semibold text-slate-700">₹{totalCredit}</span></div>
                     </div>
                  </Card>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                           <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Ref</th>
                              <th className="px-4 py-3 text-right">Debit</th>
                              <th className="px-4 py-3 text-right">Credit</th>
                              <th className="px-4 py-3 text-right">Balance</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {loading ? (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
                           ) : entries.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No transactions found</td></tr>
                           ) : (
                              entries.map((entry, idx) => (
                                 <tr key={entry.id + idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-600">
                                       {new Date(entry.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                       <div className="font-medium text-slate-700">{entry.type}</div>
                                       <div className="text-xs text-slate-400">{entry.description}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-600">
                                       {entry.debit > 0 ? `₹${entry.debit}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600">
                                       {entry.credit > 0 ? `₹${entry.credit}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-700">
                                       ₹{entry.balance.toFixed(2)}
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </>
            )}
         </div>
      </div>
   );
};

export default PartyStatementPage;
