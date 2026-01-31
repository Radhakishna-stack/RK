
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, Phone, Bike, Loader2, Trash2,
  ArrowLeft, ChevronRight, User, MoreVertical, X,
  CheckCircle2, Hash, Edit3, MessageCircle, ClipboardList,
  Clock, Calendar, Package, ArrowRight, Filter, Camera,
  Upload, FlipHorizontal, AlertCircle
} from 'lucide-react';
import { dbService } from '../db';
import { Visitor, VisitorType } from '../types';

interface VisitorsPageProps {
  onNavigate: (tab: string) => void;
}

const VisitorsPage: React.FC<VisitorsPageProps> = ({ onNavigate }) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Spare Part Enquiry' | 'Other'>('All');

  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    bikeNumber: string;
    remarks: string;
    type: VisitorType;
  }>({
    name: '',
    phone: '',
    bikeNumber: '',
    remarks: '',
    type: 'Other'
  });
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getVisitors();
      setVisitors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = (
        v.name.toLowerCase().includes(query) ||
        v.phone.includes(query) ||
        v.bikeNumber.toLowerCase().includes(query) ||
        v.remarks.toLowerCase().includes(query)
      );
      const matchesFilter = activeFilter === 'All' || v.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [visitors, searchTerm, activeFilter]);

  // --- Camera & Upload Logic ---
  const openCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("Camera access failed. Use upload instead.");
      setTimeout(() => closeCamera(), 2000);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImages(prev => [...prev, dataUrl]);

        // Flash animation
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white z-[300] animate-flash pointer-events-none';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    const readers = Array.from(files).map((file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPhotos.push(reader.result as string);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });
    await Promise.all(readers);
    setImages(prev => [...prev, ...newPhotos]);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newVisitor = await dbService.addVisitor({
        ...formData,
        photoUrls: images
      });
      setVisitors(prev => [newVisitor, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to log visitor");
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', bikeNumber: '', remarks: '', type: 'Other' });
    setImages([]);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Permanent removal of this visitor log?")) {
      setLoading(true);
      await dbService.deleteVisitor(id);
      setVisitors(prev => prev.filter(v => v.id !== id));
      setLoading(false);
    }
  };

  const getFollowUpMsg = (v: Visitor) => {
    if (v.type === 'Spare Part Enquiry') {
      return `Hi ${v.name}, follow up from Moto Gear SRK regarding your spare part enquiry for ${v.bikeNumber}. We've checked the inventory. Let us know when you'd like to collect it!`;
    }
    return `Hi ${v.name}, thanks for visiting Moto Gear SRK! Let us know if you need anything for bike ${v.bikeNumber}.`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-lg mx-auto px-1 pb-24">
      {/* Header HUD */}
      <header className="flex justify-between items-end gap-6 px-1">
        <div className="flex items-end gap-3">
          <div className="pb-1">
            <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">Walk-in Log</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <ClipboardList className="w-3 h-3 text-blue-500" /> Visitor Identity Tracking
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-slate-900 text-white p-4 rounded-[22px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 shadow-2xl active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Advanced Command Bar */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="SEARCH VISITORS..."
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-[11px] uppercase tracking-widest transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Strip */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <FilterTab active={activeFilter === 'All'} onClick={() => setActiveFilter('All')} label="All" />
          <FilterTab active={activeFilter === 'Spare Part Enquiry'} onClick={() => setActiveFilter('Spare Part Enquiry')} label="Enquiry" />
          <FilterTab active={activeFilter === 'Other'} onClick={() => setActiveFilter('Other')} label="Other" />
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6 text-slate-300">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Fetching Logs...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisitors.map(visitor => {
            const isEnquiry = visitor.type === 'Spare Part Enquiry';
            return (
              <div key={visitor.id} className={`bg-white rounded-[32px] border ${isEnquiry ? 'border-blue-100' : 'border-slate-100'} shadow-sm p-6 space-y-4 hover:border-blue-200 transition-colors group relative overflow-hidden`}>
                {isEnquiry && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-12 -mt-12 rounded-full"></div>}

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border transition-colors ${isEnquiry ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-900 border-slate-100'}`}>
                      {isEnquiry ? <Package className="w-5 h-5" /> : (visitor.name?.charAt(0) || '?')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{visitor.name}</h3>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isEnquiry ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {isEnquiry ? 'Part Enquiry' : 'General'}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" /> {new Date(visitor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(visitor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(visitor.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors relative z-10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3">
                    <Bike className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest">{visitor.bikeNumber}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isEnquiry ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase">{visitor.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-[11px] font-medium text-slate-500 leading-relaxed">
                  "{visitor.remarks}"
                </div>

                {visitor.photoUrls && visitor.photoUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {visitor.photoUrls.map((url, i) => (
                      <div key={i} className="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                        <img src={url} className="w-full h-full object-cover" alt="visitor documentation" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => dbService.sendWhatsApp(visitor.phone, getFollowUpMsg(visitor))}
                    className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border active:scale-95 transition-all ${isEnquiry ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                  >
                    <MessageCircle className="w-4 h-4" /> Follow Up
                  </button>
                </div>
              </div>
            );
          })}

          {filteredVisitors.length === 0 && (
            <div className="py-40 text-center bg-white rounded-[64px] border-2 border-dashed border-slate-100 space-y-4">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No {activeFilter === 'All' ? '' : activeFilter} logs found</p>
            </div>
          )}
        </div>
      )}

      {/* Enrollment Panel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Log Visitor</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Center Entry Check-in</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Purpose*</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'Spare Part Enquiry' })}
                      className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.type === 'Spare Part Enquiry' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                      <Package className="w-3.5 h-3.5" /> Part Enquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'Other' })}
                      className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.type === 'Other' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                      <User className="w-3.5 h-3.5" /> Other / Service
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visitor Name*</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-black uppercase tracking-tight focus:ring-4 focus:ring-blue-500/5 transition-all"
                      placeholder="NAME"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact No*</label>
                    <input
                      required
                      type="tel"
                      placeholder="PHONE"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bike Number</label>
                    <input
                      type="text"
                      placeholder="MH12..."
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/5 transition-all"
                      value={formData.bikeNumber}
                      onChange={e => setFormData({ ...formData, bikeNumber: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{formData.type === 'Spare Part Enquiry' ? 'Spare Part Needed*' : 'Remarks / Purpose*'}</label>
                  <textarea
                    required
                    rows={3}
                    placeholder={formData.type === 'Spare Part Enquiry' ? "SPECIFY SPARE PARTS OR QUANTITIES..." : "DESCRIBE PURPOSE OF VISIT..."}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[11px] font-black uppercase transition-all focus:ring-4 focus:ring-blue-500/5 resize-none"
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                {/* Document capture segment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visual Documentation</label>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{images.length} Attached</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                        <img src={img} className="w-full h-full object-cover" alt="capture" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={openCamera}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase">Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase">Upload</span>
                    </button>
                  </div>
                  <input type="file" ref={galleryInputRef} multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  <input type="file" ref={cameraInputRef} capture="environment" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="pt-4 flex gap-4 pb-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400">Abort</button>
                <button type="submit" className="flex-[2] p-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Log Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immersive Camera Interface */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[300] flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center text-white z-10">
            <button onClick={closeCamera} className="p-3 bg-white/10 rounded-2xl backdrop-blur-md active:scale-90 transition-all">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Visitor Lens</h3>
            <div className="w-12"></div>
          </div>

          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-900">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-64 h-64 border border-white/40 rounded-[40px]"></div>
            </div>
          </div>

          <div className="p-8 pb-16 flex flex-col items-center gap-8 bg-black/50 backdrop-blur-xl">
            <div className="flex gap-3 overflow-x-auto w-full justify-center">
              {images.slice(-4).map((img, i) => (
                <div key={i} className="w-12 h-12 rounded-xl border-2 border-white/20 overflow-hidden shrink-0">
                  <img src={img} className="w-full h-full object-cover" alt="captured" />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-12">
              <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center active:scale-90">
                <FlipHorizontal className="w-6 h-6 text-white/40" />
              </button>
              <button
                onClick={capturePhoto}
                className="w-24 h-24 rounded-full bg-white p-2 border-8 border-white/20 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)]"
              >
                <div className="w-full h-full rounded-full border-4 border-slate-900 bg-white"></div>
              </button>
              <button
                onClick={closeCamera}
                className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xl active:scale-95"
              >
                <CheckCircle2 className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
  >
    {label}
  </button>
);

export default VisitorsPage;
