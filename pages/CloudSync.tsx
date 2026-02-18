import React, { useState, useEffect } from 'react';
import { dbService } from '../db';
import { ArrowLeft, Cloud, CloudOff, Upload, Download, Link, CheckCircle, AlertCircle, Loader, RefreshCw, Trash2, ExternalLink } from 'lucide-react';

interface CloudSyncProps {
    onNavigate: (page: string) => void;
}

const CloudSync: React.FC<CloudSyncProps> = ({ onNavigate }) => {
    const [gasUrl, setGasUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState('');
    const [pullStatus, setPullStatus] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [showConfirm, setShowConfirm] = useState<'migrate' | 'pull' | null>(null);

    useEffect(() => {
        const url = dbService.getGasUrl();
        setGasUrl(url);
        setIsConnected(!!url);
    }, []);

    const handleSaveUrl = () => {
        if (!gasUrl.trim()) {
            dbService.setGasUrl('');
            setIsConnected(false);
            setTestResult(null);
            return;
        }
        dbService.setGasUrl(gasUrl.trim());
        setIsConnected(true);
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

    const handleMigrate = async () => {
        setShowConfirm(null);
        setIsMigrating(true);
        setMigrationStatus('Migrating data to Google Sheets...');
        try {
            const result = await dbService.migrateToCloud();
            setMigrationStatus(result);
        } catch (err: any) {
            setMigrationStatus(`❌ Migration failed: ${err.message}`);
        } finally {
            setIsMigrating(false);
        }
    };

    const handlePull = async () => {
        setShowConfirm(null);
        setIsPulling(true);
        setPullStatus('Pulling data from Google Sheets...');
        try {
            const result = await dbService.pullFromCloud();
            setPullStatus(result);
        } catch (err: any) {
            setPullStatus(`❌ Pull failed: ${err.message}`);
        } finally {
            setIsPulling(false);
        }
    };

    const handleDisconnect = () => {
        dbService.setGasUrl('');
        setGasUrl('');
        setIsConnected(false);
        setTestResult(null);
        setMigrationStatus('');
        setPullStatus('');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)', color: '#e0e0e0' }}>
            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(15, 12, 41, 0.95)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12
            }}>
                <button onClick={() => onNavigate('settings')} style={{
                    background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: 4
                }}>
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
                    {isConnected ? 'Connected' : 'Offline'}
                </div>
            </div>

            <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
                {/* Connection Setup Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 16,
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    padding: 20, marginBottom: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Link size={20} color="#8b5cf6" />
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Google Apps Script URL</h2>
                    </div>

                    <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                        Paste your deployed Google Apps Script Web App URL here. This connects your app to Google Sheets for cloud storage.
                    </p>

                    <input
                        type="url"
                        value={gasUrl}
                        onChange={(e) => setGasUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/xxx/exec"
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                            fontFamily: 'monospace'
                        }}
                    />

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleSaveUrl} style={{
                            flex: 1, padding: '10px 16px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer'
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
                                {isTesting ? 'Testing...' : 'Test'}
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
                            color: testResult === 'success' ? '#22c55e' : '#ef4444',
                            fontSize: 13
                        }}>
                            {testResult === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {testResult === 'success' ? 'Connection successful! Google Sheets is reachable.' : 'Connection failed. Check the URL and ensure the script is deployed.'}
                        </div>
                    )}
                </div>

                {/* Data Migration Card */}
                {isConnected && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)', borderRadius: 16,
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        padding: 20, marginBottom: 20
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <Upload size={20} color="#22c55e" />
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Push to Cloud</h2>
                        </div>

                        <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                            Push all local data (localStorage) to Google Sheets. Use this for <strong>first-time setup</strong> or to sync after offline changes.
                        </p>

                        <button
                            onClick={() => setShowConfirm('migrate')}
                            disabled={isMigrating}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10,
                                background: isMigrating ? 'rgba(34, 197, 94, 0.1)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                                cursor: isMigrating ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            {isMigrating ? <Loader size={18} /> : <Upload size={18} />}
                            {isMigrating ? 'Migrating...' : '📤 Push Data to Google Sheets'}
                        </button>

                        {migrationStatus && (
                            <pre style={{
                                marginTop: 12, padding: 14, borderRadius: 10,
                                background: 'rgba(0,0,0,0.3)', fontSize: 12, color: '#bbb',
                                whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 300, overflow: 'auto'
                            }}>
                                {migrationStatus}
                            </pre>
                        )}
                    </div>
                )}

                {/* Pull from Cloud Card */}
                {isConnected && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)', borderRadius: 16,
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        padding: 20, marginBottom: 20
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <Download size={20} color="#60a5fa" />
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Pull from Cloud</h2>
                        </div>

                        <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                            Download all data from Google Sheets into this device. Use this to <strong>sync a new device</strong> or restore after clearing browser data.
                        </p>

                        <button
                            onClick={() => setShowConfirm('pull')}
                            disabled={isPulling}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10,
                                background: isPulling ? 'rgba(59, 130, 246, 0.1)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                                cursor: isPulling ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            {isPulling ? <Loader size={18} /> : <Download size={18} />}
                            {isPulling ? 'Pulling...' : '📥 Pull Data from Google Sheets'}
                        </button>

                        {pullStatus && (
                            <pre style={{
                                marginTop: 12, padding: 14, borderRadius: 10,
                                background: 'rgba(0,0,0,0.3)', fontSize: 12, color: '#bbb',
                                whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 300, overflow: 'auto'
                            }}>
                                {pullStatus}
                            </pre>
                        )}
                    </div>
                )}

                {/* How It Works Info Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <ExternalLink size={18} color="#888" />
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#999' }}>How It Works</h3>
                    </div>
                    <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7 }}>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong style={{ color: '#bbb' }}>📝 Automatic Sync:</strong> Every time you add, edit, or delete data in the app,
                            it's instantly saved locally AND synced to Google Sheets in the background.
                        </p>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong style={{ color: '#bbb' }}>⚡ Speed:</strong> Reads come from localStorage (instant).
                            Writes go to both localStorage and cloud (non-blocking).
                        </p>
                        <p style={{ margin: 0 }}>
                            <strong style={{ color: '#bbb' }}>🔄 New Device:</strong> Use "Pull from Cloud" to download
                            all your data onto a new phone or browser.
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, padding: 20
                }}>
                    <div style={{
                        background: '#1a1a2e', borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        padding: 24, maxWidth: 400, width: '100%'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700 }}>
                            {showConfirm === 'migrate' ? '⚠️ Push to Cloud?' : '⚠️ Pull from Cloud?'}
                        </h3>
                        <p style={{ color: '#999', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px 0' }}>
                            {showConfirm === 'migrate'
                                ? 'This will upload all your local data to Google Sheets. Existing cloud data may be overwritten with duplicates.'
                                : 'This will overwrite your local data with data from Google Sheets. Make sure your cloud data is up to date.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowConfirm(null)} style={{
                                flex: 1, padding: '10px 16px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: '#ccc', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                            }}>
                                Cancel
                            </button>
                            <button onClick={showConfirm === 'migrate' ? handleMigrate : handlePull} style={{
                                flex: 1, padding: '10px 16px', borderRadius: 10,
                                background: showConfirm === 'migrate'
                                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                            }}>
                                {showConfirm === 'migrate' ? 'Yes, Push' : 'Yes, Pull'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spin animation */}
            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
        </div>
    );
};

export default CloudSync;
