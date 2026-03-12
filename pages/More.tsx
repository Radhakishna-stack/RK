import React from 'react';
import {
    Home, Users, FileText, Package, Settings as SettingsIcon,
    Wrench, DollarSign, TrendingUp,
    Truck, UserCheck, ClipboardCheck, Receipt, ArrowDownCircle,
    ShoppingCart, ClipboardList, Wallet, Calendar, BarChart3,
    MapPin, Shield, CreditCard, Banknote,
    Binary, Trash2, ChevronRight, Cloud
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { canAccessRoute } from '../permissions';
import { UserRole } from '../types';

interface MorePageProps {
    onNavigate: (tab: string) => void;
    userRole?: UserRole;
}

const MorePage: React.FC<MorePageProps> = ({ onNavigate, userRole = 'employee' as UserRole }) => {
    // Helper: only show item if the current role is allowed
    const can = (route: string) => canAccessRoute(userRole, route);

    return (
        <div className="pb-32 px-4 pt-6 space-y-8 fade-up">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Terminal</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Control Center // v2.0</p>
            </div>

            {/* Customers Section — show if any sub-item is allowed */}
            {(can('customers') || can('visitors') || can('reminders') || can('party_statement')) && (
                <Section title="Directory" icon={<Users className="w-5 h-5" />}>
                    {can('customers') && (
                        <MenuItem
                            icon={<Users />}
                            label="Customers"
                            description="Core database"
                            color="#10B981"
                            onClick={() => onNavigate('customers')}
                        />
                    )}
                    {can('visitors') && (
                        <MenuItem
                            icon={<UserCheck />}
                            label="Visitors"
                            description="Daily arrivals"
                            color="#10B981"
                            onClick={() => onNavigate('visitors')}
                        />
                    )}
                    {can('reminders') && (
                        <MenuItem
                            icon={<Calendar />}
                            label="Reminders"
                            description="Service queue"
                            color="#10B981"
                            onClick={() => onNavigate('reminders')}
                        />
                    )}
                    {can('party_statement') && (
                        <MenuItem
                            icon={<FileText />}
                            label="Ledger"
                            description="Account history"
                            color="#10B981"
                            onClick={() => onNavigate('party_statement')}
                        />
                    )}
                </Section>
            )}

            {/* Workshop Section */}
            {(can('complaints') || can('inventory') || can('stock_wanting') || can('purchase') || can('pickup_manager')) && (
                <Section title="Operations" icon={<Wrench className="w-5 h-5" />}>
                    {can('complaints') && (
                        <MenuItem
                            icon={<ClipboardCheck />}
                            label="Work Orders"
                            description="Service jobs"
                            color="#F59E0B"
                            onClick={() => onNavigate('complaints')}
                        />
                    )}
                    {can('inventory') && (
                        <MenuItem
                            icon={<Package />}
                            label="Inventory"
                            description="Part management"
                            color="#F59E0B"
                            onClick={() => onNavigate('items')}
                        />
                    )}
                    {can('stock_wanting') && (
                        <MenuItem
                            icon={<ClipboardList />}
                            label="Stock Wanting"
                            description="Order parts"
                            color="#F59E0B"
                            onClick={() => onNavigate('stock_wanting')}
                        />
                    )}
                    {can('purchase') && (
                        <MenuItem
                            icon={<ShoppingCart />}
                            label="Purchases"
                            description="Supplier terminal"
                            color="#F59E0B"
                            onClick={() => onNavigate('purchase')}
                        />
                    )}
                    {can('pickup_manager') && (
                        <MenuItem
                            icon={<Truck />}
                            label="Pickup Manager"
                            description="Logistics & tracking"
                            color="#F59E0B"
                            onClick={() => onNavigate('pickup_manager')}
                        />
                    )}
                </Section>
            )}

            {/* Financial Section */}
            {(can('billing') || can('payment_voucher') || can('expenses') || can('bank_accounts') || can('cash_in_hand')) && (
                <Section title="Financial" icon={<DollarSign className="w-5 h-5" />}>
                    {can('billing') && (
                        <MenuItem
                            icon={<Receipt />}
                            label="Billing"
                            description="POS Terminal"
                            color="#0369A1"
                            onClick={() => onNavigate('billing')}
                        />
                    )}
                    {can('billing') && (
                        <MenuItem
                            icon={<FileText />}
                            label="Estimates"
                            description="Quotation desk"
                            color="#0369A1"
                            onClick={() => onNavigate('estimate')}
                        />
                    )}
                    {can('payment_voucher') && (
                        <MenuItem
                            icon={<ArrowDownCircle />}
                            label="Payments"
                            description="In / Out flow"
                            color="#0369A1"
                            onClick={() => onNavigate('payment_receipt')}
                        />
                    )}
                    {can('expenses') && (
                        <MenuItem
                            icon={<Wallet />}
                            label="Expenses"
                            description="Outflow logs"
                            color="#0369A1"
                            onClick={() => onNavigate('expenses')}
                        />
                    )}
                    {can('bank_accounts') && (
                        <MenuItem
                            icon={<CreditCard />}
                            label="Accounts"
                            description="Bank balances"
                            color="#0369A1"
                            onClick={() => onNavigate('bank_accounts')}
                        />
                    )}
                    {can('cash_in_hand') && (
                        <MenuItem
                            icon={<Banknote />}
                            label="Cash Logs"
                            description="Physical cash"
                            color="#0369A1"
                            onClick={() => onNavigate('cash_in_hand')}
                        />
                    )}
                </Section>
            )}

            {/* Team Section */}
            {(can('employee_panel') || can('salesmen') || can('staff_control') || can('field_service_manager')) && (
                <Section title="Team Operations" icon={<Shield className="w-5 h-5" />}>
                    {can('employee_panel') && (
                        <MenuItem
                            icon={<Users />}
                            label="Employees"
                            description="Team management"
                            onClick={() => onNavigate('employee_panel')}
                        />
                    )}
                    {can('salesmen') && (
                        <MenuItem
                            icon={<TrendingUp />}
                            label="Sales Tracking"
                            description="Monitor performance"
                            onClick={() => onNavigate('salesmen')}
                        />
                    )}
                    {can('staff_control') && (
                        <MenuItem
                            icon={<Shield />}
                            label="Staff Control"
                            description="Admin controls"
                            onClick={() => onNavigate('staff_control')}
                        />
                    )}
                    {can('field_service_manager') && (
                        <MenuItem
                            icon={<MapPin />}
                            label="Field Service Manager"
                            description="GPS tracking & field jobs"
                            onClick={() => onNavigate('field_service_manager')}
                            highlight
                        />
                    )}
                </Section>
            )}

            {/* Reports Section */}
            {(can('dashboard') || can('sale_report')) && (
                <Section title="Reports & Analytics" icon={<BarChart3 className="w-5 h-5" />}>
                    {can('dashboard') && (
                        <MenuItem
                            icon={<BarChart3 />}
                            label="Dashboard V2"
                            description="Advanced analytics"
                            onClick={() => onNavigate('dashboard')}
                        />
                    )}
                    {can('sale_report') && (
                        <MenuItem
                            icon={<TrendingUp />}
                            label="Sales Report"
                            description="Revenue analysis"
                            onClick={() => onNavigate('sale_report')}
                        />
                    )}
                </Section>
            )}

            {/* Tools & Settings Section */}
            {(can('utilities') || can('settings') || can('recycle_bin') || can('cloud_sync')) && (
                <Section title="Tools & Settings" icon={<SettingsIcon className="w-5 h-5" />}>
                    {can('utilities') && (
                        <MenuItem
                            icon={<Binary />}
                            label="Utilities"
                            description="System tools"
                            onClick={() => onNavigate('utilities')}
                        />
                    )}
                    {can('settings') && (
                        <MenuItem
                            icon={<SettingsIcon />}
                            label="Settings"
                            description="App configuration"
                            onClick={() => onNavigate('settings')}
                        />
                    )}
                    {can('recycle_bin') && (
                        <MenuItem
                            icon={<Trash2 />}
                            label="Recycle Bin"
                            description="Restore deleted items"
                            onClick={() => onNavigate('recycle_bin')}
                        />
                    )}
                    {can('cloud_sync') && (
                        <MenuItem
                            icon={<Cloud />}
                            label="Cloud Sync"
                            description="Google Sheets backup"
                            onClick={() => onNavigate('cloud_sync')}
                            highlight
                        />
                    )}
                </Section>
            )}
        </div>
    );
};

// Section Component — hides itself if all children are null
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
    // Filter out null/undefined/false children
    const validChildren = React.Children.toArray(children).filter(Boolean);
    if (validChildren.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <div style={{
                    background: '#F1F5F9',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #E2E8F0'
                }}>
                    <span className="text-blue-600">{icon}</span>
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h2>
                </div>
            </div>
            <Card padding="none" className="overflow-hidden card-glow">
                <div className="divide-y divide-slate-100">
                    {children}
                </div>
            </Card>
        </div>
    );
};

// Menu Item Component
const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    highlight?: boolean;
    color?: string;
}> = ({ icon, label, description, onClick, highlight, color = '#64748B' }) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center gap-4 p-4 text-left transition-all
      hover:bg-slate-50 active:bg-slate-100 group
      ${highlight ? 'bg-blue-50/50 border-l-[3px] border-l-[#0369A1]' : ''}
    `}
    >
        <div 
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
            style={{ 
                backgroundColor: highlight ? '#0369A1' : `${color}10`, 
                color: highlight ? 'white' : color,
                border: highlight ? 'none' : `1px solid ${color}20`
            }}
        >
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{label}</h3>
            <p className="text-[11px] font-medium text-slate-500 truncate uppercase mt-0.5 tracking-wide">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
    </button>
);

export default MorePage;
