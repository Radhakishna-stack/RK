import React, { useState, useEffect } from 'react';
import { Shield, Save, RotateCcw, Check } from 'lucide-react';
import { dbService } from '../db';
import { RolePermissions, UserRole } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions';

// Map permission keys to human readable labels
const PERMISSION_LABELS: Record<keyof RolePermissions, { label: string, category: string }> = {
    canViewSales: { label: 'View Sales Lists', category: 'Sales' },
    canCreateSales: { label: 'Create Invoices', category: 'Sales' },
    canEditSales: { label: 'Edit Invoices', category: 'Sales' },
    canDeleteSales: { label: 'Delete Invoices', category: 'Sales' },
    canAccessBilling: { label: 'Access Billing Page', category: 'Sales' },
    canAccessPurchase: { label: 'Access Purchase', category: 'Inventory' },

    canManageInventory: { label: 'Manage Inventory (Add/Edit Items)', category: 'Inventory' },
    canManageCustomers: { label: 'Manage Customers', category: 'CRM' },
    canManageExpenses: { label: 'Manage Expenses', category: 'Finance' },

    canViewComplaints: { label: 'View Job Cards', category: 'Service' },
    canEditComplaints: { label: 'Edit Job Cards (Status/Update)', category: 'Service' },

    canViewReports: { label: 'View Reports', category: 'Analytics' },
    canAccessAnalytics: { label: 'Access Dashboard Analytics', category: 'Analytics' },

    canManageStaff: { label: 'Manage Staff', category: 'Admin' },
    canManageUsers: { label: 'Manage Users', category: 'Admin' },
    canViewSettings: { label: 'View Settings', category: 'Admin' },
    canManageSettings: { label: 'Change Settings', category: 'Admin' },
};

const ROLES: UserRole[] = ['manager', 'employee', 'mechanic']; // Exclude admin as they should have all access

const RolePermissionsEditor: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeRole, setActiveRole] = useState<UserRole>('manager');
    const [permissions, setPermissions] = useState<Record<string, RolePermissions>>({});

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const perms = await dbService.getAllRolePermissions();
            setPermissions(perms);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof RolePermissions) => {
        setPermissions(prev => ({
            ...prev,
            [activeRole]: {
                ...prev[activeRole],
                [key]: !prev[activeRole][key]
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await dbService.updateRolePermissions(activeRole, permissions[activeRole]);
            // Force reload to ensure standardized state
            await loadPermissions();
            alert('Permissions updated successfully! Refresh the page for changes to take effect.');
        } catch (e) {
            console.error(e);
            alert('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset ' + activeRole + ' permissions to default?')) {
            setPermissions(prev => ({
                ...prev,
                [activeRole]: { ...DEFAULT_ROLE_PERMISSIONS[activeRole] }
            }));
        }
    };

    if (loading) return <div>Loading permissions...</div>;

    // Group permissions by category
    const groupedPermissions: Record<string, (keyof RolePermissions)[]> = {};
    Object.entries(PERMISSION_LABELS).forEach(([key, value]) => {
        if (!groupedPermissions[value.category]) groupedPermissions[value.category] = [];
        groupedPermissions[value.category].push(key as keyof RolePermissions);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        Role Permissions
                    </h2>
                    <p className="text-slate-600 text-sm">Control what each role can access and modify</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Defaults
                    </Button>
                    <Button onClick={handleSave} isLoading={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                {ROLES.map(role => (
                    <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeRole === role
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Permissions Grid */}
            <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, keys]) => (
                    <Card key={category} padding="none" className="overflow-hidden">
                        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                            <h3 className="font-bold text-slate-800">{category}</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            {keys.map(key => {
                                const isEnabled = permissions[activeRole][key];
                                return (
                                    <div key={key} className="flex items-center justify-between group">
                                        <label className="text-sm font-medium text-slate-700 group-hover:text-blue-700 cursor-pointer" htmlFor={`perm-${key}`}>
                                            {PERMISSION_LABELS[key].label}
                                        </label>

                                        <button
                                            id={`perm-${key}`}
                                            onClick={() => handleToggle(key)}
                                            className={`
                                                relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                                ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block w-4 h-4 transform bg-white rounded-full transition-transform mt-1 ml-1
                                                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                                `}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default RolePermissionsEditor;
