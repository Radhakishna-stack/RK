import React, { useState, useEffect } from 'react';
import { Plus, Package, Building, Phone, Calculator, Check, ArrowLeft } from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, Customer } from '../types';
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
   const [suppliers, setSuppliers] = useState<Customer[]>([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [loading, setLoading] = useState(true);
   const [selectedSupplier, setSelectedSupplier] = useState('');
   const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
   const [selectedItem, setSelectedItem] = useState('');

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);
      try {
         const [inventoryData, customersData] = await Promise.all([
            dbService.getInventory(),
            dbService.getCustomers()
         ]);
         setInventory(inventoryData);
         setSuppliers(customersData);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const addItem = () => {
      if (!selectedItem) return;
      const item = inventory.find(i => i.id === selectedItem);
      if (!item) return;

      setPurchaseItems([...purchaseItems, {
         itemId: item.id,
         name: item.name,
         quantity: 1,
         purchasePrice: item.purchasePrice || 0
      }]);
      setSelectedItem('');
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
      if (!selectedSupplier || purchaseItems.length === 0) {
         alert('Please select supplier and add items');
         return;
      }

      try {
         // Update inventory quantities
         for (const item of purchaseItems) {
            const inventoryItem = inventory.find(i => i.id === item.itemId);
            if (inventoryItem) {
               await dbService.updateStock(item.itemId, item.quantity, 'Purchase');
            }
         }

         // Record transaction
         await dbService.addTransaction({
            type: 'purchase',
            amount: totalAmount,
            category: 'Inventory Purchase',
            description: `Purchase from ${suppliers.find(s => s.id === selectedSupplier)?.name}`,
            date: new Date().toISOString()
         });

         alert('Purchase recorded successfully!');
         setPurchaseItems([]);
         setSelectedSupplier('');
         setIsModalOpen(false);
         loadData();
      } catch (err) {
         alert('Failed to record purchase. Please try again.');
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
            <Button onClick={() => setIsModalOpen(true)}>
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

         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="New Purchase"
            size="md"
         >
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Supplier</label>
                  <select
                     value={selectedSupplier}
                     onChange={(e) => setSelectedSupplier(e.target.value)}
                     className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     <option value="">Select supplier</option>
                     {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                     ))}
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Add Items</label>
                  <div className="flex gap-2">
                     <select
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                        <option value="">Select item</option>
                        {inventory.map(item => (
                           <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                     </select>
                     <Button onClick={addItem} disabled={!selectedItem}>
                        <Plus className="w-5 h-5" />
                     </Button>
                  </div>
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
                     disabled={!selectedSupplier || purchaseItems.length === 0}
                     className="flex-1"
                  >
                     <Check className="w-4 h-4 mr-1" />
                     Complete Purchase
                  </Button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default PurchasePage;
