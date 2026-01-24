import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { dbService } from '../db';
import { Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface ChequesPageProps {
   onNavigate: (tab: string) => void;
}

const ChequesPage: React.FC<ChequesPageProps> = ({ onNavigate }) => {
   const [cheques, setCheques] = useState<Transaction[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cleared' | 'bounced'>('all');

   const [formData, setFormData] = useState({
      chequeNumber: '',
      amount: '',
      partyName: '',
      bankName: '',
      date: new Date().toISOString().split('T')[0],
      type: 'received' as 'received' | 'issued'
   });

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);
      try {
         const allTransactions = await dbService.getTransactions();
         const chequeTransactions = allTransactions.filter(
            t => t.type === 'cheque-received' || t.type === 'cheque-issued'
         );
         setCheques(chequeTransactions);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         await dbService.addTransaction({
            description: `Cheque #${formData.chequeNumber} - ${formData.partyName}`,
            amount: parseFloat(formData.amount),
            type: formData.type === 'received' ? 'cheque-received' : 'cheque-issued',
            category: 'Cheque',
            date: formData.date,
            status: 'pending',
            chequeNumber: formData.chequeNumber,
            partyName: formData.partyName,
            bankName: formData.bankName
         });

         await loadData();
         setIsModalOpen(false);
         setFormData({
            chequeNumber: '',
            amount: '',
            partyName: '',
            bankName: '',
            date: new Date().toISOString().split('T')[0],
            type: 'received'
         });
      } catch (err) {
         alert('Failed to add cheque. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const updateChequeStatus = async (id: string, newStatus: 'cleared' | 'bounced') => {
      await dbService.updateTransaction(id, { status: newStatus });
      loadData();
   };

   const filteredCheques = cheques.filter(cheque => {
      const matchesSearch =
         cheque.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         cheque.chequeNumber?.includes(searchTerm) ||
         cheque.bankName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
         statusFilter === 'all' ||
         cheque.status === statusFilter;

      return matchesSearch && matchesStatus;
   });

   const statusCounts = {
      pending: cheques.filter(c => c.status === 'pending').length,
      cleared: cheques.filter(c => c.status === 'cleared').length,
      bounced: cheques.filter(c => c.status === 'bounced').length
   };

   const totalPending = cheques
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading cheques...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Cheques</h1>
               <p className="text-sm text-slate-600 mt-1">{cheques.length} total cheques</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
               <Plus className="w-5 h-5 mr-2" />
               Add Cheque
            </Button>
         </div>

         {/* Pending Amount */}
         <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
            <div>
               <p className="text-sm text-amber-100 mb-1">Pending Cheques</p>
               <h2 className="text-4xl font-bold">₹{totalPending.toLocaleString()}</h2>
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
               All ({cheques.length})
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
               onClick={() => setStatusFilter('cleared')}
               className={`
            px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${statusFilter === 'cleared'
                     ? 'bg-green-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               Cleared ({statusCounts.cleared})
            </button>
            <button
               onClick={() => setStatusFilter('bounced')}
               className={`
            px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${statusFilter === 'bounced'
                     ? 'bg-red-600 text-white shadow-md'
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          `}
            >
               Bounced ({statusCounts.bounced})
            </button>
         </div>

         {/* Search */}
         <Input
            type="text"
            placeholder="Search by party, cheque number, or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
         />

         {/* Cheques List */}
         <div className="space-y-3">
            {filteredCheques.length === 0 ? (
               <Card>
                  <div className="text-center py-12">
                     <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {searchTerm ? 'No matching cheques' : 'No cheques recorded'}
                     </h3>
                     <p className="text-slate-600 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Add your first cheque to start tracking'}
                     </p>
                     {!searchTerm && (
                        <Button onClick={() => setIsModalOpen(true)}>
                           <Plus className="w-5 h-5 mr-2" />
                           Add First Cheque
                        </Button>
                     )}
                  </div>
               </Card>
            ) : (
               filteredCheques
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((cheque) => (
                     <Card key={cheque.id} padding="md">
                        <div className="space-y-3">
                           <div className="flex items-start justify-between">
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">{cheque.partyName}</h3>
                                    <Badge
                                       variant={
                                          cheque.status === 'cleared' ? 'success' :
                                             cheque.status === 'bounced' ? 'danger' : 'warning'
                                       }
                                       size="sm"
                                    >
                                       {cheque.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                       {cheque.status === 'cleared' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                       {cheque.status === 'bounced' && <AlertCircle className="w-3 h-3 mr-1" />}
                                       {cheque.status || 'Pending'}
                                    </Badge>
                                 </div>

                                 <div className="space-y-1 text-sm text-slate-600">
                                    <p className="font-mono">Cheque #{cheque.chequeNumber}</p>
                                    <p>{cheque.bankName}</p>
                                    <div className="flex items-center gap-1">
                                       <Calendar className="w-4 h-4" />
                                       <span>{new Date(cheque.date).toLocaleDateString()}</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="text-right">
                                 <Badge
                                    variant={cheque.type === 'cheque-received' ? 'success' : 'info'}
                                    size="sm"
                                 >
                                    {cheque.type === 'cheque-received' ? 'Received' : 'Issued'}
                                 </Badge>
                                 <p className="text-2xl font-bold text-blue-600 mt-2">
                                    ₹{cheque.amount.toLocaleString()}
                                 </p>
                              </div>
                           </div>

                           {cheque.status === 'pending' && (
                              <div className="flex gap-2 pt-2 border-t border-slate-200">
                                 <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => updateChequeStatus(cheque.id, 'cleared')}
                                    className="flex-1"
                                 >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Mark Cleared
                                 </Button>
                                 <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => updateChequeStatus(cheque.id, 'bounced')}
                                    className="flex-1"
                                 >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    Mark Bounced
                                 </Button>
                              </div>
                           )}
                        </div>
                     </Card>
                  ))
            )}
         </div>

         {/* Add Cheque Modal */}
         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add Cheque"
            size="md"
         >
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                     Cheque Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                     {[
                        { value: 'received', label: 'Cheque Received' },
                        { value: 'issued', label: 'Cheque Issued' }
                     ].map((type) => (
                        <button
                           key={type.value}
                           type="button"
                           onClick={() => setFormData({ ...formData, type: type.value as 'received' | 'issued' })}
                           className={`
                    p-3 rounded-xl font-semibold text-sm transition-all
                    ${formData.type === type.value
                                 ? 'bg-blue-600 text-white shadow-md'
                                 : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                        >
                           {type.label}
                        </button>
                     ))}
                  </div>
               </div>

               <Input
                  label="Party Name"
                  type="text"
                  required
                  placeholder="Customer or vendor name"
                  value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
               />

               <div className="grid grid-cols-2 gap-4">
                  <Input
                     label="Cheque Number"
                     type="text"
                     required
                     placeholder="123456"
                     value={formData.chequeNumber}
                     onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                  />

                  <Input
                     label="Amount"
                     type="number"
                     required
                     placeholder="₹ 0"
                     value={formData.amount}
                     onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
               </div>

               <Input
                  label="Bank Name"
                  type="text"
                  required
                  placeholder="e.g., HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
               />

               <Input
                  label="Cheque Date"
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
                     Add Cheque
                  </Button>
               </div>
            </form>
         </Modal>
      </div>
   );
};

export default ChequesPage;
