import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Settings, ChevronRight, Loader2, ArrowUpRight,
  ArrowDownRight, Landmark, Wallet, Box, TrendingUp, IndianRupee,
  Bell, User, CreditCard, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { dbService } from '../db';
import { DashboardStats, InventoryItem, Invoice } from '../types';

interface DashboardV2Props {
  onNavigate: (tab: string) => void;
}

const DashboardV2: React.FC<DashboardV2Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, iData] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getInventory()
      ]);
      setStats(sData);
      setInventory(iData);
    } catch (err) {
      console.error("Dashboard V2 load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Nov', total: 12000 },
    { name: 'Dec', total: 18500 },
    { name: 'Jan', total: stats?.totalReceived || 0 },
  ];

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0369A1' }} />
      <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Tuning Metrics...
      </p>
    </div>
  );

  return (
    <div className="pb-32 animate-in fade-in duration-500">

      {/* ── Dashboard Content ── */}
      <div className="space-y-4">

        {/* Receivables/Payables Cards (Structural Minimalist) */}
        <div className="grid grid-cols-2 gap-4">
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #0369A1', borderRadius: '6px', padding: '1rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-3.5 h-3.5" style={{ color: '#0369A1' }} />
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                You'll Get
              </span>
            </div>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
              ₹{stats?.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #F59E0B', borderRadius: '6px', padding: '1rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                You'll Give
              </span>
            </div>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
              ₹{stats?.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Sale Overview Chart */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1.25rem' }}>
          <div className="flex justify-between items-start mb-4">
            <h4 style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sale Overview (Jan)
            </h4>
          </div>

          <div className="mb-4">
            <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: '2rem', fontWeight: 700, color: '#0369A1', letterSpacing: '-0.03em', lineHeight: 1 }}>
              ₹{stats?.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <div className="mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" style={{ color: '#10B981' }} />
              <span style={{ fontFamily: "'Fira Sans', sans-serif", fontSize: '0.75rem', color: '#64748B' }}>0% growth vs last month</span>
            </div>
          </div>

          <div className="h-44 w-full relative">
            <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-slate-200 -z-10" />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0369A1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0369A1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontFamily: "'Fira Code', monospace", fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  dy={10}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0369A1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  dot={{ r: 4, fill: '#FFFFFF', strokeWidth: 2, stroke: '#0369A1' }}
                  activeDot={{ r: 6, fill: '#0369A1', stroke: '#FFFFFF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem' }}>
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Purchases (Jan)
          </p>
          <h4 style={{ fontFamily: "'Fira Code', monospace", fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            ₹0.00
          </h4>
        </div>

        {/* Cash & Bank Section */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cash & Bank
            </h4>
          </div>
          <div style={{ padding: '1.25rem' }} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div style={{ padding: '0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Bank Balance</p>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '1rem', fontWeight: 700, color: '#0369A1' }}>₹{stats?.bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cash In Hand</p>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '1rem', fontWeight: 700, color: '#0369A1' }}>₹{stats?.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                List of Banks
              </div>
              <div className="space-y-3">
                <BankRow name="PHONE PE" amount={11830.00} />
                <BankRow name="PHONE PE (SIR)" amount={2190.00} />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Snapshot Section */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Inventory
            </h4>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div className="grid grid-cols-2 gap-4">
              <div style={{ padding: '0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Stock Value</p>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  ₹{inventory.reduce((s, i) => s + (i.stock * i.unitPrice), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>No. of Items</p>
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  {inventory.reduce((s, i) => s + i.stock, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Industrial CTA) */}
      <div className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-[60]">
        <button
          onClick={() => onNavigate('billing')}
          className="pointer-events-auto transform active:scale-95 transition-all"
          style={{
            background: '#0F172A', // Deep Navy base
            color: '#FFFFFF',
            padding: '1rem 2rem',
            border: '2px solid #F59E0B', // Amber structural border
            borderRadius: '4px',
            fontFamily: "'Fira Code', monospace",
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)'
          }}
        >
          <div style={{ background: '#0369A1', padding: '0.35rem', borderRadius: '2px' }}>
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          ADD SALE NOW
        </button>
      </div>

    </div>
  );
};

const BankRow: React.FC<{ name: string, amount: number }> = ({ name, amount }) => (
  <div className="flex justify-between items-center group">
    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
      {name}
    </span>
    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </span>
  </div>
);

export default DashboardV2;
