import React, { useState } from 'react';
import { Lock, Mail, User, AtSign, Image as ImageIcon, KeyRound, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { apiFetch, setStoredToken } from '../api';

interface AuthViewProps {
  onAuthenticated: (user: UserProfile) => void;
  onNotifyToast: (msg: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated, onNotifyToast }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password Reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, rememberMe })
      });
      setStoredToken(res.token);
      onNotifyToast(`Welcome back, ${res.user.name}.`);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: demoEmail, password: 'Password123!', rememberMe: true })
      });
      setStoredToken(res.token);
      onNotifyToast(`Signed in as ${res.user.name}.`);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, username, email, password, avatar })
      });
      setStoredToken(res.token);
      onNotifyToast(`Welcome to INKWAVE, ${res.user.name}!`);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; resetToken: string; email: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: resetEmail })
        }
      );
      setResetToken(res.resetToken);
      setSuccessMsg(`${res.message} Verification Code: ${res.resetToken}`);
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Could not process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          token: resetToken,
          newPassword
        })
      });
      setSuccessMsg(res.message);
      setIdentifier(resetEmail);
      setPassword(newPassword);
      setMode('login');
      onNotifyToast('Password reset complete. Please sign in.');
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/90 dark:bg-[#0F172A]/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            INKWAVE Membership
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white">
            {mode === 'login' && 'Sign in to your salon'}
            {mode === 'register' && 'Join the publishing collective'}
            {mode === 'forgot' && 'Recover your account'}
            {mode === 'reset' && 'Set a new password'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            “Ideas move. Stories stay.”
          </p>
        </div>

        {/* Mode Switcher */}
        {(mode === 'login' || mode === 'register') && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/5 dark:bg-slate-100/5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="elena@inkwave.io or elenavance"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="text-[#2563EB] dark:text-blue-400 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Instant Demo Accounts for immediate exploration */}
            <div className="pt-4 border-t border-slate-900/10 dark:border-slate-100/10 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                Instant Demo Accounts
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('elena@inkwave.io')}
                  className="w-full py-2 px-3 rounded-lg border border-slate-900/10 dark:border-slate-100/10 hover:border-[#2563EB] text-xs text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>
                    <strong className="text-[#0B132B] dark:text-white">Elena Vance</strong> · Founding Editor (Admin)
                  </span>
                  <span className="text-[#2563EB] font-medium">1-Click Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('arjun@inkwave.io')}
                  className="w-full py-2 px-3 rounded-lg border border-slate-900/10 dark:border-slate-100/10 hover:border-[#2563EB] text-xs text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>
                    <strong className="text-[#0B132B] dark:text-white">Arjun Mehta</strong> · Systems Architect
                  </span>
                  <span className="text-[#2563EB] font-medium">1-Click Sign In</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="adalovelace"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm font-mono text-[#0B132B] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ada@inkwave.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Profile Image URL (optional — auto-generated if left blank)
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="/api/avatar/Ada-Lovelace.svg"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="elena@inkwave.io"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold"
            >
              {loading ? 'Generating reset code...' : 'Send Reset Token'}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-500 hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Verification Token
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm font-mono uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
            >
              {loading ? 'Updating password...' : 'Confirm Password Reset'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
