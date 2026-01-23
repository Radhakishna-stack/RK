import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Phone, User, Trash2, Navigation, Target } from 'lucide-react';
import { dbService } from '../db';
import { Salesman, StaffLocation } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const SalesmanTrackingPage: React.FC = () => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    targetArea: ''
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesmenData, locationsData] = await Promise.all([
        dbService.getSalesmen(),
        dbService.getStaffLocations()
      ]);
      setSalesmen(salesmenData);
      setLocations(locationsData);
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
      await dbService.addSalesman(formData);

      await loadData();
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', targetArea: '' });
    } catch (err) {
      alert('Failed to add salesman. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this salesman? This action cannot be undone.')) {
      await dbService.deleteSalesman(id);
      loadData();
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getLocationForSalesman = (salesmanId: string) => {
    return locations.find(loc => loc.staffId === salesmanId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Team Tracking</h1>
          <p className="text-sm text-slate-600 mt-1">{salesmen.length} team members</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Active Team Count */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Navigation className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-blue-100 mb-1">Active in Field</p>
            <h2 className="text-4xl font-bold">{locations.length}</h2>
          </div>
        </div>
      </Card>

      {/* Team Members List */}
      <div className="space-y-3">
        {salesmen.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No team members</h3>
              <p className="text-slate-600 mb-4">Add your first field team member to start tracking</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add First Member
              </Button>
            </div>
          </Card>
        ) : (
          salesmen.map((salesman) => {
            const location = getLocationForSalesman(salesman.id);
            const isActive = location &&
              (new Date().getTime() - new Date(location.timestamp).getTime()) < 900000; // Active in last 15 mins

            return (
              <Card key={salesman.id} padding="md">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isActive ? 'bg-green-100' : 'bg-slate-100'}
                    `}>
                      <User className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-slate-400'}`} />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{salesman.name}</h3>
                        <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                          {isActive ? 'Active' : 'Offline'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{salesman.phone}</span>
                        </div>
                        {salesman.targetArea && (
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            <span>{salesman.targetArea}</span>
                          </div>
                        )}
                        {location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs">
                              Last seen {new Date(location.timestamp).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {location && isActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openGoogleMaps(location.lat, location.lng)}
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          View on Map
                        </Button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(salesman.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Salesman Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Field Team Member"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            required
            placeholder="Enter member name"
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

          <Input
            label="Target Area"
            type="text"
            placeholder="e.g., North Zone, Downtown (Optional)"
            value={formData.targetArea}
            onChange={(e) => setFormData({ ...formData, targetArea: e.target.value })}
            icon={<Target className="w-5 h-5" />}
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
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesmanTrackingPage;
