import React, { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, Camera, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, Customer } from '../types';

const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedBike, setSelectedBike] = useState('');
  const [customerInfo, setCustomerInfo] = useState<{name: string, phone: string} | null>(null);
  const [complaintDetails, setComplaintDetails] = useState('');
  const [estCost, setEstCost] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([dbService.getComplaints(), dbService.getCustomers()]).then(([compData, custData]) => {
      setComplaints(compData);
      setCustomers(custData);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch data:", err);
      setLoading(false);
    });
  }, []);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo) {
      alert("Please select a valid bike number first.");
      return;
    }
    
    setLoading(true);
    const newComplaint = await dbService.addComplaint({
      bikeNumber: selectedBike,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      details: complaintDetails,
      photoUrls: images,
      estimatedCost: parseFloat(estCost) || 0
    });
    
    setComplaints([newComplaint, ...complaints]);
    setLoading(false);
    setIsModalOpen(false);
    resetForm();
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
    setSelectedBike('');
    setCustomerInfo(null);
    setComplaintDetails('');
    setEstCost('');
    setImages([]);
  };

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    await dbService.updateComplaintStatus(id, status);
    setComplaints(complaints.map(c => c && c.id === id ? { ...c, status } : c));
  };

  if (loading && complaints.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="w-12 h-12 animate-spin" />
      <p>Loading Job Cards...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Complaints</h2>
          <p className="text-slate-500">Register and manage service requests</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Register Complaint
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complaints.filter(c => !!c).map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full group">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold bg-slate-900 text-white px-3 py-1 rounded text-sm uppercase tracking-wider">{c.bikeNumber}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{c.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                  c.status === ComplaintStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 
                  c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {c.status}
                </span>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 italic flex-grow">"{c.details}"</p>
            
            {c.photoUrls && c.photoUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {c.photoUrls.map((url, idx) => (
                  <img key={idx} src={url} alt={`Evidence ${idx}`} className="w-16 h-16 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                ))}
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-50 pt-4">
               <div>
                 <p className="text-xs font-bold text-slate-900">{c.customerName}</p>
                 <p className="text-[10px] text-slate-400">{c.customerPhone}</p>
               </div>
               <div className="flex gap-2">
                {c.status === ComplaintStatus.PENDING && (
                  <button onClick={() => updateStatus(c.id, ComplaintStatus.IN_PROGRESS)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">Start Work</button>
                )}
                {c.status === ComplaintStatus.IN_PROGRESS && (
                  <button onClick={() => updateStatus(c.id, ComplaintStatus.COMPLETED)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors">Complete</button>
                )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
             <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-xl font-bold text-slate-900">Register Service</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bike Selection</label>
                    <select 
                      required 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-700" 
                      value={selectedBike} 
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedBike(val);
                        const cust = customers.find(cu => cu && cu.bikeNumber === val);
                        if(cust) {
                          setCustomerInfo({name: cust.name, phone: cust.phone});
                        } else {
                          setCustomerInfo(null);
                        }
                      }}
                    >
                      <option value="">Select Customer's Bike...</option>
                      {customers.filter(cu => !!cu).map(cu => <option key={cu.id} value={cu.bikeNumber}>{cu.bikeNumber} — {cu.name}</option>)}
                    </select>
                  </div>
                  
                  {customerInfo && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">Customer Profile</p>
                        <p className="font-bold text-blue-900">{customerInfo.name}</p>
                        <p className="text-xs text-blue-700/70 font-medium">{customerInfo.phone}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Plus className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Complaint Details</label>
                    <textarea 
                      required 
                      rows={3}
                      placeholder="List all issues reported by the customer..." 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-slate-700 placeholder:text-slate-400" 
                      value={complaintDetails} 
                      onChange={e => setComplaintDetails(e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bike Inspection Photos</label>
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Capture</span>
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      capture="environment" 
                      multiple 
                      className="hidden" 
                      onChange={handleCapture} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estimated Cost (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input 
                        required 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full p-3.5 pl-8 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        value={estCost} 
                        onChange={e => setEstCost(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] p-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    Create Job Card
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;