import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Users, Package, FileText, AlertCircle } from 'lucide-react';
import { dbService } from '../db';
import { RecycleBinItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const RecycleBinPage: React.FC = () => {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getRecycleBinItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm('Restore this item?')) {
      await dbService.restoreFromRecycleBin(id);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanently delete this item? This cannot be undone.')) {
      await dbService.permanentlyDelete(id);
      loadData();
    }
  };

  const handleEmptyBin = async () => {
    if (window.confirm('Permanently delete all items? This cannot be undone.')) {
      await dbService.emptyRecycleBin();
      loadData();
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'Customer': return Users;
      case 'Inventory': return Package;
      case 'Invoice': return FileText;
      case 'Complaint': return AlertCircle;
      default: return FileText;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'Customer': return 'bg-blue-100 text-blue-600';
      case 'Inventory': return 'bg-green-100 text-green-600';
      case 'Invoice': return 'bg-purple-100 text-purple-600';
      case 'Complaint': return 'bg-amber-100 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading recycle bin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recycle Bin</h1>
          <p className="text-sm text-slate-600 mt-1">{items.length} deleted items</p>
        </div>
        {items.length > 0 && (
          <Button
            variant="danger"
            onClick={handleEmptyBin}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Empty Bin
          </Button>
        )}
      </div>

      {/* Warning Card */}
      {items.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Items are automatically deleted after 30 days</p>
              <p className="text-xs text-slate-600 mt-1">Restore important items before they're permanently removed.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Trash2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Recycle bin is empty</h3>
              <p className="text-slate-600">Deleted items will appear here</p>
            </div>
          </Card>
        ) : (
          items
            .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
            .map((item) => {
              const Icon = getCategoryIcon(item.type);
              const colorClass = getCategoryColor(item.type);

              return (
                <Card key={item.binId} padding="md">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{item.data.name || item.data.customerName || item.data.description || 'Deleted Item'}</h3>
                          <Badge variant="neutral" size="sm">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          Deleted {new Date(item.deletedAt).toLocaleDateString()}
                        </p>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRestore(item.binId)}
                        className="flex-1"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(item.binId)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
};

export default RecycleBinPage;
