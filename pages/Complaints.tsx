
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Clock, CheckCircle, AlertCircle, Bike, Phone, Calendar, DollarSign, X,
  Camera, Upload, FlipHorizontal, Image as ImageIcon, Trash2
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bikeNumber: '',
    customerName: '',
    customerPhone: '',
    details: '',
    estimatedCost: '',
    dueDate: '',
    odometerReading: ''
  });
  const [images, setImages] = useState<string[]>([]);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getComplaints();
      setComplaints(data);
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
      await dbService.addComplaint({
        ...formData,
        estimatedCost: parseInt(formData.estimatedCost) || 0,
        odometerReading: parseInt(formData.odometerReading) || 0,
        photoUrls: images
      });
      await loadData();
      setIsModalOpen(false);
      setFormData({ bikeNumber: '', customerName: '', customerPhone: '', details: '', estimatedCost: '', dueDate: '', odometerReading: '' });
      setImages([]);
    } catch (err) {
      alert('Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    await dbService.updateComplaintStatus(id, newStatus);
    loadData();
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch =
      complaint.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'ALL' || complaint.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Count by status
  const statusCounts = {
    pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
    inProgress: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length,
    completed: complaints.filter(c => c.status === ComplaintStatus.COMPLETED).length
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Jobs</h1>
          <p className="text-sm text-slate-600 mt-1">{complaints.length} total jobs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          New Job
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <StatusTab
          label="All"
          count={complaints.length}
          active={filterStatus === 'ALL'}
          onClick={() => setFilterStatus('ALL')}
        />
        <StatusTab
          label="Pending"
          count={statusCounts.pending}
          active={filterStatus === ComplaintStatus.PENDING}
          onClick={() => setFilterStatus(ComplaintStatus.PENDING)}
          variant="warning"
        />
        <StatusTab
          label="In Progress"
          count={statusCounts.inProgress}
          active={filterStatus === ComplaintStatus.IN_PROGRESS}
          onClick={() => setFilterStatus(ComplaintStatus.IN_PROGRESS)}
          variant="info"
        />
        <StatusTab
          label="Completed"
          count={statusCounts.completed}
          active={filterStatus === ComplaintStatus.COMPLETED}
          onClick={() => setFilterStatus(ComplaintStatus.COMPLETED)}
          variant="success"
        />
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search by bike number, customer, or details..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== 'ALL' ? 'No matching jobs' : 'No jobs yet'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Create your first service job to get started'}
              </p>
              {!searchTerm && filterStatus === 'ALL' && (
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
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Add Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Job"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bike Number"
            type="text"
            required
            placeholder="MH12AB1234"
            value={formData.bikeNumber}
            onChange={(e) => setFormData({ ...formData, bikeNumber: e.target.value.toUpperCase() })}
            icon={<Bike className="w-5 h-5" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              type="text"
              required
              placeholder="Full name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />

            <Input
              label="Phone"
              type="tel"
              required
              placeholder="10-digit number"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              icon={<Phone className="w-5 h-5" />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Job Details
            </label>
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

          {/* Photo Upload Section */}
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
                      if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;
                      }
                    })
                    .catch(err => alert("Camera access denied"));
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
                  await new Promise<void>(resolve => {
                    reader.onloadend = () => {
                      newPhotos.push(reader.result as string);
                      resolve();
                    }
                  });
                }
                setImages(prev => [...prev, ...newPhotos]);
              }}
            />
          </div>

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
              Create Job
            </Button>
          </div>
        </form>
      </Modal>

      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <button
              onClick={() => {
                streamRef.current?.getTracks().forEach(track => track.stop());
                setIsCameraOpen(false);
              }}
              className="p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="font-bold">Take Photo</span>
            <div className="w-8"></div>
          </div>

          <div className="flex-1 bg-black relative flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-8 flex justify-center bg-black/80">
            <button
              onClick={() => {
                if (videoRef.current && canvasRef.current) {
                  const video = videoRef.current;
                  const canvas = canvasRef.current;
                  const context = canvas.getContext('2d');
                  if (context) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0);
                    setImages(prev => [...prev, canvas.toDataURL('image/jpeg')]);
                  }
                }
              }}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Job Card Component
const JobCard: React.FC<{
  job: Complaint;
  onStatusChange: (id: string, status: ComplaintStatus) => void;
}> = ({ job, onStatusChange }) => {
  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING:
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case ComplaintStatus.IN_PROGRESS:
        return <Badge variant="info" size="sm">In Progress</Badge>;
      case ComplaintStatus.COMPLETED:
        return <Badge variant="success" size="sm">Completed</Badge>;
      case ComplaintStatus.CANCELLED:
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
    }
  };

  return (
    <Card>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bike className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-bold text-slate-900">{job.bikeNumber}</h3>
              {getStatusBadge(job.status)}
              {job.photoUrls && job.photoUrls.length > 0 && (
                <ImageIcon className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-slate-600">{job.customerName}</p>
          </div>
          {job.estimatedCost > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Estimated</p>
              <p className="text-lg font-bold text-slate-900">₹{job.estimatedCost.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Details */}
        <p className="text-sm text-slate-700 line-clamp-2">{job.details}</p>

        {/* Due Date */}
        {job.dueDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(job.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Status Actions */}
        {job.status !== ComplaintStatus.COMPLETED && job.status !== ComplaintStatus.CANCELLED && (
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            {job.status === ComplaintStatus.PENDING && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatusChange(job.id, ComplaintStatus.IN_PROGRESS)}
                className="flex-1"
              >
                Start Work
              </Button>
            )}
            {job.status === ComplaintStatus.IN_PROGRESS && (
              <Button
                size="sm"
                onClick={() => onStatusChange(job.id, ComplaintStatus.COMPLETED)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Status Tab Component
const StatusTab: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant?: 'warning' | 'info' | 'success';
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
      className={`
        px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors
        ${colorClass}
        ${active ? 'shadow-sm' : 'border border-slate-200'}
      `}
    >
      {label} ({count})
    </button>
  );
};

export default ComplaintsPage;
