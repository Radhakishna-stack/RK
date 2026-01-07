
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Loader2, Camera, Trash2, X, Image as ImageIcon, Search, ChevronRight, Bike, User, Clock, CheckCircle2, Phone, Upload, Filter, FlipHorizontal } from 'lucide-react';
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
  const [images, setImages] = useState<string[]>([]);
  
  // UI State
  const [showBikeSuggestions, setShowBikeSuggestions] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
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

  // --- In-App Camera Logic ---
  const openCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("Could not access camera. Using fallback.");
      // Auto-fallback to native picker after a delay if permission fails
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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImages(prev => [...prev, dataUrl]);
        
        // Visual feedback (flash)
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white z-[100] animate-flash pointer-events-none';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newComplaint = await dbService.addComplaint({
        bikeNumber: bikeInput.toUpperCase(),
        customerName: nameInput,
        customerPhone: phoneInput,
        details: complaintDetails,
        photoUrls: images,
        estimatedCost: parseFloat(estCost) || 0
      });
      
      setComplaints([newComplaint, ...complaints]);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Failed to create job card.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this job card?")) {
      setLoading(true);
      await dbService.deleteComplaint(id);
      setComplaints(complaints.filter(c => c.id !== id));
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBikeInput('');
    setNameInput('');
    setPhoneInput('');
    setComplaintDetails('');
    setEstCost('');
    setImages([]);
  };

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    try {
      await dbService.updateComplaintStatus(id, status);
      setComplaints(complaints.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const bikeSuggestions = useMemo(() => {
    if (!bikeInput) return [];
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

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-lg mx-auto">
      <header className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Job Cards</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Service Requests</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="SEARCH BIKE OR CUSTOMER..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-xs tracking-widest uppercase shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-blue-500 ml-1" />
          <select 
            className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {Object.values(ComplaintStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="text-[10px] font-bold text-slate-300 mr-1">
            {filteredComplaints.length} Records
          </div>
        </div>
      </div>

      {loading && complaints.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map(c => (
            <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="bg-slate-900 text-white px-3 py-1 rounded text-[11px] font-black tracking-widest uppercase border border-slate-800 shadow-md">
                         {c.bikeNumber}
                       </span>
                       <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter border ${
                        c.status === ComplaintStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        c.status === ComplaintStatus.CANCELLED ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic line-clamp-2">"{c.details}"</p>
                </div>

                {c.photoUrls && c.photoUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {c.photoUrls.map((url, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={url} alt="inspection" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                        {c.customerName.charAt(0)}
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{c.customerName}</p>
                       <p className="text-[9px] font-bold text-slate-400">{c.customerPhone}</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-2">
                    {c.status === ComplaintStatus.PENDING && (
                      <button onClick={() => updateStatus(c.id, ComplaintStatus.IN_PROGRESS)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Start Work</button>
                    )}
                    {c.status === ComplaintStatus.IN_PROGRESS && (
                      <button onClick={() => updateStatus(c.id, ComplaintStatus.COMPLETED)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Complete</button>
                    )}
                    {c.status === ComplaintStatus.COMPLETED && (
                      <div className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase">Finalized</span>
                      </div>
                    )}
                   </div>
                </div>
              </div>
            </div>
          ))}

          {filteredComplaints.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Bike className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No active job cards found</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[95vh]">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Job Card</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bike Number (Type or Choose)</label>
                    <div className="relative">
                      <Bike className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <input 
                        required 
                        type="text"
                        placeholder="e.g. MH12AB1234"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-slate-700 uppercase" 
                        value={bikeInput}
                        onChange={e => setBikeInput(e.target.value)}
                        onFocus={() => setShowBikeSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowBikeSuggestions(false), 200)}
                      />
                    </div>
                    {showBikeSuggestions && bikeSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        {bikeSuggestions.map(cust => (
                          <button 
                            key={cust.id} 
                            type="button"
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                            onClick={() => {
                              setBikeInput(cust.bikeNumber);
                              setNameInput(cust.name);
                              setPhoneInput(cust.phone);
                              setShowBikeSuggestions(false);
                            }}
                          >
                            <div>
                               <p className="font-black text-slate-900 text-xs uppercase">{cust.bikeNumber}</p>
                               <p className="text-[10px] text-slate-400 font-bold">{cust.name}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                           <input 
                             required
                             type="text"
                             placeholder="Full Name"
                             className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-slate-700"
                             value={nameInput}
                             onChange={e => setNameInput(e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                           <input 
                             required
                             type="tel"
                             placeholder="Contact No"
                             className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-slate-700"
                             value={phoneInput}
                             onChange={e => setPhoneInput(e.target.value)}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Details</label>
                    <textarea 
                      required 
                      rows={4}
                      placeholder="DESCRIBE ISSUES REPORTED BY THE CUSTOMER..." 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 outline-none resize-none font-bold text-sm text-slate-700 placeholder:text-slate-300 transition-all uppercase" 
                      value={complaintDetails} 
                      onChange={e => setComplaintDetails(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inspection Photos</label>
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                          <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Integrated Camera Button */}
                      <button 
                        type="button"
                        onClick={openCamera}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
                      >
                        <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Camera</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all group"
                      >
                        <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Gallery</span>
                      </button>
                    </div>
                    
                    {/* Hidden Fallback Inputs */}
                    <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget Estimate (₹)</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</div>
                      <input 
                        required 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full p-5 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-black text-lg text-slate-900" 
                        value={estCost} 
                        onChange={e => setEstCost(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4 sticky bottom-0 bg-white pb-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] p-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    Finalize Job Card
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* --- Fullscreen Camera UI --- */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-300">
           <div className="p-4 flex justify-between items-center text-white z-10 bg-gradient-to-b from-black/50 to-transparent">
              <button onClick={closeCamera} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                 <X className="w-6 h-6" />
              </button>
              <h3 className="text-xs font-black uppercase tracking-widest">Job Card Photos</h3>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-2">
                    {images.slice(-3).map((img, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-800">
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-black/80">
                   <div className="space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                      <p className="text-sm font-bold">{cameraError}</p>
                   </div>
                </div>
              )}
           </div>

           <div className="p-10 pb-16 flex flex-col items-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-12">
                 <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                    <FlipHorizontal className="w-6 h-6 text-white/50" />
                 </div>
                 
                 <button 
                   onClick={capturePhoto}
                   className="w-20 h-20 rounded-full bg-white p-1 border-4 border-white/30 active:scale-90 transition-all shadow-2xl"
                 >
                   <div className="w-full h-full rounded-full border-2 border-slate-900 bg-white"></div>
                 </button>

                 <button 
                   onClick={closeCamera}
                   className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-[10px] uppercase"
                 >
                   Done
                 </button>
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                {images.length} Photos Taken
              </p>
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
