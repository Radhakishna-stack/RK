import React, { useState, useEffect } from 'react';
import { dbService } from '../db';
import {
  ArrowLeft, Cloud, CloudOff, Link, CheckCircle, AlertCircle,
  Loader, RefreshCw, Trash2, Zap, ShieldCheck, Database,
  Users, FileText, Package, Wrench, CreditCard, Bell
} from 'lucide-react';

interface CloudSyncProps {
  onNavigate: (page: string) => void;
}

const CloudSync: React.FC<CloudSyncProps> = ({ onNavigate }) => {
  const [gasUrl, setGasUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const url = dbService.getGasUrl();
    setGasUrl(url);
    setIsConnected(!!url);
    // Show approximate last sync time from localStorage
    const ts = localStorage.getItem('mg_last_sync_ts');
    if (ts) setLastSyncTime(ts);
  }, []);

  // Update last sync timestamp whenever any data write happens
  useEffect(() => {
    const handler = () => {
      const now = new Date().toISOString();
      localStorage.setItem('mg_last_sync_ts', now);
      setLastSyncTime(now);
    };
    window.addEventListener('mg_data_updated', handler);
    return () => window.removeEventListener('mg_data_updated', handler);
  }, []);

  const handleSaveUrl = () => {
    const trimmed = gasUrl.trim();
    dbService.setGasUrl(trimmed);
    setIsConnected(!!trimmed);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'getDashboardStats', data: {} }),
      });
      const result = await res.json();
      setTestResult(result.success ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    dbService.setGasUrl('');
    setGasUrl('');
    setIsConnected(false);
    setTestResult(null);
  };

  const formatSyncTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const AUTO_SYNC_ITEMS = [
    { icon: <Wrench size={16} />, label: 'Service Jobs', color: '#f59e0b' },
    { icon: <Users size={16} />, label: 'Customers', color: '#3b82f6' },
    { icon: <FileText size={16} />, label: 'Invoices & Sales', color: '#8b5cf6' },
    { icon: <Package size={16} />, label: 'Inventory & Stock', color: '#10b981' },
    { icon: <CreditCard size={16} />, label: 'Expenses & Payments', color: '#ef4444' },
    { icon: <Bell size={16} />, label: 'Service Reminders', color: '#06b6d4' },
    { icon: <Database size={16} />, label: 'Pickup Requests', color: '#a855f7' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)', color: '#e0e0e0' }}>

      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15, 12, 41, 0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <button onClick={() => onNavigate('settings')} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={24} />
        </button>
        <Cloud size={24} color="#8b5cf6" />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Cloud Sync</h1>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 20,
          background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: isConnected ? '#22c55e' : '#ef4444',
          fontSize: 12, fontWeight: 600
        }}>
          {isConnected ? <Cloud size={14} /> : <CloudOff size={14} />}
          {isConnected ? 'Connected' : 'Not Connected'}
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Live Sync Status Banner */}
        {isConnected && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Zap size={18} color="#22c55e" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#22c55e', fontSize: 15 }}>Auto-Sync is Active</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6ee7b7' }}>
                Every change you make is instantly saved to Google Sheets.
                {lastSyncTime && ` Last sync: ${formatSyncTime(lastSyncTime)}`}
              </p>
            </div>
          </div>
        )}

        {/* Connection Setup Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 16,
          border: '1px solid rgba(139, 92, 246, 0.2)', padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Link size={20} color="#8b5cf6" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Google Apps Script URL</h2>
          </div>

          <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px 0', lineHeight: 1.5 }}>
            Paste your deployed Google Apps Script Web App URL below. Once saved, all data changes sync automatically — no manual action needed.
          </p>

          <input
            type="url"
            value={gasUrl}
            onChange={(e) => setGasUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/xxx/exec"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'monospace'
            }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleSaveUrl} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              💾 Save URL
            </button>

            {isConnected && (
              <button onClick={handleTestConnection} disabled={isTesting} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa', fontSize: 14, fontWeight: 600,
                cursor: isTesting ? 'not-allowed' : 'pointer', opacity: isTesting ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                {isTesting ? <Loader size={16} className="spin" /> : <RefreshCw size={16} />}
                {isTesting ? 'Testing…' : 'Test'}
              </button>
            )}

            {isConnected && (
              <button onClick={handleDisconnect} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', cursor: 'pointer'
              }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {testResult && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 8,
              background: testResult === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${testResult === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: testResult === 'success' ? '#22c55e' : '#ef4444', fontSize: 13
            }}>
              {testResult === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {testResult === 'success'
                ? '✅ Connection successful! Auto-sync is working.'
                : '❌ Connection failed. Check the URL and re-deploy the script.'}
            </div>
          )}
        </div>

        {/* What Auto-Syncs */}
        {isConnected && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 16,
            border: '1px solid rgba(139, 92, 246, 0.15)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <ShieldCheck size={20} color="#8b5cf6" />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Everything Syncs Automatically</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {AUTO_SYNC_ITEMS.map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#555', margin: '14px 0 0', textAlign: 'center' }}>
              ⚡ Writes go to local cache first (instant), then cloud in the background — no waiting, no manual action.
            </p>
          </div>
        )}

        {/* Not connected help */}
        {!isConnected && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)', padding: 20
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#999' }}>How to connect</h3>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#777', lineHeight: 1.9 }}>
              <li>Open your Google Sheet → <strong style={{ color: '#bbb' }}>Extensions → Apps Script</strong></li>
              <li>Paste the <code style={{ color: '#8b5cf6' }}>gas-backend.ts</code> code</li>
              <li>Click <strong style={{ color: '#bbb' }}>Deploy → New Deployment → Web App</strong></li>
              <li>Set access to <strong style={{ color: '#bbb' }}>Anyone</strong>, copy the URL</li>
              <li>Paste it above and click <strong style={{ color: '#bbb' }}>Save URL</strong></li>
            </ol>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default CloudSync;
