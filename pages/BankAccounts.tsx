import React, { useState, useEffect } from 'react';
import { Plus, Search, Landmark, Trash2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { dbService } from '../db';
import { BankAccount } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface BankAccountsPageProps {
   onNavigate: (tab: string) => void;
}

const BankAccountsPage: React.FC<BankAccountsPageProps> = ({ onNavigate }) => {
   const [accounts, setAccounts] = useState<BankAccount[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Financial Summary States
   const [cashBalance, setCashBalance] = useState(0);
   const [pendingCheques, setPendingCheques] = useState(0);

   const [formData, setFormData] = useState({
      bankName: '',
      accountNumber: '',
      accountType: 'Savings',
      balance: ''
   });

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);
      try {
         const data = await dbService.getBankAccounts();
         setAccounts(data);

         // Fetch transactions for summary
         const transactions = await dbService.getTransactions();

         // Calculate Cash Balance
         const cashIn = transactions
            .filter(t => t.type === 'cash-in')
            .reduce((sum, t) => sum + t.amount, 0);
         const cashOut = transactions
            .filter(t => t.type === 'cash-out')
            .reduce((sum, t) => sum + t.amount, 0);
         setCashBalance(cashIn - cashOut);

         // Calculate Pending Cheques
         const pending = transactions
            .filter(t => (t.type === 'cheque-received' || t.type === 'cheque-issued') && t.status === 'pending')
            .reduce((sum, t) => sum + t.amount, 0);
         setPendingCheques(pending);

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
         await dbService.addBankAccount({
            ...formData,
            balance: parseFloat(formData.balance)
         });

         await loadData();
         setIsModalOpen(false);
         setFormData({ bankName: '', accountNumber: '', accountType: 'Savings', balance: '' });
      } catch (err) {
         alert('Failed to add account. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (window.confirm('Delete this bank account? This action cannot be undone.')) {
         await dbService.deleteBankAccount(id);
         loadData();
      }
   };

   const filteredAccounts = accounts.filter(account =>
      account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm)
   );

   const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-slate-600">Loading accounts...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Bank Accounts</h1>
               <p className="text-sm text-slate-600 mt-1">{accounts.length} accounts</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
               <Plus className="w-5 h-5 mr-2" />
               Add Account
            </Button>
         </div>

         {/* Financial Summary */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Bank Balance */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white shadow-lg">
               <div>
                  <div className="flex items-center gap-2 mb-2 text-blue-100">
                     <Landmark className="w-5 h-5" />
                     <p className="text-sm font-medium">Bank Balance</p>
                  </div>
                  <h2 className="text-3xl font-bold">₹{totalBalance.toLocaleString()}</h2>
               </div>
            </Card>

            {/* Cash In Hand */}
            <button
               onClick={() => onNavigate('cash_in_hand')}
               className="text-left w-full transition-transform hover:-translate-y-1"
            >
               <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 text-white shadow-lg h-full">
                  <div>
                     <div className="flex items-center gap-2 mb-2 text-green-100">
                        <TrendingUp className="w-5 h-5" />
                        <p className="text-sm font-medium">Cash In Hand</p>
                     </div>
                     <h2 className="text-3xl font-bold">₹{cashBalance.toLocaleString()}</h2>
                     <div className="mt-2 text-xs bg-green-800/30 inline-block px-2 py-1 rounded-lg">
                        Tap to view details →
                     </div>
                  </div>
               </Card>
            </button>

            {/* Pending Cheques */}
            <button
               onClick={() => onNavigate('cheques')}
               className="text-left w-full transition-transform hover:-translate-y-1"
            >
               <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white shadow-lg h-full">
                  <div>
                     <div className="flex items-center gap-2 mb-2 text-amber-100">
                        <Clock className="w-5 h-5" /> // Note: Clock import needed if not present
                        <p className="text-sm font-medium">Pending Cheques</p>
                     </div>
                     <h2 className="text-3xl font-bold">₹{pendingCheques.toLocaleString()}</h2>
                     <div className="mt-2 text-xs bg-amber-700/30 inline-block px-2 py-1 rounded-lg">
                        Tap to manage →
                     </div>
                  </div>
               </Card>
            </button>
         </div>

         {/* Search */}
         <Input
            type="text"
            placeholder="Search by bank name or account number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
         />

         {/* Accounts List */}
         <div className="space-y-3">
            {filteredAccounts.length === 0 ? (
               <Card>
                  <div className="text-center py-12">
                     <Landmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {searchTerm ? 'No matching accounts' : 'No bank accounts'}
                     </h3>
                     <p className="text-slate-600 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Add your first bank account to start tracking'}
                     </p>
                     {!searchTerm && (
                        <Button onClick={() => setIsModalOpen(true)}>
                           <Plus className="w-5 h-5 mr-2" />
                           Add First Account
                        </Button>
                     )}
                  </div>
               </Card>
            ) : (
               filteredAccounts.map((account) => (
                  <Card key={account.id} padding="md">
                     <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                           <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Landmark className="w-6 h-6 text-blue-600" />
                           </div>

                           <div className="flex-1 space-y-2">
                              <div>
                                 <h3 className="text-lg font-bold text-slate-900">{account.bankName}</h3>
                                 <p className="text-sm text-slate-600 font-mono">{account.accountNumber}</p>
                              </div>

                              <Badge variant="neutral" size="sm">
                                 {account.accountType}
                              </Badge>

                              <div className="pt-1">
                                 <p className="text-2xl font-bold text-blue-600">
                                    ₹{account.balance.toLocaleString()}
                                 </p>
                              </div>
                           </div>
                        </div>

                        <button
                           onClick={() => handleDelete(account.id)}
                           className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </Card>
               ))
            )}
         </div>

         {/* Add Account Modal */}
         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add Bank Account"
            size="md"
         >
            <form onSubmit={handleSubmit} className="space-y-4">
               <Input
                  label="Bank Name"
                  type="text"
                  required
                  placeholder="e.g., State Bank of India"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  icon={<Landmark className="w-5 h-5" />}
               />

               <Input
                  label="Account Number"
                  type="text"
                  required
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
               />

               <Input
                  label="Current Balance"
                  type="number"
                  required
                  placeholder="₹ 0"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
               />

               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                     Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                     {['Savings', 'Current'].map((type) => (
                        <button
                           key={type}
                           type="button"
                           onClick={() => setFormData({ ...formData, accountType: type })}
                           className={`
                    p-3 rounded-xl font-semibold text-sm transition-all
                    ${formData.accountType === type
                                 ? 'bg-blue-600 text-white shadow-md'
                                 : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                        >
                           {type}
                        </button>
                     ))}
                  </div>
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
                     Add Account
                  </Button>
               </div>
            </form>
         </Modal>
      </div>
   );
};

export default BankAccountsPage;
