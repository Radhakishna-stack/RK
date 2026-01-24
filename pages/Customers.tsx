import React, { useState, useEffect } from 'react';
import {
  Search, Phone, Bike, Trash2, Users, MapPin
} from 'lucide-react';
import { dbService } from '../db';
import { Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this customer? This action cannot be undone.')) {
      await dbService.deleteCustomer(id);
      loadData();
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.phone.includes(search) ||
      customer.bikeNumber.toLowerCase().includes(search) ||
      (customer.city && customer.city.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-600 mt-1">{customers.length} total customers</p>
        </div>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search by name, phone, bike number, or city..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No matching customers' : 'No customers yet'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? 'Try a different search term' : 'Customers will appear here once you create a sale or job'}
              </p>
            </div>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Name */}
                  <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                        {customer.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Bike className="w-4 h-4" />
                      <span className="font-semibold">{customer.bikeNumber}</span>
                    </div>
                    {customer.city && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{customer.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Points */}
                  {customer.loyaltyPoints > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-semibold">
                      ⭐ {customer.loyaltyPoints} points
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
