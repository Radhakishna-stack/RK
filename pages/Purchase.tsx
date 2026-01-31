import React, { useState, useEffect } from 'react';
import { Plus, Package, Building, Phone, Calculator, Check, ArrowLeft, Edit2, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, Customer, Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface PurchaseItem {
   itemId: string;
   name: string;
   quantity: number;
   purchasePrice: number;
}

interface PurchasePageProps {
   onNavigate: (tab: string) => void;
}

const PurchasePage: React.FC<PurchasePageProps> = ({ onNavigate }) => {
   const [inventory, setInventory] = useState<InventoryItem[]>([]);
   // Suppliers are Customers in reusing the type, but might be just names manually
   const [suppliers, setSuppliers] = useState<Customer[]>([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [loading, setLoading] = useState(true);

   // Form State
   const [supplierName, setSupplierName] = useState('');
   const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
   const [filteredSuppliers, setFilteredSuppliers] = useState<Customer[]>([]);

   const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

   // Item Selection State
   const [selectedItemId, setSelectedItemId] = useState('');
   const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: '1' });
   const [useManualItem, setUseManualItem] = useState(false);
   const [transactions, setTransactions] = useState<Transaction[]>([]);

   // Edit Transaction State
   const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
   const [editForm, setEditForm] = useState({
      date: '',
      amount: '',
      description: ''
   });

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);
      try {
         const [inventoryData, customersData, txnsData] = await Promise.all([
            dbService.getInventory(),
            dbService.getCustomers(),
            dbService.getTransactions()
         ]);
         setInventory(inventoryData);
         setSuppliers(customersData);
         setTransactions(txnsData.filter(t => t.type === 'purchase').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleSupplierSearch = (val: string) => {
      setSupplierName(val);
      if (val.trim()) {
         const filtered = suppliers.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));
         setFilteredSuppliers(filtered);
         setShowSupplierDropdown(filtered.length > 0);
      } else {
         setShowSupplierDropdown(false);
      }
   };

   const selectSupplier = (supplier: Customer) => {
      setSupplierName(supplier.name);
      setShowSupplierDropdown(false);
   };

   const addItem = () => {
      if (useManualItem) {
         if (!manualItem.name || !manualItem.price) return;
         setPurchaseItems([...purchaseItems, {
            itemId: 'MANUAL-' + Date.now(),
            name: manualItem.name,
            quantity: parseInt(manualItem.quantity) || 1,
            purchasePrice: parseFloat(manualItem.price) || 0
         }]);
         setManualItem({ name: '', price: '', quantity: '1' });
      } else {
         if (!selectedItemId) return;
         const item = inventory.find(i => i.id === selectedItemId);
         if (!item) return;

         setPurchaseItems([...purchaseItems, {
            itemId: item.id,
            name: item.name,
            quantity: 1,
            purchasePrice: item.purchasePrice || 0
         }]);
         setSelectedItemId('');
      }
   };

   const updateQuantity = (index: number, quantity: number) => {
      const updated = [...purchaseItems];
      updated[index].quantity = quantity;
      setPurchaseItems(updated);
   };

   const updatePrice = (index: number, price: number) => {
      const updated = [...purchaseItems];
      updated[index].purchasePrice = price;
      setPurchaseItems(updated);
   };

   const removeItem = (index: number) => {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
   };

   const totalAmount = purchaseItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

   const completePurchase = async () => {
      if (!supplierName || purchaseItems.length === 0) {
         alert('Please enter supplier and add items');
         return;
      }

      try {
         // Update inventory quantities ONLY for existing items
         for (const item of purchaseItems) {
            // Check if it's a real inventory item (not manual)
            // We assume manual items start with MANUAL-
            if (!item.itemId.startsWith('MANUAL-')) {
               const inventoryItem = inventory.find(i => i.id === item.itemId);
               // Double check
               if (inventoryItem) {
                  await dbService.updateStock(item.itemId, item.quantity, 'Purchase');
               }
            }
         }

         // Construct detailed description
         const itemDetails = purchaseItems.map(i => `${i.name} (${i.quantity} x ${i.purchasePrice})`).join(', ');

         // Record transaction
         await dbService.addTransaction({
            type: 'purchase',
            amount: totalAmount,
            category: 'Inventory Purchase',
            description: `Purchase from ${supplierName}: ${itemDetails}`,
            date: new Date().toISOString()
         });

         alert('Purchase recorded successfully!');
         setPurchaseItems([]);
         setSupplierName('');
         setIsModalOpen(false);
         loadData();
      } catch (err) {
         alert('Failed to record purchase. Please try again.');
      }
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
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">Purchase</h1>
                  <p className="text-sm text-slate-600 mt-1">Record stock purchases</p>
               </div>
            </div>
            <Button onClick={() => {
               setIsModalOpen(true);
               setSupplierName('');
               setPurchaseItems([]);
            }}>
               <Plus className="w-5 h-5 mr-2" />
               New Purchase
            </Button>
         </div>

         <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
               <Package className="w-12 h-12 text-blue-600 mx-auto mb-2" />
               <h3 className="text-lg font-bold text-slate-900">Record Your Purchases</h3>
               <p className="text-sm text-slate-600 mt-1">Keep track of inventory purchases and stock updates</p>
            </div>
         </Card>

         <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Purchases</h2>
            {transactions.length === 0 ? (
               <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                  No purchases recorded yet
               </div>
            ) : (
               <div className="grid gap-3">
                  {transactions.map((txn) => (
                     <Card key={txn.id} padding="md">
                        <div className="flex justify-between items-start">
                           <div className="flex-1">
                              <div className="font-semibold text-slate-900 line-clamp-2">{txn.description}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                 {new Date(txn.date).toLocaleDateString()} • {new Date(txn.date).toLocaleTimeString()}
                              </div>
                           </div>
                           <div className="text-right pl-4">
                              <div className="text-lg font-bold text-red-600">-₹{txn.amount.toLocaleString()}</div>
                              <div className="flex flex-col items-end gap-1 mt-1">
                                 <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                    Purchase
                                 </div>
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
                     </Card>
                  ))}
               </div>
            )}
         </div>

         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="New Purchase"
            size="md"
         >
            <div className="space-y-4">
               <div className="space-y-1.5 relative">
                  <label className="block text-sm font-semibold text-slate-700">Supplier</label>
                  <Input
                     type="text"
                     placeholder="Search or Enter Supplier Name..."
                     value={supplierName}
                     onChange={(e) => handleSupplierSearch(e.target.value)}
                  />
                  {/* Using custom render for Suppliers since they reuse Customer type but logic handles string input */}
                  {showSupplierDropdown && (
                     <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredSuppliers.map(s => (
                           <div
                              key={s.id}
                              onClick={() => selectSupplier(s)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                           >
                              {s.name}
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-semibold text-slate-700">Add Items</label>
                     <button
                        onClick={() => setUseManualItem(!useManualItem)}
                        className="text-xs text-blue-600 font-bold hover:underline"
                     >
                        {useManualItem ? 'Switch to Inventory Item' : 'Add Manual Item'}
                     </button>
                  </div>

                  {useManualItem ? (
                     <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                           <Input
                              placeholder="Item Name"
                              value={manualItem.name}
                              onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                           />
                        </div>
                        <div className="col-span-3">
                           <Input
                              type="number"
                              placeholder="Price"
                              value={manualItem.price}
                              onChange={(e) => setManualItem({ ...manualItem, price: e.target.value })}
                           />
                        </div>
                        <div className="col-span-2">
                           <Input
                              type="number"
                              placeholder="Qty"
                              value={manualItem.quantity}
                              onChange={(e) => setManualItem({ ...manualItem, quantity: e.target.value })}
                           />
                        </div>
                        <div className="col-span-2">
                           <Button onClick={addItem} className="w-full">
                              <Plus className="w-5 h-5" />
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex gap-2">
                        <select
                           value={selectedItemId}
                           onChange={(e) => setSelectedItemId(e.target.value)}
                           className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="">Select inventory item...</option>
                           {inventory.map(item => (
                              <option key={item.id} value={item.id}>{item.name} - (Stock: {item.stock})</option>
                           ))}
                        </select>
                        <Button onClick={addItem} disabled={!selectedItemId}>
                           <Plus className="w-5 h-5" />
                        </Button>
                     </div>
                  )}
               </div>

               {purchaseItems.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                     {purchaseItems.map((item, index) => (
                        <Card key={index} padding="sm">
                           <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                 <span className="font-semibold text-sm">{item.name}</span>
                                 <button
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-700"
                                 >
                                    ×
                                 </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                 <Input
                                    label="Qty"
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                                 />
                                 <Input
                                    label="Price"
                                    type="number"
                                    value={item.purchasePrice}
                                    onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                                 />
                              </div>
                              <p className="text-sm font-bold text-blue-600">
                                 Total: ₹{(item.quantity * item.purchasePrice).toLocaleString()}
                              </p>
                           </div>
                        </Card>


                     ))}
                  </div>
               )}

               {purchaseItems.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-slate-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span>
                     </div>
                  </div>
               )}

               <div className="border-t border-slate-200 pt-4 flex gap-3">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                     Cancel
                  </Button>
                  <Button
                     onClick={completePurchase}
                     disabled={!supplierName || purchaseItems.length === 0}
                     className="flex-1"
                  >
                     <Check className="w-4 h-4 mr-1" />
                     Complete Purchase
                  </Button>
               </div>
            </div>
         </Modal>
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
                     It will NOT automatically adjust inventory stock. If you need to correct stock, please do so manually in the Inventory tab.
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
