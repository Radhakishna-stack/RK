import React, { useState, useEffect } from 'react';
import { Plus, Minus, Wallet, ArrowUpCircle, ArrowDownCircle, Clock, Calendar, Download, FileText } from 'lucide-react';
import { dbService } from '../db';
import { Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashInHandPageProps {
   onNavigate: (tab: string) => void;
}

const CashInHandPage: React.FC<CashInHandPageProps> = ({ onNavigate }) => {
   const [loading, setLoading] = useState(true);
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

   // Filters
   const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // First day of current month
   const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');

   const [formData, setFormData] = useState({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
   });

   useEffect(() => {
      loadData();
   }, []);

   useEffect(() => {
      filterData();
   }, [transactions, startDate, endDate]);

   const loadData = async () => {
      setLoading(true);
      try {
         const allTransactions = await dbService.getTransactions();
         // Filter for Cash Account transactions OR legacy manually added cash transactions
         const cashTransactions = allTransactions.filter(
            t => t.accountId === 'CASH-01' || t.type === 'cash-in' || t.type === 'cash-out' ||
               (t.paymentMode === 'Cash' && (t.type === 'purchase' || t.type === 'expense'))
         );
         setTransactions(cashTransactions);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const filterData = () => {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);

      const filtered = transactions.filter(t => {
         const txnDate = new Date(t.date).getTime();
         return txnDate >= start && txnDate <= end;
      });
      setFilteredTransactions(filtered);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         await dbService.addTransaction({
            ...formData,
            amount: parseFloat(formData.amount),
            type: transactionType,
            accountId: 'CASH-01', // Explicitly link to Central Cash Account
            paymentMode: 'Cash',
            category: transactionType === 'IN' ? 'Cash Received' : 'Cash Paid',
            entityId: 'MANUAL'
         });

         await loadData();
         setIsModalOpen(false);
         setFormData({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      } catch (err) {
         alert('Failed to add transaction. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const openModal = (type: 'IN' | 'OUT') => {
      setTransactionType(type);
      setIsModalOpen(true);
   };

   // Calculate cash balance based on FILTERED data
   const cashIn = filteredTransactions
      .filter(t => t.type === 'IN' || t.type === 'cash-in' || t.type === 'cheque-received')
      .reduce((sum, t) => sum + t.amount, 0);

   const cashOut = filteredTransactions
      .filter(t => t.type === 'OUT' || t.type === 'cash-out' || t.type === 'purchase' || t.type === 'expense' || t.type === 'cheque-issued')
      .reduce((sum, t) => sum + t.amount, 0);

   const balance = cashIn - cashOut;

   // Calculate Opening Balance (transactions before start date)
   const calculateOpeningBalance = () => {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const previousTxns = transactions.filter(t => new Date(t.date).getTime() < start);

      const prevIn = previousTxns
         .filter(t => t.type === 'IN' || t.type === 'cash-in' || t.type === 'cheque-received')
         .reduce((sum, t) => sum + t.amount, 0);

      const prevOut = previousTxns
         .filter(t => t.type === 'OUT' || t.type === 'cash-out' || t.type === 'purchase' || t.type === 'expense' || t.type === 'cheque-issued')
         .reduce((sum, t) => sum + t.amount, 0);

      return prevIn - prevOut;
   };

   const openingBalance = calculateOpeningBalance();
   const closingBalance = openingBalance + balance;

   const downloadPDF = () => {
      const doc = new jsPDF();
      doc.text("Cash In Hand Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 14, 22);

      doc.text(`Opening Balance: ${openingBalance.toLocaleString()}`, 14, 30);
      doc.text(`Total In: ${cashIn.toLocaleString()}`, 70, 30);
      doc.text(`Total Out: ${cashOut.toLocaleString()}`, 130, 30);
      doc.text(`Closing Balance: ${closingBalance.toLocaleString()}`, 14, 36);

      const tableData = filteredTransactions
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .map(t => [
            new Date(t.date).toLocaleDateString(),
            t.description || t.category || '-',
            t.type === 'IN' || t.type === 'cash-in' ? 'IN' : 'OUT',
            t.amount.toLocaleString()
         ]);

      autoTable(doc, {
         startY: 45,
         head: [['Date', 'Description', 'Type', 'Amount']],
         body: tableData,
      });

      doc.save(`cash-report-${startDate}-to-${endDate}.pdf`);
   };

   const downloadExcel = () => {
      const headers = ['Date', 'Description', 'Type', 'Amount'];
      const rows = filteredTransactions.map(t => [
         new Date(t.date).toLocaleDateString(),
         `"${t.description || t.category || '-'}"`, // Quote description to handle commas
         t.type === 'IN' || t.type === 'cash-in' ? 'IN' : 'OUT',
         t.amount
      ]);

      const csvContent = "data:text/csv;charset=utf-8,"
         + headers.join(",") + "\n"
         + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `cash_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   // Helper to display transaction type styling
   const getTransactionTypeStyle = (type: string) => {
      const isIn = type === 'IN' || type === 'cash-in' || type === 'cheque-received';
      return {
         color: isIn ? 'text-green-600' : 'text-red-600',
         bg: isIn ? 'bg-green-100' : 'bg-red-100',
         icon: isIn ? ArrowUpCircle : ArrowDownCircle,
         sign: isIn ? '+' : '-'
      };
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading cash transactions...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Cash In Hand</h1>
               <p className="text-sm text-slate-600 mt-1">Track cash flow and manage expenses</p>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={downloadExcel}>
                  <FileText className="w-4 h-4 mr-2" /> Excel
               </Button>
               <Button variant="outline" size="sm" onClick={downloadPDF}>
                  <Download className="w-4 h-4 mr-2" /> PDF
               </Button>
            </div>
         </div>

         {/* Filters */}
         <Card padding="sm" className="bg-slate-50 border-slate-200">
            <div className="flex flex-wrap items-end gap-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                     type="date"
                     className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                     type="date"
                     className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                  />
               </div>
               <div className="text-sm text-slate-500 pb-2 ml-auto">
                  Showing {filteredTransactions.length} records
               </div>
            </div>
         </Card>

         {/* Balance Card */}
         <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-sm text-green-100 mb-1">Closing Balance</p>
                  <h2 className="text-4xl font-bold">₹{closingBalance.toLocaleString()}</h2>
               </div>
               <div className="ml-auto text-right">
                  <p className="text-xs text-green-100 mb-1">Opening Balance</p>
                  <p className="text-lg font-bold opacity-80">₹{openingBalance.toLocaleString()}</p>
               </div>
            </div>
         </Card>

         {/* Quick Actions */}
         <div className="grid grid-cols-2 gap-3">
            <Button
               onClick={() => openModal('IN')}
               className="bg-green-600 hover:bg-green-700 h-auto py-4"
            >
               <Plus className="w-5 h-5 mr-2" />
               Cash In
            </Button>
            <Button
               onClick={() => openModal('OUT')}
               variant="danger"
               className="h-auto py-4"
            >
               <Minus className="w-5 h-5 mr-2" />
               Cash Out
            </Button>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-200">
               <div className="flex items-center gap-2 mb-2">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">Total In</span>
               </div>
               <p className="text-2xl font-bold text-green-600">₹{cashIn.toLocaleString()}</p>
            </Card>

            <Card className="bg-red-50 border-red-200">
               <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-900">Total Out</span>
               </div>
               <p className="text-2xl font-bold text-red-600">₹{cashOut.toLocaleString()}</p>
            </Card>
         </div>

         {/* Recent Transactions */}
         <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Transactions</h2>

            {filteredTransactions.length === 0 ? (
               <Card>
                  <div className="text-center py-12">
                     <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">No cash transactions found</h3>
                     <p className="text-slate-600 mb-4">Try adjusting your date dates</p>
                  </div>
               </Card>
            ) : (
               filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => {
                     const style = getTransactionTypeStyle(transaction.type);
                     const Icon = style.icon;

                     return (
                        <Card key={transaction.id} padding="md">
                           <div className="flex items-start gap-3">
                              <div className={`
                                 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                                 ${style.bg}
                              `}>
                                 <Icon className={`w-6 h-6 ${style.color}`} />
                              </div>

                              <div className="flex-1">
                                 <h3 className="text-base font-bold text-slate-900">
                                    {transaction.description || transaction.category || 'Transaction'}
                                 </h3>
                                 <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                    {transaction.paymentMode && (
                                       <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs ml-2">
                                          {transaction.paymentMode}
                                       </span>
                                    )}
                                 </div>
                              </div>

                              <div className="text-right">
                                 <p className={`
                                    text-xl font-bold
                                    ${style.color}
                                 `}>
                                    {style.sign}₹{transaction.amount.toLocaleString()}
                                 </p>
                              </div>
                           </div>
                        </Card>
                     );
                  })
            )}
         </div>

         {/* Add Transaction Modal */}
         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={transactionType === 'IN' ? 'Cash In' : 'Cash Out'}
            size="md"
         >
            <form onSubmit={handleSubmit} className="space-y-4">
               <Input
                  label="Description"
                  type="text"
                  required
                  placeholder={transactionType === 'IN' ? 'Money received from...' : 'Money paid for...'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
               />

               <Input
                  label="Amount"
                  type="number"
                  required
                  placeholder="₹ 0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
               />

               <Input
                  label="Date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
               />

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
                     {transactionType === 'IN' ? 'Add Cash In' : 'Add Cash Out'}
                  </Button>
               </div>
            </form>
         </Modal>
      </div>
   );
};

export default CashInHandPage;

