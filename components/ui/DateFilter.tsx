import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';

interface DateFilterProps {
    onChange: (startDate: string | null, endDate: string | null, range: DateRange) => void;
    storageKey?: string; // Unique key for localStorage persistence
}

export const DateFilter: React.FC<DateFilterProps> = ({ onChange, storageKey }) => {
    const [selectedRange, setSelectedRange] = useState<DateRange>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    // Load saved filter from localStorage on mount
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(`dateFilter_${storageKey}`);
            if (saved) {
                const { range, start, end } = JSON.parse(saved);
                setSelectedRange(range);
                if (range === 'custom') {
                    setCustomStart(start || '');
                    setCustomEnd(end || '');
                    setShowCustomPicker(true);
                }
                applyFilter(range, start, end);
            }
        }
    }, [storageKey]);

    const applyFilter = (range: DateRange, start?: string, end?: string) => {
        let startDate: string | null = null;
        let endDate: string | null = null;
        const now = new Date();

        switch (range) {
            case 'today':
                startDate = endDate = now.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                startDate = weekStart.toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = start || null;
                endDate = end || null;
                break;
            case 'all':
            default:
                startDate = null;
                endDate = null;
                break;
        }

        onChange(startDate, endDate, range);

        // Save to localStorage
        if (storageKey) {
            localStorage.setItem(`dateFilter_${storageKey}`, JSON.stringify({ range, start: startDate, end: endDate }));
        }
    };

    const handleRangeChange = (range: DateRange) => {
        setSelectedRange(range);
        setShowDropdown(false);

        if (range === 'custom') {
            setShowCustomPicker(true);
        } else {
            setShowCustomPicker(false);
            applyFilter(range);
        }
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            applyFilter('custom', customStart, customEnd);
            setShowCustomPicker(false);
            setShowDropdown(false);
        }
    };

    const getRangeLabel = () => {
        switch (selectedRange) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'quarter': return 'This Quarter';
            case 'year': return 'This Year';
            case 'custom': return customStart && customEnd ? `${customStart} to ${customEnd}` : 'Custom Range';
            case 'all':
            default: return 'All Time';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{getRangeLabel()}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                        {(['today', 'week', 'month', 'quarter', 'year', 'all', 'custom'] as DateRange[]).map(range => (
                            <button
                                key={range}
                                onClick={() => handleRangeChange(range)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${selectedRange === range ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                    }`}
                            >
                                {range === 'today' && 'Today'}
                                {range === 'week' && 'This Week'}
                                {range === 'month' && 'This Month'}
                                {range === 'quarter' && 'This Quarter'}
                                {range === 'year' && 'This Year'}
                                {range === 'all' && 'All Time'}
                                {range === 'custom' && 'Custom Range'}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {showCustomPicker && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setShowCustomPicker(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-40 p-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Select Custom Date Range</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowCustomPicker(false)}
                                    className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCustomApply}
                                    disabled={!customStart || !customEnd}
                                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
