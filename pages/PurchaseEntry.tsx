import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Save, Trash2, User, Package, Calendar, FileText, ShoppingCart } from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, Customer, Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AutocompleteDropdown } from '../components/AutocompleteDropdown';

interface PurchaseEntryPageProps {
    onNavigate: (tab: string) => void;
}

const PurchaseEntryPage: React.FC<PurchaseEntryPageProps> = ({ onNavigate }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [suppliers, setSuppliers] = useState<Customer[]>([]); // Reusing Customer type for suppliers
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState(''); // Purchase Invoice / Ref No

    // Supplier Autocomplete
    const [filteredSuppliers, setFilteredSuppliers] = useState<Customer[]>([]);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

    // Items
    const [items, setItems] = useState<{
        id: string; // temp id
        inventoryId?: string; // if linked to inventory
        name: string;
        quantity: number;
        price: number;
    }[]>([]);

    // New Item Input State
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    // Item Autocomplete
    const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [inventoryData, customersData] = await Promise.all([
                dbService.getInventory(),
                dbService.getCustomers()
            ]);
            setInventory(inventoryData);
            setSuppliers(customersData); // In future, fetch distinct suppliers? For now using Customers as address book
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSupplierChange = (val: string) => {
        setSupplierName(val);
        if (val.trim()) {
            const filtered = suppliers.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));
            setFilteredSuppliers(filtered);
            setShowSupplierDropdown(filtered.length > 0);
        } else {
            setShowSupplierDropdown(false);
        }
    };

    const selectSupplier = (s: Customer) => {
        setSupplierName(s.name);
        setShowSupplierDropdown(false);
    };

    const handleItemNameChange = (val: string) => {
        setNewItemName(val);
        if (val.trim()) {
            const filtered = inventory.filter(i => i.name.toLowerCase().includes(val.toLowerCase()));
            setFilteredItems(filtered);
            setShowItemDropdown(filtered.length > 0);
        } else {
            setShowItemDropdown(false);
        }
    };

    const selectItem = (item: InventoryItem) => {
        setNewItemName(item.name);
        setNewItemPrice(item.purchasePrice ? item.purchasePrice.toString() : '');
        // Store selected inventory ID temporarily to link when adding?
        // Actually we can just lookup by name or keep a ref.
        // Let's use name matching for simplicity or finding id from list.
        setShowItemDropdown(false);
    };

    const handleAddItem = () => {
        if (!newItemName || !newItemQty || !newItemPrice) return;

        // Check if it matches an existing inventory item
        const inventoryItem = inventory.find(i => i.name.toLowerCase() === newItemName.toLowerCase());

        setItems([...items, {
            id: Date.now().toString(),
            inventoryId: inventoryItem?.id,
            name: newItemName,
            quantity: parseInt(newItemQty) || 0,
            price: parseFloat(newItemPrice) || 0
        }]);

        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }, [items]);

    const handleSave = async () => {
        if (!supplierName || items.length === 0) {
            alert('Please enter supplier and adds items');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update Inventory Stock
            for (const item of items) {
                if (item.inventoryId) {
                    await dbService.updateStock(item.inventoryId, item.quantity, 'Purchase');
                    // Also update purchase price?
                    // await dbService.updateItem(item.inventoryId, { purchasePrice: item.price });
                } else {
                    // New Manual Item? 
                    // Option to create it in inventory?
                    // For now, if no ID, we just record transaction. 
                    // But user might want to Add to Inventory.
                    // Let's auto-create if it doesn't exist? 
                    // Or just skip stock update for manual items (as per old logic).
                }
            }

            // 2. Add Transaction
            const itemDetails = items.map(i => `${i.name} (${i.quantity} x ${i.price})`).join(', ');

            await dbService.addTransaction({
                type: 'purchase',
                amount: totalAmount,
                category: 'Inventory Purchase',
                description: `Purchase from ${supplierName} ${invoiceNumber ? `(Ref: ${invoiceNumber})` : ''}: ${itemDetails}`,
                date: date
            });

            alert('Purchase recorded successfully!');
            onNavigate('purchase'); // Go back to list
        } catch (err) {
            console.error(err);
            alert('Failed to save purchase');
        } finally {
            setIsSaving(false);
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
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 -mx-4 px-4 py-4 md:mx-0 md:px-0 md:static">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate('purchase')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">New Purchase</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column: Details & Items */}
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Purchase Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ref No. / Invoice</label>
                                <Input type="text" placeholder="Optional" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-blue-600" />
                            Supplier Details
                        </h2>
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                            <Input
                                type="text"
                                placeholder="Search or enter supplier name..."
                                value={supplierName}
                                onChange={(e) => handleSupplierChange(e.target.value)}
                            />
                            <AutocompleteDropdown
                                show={showSupplierDropdown}
                                customers={filteredSuppliers}
                                onSelect={selectSupplier}
                                displayField="name"
                            />
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                            Add Items
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[1fr_80px_100px] gap-2">
                                <div className="relative">
                                    <Input
                                        placeholder="Item Name"
                                        value={newItemName}
                                        onChange={(e) => handleItemNameChange(e.target.value)}
                                    />
                                    {/* Dropdown for items */}
                                    {showItemDropdown && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {filteredItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => selectItem(item)}
                                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                                                >
                                                    {item.name} <span className="text-slate-400 text-xs">({item.stock})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Input
                                    type="number"
                                    placeholder="Qty"
                                    value={newItemQty}
                                    onChange={(e) => setNewItemQty(e.target.value)}
                                />
                                <Input
                                    type="number"
                                    placeholder="Price"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddItem} className="w-full" disabled={!newItemName}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-blue-600" />
                            Items Summary
                        </h2>

                        <div className="flex-1 overflow-y-auto min-h-[300px] space-y-2">
                            {items.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    No items added
                                </div>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-slate-900">{item.name}</div>
                                            <div className="text-sm text-slate-500">{item.quantity} x ₹{item.price}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-700">₹{(item.quantity * item.price).toLocaleString()}</span>
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-200 mt-4 space-y-4">
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total Amount</span>
                                <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving || items.length === 0 || !supplierName}
                                className="w-full"
                                size="lg"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {isSaving ? 'Recording...' : 'Complete Purchase'}
                            </Button>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default PurchaseEntryPage;
