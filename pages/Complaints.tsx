
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Clock, CheckCircle, AlertCircle, Bike, Phone, Calendar, DollarSign, X,
  Camera, Upload, Image as ImageIcon, Trash2, User, ArrowLeft, UserCheck, ChevronDown, Wrench
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, Customer, User as AppUser } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface ComplaintsPageProps {
  onNavigate: (tab: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsedLabel(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function mechanicInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ComplaintsPage: React.FC<ComplaintsPageProps> = ({ onNavigate }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mechanics, setMechanics] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [filterMechanic, setFilterMechanic] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingJob, setEditingJob] = useState<Complaint | null>(null);
  const [formData, setFormData] = useState({
    bikeNumber: '',
    customerName: '',
    customerPhone: '',
    city: '',
    details: '',
    estimatedCost: '',
    dueDate: '',
    odometerReading: '',
    assignedMechanicId: '',
    assignedMechanicName: ''
  });
  const [images, setImages] = useState<string[]>([]);

  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    loadCustomers();
    loadMechanics();
    const handleSync = () => { loadData(true); loadCustomers(); loadMechanics(); };
    window.addEventListener('mg_data_updated', handleSync);
    return () => window.removeEventListener('mg_data_updated', handleSync);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await dbService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await dbService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadMechanics = async () => {
    try {
      const users = await dbService.getUsers();
      // Show all active staff who can work on jobs
      setMechanics(users.filter(u => u.isActive && (u.role === 'mechanic' || u.role === 'employee' || u.role === 'manager')));
    } catch (err) {
      console.error('Failed to load mechanics:', err);
    }
  };

  const handleBikeNumberChange = (value: string) => {
    setFormData({ ...formData, bikeNumber: value.toUpperCase() });
    if (value.length >= 2) {
      const filtered = customers.filter(c =>
        c.bikeNumber.toUpperCase().includes(value.toUpperCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, customerPhone: value });
    if (value.length >= 3) {
      const filtered = customers.filter(c =>
        c.phone.includes(value)
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      bikeNumber: customer.bikeNumber,
      customerName: customer.name,
      customerPhone: customer.phone,
      city: customer.city || ''
    });
    setShowSuggestions(false);
  };

  const handleMechanicSelect = (userId: string) => {
    if (!userId) {
      setFormData({ ...formData, assignedMechanicId: '', assignedMechanicName: '' });
      return;
    }
    const mechanic = mechanics.find(m => m.id === userId);
    setFormData({
      ...formData,
      assignedMechanicId: mechanic?.id || '',
      assignedMechanicName: mechanic?.name || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingJob) {
        await dbService.updateComplaint(editingJob.id, {
          ...formData,
          estimatedCost: parseInt(formData.estimatedCost) || 0,
          odometerReading: parseInt(formData.odometerReading) || 0,
          photoUrls: images
        });
      } else {
        const existingCustomers = await dbService.getCustomers();
        const existingCustomer = existingCustomers.find(
          c => c.bikeNumber.toUpperCase() === formData.bikeNumber.toUpperCase()
        );
        if (!existingCustomer) {
          await dbService.addCustomer({
            name: formData.customerName,
            phone: formData.customerPhone,
            bikeNumber: formData.bikeNumber.toUpperCase(),
            city: formData.city || '',
            loyaltyPoints: 0
          });
        } else if (existingCustomer.name !== formData.customerName || existingCustomer.phone !== formData.customerPhone) {
          await dbService.updateCustomer(existingCustomer.id, {
            name: formData.customerName,
            phone: formData.customerPhone,
            city: formData.city || existingCustomer.city || ''
          });
        }
        await dbService.addComplaint({
          ...formData,
          bikeNumber: formData.bikeNumber.toUpperCase(),
          estimatedCost: parseInt(formData.estimatedCost) || 0,
          odometerReading: parseInt(formData.odometerReading) || 0,
          photoUrls: images
        });
        loadCustomers();
      }
      await loadData();
      setIsModalOpen(false);
      setEditingJob(null);
      resetForm();
    } catch (err) {
      alert(`Failed to ${editingJob ? 'update' : 'create'} job. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ bikeNumber: '', customerName: '', customerPhone: '', city: '', details: '', estimatedCost: '', dueDate: '', odometerReading: '', assignedMechanicId: '', assignedMechanicName: '' });
    setImages([]);
  };

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    await dbService.updateComplaintStatus(id, newStatus);
    loadData();
  };

  const handleEdit = (job: Complaint) => {
    setEditingJob(job);
    setFormData({
      bikeNumber: job.bikeNumber,
      customerName: job.customerName,
      customerPhone: job.customerPhone || '',
      city: job.city || '',
      details: job.details,
      estimatedCost: job.estimatedCost?.toString() || '',
      dueDate: job.dueDate || '',
      odometerReading: job.odometerReading?.toString() || '',
      assignedMechanicId: job.assignedMechanicId || '',
      assignedMechanicName: job.assignedMechanicName || ''
    });
    setImages(job.photoUrls || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service job? This action cannot be undone.')) {
      try {
        await dbService.deleteComplaint(id);
        await loadData();
      } catch (err) {
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleQuickAssign = async (job: Complaint, mechanicId: string) => {
    const mechanic = mechanics.find(m => m.id === mechanicId);
    await dbService.updateComplaint(job.id, {
      ...job,
      photoUrls: job.photoUrls || [],
      assignedMechanicId: mechanic?.id || '',
      assignedMechanicName: mechanic?.name || ''
    });
    await loadData();
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch =
      complaint.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.assignedMechanicName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || complaint.status === filterStatus;
    const matchesMechanic = filterMechanic === 'ALL'
      ? true
      : filterMechanic === 'UNASSIGNED'
        ? !complaint.assignedMechanicId
        : complaint.assignedMechanicId === filterMechanic;
    return matchesSearch && matchesStatus && matchesMechanic;
  });

  const statusCounts = {
    pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
    inProgress: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length,
    completed: complaints.filter(c => c.status === ComplaintStatus.COMPLETED).length
  };

  const unassignedCount = complaints.filter(c => !c.assignedMechanicId && c.status !== ComplaintStatus.COMPLETED && c.status !== ComplaintStatus.CANCELLED).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Service Jobs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {complaints.length} total
              {unassignedCount > 0 && (
                <span className="ml-2 text-amber-600 font-semibold">· {unassignedCount} unassigned</span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setEditingJob(null); setIsModalOpen(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          New Job
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <StatusTab label="All" count={complaints.length} active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')} />
        <StatusTab label="Pending" count={statusCounts.pending} active={filterStatus === ComplaintStatus.PENDING} onClick={() => setFilterStatus(ComplaintStatus.PENDING)} variant="warning" />
        <StatusTab label="In Progress" count={statusCounts.inProgress} active={filterStatus === ComplaintStatus.IN_PROGRESS} onClick={() => setFilterStatus(ComplaintStatus.IN_PROGRESS)} variant="info" />
        <StatusTab label="Completed" count={statusCounts.completed} active={filterStatus === ComplaintStatus.COMPLETED} onClick={() => setFilterStatus(ComplaintStatus.COMPLETED)} variant="success" />
      </div>

      {/* Search + Mechanic Filter Row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search bike, customer, mechanic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="relative">
          <select
            value={filterMechanic}
            onChange={e => setFilterMechanic(e.target.value)}
            className="appearance-none h-full pl-4 pr-9 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Staff</option>
            <option value="UNASSIGNED">Unassigned</option>
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== 'ALL' || filterMechanic !== 'ALL' ? 'No matching jobs' : 'No jobs yet'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || filterStatus !== 'ALL' || filterMechanic !== 'ALL' ? 'Try adjusting your filters' : 'Create your first service job to get started'}
              </p>
              {!searchTerm && filterStatus === 'ALL' && filterMechanic === 'ALL' && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Job
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredComplaints.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              mechanics={mechanics}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onQuickAssign={handleQuickAssign}
            />
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); resetForm(); }}
        title={editingJob ? 'Edit Service Job' : 'Create New Job'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bike Number + customer autocomplete */}
          <div className="relative">
            <Input
              label="Bike Number"
              type="text"
              required
              placeholder="MH12AB1234"
              value={formData.bikeNumber}
              onChange={(e) => handleBikeNumberChange(e.target.value)}
              onFocus={() => formData.bikeNumber.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
              icon={<Bike className="w-5 h-5" />}
            />
            {showSuggestions && (
              <CustomerDropdown suggestions={suggestions} onSelect={selectCustomer} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              type="text"
              required
              placeholder="Full name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
            <div className="relative">
              <Input
                label="Phone"
                type="tel"
                required
                placeholder="10-digit number"
                value={formData.customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onFocus={() => formData.customerPhone.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                icon={<Phone className="w-5 h-5" />}
              />
              {showSuggestions && (
                <CustomerDropdown suggestions={suggestions} onSelect={selectCustomer} />
              )}
            </div>
          </div>

          <Input
            label="City"
            type="text"
            required
            placeholder="Enter city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />

          {/* Job Details */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Job Details</label>
            <textarea
              required
              placeholder="Describe the service required..."
              className="w-full px-4 py-3 min-h-[100px] bg-white border border-slate-200 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Cost"
              type="number"
              placeholder="₹ 0"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <Input
              label="Odometer (km)"
              type="number"
              placeholder="12500"
              value={formData.odometerReading}
              onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
              icon={<Clock className="w-5 h-5" />}
            />
          </div>

          <Input
            label="Due Date (Optional)"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            icon={<Calendar className="w-5 h-5" />}
          />

          {/* ── Mechanic Assignment ── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-500" />
              Assign Mechanic
            </label>
            <div className="relative">
              <select
                value={formData.assignedMechanicId}
                onChange={e => handleMechanicSelect(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              >
                <option value="">— Unassigned —</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Photos</label>
              <span className="text-xs text-slate-500">{images.length} added</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img} className="w-full h-full object-cover" alt="job" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(stream => {
                      setIsCameraOpen(true);
                      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; }
                    })
                    .catch(() => alert("Camera access denied"));
                }}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </button>
            </div>
            <input
              type="file"
              ref={galleryInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;
                const newPhotos: string[] = [];
                for (let i = 0; i < files.length; i++) {
                  const reader = new FileReader();
                  reader.readAsDataURL(files[i]);
                  await new Promise<void>(resolve => { reader.onloadend = () => { newPhotos.push(reader.result as string); resolve(); } });
                }
                setImages(prev => [...prev, ...newPhotos]);
              }}
            />
          </div>

          <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); }} className="p-2">
              <X className="w-6 h-6" />
            </button>
            <span className="font-bold">Take Photo</span>
            <div className="w-8" />
          </div>
          <div className="flex-1 bg-black relative flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-8 flex justify-center bg-black/80">
            <button
              onClick={() => {
                if (videoRef.current && canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                    ctx.drawImage(videoRef.current, 0, 0);
                    setImages(prev => [...prev, canvasRef.current!.toDataURL('image/jpeg')]);
                  }
                }
              }}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Customer Dropdown ─────────────────────────────────────────────────────────

const CustomerDropdown: React.FC<{ suggestions: Customer[]; onSelect: (c: Customer) => void }> = ({ suggestions, onSelect }) => (
  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
    {suggestions.map(customer => (
      <button
        key={customer.id}
        type="button"
        onClick={() => onSelect(customer)}
        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
      >
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{customer.bikeNumber}</span>
            <span>·</span><span>{customer.phone}</span>
            {customer.city && <><span>·</span><span>{customer.city}</span></>}
          </div>
        </div>
      </button>
    ))}
  </div>
);

// ─── Job Card Component ────────────────────────────────────────────────────────

const MECHANIC_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

function mechanicColor(id?: string): string {
  if (!id) return 'bg-slate-100 text-slate-500 border-slate-200';
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return MECHANIC_COLORS[Math.abs(hash) % MECHANIC_COLORS.length];
}

const JobCard: React.FC<{
  job: Complaint;
  mechanics: AppUser[];
  onStatusChange: (id: string, status: ComplaintStatus) => void;
  onEdit: (job: Complaint) => void;
  onDelete: (id: string) => void;
  onQuickAssign: (job: Complaint, mechanicId: string) => void;
}> = ({ job, mechanics, onStatusChange, onEdit, onDelete, onQuickAssign }) => {
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setShowAssignMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING: return <Badge variant="warning" size="sm">Pending</Badge>;
      case ComplaintStatus.IN_PROGRESS: return <Badge variant="info" size="sm">In Progress</Badge>;
      case ComplaintStatus.COMPLETED: return <Badge variant="success" size="sm">Completed</Badge>;
      case ComplaintStatus.CANCELLED: return <Badge variant="danger" size="sm">Cancelled</Badge>;
    }
  };

  const isOverdue = job.dueDate && new Date(job.dueDate) < new Date() && job.status !== ComplaintStatus.COMPLETED && job.status !== ComplaintStatus.CANCELLED;

  return (
    <Card>
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Bike className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-900">{job.bikeNumber}</h3>
              {getStatusBadge(job.status)}
              {job.photoUrls && job.photoUrls.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <ImageIcon className="w-3.5 h-3.5" />{job.photoUrls.length}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 truncate">{job.customerName}</p>
            {job.customerPhone && (
              <p className="text-xs text-slate-400">{job.customerPhone}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {job.estimatedCost > 0 && (
              <>
                <p className="text-xs text-slate-400">Estimated</p>
                <p className="text-base font-bold text-slate-900">₹{job.estimatedCost.toLocaleString()}</p>
              </>
            )}
          </div>
        </div>

        {/* Job details */}
        <p className="text-sm text-slate-700 line-clamp-2">{job.details}</p>

        {/* Meta row — elapsed time + due date */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {elapsedLabel(job.createdAt)}
          </span>
          {job.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              {isOverdue ? '⚠ Overdue: ' : 'Due: '}{new Date(job.dueDate).toLocaleDateString()}
            </span>
          )}
          {job.odometerReading && (
            <span>{job.odometerReading.toLocaleString()} km</span>
          )}
        </div>

        {/* Mechanic Assignment chip */}
        <div className="flex items-center gap-2" ref={assignRef}>
          {job.assignedMechanicId ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Handler:</span>
              <div
                className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold cursor-pointer select-none ${mechanicColor(job.assignedMechanicId)}`}
                onClick={() => setShowAssignMenu(v => !v)}
              >
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-black">
                  {mechanicInitials(job.assignedMechanicName)}
                </span>
                {job.assignedMechanicName}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAssignMenu(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dashed border-amber-300 text-amber-600 text-xs font-semibold hover:bg-amber-50 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Assign Mechanic
            </button>
          )}
          {/* Assign dropdown */}
          {showAssignMenu && (
            <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl min-w-[180px] overflow-hidden"
              style={{ marginTop: '30px' }}
            >
              <button
                onClick={() => { onQuickAssign(job, ''); setShowAssignMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100"
              >
                — Unassign
              </button>
              {mechanics.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onQuickAssign(job, m.id); setShowAssignMenu(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${job.assignedMechanicId === m.id ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700'}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${mechanicColor(m.id)}`}>
                    {mechanicInitials(m.name)}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          {job.status !== ComplaintStatus.COMPLETED && job.status !== ComplaintStatus.CANCELLED && (
            <>
              {job.status === ComplaintStatus.PENDING && (
                <Button size="sm" variant="secondary" onClick={() => onStatusChange(job.id, ComplaintStatus.IN_PROGRESS)} className="flex-1">
                  Start Work
                </Button>
              )}
              {job.status === ComplaintStatus.IN_PROGRESS && (
                <Button size="sm" onClick={() => onStatusChange(job.id, ComplaintStatus.COMPLETED)} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(job)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(job.id)} className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ─── Status Tab ────────────────────────────────────────────────────────────────

const StatusTab: React.FC<{
  label: string; count: number; active: boolean; onClick: () => void; variant?: 'warning' | 'info' | 'success';
}> = ({ label, count, active, onClick, variant }) => {
  const colors = {
    warning: active ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    info: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    success: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
  };
  const defaultColor = active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50';
  const colorClass = variant ? colors[variant] : defaultColor;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${colorClass} ${active ? 'shadow-sm' : 'border border-slate-200'}`}
    >
      {label} ({count})
    </button>
  );
};

export default ComplaintsPage;
