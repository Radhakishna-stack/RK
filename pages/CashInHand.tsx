import React, { useState, useEffect } from 'react';
import { Plus, Minus, Wallet, ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { dbService } from '../db';
import { Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface CashInHandPageProps {
   onNavigate: (tab: string) => void;
}

const CashInHandPage: React.FC<CashInHandPageProps> = ({ onNavigate }) => {
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [loading, setLoading] = useState(true);
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

   const loadData = async () => {
      setLoading(true);
      try {
         const allTransactions = await dbService.getTransactions();
         // Filter for Cash Account transactions OR legacy manually added cash transactions
         const cashTransactions = allTransactions.filter(
            t => t.accountId === 'CASH-01' || t.type === 'cash-in' || t.type === 'cash-out'
         );
         setTransactions(cashTransactions);
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

   // Calculate cash balance
   // Standardize types for calculation: IN/cash-in are positive, OUT/cash-out are negative
   const cashIn = transactions
      .filter(t => t.type === 'IN' || t.type === 'cash-in' || t.type === 'cheque-received')
      .reduce((sum, t) => sum + t.amount, 0);

   const cashOut = transactions
      .filter(t => t.type === 'OUT' || t.type === 'cash-out' || t.type === 'cheque-issued')
      .reduce((sum, t) => sum + t.amount, 0);

   const balance = cashIn - cashOut;

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
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Cash In Hand</h1>
            <p className="text-sm text-slate-600 mt-1">{transactions.length} transactions</p>
         </div>

         {/* Balance Card */}
         <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-sm text-green-100 mb-1">Current Balance</p>
                  <h2 className="text-4xl font-bold">₹{balance.toLocaleString()}</h2>
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
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>

            {transactions.length === 0 ? (
               <Card>
                  <div className="text-center py-12">
                     <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">No cash transactions</h3>
                     <p className="text-slate-600 mb-4">Start tracking your cash flow</p>
                     <div className="flex gap-3 justify-center">
                        <Button onClick={() => openModal('IN')}>
                           <Plus className="w-5 h-5 mr-2" />
                           Cash In
                        </Button>
                     </div>
                  </div>
               </Card>
            ) : (
               transactions
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

