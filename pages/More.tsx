import React, { useState } from 'react';
import {
    Home, Users, FileText, Package, Settings as SettingsIcon,
    Wrench, DollarSign, TrendingUp, MessagesSquare, Sparkles,
    Truck, UserCheck, ClipboardCheck, Receipt, ArrowDownCircle,
    ShoppingCart, ClipboardList, Wallet, Calendar, BarChart3,
    MapPin, Bot, Shield, CreditCard, Banknote, CheckSquare,
    Megaphone, Chrome, Binary, Trash2, ChevronRight, LayoutGrid
} from 'lucide-react';
import { Card } from '../components/ui/Card';

interface MorePageProps {
    onNavigate: (tab: string) => void;
}

const MorePage: React.FC<MorePageProps> = ({ onNavigate }) => {
    return (
        <div className="pb-32 px-4 pt-6 space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">All Features</h1>
                <p className="text-slate-600">Organize your business operations</p>
            </div>

            {/* Customers Section */}
            <Section title="Customers" icon={<Users className="w-5 h-5" />}>
                <MenuItem
                    icon={<Users />}
                    label="Customers"
                    description="Manage customer database"
                    onClick={() => onNavigate('customers')}
                />
                <MenuItem
                    icon={<UserCheck />}
                    label="Walk-in Visitors"
                    description="Track daily visitors"
                    onClick={() => onNavigate('visitors')}
                />
                <MenuItem
                    icon={<Calendar />}
                    label="Service Reminders"
                    description="Schedule follow-ups"
                    onClick={() => onNavigate('reminders')}
                />
                <MenuItem
                    icon={<FileText />}
                    label="Customer Ledger"
                    description="View statements"
                    onClick={() => onNavigate('party_statement')}
                />
            </Section>

            {/* Workshop Section */}
            <Section title="Workshop" icon={<Wrench className="w-5 h-5" />}>
                <MenuItem
                    icon={<ClipboardCheck />}
                    label="Service Jobs"
                    description="Manage work orders"
                    onClick={() => onNavigate('complaints')}
                />
                <MenuItem
                    icon={<Package />}
                    label="Inventory"
                    description="Stock management"
                    onClick={() => onNavigate('items')}
                />
                <MenuItem
                    icon={<ClipboardList />}
                    label="Stock Request"
                    description="Order needed parts"
                    onClick={() => onNavigate('stock_wanting')}
                />
                <MenuItem
                    icon={<ShoppingCart />}
                    label="Purchase Orders"
                    description="Supplier orders"
                    onClick={() => onNavigate('purchase')}
                />
            </Section>

            {/* Financial Section */}
            <Section title="Financial" icon={<DollarSign className="w-5 h-5" />}>
                <MenuItem
                    icon={<Receipt />}
                    label="Billing"
                    description="Create invoices"
                    onClick={() => onNavigate('billing')}
                />
                <MenuItem
                    icon={<FileText />}
                    label="Estimates"
                    description="Quote customers"
                    onClick={() => onNavigate('estimate')}
                />
                <MenuItem
                    icon={<ArrowDownCircle />}
                    label="Payment Receipt"
                    description="Receive payments"
                    onClick={() => onNavigate('payment_receipt')}
                />
                <MenuItem
                    icon={<Wallet />}
                    label="Expenses"
                    description="Track spending"
                    onClick={() => onNavigate('expenses')}
                />
                <MenuItem
                    icon={<CreditCard />}
                    label="Bank Accounts"
                    description="Account management"
                    onClick={() => onNavigate('bank_accounts')}
                />
                <MenuItem
                    icon={<Banknote />}
                    label="Cash in Hand"
                    description="Cash flow tracking"
                    onClick={() => onNavigate('cash_in_hand')}
                    noBorder
                />

            </Section>

            {/* Team Section */}
            <Section title="Team Operations" icon={<Shield className="w-5 h-5" />}>
                <MenuItem
                    icon={<Users />}
                    label="Employees"
                    description="Team management"
                    onClick={() => onNavigate('employee_panel')}
                />
                <MenuItem
                    icon={<TrendingUp />}
                    label="Sales Tracking"
                    description="Monitor performance"
                    onClick={() => onNavigate('salesmen')}
                />
                <MenuItem
                    icon={<Shield />}
                    label="Staff Control"
                    description="Admin controls"
                    onClick={() => onNavigate('staff_control')}
                />
                <MenuItem
                    icon={<MapPin />}
                    label="Field Service Manager"
                    description="GPS tracking & field jobs"
                    onClick={() => onNavigate('field_service_manager')}
                    highlight
                />
            </Section>

            {/* Marketing Section */}
            <Section title="Marketing" icon={<Megaphone className="w-5 h-5" />}>
                <MenuItem
                    icon={<MessagesSquare />}
                    label="WhatsApp Marketing"
                    description="Bulk messaging"
                    onClick={() => onNavigate('whatsapp_marketing')}
                />
                <MenuItem
                    icon={<Chrome />}
                    label="Google Profile"
                    description="Business listing"
                    onClick={() => onNavigate('google_profile')}
                />
                <MenuItem
                    icon={<Megaphone />}
                    label="Ad Campaigns"
                    description="Manage ads"
                    onClick={() => onNavigate('ads')}
                />
                <MenuItem
                    icon={<MapPin />}
                    label="Market Research"
                    description="Local insights"
                    onClick={() => onNavigate('market_explorer')}
                />
            </Section>

            {/* AI Tools Section */}
            <Section title="AI Powered" icon={<Sparkles className="w-5 h-5" />}>
                <MenuItem
                    icon={<Bot />}
                    label="Tech Agent"
                    description="AI assistant"
                    onClick={() => onNavigate('tech_agent')}
                    highlight
                />
                <MenuItem
                    icon={<Sparkles />}
                    label="Business Insights"
                    description="AI predictions"
                    onClick={() => onNavigate('horoscope')}
                />
                <MenuItem
                    icon={<Sparkles />}
                    label="Smart Ads"
                    description="AI ad generation"
                    onClick={() => onNavigate('smart_ads')}
                />
                <MenuItem
                    icon={<Sparkles />}
                    label="Marketing Tools"
                    description="AI marketing"
                    onClick={() => onNavigate('marketing_tools')}
                />
            </Section>

            {/* Reports Section */}
            <Section title="Reports & Analytics" icon={<BarChart3 className="w-5 h-5" />}>
                <MenuItem
                    icon={<BarChart3 />}
                    label="Dashboard V2"
                    description="Advanced analytics"
                    onClick={() => onNavigate('dashboard')}
                />
                <MenuItem
                    icon={<TrendingUp />}
                    label="Sales Report"
                    description="Revenue analysis"
                    onClick={() => onNavigate('sale_report')}
                />
            </Section>

            {/* Tools Section */}
            <Section title="Tools & Settings" icon={<SettingsIcon className="w-5 h-5" />}>
                <MenuItem
                    icon={<Binary />}
                    label="Utilities"
                    description="System tools"
                    onClick={() => onNavigate('utilities')}
                />
                <MenuItem
                    icon={<SettingsIcon />}
                    label="Settings"
                    description="App configuration"
                    onClick={() => onNavigate('settings')}
                />
                <MenuItem
                    icon={<Trash2 />}
                    label="Recycle Bin"
                    description="Restore deleted items"
                    onClick={() => onNavigate('recycle_bin')}
                />
            </Section>
        </div>
    );
};

// Section Component
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
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

// Menu Item Component
const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    highlight?: boolean;
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
