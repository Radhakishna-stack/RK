import React, { useState, useEffect } from 'react';
import { Shield, Plus, User, Phone, Key, Trash2, ArrowLeft } from 'lucide-react';
import { dbService } from '../db';
import { Salesman } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface StaffControlCenterProps {
  onNavigate: (tab: string) => void;
}

const StaffControlCenter: React.FC<StaffControlCenterProps> = ({ onNavigate }) => {
  const [staff, setStaff] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Technician',
    accessCode: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getSalesmen();
      setStaff(data);
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
      await dbService.addSalesman({
        ...formData,
        targetArea: formData.role // Using targetArea field for role
      });

      await loadData();
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', role: 'Technician', accessCode: '' });
    } catch (err) {
      alert('Failed to add staff member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this staff member? This action cannot be undone.')) {
      await dbService.deleteSalesman(id);
      loadData();
    }
  };

  const roles = ['Technician', 'Salesman', 'Manager', 'Accountant'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff Control</h1>
            <p className="text-sm text-slate-600 mt-1">{staff.length} staff members</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Total Count */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-blue-100 mb-1">Total Staff</p>
            <h2 className="text-4xl font-bold">{staff.length}</h2>
          </div>
        </div>
      </Card>

      {/* Staff List */}
      <div className="space-y-3">
        {staff.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No staff members</h3>
              <p className="text-slate-600 mb-4">Add your first staff member to get started</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add First Staff
              </Button>
            </div>
          </Card>
        ) : (
          staff.map((member) => (
            <Card key={member.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                      <Badge variant="info" size="sm">
                        {member.targetArea || 'Staff'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Staff Member"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            required
            placeholder="Enter staff name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="w-5 h-5" />}
          />

          <Input
            label="Phone"
            type="tel"
            required
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={<Phone className="w-5 h-5" />}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`
                    p-3 rounded-xl font-semibold text-sm transition-all
                    ${formData.role === role
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Access Code (Optional)"
            type="password"
            placeholder="4-digit PIN"
            value={formData.accessCode}
            onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
            icon={<Key className="w-5 h-5" />}
            helperText="Used for staff login to employee panel"
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
              Add Staff
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffControlCenter;
