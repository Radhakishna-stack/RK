import React, { useState } from 'react';
import { MapPin, Send, Bike, User, Phone, FileText, CheckCircle, Loader2, AlertCircle, Navigation } from 'lucide-react';

// ⚙️ CONFIG: Change this to your shop's WhatsApp number (with country code, no + or spaces)
const SHOP_WHATSAPP_NUMBER = '919876543210';

const CustomerBooking: React.FC = () => {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        bikeNumber: '',
        issue: '',
    });
    const [locationLink, setLocationLink] = useState('');
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitted, setSubmitted] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const link = `https://maps.google.com/?q=${latitude},${longitude}`;
                setLocationLink(link);
                setLocationStatus('success');
            },
            () => setLocationStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const isValid = form.name && form.phone && form.bikeNumber && form.issue;

    const handleSendWhatsApp = () => {
        if (!isValid) return;

        const message = `🔧 *Vehicle Pickup Request*\n\n` +
            `👤 *Name:* ${form.name}\n` +
            `📞 *Phone:* ${form.phone}\n` +
            `🏍️ *Bike No:* ${form.bikeNumber.toUpperCase()}\n` +
            `🛠️ *Issue:* ${form.issue}\n` +
            (locationLink ? `📍 *My Location:* ${locationLink}` : `📍 *Location:* Not shared`);

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h2>
                    <p className="text-slate-600 text-sm mb-6">
                        Your pickup request has been sent via WhatsApp. Our team will contact you shortly to confirm.
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-sm text-slate-700 mb-6">
                        <p><span className="font-semibold">Name:</span> {form.name}</p>
                        <p><span className="font-semibold">Bike:</span> {form.bikeNumber.toUpperCase()}</p>
                        <p><span className="font-semibold">Issue:</span> {form.issue}</p>
                    </div>
                    <button
                        onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', bikeNumber: '', issue: '' }); setLocationLink(''); setLocationStatus('idle'); }}
                        className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-colors"
                    >
                        New Booking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
            {/* Hero Header */}
            <div className="px-6 pt-12 pb-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Bike className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-2">SRK Bike Service</h1>
                <p className="text-blue-200 text-sm font-medium">Vehicle Pickup Booking</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-t-3xl min-h-screen px-6 pt-8 pb-12 shadow-2xl">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Book a Pickup</h2>
                <p className="text-slate-500 text-sm mb-6">We'll come to you! Fill in your details below.</p>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Your Name *</label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Enter your full name"
                                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Phone Number *</label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                placeholder="Your mobile number"
                                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Bike Number */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Bike Number *</label>
                        <div className="relative">
                            <Bike className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={form.bikeNumber}
                                onChange={e => setForm({ ...form, bikeNumber: e.target.value.toUpperCase() })}
                                placeholder="TN 01 AB 1234"
                                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                            />
                        </div>
                    </div>

                    {/* Issue */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Describe the Issue *</label>
                        <div className="relative">
                            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <textarea
                                value={form.issue}
                                onChange={e => setForm({ ...form, issue: e.target.value })}
                                placeholder="e.g. Engine not starting, brake problem, oil change..."
                                rows={3}
                                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Your Location</label>
                        {locationStatus === 'success' ? (
                            <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-2xl">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-green-800">Location captured ✓</p>
                                    <p className="text-xs text-green-700 truncate">{locationLink}</p>
                                </div>
                                <button onClick={handleGetLocation} className="text-xs text-green-700 underline">Refresh</button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGetLocation}
                                disabled={locationStatus === 'loading'}
                                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 font-semibold text-sm hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-60"
                            >
                                {locationStatus === 'loading' ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Getting your location...</>
                                ) : locationStatus === 'error' ? (
                                    <><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-red-600">Failed — tap to retry</span></>
                                ) : (
                                    <><Navigation className="w-4 h-4" /> Share My Location</>
                                )}
                            </button>
                        )}
                        <p className="text-xs text-slate-400 mt-1.5 text-center">Helps our team find you faster</p>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            onClick={handleSendWhatsApp}
                            disabled={!isValid}
                            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-base rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.12 1.528 5.846L0 24l6.335-1.508A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.862 9.862 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z" />
                            </svg>
                            Send via WhatsApp
                        </button>
                        {!isValid && (
                            <p className="text-xs text-center text-slate-400 mt-2">Fill all required fields (*) to continue</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">SRK Bike Service • Powered by Moto Gear</p>
                </div>
            </div>
        </div>
    );
};

export default CustomerBooking;
