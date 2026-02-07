import React, { useState, useEffect } from 'react';
import { Plus, Package, ArrowLeft, Edit2, AlertTriangle, Save, Trash2, Search, Filter } from 'lucide-react';
import { dbService } from '../db';
import { Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DateFilter } from '../components/ui/DateFilter';

interface PurchasePageProps {
   onNavigate: (tab: string) => void;
}

const PurchasePage: React.FC<PurchasePageProps> = ({ onNavigate }) => {
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [loading, setLoading] = useState(true);
   const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [dateStart, setDateStart] = useState<string | null>(null);
   const [dateEnd, setDateEnd] = useState<string | null>(null);

   // Edit Transaction State (Keep this for quick edits of past records)
   const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
   const [editForm, setEditForm] = useState({
      date: '',
      amount: '',
      description: ''
   });

   useEffect(() => {
      loadData();
   }, []);

   useEffect(() => {
      applyFilters();
   }, [transactions, searchTerm, dateStart, dateEnd]);

   const loadData = async () => {
      setLoading(true);
      try {
         const txnsData = await dbService.getTransactions();
         setTransactions(txnsData.filter(t => t.type === 'purchase').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const applyFilters = () => {
      let filtered = transactions;

      // Search
      if (searchTerm) {
         const term = searchTerm.toLowerCase();
         filtered = filtered.filter(t =>
            t.description.toLowerCase().includes(term) ||
            t.amount.toString().includes(term)
         );
      }

      // Date Range
      if (dateStart && dateEnd) {
         const start = new Date(dateStart).setHours(0, 0, 0, 0);
         const end = new Date(dateEnd).setHours(23, 59, 59, 999);
         filtered = filtered.filter(t => {
            const d = new Date(t.date).getTime();
            return d >= start && d <= end;
         });
      }

      setFilteredTransactions(filtered);
   };

   const openEditModal = (txn: Transaction) => {
      setEditingTransaction(txn);
      setEditForm({
         date: txn.date,
         amount: txn.amount.toString(),
         description: txn.description
      });
   };

   const handleUpdateTransaction = async () => {
      if (!editingTransaction) return;

      try {
         await dbService.updateTransaction(editingTransaction.id, {
            date: editForm.date,
            amount: parseFloat(editForm.amount),
            description: editForm.description
         });
         setEditingTransaction(null);
         loadData();
      } catch (err) {
         alert('Failed to update transaction');
      }
   };

   const handleDeleteTransaction = async (id: string) => {
      if (confirm('Are you sure you want to delete this purchase record? Note: This will NOT revert stock changes.')) {
         try {
            await dbService.deleteTransaction(id);
            loadData();
         } catch (err) {
            alert('Failed to delete transaction');
         }
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6 pb-24">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">Purchase History</h1>
                  <p className="text-sm text-slate-600 mt-1">Manage and track stock purchases</p>
               </div>
            </div>
            <Button onClick={() => onNavigate('/purchase/new')}>
               <Plus className="w-5 h-5 mr-2" />
               New Purchase
            </Button>
         </div>

         <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
               <Package className="w-12 h-12 text-blue-600 mx-auto mb-2" />
               <h3 className="text-lg font-bold text-slate-900">Purchase Management</h3>
               <p className="text-sm text-slate-600 mt-1">Record new stock arrivals and view past purchase history.</p>
            </div>
         </Card>

         {/* Filters */}
         <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                  type="text"
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
               />
            </div>
            <DateFilter onChange={(start, end) => {
               setDateStart(start);
               setDateEnd(end);
            }} />
         </div>

         <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Purchases ({filteredTransactions.length})</h2>
            {filteredTransactions.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No purchases found</h3>
                  <p className="text-slate-600">Adjust filters or create a new purchase</p>
               </div>
            ) : (
               <div className="grid gap-3">
                  {filteredTransactions.map((txn) => (
                     <Card key={txn.id} padding="md">
                        <div className="flex justify-between items-start">
                           <div className="flex-1">
                              <div className="font-semibold text-slate-900 line-clamp-2">{txn.description}</div>
                              <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                 <span>{new Date(txn.date).toLocaleDateString()}</span>
                                 <span>•</span>
                                 <span>{new Date(txn.date).toLocaleTimeString()}</span>
                              </div>
                           </div>
                           <div className="text-right pl-4">
                              <div className="text-lg font-bold text-red-600">-₹{txn.amount.toLocaleString()}</div>
                              <div className="flex flex-col items-end gap-1 mt-1">
                                 <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                    Purchase
                                 </span>
                                 <div className="flex gap-1 mt-1">
                                    <button
                                       onClick={() => openEditModal(txn)}
                                       className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                                    >
                                       <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                       onClick={() => handleDeleteTransaction(txn.id)}
                                       className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1"
                                    >
                                       <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </Card>
                  ))}
               </div>
            )}
         </div>

         {/* Edit Modal (Kept for quick fixes) */}
         <Modal
            isOpen={!!editingTransaction}
            onClose={() => setEditingTransaction(null)}
            title="Edit Purchase Transaction"
         >
            <div className="space-y-4">
               <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex gap-2">
                  <AlertTriangle className="w-10 h-10 shrink-0" />
                  <p>
                     <strong>Warning:</strong> Updating this record will only change the financial ledger (Amount/Date).
                     It will NOT automatically adjust inventory stock.
                  </p>
               </div>

               <Input
                  label="Date"
                  type="date"
                  value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
               />

               <Input
                  label="Total Amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
               />

               <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Description / Details</label>
                  <textarea
                     className="w-full border border-slate-300 rounded-lg p-2 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={editForm.description}
                     onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
               </div>

               <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                  <Button onClick={handleUpdateTransaction}>
                     <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
               </div>
            </div>
         </Modal>
      </div >
   );
};

export default PurchasePage;
