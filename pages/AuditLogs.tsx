import React, { useState, useEffect } from 'react';
import { dbService } from '../db';
import { AuditLog } from '../types';
import { ShieldAlert, Search, Filter, Clock, Activity, FileText, Settings, User, Navigation } from 'lucide-react';
import { Card } from '../components/ui/Card';

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const fetchedLogs = await dbService.getAuditLogs();
                setLogs(fetchedLogs);
            } catch (error) {
                console.error('Failed to load audit logs:', error);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || log.entityType === filterType;
        return matchesSearch && matchesType;
    });

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
            case 'STATUS_CHANGE': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'INVOICE': return <FileText className="w-4 h-4" />;
            case 'JOB': return <Activity className="w-4 h-4" />;
            case 'CUSTOMER': return <User className="w-4 h-4" />;
            case 'SETTINGS': return <Settings className="w-4 h-4" />;
            default: return <Navigation className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <ShieldAlert className="w-8 h-8 text-blue-600 animate-pulse mb-4" />
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Decrypting Logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex-shrink-0 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner">
                            <ShieldAlert className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
                            <p className="text-sm text-slate-500 font-medium">Immutable record of all critical personnel actions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search users or events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                            />
                        </div>

                        {/* Filter */}
                        <div className="relative">
                            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="ALL">All Entities</option>
                                <option value="INVOICE">Invoices</option>
                                <option value="JOB">Field Jobs</option>
                                <option value="CUSTOMER">Customers</option>
                                <option value="SETTINGS">Settings</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                        {filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-lg font-medium">No audit logs found</p>
                                <p className="text-sm">Try adjusting your search or filter criteria.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                        <th className="font-semibold p-4">Timestamp</th>
                                        <th className="font-semibold p-4">User</th>
                                        <th className="font-semibold p-4">Action</th>
                                        <th className="font-semibold p-4">Entity</th>
                                        <th className="font-semibold p-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 align-top w-48">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(log.timestamp).toLocaleString('en-IN', {
                                                        day: '2-digit', month: 'short',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top w-48">
                                                <div className="font-semibold text-slate-900 text-sm">
                                                    {log.userName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {log.userId.split('_')[1] || log.userId}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top w-32">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top w-32">
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                    {getEntityIcon(log.entityType)}
                                                    {log.entityType}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className="text-sm text-slate-800">{log.description}</span>
                                                <div className="text-xs text-slate-400 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ID: {log.entityId}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
