
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Package, TrendingDown, TrendingUp, AlertCircle, Edit3, Trash2
} from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface InventoryPageProps {
  onNavigate: (tab: string, query?: string) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    unitPrice: '',
    purchasePrice: '',
    itemCode: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getInventory();
      setItems(data);
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
      if (editingItem) {
        // Update existing item
        await dbService.updateStock(editingItem.id, parseInt(formData.stock) - editingItem.stock);
      } else {
        // Add new item
        await dbService.addInventoryItem({
          ...formData,
          stock: parseInt(formData.stock) || 0,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          purchasePrice: parseFloat(formData.purchasePrice) || 0
        });
      }

      await loadData();
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: '', category: '', stock: '', unitPrice: '', purchasePrice: '', itemCode: '' });
    } catch (err) {
      alert('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this item? This action cannot be undone.')) {
      await dbService.deleteInventoryItem(id);
      loadData();
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock.toString(),
      unitPrice: item.unitPrice.toString(),
      purchasePrice: item.purchasePrice.toString(),
      itemCode: item.itemCode
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorize items by stock level
  const lowStockItems = items.filter(item => item.stock < 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-600 mt-1">{items.length} items in stock</p>
        </div>
        <Button onClick={() => {
          setEditingItem(null);
          setFormData({ name: '', category: '', stock: '', unitPrice: '', purchasePrice: '', itemCode: '' });
          setIsModalOpen(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Low Stock Alert</h3>
              <p className="text-sm text-amber-700">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low on stock
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <Input
        type="text"
        placeholder="Search by name, category, or item code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      {/* Items Grid */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No matching items' : 'No inventory items'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Add your first inventory item to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Item
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Name and Category */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-600">{item.category}</p>
                  </div>

                  {/* Stock Level */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">
                        Stock: <span className={`font-semibold ${item.stock < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.stock}
                        </span>
                      </span>
                    </div>
                    {item.stock < 10 && (
                      <Badge variant="warning" size="sm">Low Stock</Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-slate-600">Purchase: </span>
                      <span className="font-semibold text-slate-900">₹{item.purchasePrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Selling: </span>
                      <span className="font-semibold text-green-600">₹{item.unitPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Item Code */}
                  {item.itemCode && (
                    <p className="text-xs text-slate-500 font-mono">Code: {item.itemCode}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            type="text"
            required
            placeholder="Enter item name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<Package className="w-5 h-5" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              type="text"
              required
              placeholder="Parts, Oil, etc."
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />

            <Input
              label="Item Code"
              type="text"
              placeholder="SKU/Code"
              value={formData.itemCode}
              onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
            />
          </div>

          <Input
            label="Stock Quantity"
            type="number"
            required
            placeholder="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase Price"
              type="number"
              required
              placeholder="₹ 0"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              icon={<TrendingDown className="w-5 h-5" />}
            />

            <Input
              label="Selling Price"
              type="number"
              required
              placeholder="₹ 0"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>

          <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
