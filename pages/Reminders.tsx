import React, { useState, useEffect } from 'react';
import { Bell, Search, Calendar, MessageSquare, Plus, Loader2, Trash2 } from 'lucide-react';
import { dbService } from '../db';
import { ServiceReminder } from '../types';

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    bikeNumber: '',
    customerName: '',
    phone: '',
    reminderDate: '',
    serviceType: 'Regular Service'
  });

  useEffect(() => {
    dbService.getReminders().then(data => {
      setReminders(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await dbService.addReminder(newReminder);
    setReminders([...reminders, res]);
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this reminder?")) {
      setLoading(true);
      await dbService.deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
      setLoading(false);
    }
  };

  const sendWhatsApp = (rem: ServiceReminder) => {
    const msg = `Hello ${rem.customerName}! This is a reminder from BikeService Pro that your bike (${rem.bikeNumber}) is due for its ${rem.serviceType} on ${new Date(rem.reminderDate).toLocaleDateString()}. Would you like to schedule an appointment?`;
    dbService.sendWhatsApp(rem.phone, msg);
  };

  if (loading && reminders.length === 0) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Service Reminders</h2>
          <p className="text-slate-500">Keep your customers coming back</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" /> Schedule Reminder
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.map(rem => (
          <div key={rem.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-amber-200 transition-all">
            <div className="flex justify-between mb-4">
               <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {rem.serviceType}
               </div>
               <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rem.status === 'Sent' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    {rem.status}
                  </span>
                  <button onClick={() => handleDelete(rem.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>
            <h3 className="text-lg font-bold">{rem.bikeNumber}</h3>
            <p className="text-sm text-slate-600 mb-4">{rem.customerName}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
               <Calendar className="w-3 h-3" />
               Scheduled for {new Date(rem.reminderDate).toLocaleDateString()}
            </div>
            <button 
              onClick={() => sendWhatsApp(rem)}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Send WhatsApp
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
             No reminders scheduled.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in zoom-in-95">
              <h3 className="text-xl font-bold mb-6">Schedule Service Reminder</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                 <input placeholder="Bike Number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={newReminder.bikeNumber} onChange={e => setNewReminder({...newReminder, bikeNumber: e.target.value.toUpperCase()})} />
                 <input placeholder="Customer Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={newReminder.customerName} onChange={e => setNewReminder({...newReminder, customerName: e.target.value})} />
                 <input placeholder="Phone Number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={newReminder.phone} onChange={e => setNewReminder({...newReminder, phone: e.target.value})} />
                 <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required value={newReminder.reminderDate} onChange={e => setNewReminder({...newReminder, reminderDate: e.target.value})} />
                 <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={newReminder.serviceType} onChange={e => setNewReminder({...newReminder, serviceType: e.target.value})}>
                    <option>Regular Service</option>
                    <option>Oil Change</option>
                    <option>Brake Check</option>
                    <option>Chain Lubrication</option>
                 </select>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 border border-slate-200 rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="flex-1 p-3 bg-amber-500 text-white rounded-xl font-bold">Schedule</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;