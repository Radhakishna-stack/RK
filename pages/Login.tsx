import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User as UserType } from '../types';

interface LoginPageProps {
    onLogin: (user: UserType) => void;
    error?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error: propError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(propError || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);

        try {
            // Call the parent's onLogin handler
            // The parent (App) will handle authentication logic
            await onLogin({ username, password } as any);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Moto Gear SRK</h1>
                    <p className="text-slate-600">Service Management System</p>
                </div>

                {/* Login Card */}
                <Card className="backdrop-blur-sm bg-white/90 border-slate-200 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="pl-11"
                                    autoComplete="username"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="pl-11"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Login Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !username.trim() || !password.trim()}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <LogIn className="w-5 h-5" />
                                    <span>Sign In</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Default Credentials Info */}
                <div className="mt-6 text-center">
                    <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Default Credentials</p>
                        <p className="text-xs text-blue-700">
                            Username: <span className="font-mono font-bold">admin</span>
                            {' '} | {' '}
                            Password: <span className="font-mono font-bold">admin123</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-slate-500">
                    <p>© 2026 Moto Gear SRK. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
