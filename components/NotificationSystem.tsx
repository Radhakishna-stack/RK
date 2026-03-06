import React, { useState, useEffect, useRef } from 'react';
import { Truck, Bell, X } from 'lucide-react';
import { dbService } from '../db';
import { PickupRequest, PickupStatus } from '../types';
import { getCurrentUser } from '../auth';
import { canAccessRoute } from '../permissions';

interface Toast {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
}

export const NotificationSystem: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const lastPickupsRef = useRef<Map<string, PickupStatus>>(new Map());
    const isFirstLoadRef = useRef(true);

    const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        const checkPickups = async () => {
            const user = getCurrentUser();
            if (!user) return;

            try {
                const pickups = await dbService.getPickupRequests();
                const currentMap = new Map<string, PickupStatus>();
                pickups.forEach(p => currentMap.set(p.id, p.status));

                if (isFirstLoadRef.current) {
                    // Just initialize the baseline state
                    lastPickupsRef.current = currentMap;
                    isFirstLoadRef.current = false;
                    return;
                }

                const prevMap = lastPickupsRef.current;
                const isManager = canAccessRoute(user.role, 'pickup_manager');
                const isMyPickup = (p: PickupRequest) => p.assignedEmployeeId === user.id;

                pickups.forEach(pickup => {
                    const prevStatus = prevMap.get(pickup.id);
                    const currentStatus = pickup.status;

                    if (prevStatus !== currentStatus) {
                        // ─── ADMIN / MANAGER NOTIFICATIONS ───
                        if (isManager) {
                            if (!prevStatus && currentStatus === 'Pending') {
                                addToast('New Pickup Request', `${pickup.customerName} needs a pickup for ${pickup.bikeNumber}`, 'info');
                            } else if (currentStatus === 'Accepted') {
                                addToast('Pickup Accepted', `${pickup.assignedEmployeeName} accepted pickup for ${pickup.customerName}`, 'success');
                            } else if (currentStatus === 'In Transit') {
                                addToast('Live Tracking Started', `${pickup.assignedEmployeeName} is on the way for ${pickup.customerName}`, 'info');
                            } else if (currentStatus === 'Delivered') {
                                addToast('Pickup Delivered', `Vehicle ${pickup.bikeNumber} has arrived at the shop`, 'success');
                            }
                        }

                        // ─── EMPLOYEE NOTIFICATIONS ───
                        if (isMyPickup(pickup)) {
                            if (currentStatus === 'Assigned' && prevStatus !== 'Assigned') {
                                addToast('New Pickup Assigned', `Manager assigned you a pickup for ${pickup.customerName}`, 'warning');
                            }
                        }
                    }
                });

                lastPickupsRef.current = currentMap;
            } catch (err) {
                console.error("Notification polling failed", err);
            }
        };

        // Poll every 15 seconds
        const intervalId = setInterval(checkPickups, 15000);
        return () => clearInterval(intervalId);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto w-80 sm:w-96 shadow-xl rounded-xl border p-4 flex items-start gap-3 transform transition-all animate-in slide-in-from-right-8 duration-300
                        ${toast.type === 'info' ? 'bg-white border-blue-100' : ''}
                        ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200' : ''}
                        ${toast.type === 'warning' ? 'bg-amber-50 border-amber-200' : ''}
                    `}
                >
                    <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${toast.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
                        ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
                        ${toast.type === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
                    `}>
                        {toast.type === 'warning' ? <Bell className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className={`text-sm font-bold ${toast.type === 'success' ? 'text-emerald-900' : toast.type === 'warning' ? 'text-amber-900' : 'text-slate-900'}`}>
                            {toast.title}
                        </h4>
                        <p className={`text-sm mt-0.5 ${toast.type === 'success' ? 'text-emerald-700' : toast.type === 'warning' ? 'text-amber-700' : 'text-slate-600'}`}>
                            {toast.message}
                        </p>
                    </div>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-1 rounded-md hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};
