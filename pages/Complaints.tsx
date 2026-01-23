
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Loader2, Camera, Trash2, X, Image as ImageIcon, Search, 
  ChevronRight, Bike, User, Clock, CheckCircle2, Phone, Upload, 
  Filter, FlipHorizontal, Activity, Gauge, IndianRupee, Layers,
  CheckCircle, AlertCircle, CalendarDays
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, Customer } from '../types';

const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Form State
  const [bikeInput, setBikeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [estCost, setEstCost] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // UI State
  const [showBikeSuggestions, setShowBikeSuggestions] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Camera Targeting
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null); // null means new complaint form

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compData, custData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getCustomers()
      ]);
      setComplaints(compData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setCustomers(custData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Pro Camera Logic ---
  const openCamera = async (targetId: string | null = null) => {
    setCameraTargetId(targetId);
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
      setCameraError("Camera access failed. Using device picker.");
      setTimeout(() => {
        closeCamera();
        cameraInputRef.current?.click();
      }, 1500);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        if (cameraTargetId) {
          // Add to existing complaint
          const complaint = complaints.find(c => c.id === cameraTargetId);
          if (complaint) {
            const updatedPhotos = [...(complaint.photoUrls || []), dataUrl];
            await dbService.updateComplaintPhotos(cameraTargetId, updatedPhotos);
            setComplaints(prev => prev.map(c => c.id === cameraTargetId ? { ...c, photoUrls: updatedPhotos } : c));
          }
        } else {
          // Add to form state
          setImages(prev => [...prev, dataUrl]);
        }
        
        // Flash animation
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white z-[100] animate-flash pointer-events-none';
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

    if (cameraTargetId) {
      // Add to existing complaint
      const complaint = complaints.find(c => c.id === cameraTargetId);
      if (complaint) {
        const updatedPhotos = [...(complaint.photoUrls || []), ...newPhotos];
        await dbService.updateComplaintPhotos(cameraTargetId, updatedPhotos);
        setComplaints(prev => prev.map(c => c.id === cameraTargetId ? { ...c, photoUrls: updatedPhotos } : c));
      }
    } else {
      setImages(prev => [...prev, ...newPhotos]);
    }
    
    // Clear inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeImage = async (index: number, complaintId?: string) => {
    if (complaintId) {
      const complaint = complaints.find(c => c.id === complaintId);
      if (complaint) {
        const updatedPhotos = complaint.photoUrls.filter((_, i) => i !== index);
        await dbService.updateComplaintPhotos(complaintId, updatedPhotos);
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, photoUrls: updatedPhotos } : c));
      }
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const newComplaint = await dbService.addComplaint({
        bikeNumber: bikeInput.toUpperCase(),
        customerName: nameInput,
        customerPhone: phoneInput,
        details: complaintDetails,
        photoUrls: images,
        estimatedCost: parseFloat(estCost) || 0,
        odometerReading: odometerReading ? parseFloat(odometerReading) : undefined,
        dueDate: dueDate || undefined
      });
      
      setComplaints(prev => [newComplaint, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Failed to create job card"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this Job Card forever?")) {
      setLoading(true);
      await dbService.deleteComplaint(id);
      setComplaints(prev => prev.filter(c => c.id !== id));
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBikeInput('');
    setNameInput('');
    setPhoneInput('');
    setComplaintDetails('');
    setEstCost('');
    setOdometerReading('');
    setDueDate('');
    setImages([]);
  };

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    try {
      await dbService.updateComplaintStatus(id, status);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const bikeSuggestions = useMemo(() => {
    if (!bikeInput || bikeInput.length < 2) return [];
    return customers.filter(c => 
      c.bikeNumber.toLowerCase().includes(bikeInput.toLowerCase())
    ).slice(0, 5);
  }, [customers, bikeInput]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = c.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchTerm, statusFilter]);

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      <header className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Job Cards</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
             Master Terminal Active
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="bg-slate-900 text-white p-4 rounded-[22px] shadow-2xl active:scale-95 transition-all group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </header>

      {/* Control Strip */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search bike number or name..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-xs tracking-widest uppercase shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <Filter className="w-4 h-4 text-blue-500 ml-1 shrink-0" />
            <select 
              className="w-full bg-transparent text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {Object.values(ComplaintStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="bg-slate-900 text-white px-4 flex items-center justify-center rounded-2xl font-black text-[9px] uppercase tracking-tighter shadow-lg">
            {filteredComplaints.length} Units
          </div>
        </div>
      </div>

      {loading && complaints.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6 text-slate-300">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
             <Loader2 className="w-16 h-16 animate-spin text-blue-500 absolute top-0 left-0" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Recalibrating Archives...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredComplaints.map(c => (
            <div key={c.id} className="bg-white rounded-[32px] border border-slate-50 shadow-sm overflow-hidden group hover:border-blue-100 transition-all">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                       <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-sm font-black tracking-widest uppercase shadow-lg">
                         {c.bikeNumber}
                       </span>
                       <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter ${
                        c.status === ComplaintStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        c.status === ComplaintStatus.CANCELLED ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          c.status === ComplaintStatus.COMPLETED ? 'bg-emerald-500' : 
                          c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-500' : 
                          c.status === ComplaintStatus.CANCELLED ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        {c.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pl-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      
                      {c.dueDate && (
                        <div className={`flex items-center gap-2 px-2 py-0.5 rounded-lg border ${isOverdue(c.dueDate) && c.status !== ComplaintStatus.COMPLETED ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                          <CalendarDays className="w-3 h-3" />
                          <p className="text-[9px] font-black uppercase tracking-tight">Due: {new Date(c.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                        </div>
                      )}

                      {c.odometerReading && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Gauge className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase">{c.odometerReading.toLocaleString()} KM</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openCamera(c.id)}
                      className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all active:scale-90"
                      title="Take Photo Directly"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="p-2.5 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-6 bg-slate-50/50 p-5 rounded-[24px] border border-slate-100/50 relative overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic line-clamp-2 z-10 relative">"{c.details}"</p>
                  <Layers className="absolute right-[-20px] bottom-[-20px] w-20 h-20 text-slate-100 z-0" />
                </div>

                {c.photoUrls && c.photoUrls.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
                    {c.photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-2xl border-2 border-white overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        <img src={url} alt="inspection" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(idx, c.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => openCamera(c.id)}
                      className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                       <Camera className="w-5 h-5 mb-1" />
                       <span className="text-[8px] font-black uppercase">Take Pic</span>
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
                        {c.customerName.charAt(0)}
                     </div>
                     <div>
                       <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{c.customerName}</p>
                       <p className="text-[9px] font-bold text-slate-400">Est. ₹{c.estimatedCost.toLocaleString()}</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-2">
                    {c.status === ComplaintStatus.PENDING && (
                      <button onClick={() => updateStatus(c.id, ComplaintStatus.IN_PROGRESS)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Start Task</button>
                    )}
                    {c.status === ComplaintStatus.IN_PROGRESS && (
                      <button onClick={() => updateStatus(c.id, ComplaintStatus.COMPLETED)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Mark Ready</button>
                    )}
                    {c.status === ComplaintStatus.COMPLETED && (
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 border border-emerald-100">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Finalized</span>
                      </div>
                    )}
                   </div>
                </div>
              </div>
            </div>
          ))}

          {filteredComplaints.length === 0 && (
            <div className="py-24 text-center space-y-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                <Bike className="w-12 h-12 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Empty Terminal</p>
                <p className="text-slate-300 text-[10px] font-bold uppercase">No matching job cards found</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- New Job Card Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-t-[48px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[96vh] relative">
             
             {/* Header */}
             <div className="px-8 py-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">New Job Card</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnostics & Intake</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-7 h-7" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-10 overflow-y-auto no-scrollbar pb-32">
                
                {/* Identity Segment */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                     <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Vehicle & Client</h4>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bike Number</label>
                      <div className="relative group">
                        <Bike className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 transition-transform group-focus-within:scale-110" />
                        <input 
                          required 
                          type="text"
                          placeholder="E.G. MH12AB1234"
                          className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-black text-sm text-slate-700 uppercase transition-all" 
                          value={bikeInput}
                          onChange={e => setBikeInput(e.target.value)}
                          onFocus={() => setShowBikeSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowBikeSuggestions(false), 200)}
                        />
                      </div>
                      {showBikeSuggestions && bikeSuggestions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                          {bikeSuggestions.map(cust => (
                            <button 
                              key={cust.id} 
                              type="button"
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0"
                              onClick={() => {
                                setBikeInput(cust.bikeNumber);
                                setNameInput(cust.name);
                                setPhoneInput(cust.phone);
                                setShowBikeSuggestions(false);
                              }}
                            >
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs uppercase">{cust.name.charAt(0)}</div>
                                 <div>
                                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{cust.bikeNumber}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{cust.name}</p>
                                 </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                          <div className="relative">
                             <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                             <input 
                               required
                               type="text"
                               placeholder="Full Name"
                               className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-sm text-slate-700 uppercase"
                               value={nameInput}
                               onChange={e => setNameInput(e.target.value)}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Link</label>
                          <div className="relative">
                             <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                             <input 
                               required
                               type="tel"
                               placeholder="Phone No"
                               className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-sm text-slate-700"
                               value={phoneInput}
                               onChange={e => setPhoneInput(e.target.value)}
                             />
                          </div>
                       </div>
                    </div>
                  </div>
                </section>

                {/* Diagnostics Segment */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                     <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Diagnostic Data</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                         Odometer (KM)
                         {odometerReading && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      </label>
                      <div className="relative group">
                        <Gauge className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                        <input 
                          type="number" 
                          placeholder="Current KM"
                          className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-amber-500/5 outline-none font-black text-sm text-slate-700"
                          value={odometerReading}
                          onChange={e => setOdometerReading(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget Estimate</label>
                      <div className="relative group">
                        <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                        <input 
                          required 
                          type="number" 
                          placeholder="0.00" 
                          className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none font-black text-lg text-slate-900" 
                          value={estCost} 
                          onChange={e => setEstCost(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-500" />
                        Target Delivery Date
                      </label>
                      <input 
                        type="date"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700 transition-all"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Details</label>
                      <textarea 
                        required 
                        rows={4}
                        placeholder="ENTER SPECIFIC COMPLAINTS AND DIAGNOSTICS..." 
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] focus:ring-8 focus:ring-slate-500/5 outline-none resize-none font-black text-xs text-slate-700 placeholder:text-slate-300 uppercase leading-relaxed transition-all" 
                        value={complaintDetails} 
                        onChange={e => setComplaintDetails(e.target.value)} 
                      />
                    </div>
                  </div>
                </section>

                {/* Documentation Segment */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Evidence Bundle</h4>
                     </div>
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{images.length} Captured</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-[22px] overflow-hidden border-2 border-white shadow-lg group transform hover:scale-105 transition-all">
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      type="button"
                      onClick={() => openCamera(null)}
                      className="aspect-square rounded-[22px] border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all group active:scale-95 shadow-sm"
                    >
                      <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Take Photo</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setCameraTargetId(null); galleryInputRef.current?.click(); }}
                      className="aspect-square rounded-[22px] border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all group active:scale-95 shadow-sm"
                    >
                      <Upload className="w-7 h-7 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Upload Images</span>
                    </button>
                  </div>
                  
                  {/* Hidden Native Controls */}
                  <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </section>

                <div className="pt-8 flex gap-4 sticky bottom-0 bg-white/80 backdrop-blur-xl pb-4 z-20 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 p-5 border border-slate-200 rounded-[28px] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] p-5 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                    Lock Entry
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* --- Immersive Pro Camera UI --- */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-in fade-in duration-300">
           {/* Top HUD */}
           <div className="p-6 flex justify-between items-center text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={closeCamera} className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 active:scale-90 transition-all">
                 <X className="w-7 h-7" />
              </button>
              <div className="flex flex-col items-center">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Documentation Lens</h3>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[8px] font-bold text-slate-400">REC • RAW</span>
                 </div>
              </div>
              <div className="w-12"></div>
           </div>

           {/* Viewport */}
           <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-950">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Target Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-64 h-64 border border-white/40 rounded-3xl"></div>
                 <div className="absolute w-full h-[1px] bg-white/20"></div>
                 <div className="absolute w-[1px] h-full bg-white/20"></div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-12 text-center bg-black/90">
                   <div className="space-y-4">
                      <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                      <p className="text-sm font-bold text-white uppercase">{cameraError}</p>
                   </div>
                </div>
              )}
           </div>

           {/* Bottom Shutter & Previews */}
           <div className="p-8 pb-16 flex flex-col items-center gap-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              {/* Film Strip */}
              <div className="flex gap-3 overflow-x-auto w-full px-4 no-scrollbar justify-center">
                 {(!cameraTargetId ? images : (complaints.find(c => c.id === cameraTargetId)?.photoUrls || [])).slice(-4).map((img, i) => (
                    <div key={i} className="w-12 h-12 rounded-xl border-2 border-white/20 overflow-hidden shrink-0 shadow-2xl">
                       <img src={img} className="w-full h-full object-cover" />
                    </div>
                 ))}
                 {(!cameraTargetId ? images.length : (complaints.find(c => c.id === cameraTargetId)?.photoUrls.length || 0)) > 4 && (
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white text-[10px] font-black">
                       +{(!cameraTargetId ? images.length : (complaints.find(c => c.id === cameraTargetId)?.photoUrls.length || 0)) - 4}
                    </div>
                 )}
              </div>

              <div className="flex items-center gap-12">
                 <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                    <FlipHorizontal className="w-6 h-6 text-white/40" />
                 </div>
                 
                 <button 
                   onClick={capturePhoto}
                   className="w-24 h-24 rounded-full bg-white p-2 border-8 border-white/20 active:scale-90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                 >
                   <div className="w-full h-full rounded-full border-4 border-slate-900 bg-white"></div>
                 </button>

                 <button 
                   onClick={closeCamera}
                   className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
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

export default ComplaintsPage;
