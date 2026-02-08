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
   // Extend BankAccount to include computed balance for display
   const [accounts, setAccounts] = useState<(BankAccount & { balance: number })[]>([]);
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

         // Calculate live balances for each account
         const accountsWithBalance = await Promise.all(data.map(async (acc) => {
            const balance = await dbService.getAccountBalance(acc.id);
            return { ...acc, balance };
         }));

         setAccounts(accountsWithBalance);

         // Fetch transactions for summary
         const transactions = await dbService.getTransactions();

         // Calculate Cash Balance from Cash account
         const cashAccount = data.find(acc => acc.type === 'Cash');
         if (cashAccount) {
            const cashBal = await dbService.getAccountBalance(cashAccount.id);
            setCashBalance(cashBal);
         } else {
            setCashBalance(0);
         }

         // Calculate Pending Cheques (if this feature exists)
         const pending = 0; // Placeholder - implement if cheque tracking is needed
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
            name: formData.bankName,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            type: formData.accountType as any,
            openingBalance: parseFloat(formData.balance) || 0,
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
      (account.bankName || account.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.accountNumber || '').includes(searchTerm)
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
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white shadow-lg h-full">
               <div>
                  <div className="flex items-center gap-2 mb-2 text-amber-100">
                     <Clock className="w-5 h-5" />
                     <p className="text-sm font-medium">Pending Cheques</p>
                  </div>
                  <h2 className="text-3xl font-bold">₹{pendingCheques.toLocaleString()}</h2>
               </div>
            </Card>
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
                                 <h3 className="text-lg font-bold text-slate-900">{account.bankName || account.name}</h3>
                                 <p className="text-sm text-slate-600 font-mono">{account.accountNumber || '****'}</p>
                              </div>

                              <Badge variant="neutral" size="sm">
                                 {account.type}
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
            title="NEW PAYMENT NODE"
            size="md"
         >
            <div className="mb-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
               Bank or Wallet Integration
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wide">
                     Account Display Name
                  </label>
                  <Input
                     type="text"
                     required
                     placeholder="E.G. PHONEPE SHOP / HDFC MAIN"
                     value={formData.bankName}
                     onChange={(e) => setFormData({ ...formData, bankName: e.target.value.toUpperCase() })}
                     className="text-slate-600 placeholder:text-slate-400"
                  />
               </div>

               <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wide">
                     Account Type
                  </label>
                  <select
                     value={formData.accountType}
                     onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                     <option value="Cash">CASH</option>
                     <option value="UPI">DIGITAL WALLET / UPI</option>
                     <option value="Savings">SAVINGS ACCOUNT</option>
                     <option value="Current">CURRENT ACCOUNT</option>
                     <option value="Wallet">WALLET</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wide">
                     Opening Balance (₹)
                  </label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">₹</span>
                     <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
                     {isSubmitting ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                        <div className="w-2 h-2 bg-white rounded-full" />
                     )}
                  </div>
                  {isSubmitting ? 'REGISTERING...' : 'CONFIRM REGISTRATION'}
               </button>
            </form>
         </Modal>
      </div>
   );
};

export default BankAccountsPage;
