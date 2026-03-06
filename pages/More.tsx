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
        <div className="pb-32 px-4 pt-6 space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">All Features</h1>
                <p className="text-slate-600">Organize your business operations</p>
            </div>

            {/* Customers Section — show if any sub-item is allowed */}
            {(can('customers') || can('visitors') || can('reminders') || can('party_statement')) && (
                <Section title="Customers" icon={<Users className="w-5 h-5" />}>
                    {can('customers') && (
                        <MenuItem
                            icon={<Users />}
                            label="Customers"
                            description="Manage customer database"
                            onClick={() => onNavigate('customers')}
                        />
                    )}
                    {can('visitors') && (
                        <MenuItem
                            icon={<UserCheck />}
                            label="Walk-in Visitors"
                            description="Track daily visitors"
                            onClick={() => onNavigate('visitors')}
                        />
                    )}
                    {can('reminders') && (
                        <MenuItem
                            icon={<Calendar />}
                            label="Service Reminders"
                            description="Schedule follow-ups"
                            onClick={() => onNavigate('reminders')}
                        />
                    )}
                    {can('party_statement') && (
                        <MenuItem
                            icon={<FileText />}
                            label="Customer Ledger"
                            description="View statements"
                            onClick={() => onNavigate('party_statement')}
                        />
                    )}
                </Section>
            )}

            {/* Workshop Section */}
            {(can('complaints') || can('inventory') || can('stock_wanting') || can('purchase') || can('pickup_manager')) && (
                <Section title="Workshop" icon={<Wrench className="w-5 h-5" />}>
                    {can('complaints') && (
                        <MenuItem
                            icon={<ClipboardCheck />}
                            label="Service Jobs"
                            description="Manage work orders"
                            onClick={() => onNavigate('complaints')}
                        />
                    )}
                    {can('inventory') && (
                        <MenuItem
                            icon={<Package />}
                            label="Inventory"
                            description="Stock management"
                            onClick={() => onNavigate('items')}
                        />
                    )}
                    {can('stock_wanting') && (
                        <MenuItem
                            icon={<ClipboardList />}
                            label="Stock Request"
                            description="Order needed parts"
                            onClick={() => onNavigate('stock_wanting')}
                        />
                    )}
                    {can('purchase') && (
                        <MenuItem
                            icon={<ShoppingCart />}
                            label="Purchase Orders"
                            description="Supplier orders"
                            onClick={() => onNavigate('purchase')}
                        />
                    )}
                    {can('pickup_manager') && (
                        <MenuItem
                            icon={<Truck />}
                            label="Pickup Manager"
                            description="Manage vehicle pickups & track employees"
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
                            description="Create invoices"
                            onClick={() => onNavigate('billing')}
                        />
                    )}
                    {can('billing') && (
                        <MenuItem
                            icon={<FileText />}
                            label="Estimates"
                            description="Quote customers"
                            onClick={() => onNavigate('estimate')}
                        />
                    )}
                    {can('payment_voucher') && (
                        <MenuItem
                            icon={<ArrowDownCircle />}
                            label="Payment Receipt"
                            description="Receive payments"
                            onClick={() => onNavigate('payment_receipt')}
                        />
                    )}
                    {can('expenses') && (
                        <MenuItem
                            icon={<Wallet />}
                            label="Expenses"
                            description="Track spending"
                            onClick={() => onNavigate('expenses')}
                        />
                    )}
                    {can('bank_accounts') && (
                        <MenuItem
                            icon={<CreditCard />}
                            label="Bank Accounts"
                            description="Account management"
                            onClick={() => onNavigate('bank_accounts')}
                        />
                    )}
                    {can('cash_in_hand') && (
                        <MenuItem
                            icon={<Banknote />}
                            label="Cash in Hand"
                            description="Cash flow tracking"
                            onClick={() => onNavigate('cash_in_hand')}
                            noBorder
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
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <div className="text-blue-600">{icon}</div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h2>
            </div>
            <Card padding="none" className="overflow-hidden">
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
    noBorder?: boolean;
}> = ({ icon, label, description, onClick, highlight }) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center gap-4 p-4 text-left transition-colors
      hover:bg-slate-50 active:bg-slate-100
      ${highlight ? 'bg-blue-50 hover:bg-blue-100' : ''}
    `}
    >
        <div className={`
      flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center
      ${highlight ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}
    `}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900">{label}</h3>
            <p className="text-sm text-slate-500 truncate">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
    </button>
);

export default MorePage;
