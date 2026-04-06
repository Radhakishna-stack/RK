import React, { useState, useEffect } from 'react';
import { LogIn, Lock, AlertCircle, Wrench } from 'lucide-react';
import { User as UserType } from '../types';

// ─────────────────────────────────────────────────────────────
//  DESIGN DIRECTION: "Industrial Precision"
//  Aesthetic: Industrial / Utilitarian
//  DFII Score: 15 (Excellent)
//  Differentiator: Asymmetric dark-left / white-right split
//    with a diagonal SVG separator — instantly recognizable,
//    zero resemblance to generic SaaS login screens.
//  Fonts: Fira Code (brand / labels) + Fira Sans (body)
//  Palette: Deep Navy #0F172A · CTA Blue #0369A1 · Amber #F59E0B
// ─────────────────────────────────────────────────────────────

interface LoginPageProps {
    onLogin: (credentials: { username: string; password: string }) => Promise<void> | void;
    error?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error: propError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(propError || '');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Trigger entrance animation after mount
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (propError) setError(propError);
    }, [propError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }
        setIsLoading(true);
        try {
            await onLogin({ username, password });
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden" style={{ background: '#0F172A' }}>

            {/* ── LEFT PANEL: Brand / Identity ────────────────────────── */}
            <div
                className="hidden lg:flex flex-col justify-between relative overflow-hidden"
                style={{
                    width: '45%',
                    background: 'linear-gradient(160deg, #0F172A 0%, #1e2d47 60%, #0c1f3d 100%)',
                    padding: '3.5rem',
                }}
            >
                {/* Diagonal separator — THE memorable differentiator */}
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                        position: 'absolute',
                        right: '-1px',
                        top: 0,
                        height: '100%',
                        width: '60px',
                        zIndex: 10,
                    }}
                >
                    <polygon points="0,0 100,0 100,100" fill="#F8FAFC" />
                </svg>

                {/* Amber accent line — structural decoration */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '3.5rem',
                    width: '3px',
                    height: '40%',
                    background: 'linear-gradient(to bottom, #F59E0B, transparent)',
                    borderRadius: '0 0 3px 3px',
                }} />

                {/* Gear mesh background texture */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `radial-gradient(circle at 20% 80%, rgba(3,105,161,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(245,158,11,0.08) 0%, transparent 50%)`,
                    pointerEvents: 'none',
                }} />

                {/* Brand mark */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: 48, height: 48,
                            background: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
                            borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 0 1px rgba(14,165,233,0.3), 0 8px 24px rgba(3,105,161,0.4)',
                        }}>
                            <Wrench size={24} color="white" />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Fira Code', monospace",
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#F8FAFC',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}>
                                MOTO GEAR
                            </div>
                            <div style={{
                                fontFamily: "'Fira Code', monospace",
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                color: '#F59E0B',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                            }}>
                                SRK // PRO TERMINAL
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle: tagline block */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        lineHeight: 1.15,
                        letterSpacing: '-0.03em',
                        marginBottom: '1.25rem',
                    }}>
                        Service.<br />
                        <span style={{ color: '#0EA5E9' }}>Precision.</span><br />
                        Control.
                    </h2>
                    <p style={{
                        fontFamily: "'Fira Sans', sans-serif",
                        fontSize: '0.9rem',
                        color: '#94A3B8',
                        lineHeight: 1.7,
                        maxWidth: '28ch',
                    }}>
                        Field service management for Moto Gear SRK's workshop and operations team.
                    </p>

                    {/* Status indicators */}
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {[
                            { label: 'Inventory', status: 'LIVE' },
                            { label: 'Field Jobs', status: 'LIVE' },
                            { label: 'Gold Scheme', status: 'LIVE' },
                        ].map(({ label, status }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#22C55E',
                                    boxShadow: '0 0 6px #22C55E',
                                    flexShrink: 0,
                                }} />
                                <span style={{
                                    fontFamily: "'Fira Code', monospace",
                                    fontSize: '0.75rem',
                                    color: '#64748B',
                                    letterSpacing: '0.05em',
                                }}>
                                    {label} — <span style={{ color: '#22C55E' }}>{status}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: footer */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: '0.65rem',
                        color: '#334155',
                        letterSpacing: '0.1em',
                    }}>
                        © 2026 MOTO GEAR SRK
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL: Login Form ─────────────────────────────── */}
            <div
                style={{
                    flex: 1,
                    background: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    {/* Mobile-only brand header */}
                    <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            background: '#0F172A', borderRadius: 14, padding: '0.75rem 1.25rem',
                        }}>
                            <Wrench size={20} color="#0EA5E9" />
                            <span style={{
                                fontFamily: "'Fira Code', monospace",
                                fontWeight: 700, fontSize: '0.9rem', color: '#F8FAFC',
                            }}>MOTO GEAR SRK</span>
                        </div>
                    </div>

                    {/* Form heading */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h1 style={{
                            fontFamily: "'Fira Code', monospace",
                            fontSize: 'clamp(1.6rem, 4vw, 2rem)',
                            fontWeight: 700,
                            color: '#0F172A',
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                            marginBottom: '0.5rem',
                        }}>
                            Sign in
                        </h1>
                        <p style={{
                            fontFamily: "'Fira Sans', sans-serif",
                            fontSize: '0.9rem',
                            color: '#64748B',
                        }}>
                            Enter your credentials to access the terminal.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate>

                        {/* Username */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label
                                htmlFor="username"
                                style={{
                                    display: 'block',
                                    fontFamily: "'Fira Code', monospace",
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#475569',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="admin"
                                autoComplete="username"
                                autoFocus
                                disabled={isLoading}
                                aria-describedby={error ? 'login-error' : undefined}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontFamily: "'Fira Sans', sans-serif",
                                    fontSize: '1rem',
                                    color: '#0F172A',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: 8,
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#0369A1';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#E2E8F0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '1.75rem' }}>
                            <label
                                htmlFor="password"
                                style={{
                                    display: 'block',
                                    fontFamily: "'Fira Code', monospace",
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#475569',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={isLoading}
                                aria-describedby={error ? 'login-error' : undefined}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontFamily: "'Fira Sans', sans-serif",
                                    fontSize: '1rem',
                                    color: '#0F172A',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: 8,
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#0369A1';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#E2E8F0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                id="login-error"
                                role="alert"
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.625rem',
                                    padding: '0.75rem 1rem',
                                    background: '#FEF2F2',
                                    border: '1.5px solid #FECACA',
                                    borderRadius: 8,
                                    marginBottom: '1.25rem',
                                }}
                            >
                                <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                                <p style={{
                                    fontFamily: "'Fira Sans', sans-serif",
                                    fontSize: '0.85rem',
                                    color: '#7F1D1D',
                                    margin: 0,
                                }}>
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading || !username.trim() || !password.trim()}
                            aria-label={isLoading ? 'Signing in…' : 'Sign in'}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.625rem',
                                fontFamily: "'Fira Code', monospace",
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                color: '#FFFFFF',
                                background: isLoading || !username.trim() || !password.trim()
                                    ? '#94A3B8'
                                    : 'linear-gradient(135deg, #0369A1 0%, #0284C7 100%)',
                                border: 'none',
                                borderRadius: 8,
                                cursor: isLoading || !username.trim() || !password.trim() ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
                                boxShadow: isLoading || !username.trim() || !password.trim()
                                    ? 'none'
                                    : '0 4px 14px rgba(3,105,161,0.35)',
                            }}
                            onMouseEnter={e => {
                                if (!isLoading && username.trim() && password.trim()) {
                                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                                    (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(3,105,161,0.45)';
                                }
                            }}
                            onMouseLeave={e => {
                                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(3,105,161,0.35)';
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div style={{
                                        width: 16, height: 16,
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    SIGN IN
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p style={{
                        marginTop: '2rem',
                        textAlign: 'center',
                        fontFamily: "'Fira Code', monospace",
                        fontSize: '0.65rem',
                        color: '#94A3B8',
                        letterSpacing: '0.1em',
                    }}>
                        Authorized personnel only
                    </p>
                </div>
            </div>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default LoginPage;
