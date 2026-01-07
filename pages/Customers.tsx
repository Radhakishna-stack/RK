
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, MapPin, Phone, Bike, Award, Loader2, Trash2, 
  ArrowLeft, Settings, Share2, ChevronRight, Mail, Home, Filter
} from 'lucide-react';
import { dbService } from '../db';
import { Customer } from '../types';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    bikeNumber: '', 
    city: '', 
    gstin: '', 
    email: '', 
    address: '' 
  });
  const [error, setError] = useState('');

  useEffect(() => {
    dbService.getCustomers().then(data => {
      setCustomers(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));
    return ['All Cities', ...uniqueCities.sort()];
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => c && c.name) 
      .filter(c => {
        const matchesSearch = 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm) ||
          c.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCity = selectedCity === 'All Cities' || c.city === selectedCity;
        
        return matchesSearch && matchesCity;
      });
  }, [customers, searchTerm, selectedCity]);

  const handleSubmit = async (e: React.FormEvent, closeAfter: boolean = true) => {
    e.preventDefault();
    setError('');
    try {
      const newCustomer = await dbService.addCustomer(formData);
      setCustomers([...customers, newCustomer]);
      
      if (closeAfter) {
        setIsModalOpen(false);
      }
      setFormData({ 
        name: '', 
        phone: '', 
        bikeNumber: '', 
        city: '', 
        gstin: '', 
        email: '', 
        address: '' 
      });
    } catch (err: any) {
      setError(err.message || "Failed to create customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer? All their associated records will remain but the profile will be gone.")) {
      setLoading(true);
      await dbService.deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h2>
          <p className="text-slate-500">Manage your bike service customer database</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" placeholder="Search by name, phone, bike or city..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 pointer-events-none" />
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer font-medium text-slate-700 text-sm transition-all"
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronRight className="w-4 h-4 text-slate-300 transform rotate-90" />
          </div>
        </div>

        {(searchTerm || selectedCity !== 'All Cities') && (
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCity('All Cities'); }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-3 rounded-xl transition-all"
          >
            Reset Filters
          </button>
        )}
      </div>

      {loading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
          <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
          <p className="font-bold text-sm uppercase tracking-widest">Fetching Customers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all hover:shadow-md group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                  {customer.name ? customer.name.charAt(0) : '?'}
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Award className="w-3 h-3" /> {customer.loyaltyPoints} Pts
                  </div>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {customer.phone}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                    <Bike className="w-3 h-3" /> {customer.bikeNumber}
                  </span>
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 text-[10px] font-bold uppercase">
                    <MapPin className="w-3 h-3" /> {customer.city}
                  </span>
                </div>
                {customer.email && <p className="flex items-center gap-2 pt-2"><Mail className="w-4 h-4 text-slate-400" /> {customer.email}</p>}
                {customer.address && <p className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /> {customer.address}</p>}
                {customer.gstin && <p className="flex items-center gap-2 text-xs bg-slate-50 p-1 rounded mt-2"><span className="font-bold">GSTIN:</span> {customer.gstin}</p>}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] text-slate-300 font-mono">
                ID: {customer.id}
              </div>
            </div>
          ))}
          
          {filteredCustomers.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No customers found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md h-full sm:h-auto sm:rounded-xl shadow-2xl animate-in slide-in-from-bottom-10 duration-200 flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-700 hover:bg-slate-100 p-1 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                 <h3 className="text-lg font-semibold text-slate-800">Add New Party</h3>
               </div>
               <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-full"><Settings className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
               {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold">{error}</div>}

               <div className="bg-pink-50 rounded-lg p-3 flex items-center justify-between border border-pink-100">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Share2 className="w-5 h-5 text-red-500" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Invite Parties</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">to fill their details</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                     <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
               </div>

               <form id="customer-form" className="space-y-5 pb-20 sm:pb-0">
                  <div className="relative mt-2">
                     <input 
                       required
                       type="text"
                       className="peer w-full p-3.5 bg-transparent border-2 border-blue-600 rounded-lg outline-none text-slate-900 font-medium placeholder-slate-400 transition-all focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                       placeholder="e.g. Ram Prasad"
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                     />
                     <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-bold text-blue-600 transition-all">
                        Party Name*
                     </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <input 
                       type="email"
                       placeholder="Email Address (Optional)"
                       className="w-full p-3.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
                       value={formData.email}
                       onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    <input 
                       type="text"
                       placeholder="GSTIN"
                       className="w-full p-3.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
                       value={formData.gstin}
                       onChange={e => setFormData({...formData, gstin: e.target.value})}
                    />
                  </div>

                  <div>
                     <div className="flex items-center gap-2 mb-4">
                        <h4 className="font-bold text-slate-900 text-sm">Essential Details</h4>
                        <div className="h-px bg-slate-100 flex-1"></div>
                     </div>
                     
                     <div className="space-y-4">
                        <input 
                          required
                          type="text"
                          placeholder="Bike No*"
                          className="w-full p-3.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 uppercase placeholder:text-slate-400 font-mono"
                          value={formData.bikeNumber}
                          onChange={e => setFormData({...formData, bikeNumber: e.target.value})}
                        />

                        <div className="grid grid-cols-2 gap-4">
                           <input 
                             required
                             type="text"
                             placeholder="Phone Number*"
                             className="w-full p-3.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
                             value={formData.phone}
                             onChange={e => setFormData({...formData, phone: e.target.value})}
                           />
                           <input 
                             required
                             type="text"
                             placeholder="City*"
                             className="w-full p-3.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
                             value={formData.city}
                             onChange={e => setFormData({...formData, city: e.target.value})}
                           />
                        </div>

                        <input 
                           type="text"
                           placeholder="Full Address"
                           className="w-full p-3.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
                           value={formData.address}
                           onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                     </div>
                  </div>
               </form>
            </div>

            <div className="flex w-full border-t border-slate-200">
               <button 
                  onClick={(e) => handleSubmit(e as any, false)}
                  className="flex-1 py-4 bg-white text-slate-600 font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors"
               >
                 Save & New
               </button>
               <button 
                  onClick={(e) => handleSubmit(e as any, true)}
                  className="flex-1 py-4 bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
               >
                 Save Party
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
