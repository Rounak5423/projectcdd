// ===========================================================================
// CIVORA — CivoraAuthPage
// Premium Login & Registration screen shown after the Landing Page.
// Uses the CIVORA brand identity and connects to the backend auth API.
// ===========================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Shield, User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface CivoraAuthPageProps {
  onAuthenticated: () => void;
  onBackToLanding: () => void;
}

type Mode = 'login' | 'register';

interface FieldError {
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function CivoraAuthPage({ onAuthenticated, onBackToLanding }: CivoraAuthPageProps) {
  const { login, register, error, clearError, isAuthenticated, user, logout } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [success, setSuccess] = useState('');
  const authTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (authTimerRef.current) clearTimeout(authTimerRef.current);
    };
  }, []);

  // Clear API error when user switches mode or types
  const handleModeSwitch = (m: Mode) => {
    clearError();
    setFieldErrors({});
    setSuccess('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setMode(m);
  };

  const validate = (): boolean => {
    const errs: FieldError = {};
    if (!username.trim()) errs.username = 'Username is required.';
    else if (username.trim().length < 3) errs.username = 'Must be at least 3 characters.';

    if (mode === 'register') {
      if (!email.trim()) errs.email = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    }

    if (!password) errs.password = 'Password is required.';
    else if (mode === 'register' && password.length < 8) errs.password = 'Password must be at least 8 characters.';

    if (mode === 'register') {
      if (!confirm) errs.confirm = 'Please confirm your password.';
      else if (confirm !== password) errs.confirm = 'Passwords do not match.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
        setSuccess('Welcome back, Commander.');
      } else {
        await register(username.trim(), email.trim(), password);
        setSuccess('Your civilisation awaits, Commander.');
      }
      authTimerRef.current = setTimeout(() => onAuthenticated(), 700);
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = (): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#c0392b' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#e67e22' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#c6a76a' };
    return { level: 4, label: 'Strong', color: '#2ecc71' };
  };

  const strength = passwordStrength();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a2a1b 0%, #0d130e 60%, #060b07 100%)' }}
    >
      {/* Background texture particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5a66a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Golden diagonal light beam */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ background: 'linear-gradient(135deg, #c5a66a22 0%, transparent 50%, #c5a66a11 100%)' }}
      />

      {/* Back link */}
      <button
        onClick={onBackToLanding}
        className="absolute top-6 left-6 text-[#c5a66a]/70 hover:text-[#c5a66a] text-xs font-mono tracking-widest uppercase transition-colors flex items-center gap-2 cursor-pointer"
      >
        ← Return to CIVORA
      </button>

      {/* Main card */}
      <div
        className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl shadow-2xl"
        style={{
          border: '1px solid rgba(197,166,106,0.25)',
          background: 'linear-gradient(160deg, #141c14 0%, #0f160f 100%)',
        }}
      >
        {/* Top gold accent bar */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #c5a66a, transparent)' }} />

        <div className="px-8 py-10">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-3 p-3 rounded-full border border-[#c5a66a]/30 bg-[#c5a76a]/5">
              <Shield size={28} className="text-[#c5a66a]" />
            </div>
            <h1 className="text-3xl font-bold tracking-[0.2em] text-[#eae3d2] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
              CIVORA
            </h1>
            <p className="text-xs tracking-[0.3em] text-[#c5a66a]/70 uppercase mt-1" style={{ fontFamily: 'Cinzel, serif' }}>
              Civilisation Simulation Engine
            </p>
            <div className="mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#c5a66a]/40 to-transparent" />
          </div>

          {/* Active Session Card (if user already logged in) */}
          {isAuthenticated && user && (
            <div className="mb-6 p-3.5 rounded-xl border border-[#c5a66a]/30 bg-[#c5a66a]/10 backdrop-blur-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#c5a66a] font-bold">Authenticated Session</div>
                  <div className="text-sm font-semibold text-[#eae3d2]">{user.username}</div>
                  <div className="text-[11px] text-[#c5a66a]/70">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-2.5 py-1 text-[11px] rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  Sign Out
                </button>
              </div>
              <button
                type="button"
                onClick={() => onAuthenticated()}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#c5a66a] to-[#d4b479] text-[#0d130e] font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue into CIVORA</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-[#c5a66a]/15 mb-7">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-widest uppercase transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-[#c5a66a] text-[#0d130e]'
                    : 'text-[#c5a66a]/60 hover:text-[#c5a66a] bg-transparent'
                }`}
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Success banner */}
          {success && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 text-sm animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* API Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm animate-in fade-in">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* Username */}
            <div>
              <label className="text-[10px] tracking-widest uppercase text-[#c5a66a]/70 mb-1.5 block font-semibold" style={{ fontFamily: 'Cinzel, serif' }}>
                {mode === 'login' ? 'Username or Email' : 'Username'}
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a66a]/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); setFieldErrors((p) => ({ ...p, username: '' })); }}
                  placeholder={mode === 'login' ? 'Enter username or email' : 'Choose a username'}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0f1710] border text-[#eae3d2] text-sm placeholder:text-[#5a6456] outline-none transition-all focus:ring-1 focus:ring-[#c5a66a]/40 ${
                    fieldErrors.username ? 'border-red-600/60' : 'border-[#2a3a2a] focus:border-[#c5a66a]/40'
                  }`}
                  autoComplete="username"
                  disabled={submitting}
                />
              </div>
              {fieldErrors.username && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.username}</p>}
            </div>

            {/* Email — only on register */}
            {mode === 'register' && (
              <div>
                <label className="text-[10px] tracking-widest uppercase text-[#c5a66a]/70 mb-1.5 block font-semibold" style={{ fontFamily: 'Cinzel, serif' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a66a]/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); setFieldErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="your@email.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0f1710] border text-[#eae3d2] text-sm placeholder:text-[#5a6456] outline-none transition-all focus:ring-1 focus:ring-[#c5a66a]/40 ${
                      fieldErrors.email ? 'border-red-600/60' : 'border-[#2a3a2a] focus:border-[#c5a66a]/40'
                    }`}
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>
                {fieldErrors.email && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.email}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="text-[10px] tracking-widest uppercase text-[#c5a66a]/70 mb-1.5 block font-semibold" style={{ fontFamily: 'Cinzel, serif' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a66a]/40" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); setFieldErrors((p) => ({ ...p, password: '' })); }}
                  placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#0f1710] border text-[#eae3d2] text-sm placeholder:text-[#5a6456] outline-none transition-all focus:ring-1 focus:ring-[#c5a66a]/40 ${
                    fieldErrors.password ? 'border-red-600/60' : 'border-[#2a3a2a] focus:border-[#c5a66a]/40'
                  }`}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5a66a]/40 hover:text-[#c5a66a]/70 cursor-pointer transition-colors"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.password}</p>}

              {/* Password strength indicator — register only */}
              {mode === 'register' && password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="h-1 w-8 rounded-full transition-all"
                        style={{ background: n <= strength.level ? strength.color : '#2a3a2a' }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password — register only */}
            {mode === 'register' && (
              <div>
                <label className="text-[10px] tracking-widest uppercase text-[#c5a66a]/70 mb-1.5 block font-semibold" style={{ fontFamily: 'Cinzel, serif' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a66a]/40" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: '' })); }}
                    placeholder="Re-enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#0f1710] border text-[#eae3d2] text-sm placeholder:text-[#5a6456] outline-none transition-all focus:ring-1 focus:ring-[#c5a66a]/40 ${
                      fieldErrors.confirm ? 'border-red-600/60' : 'border-[#2a3a2a] focus:border-[#c5a66a]/40'
                    }`}
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5a66a]/40 hover:text-[#c5a66a]/70 cursor-pointer transition-colors"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {fieldErrors.confirm && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.confirm}</p>}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 rounded-lg font-bold tracking-widest uppercase text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              style={{
                fontFamily: 'Cinzel, serif',
                background: submitting ? '#3a2e1a' : 'linear-gradient(135deg, #c5a66a 0%, #a07c40 100%)',
                color: submitting ? '#c5a66a' : '#0d130e',
                boxShadow: submitting ? 'none' : '0 0 20px rgba(197,166,106,0.2)',
              }}
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Verifying…</>
              ) : mode === 'login' ? (
                'Enter the Simulation'
              ) : (
                'Found Your Civilisation'
              )}
            </button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-[11px] text-[#5a6456] mt-6">
            {mode === 'login' ? (
              <>No account?{' '}<button onClick={() => handleModeSwitch('register')} className="text-[#c5a66a]/70 hover:text-[#c5a66a] underline cursor-pointer transition-colors">Create one</button></>
            ) : (
              <>Already a Commander?{' '}<button onClick={() => handleModeSwitch('login')} className="text-[#c5a66a]/70 hover:text-[#c5a66a] underline cursor-pointer transition-colors">Sign in</button></>
            )}
          </p>

          {/* Demo credentials hint with quick-fill */}
          {mode === 'login' && (
            <div className="mt-5 p-3 rounded-lg bg-[#1a2a1b]/60 border border-[#c5a66a]/15 text-center">
              <p className="text-[10px] text-[#5a6456] mb-2 uppercase tracking-wider font-mono">
                Click to Quick-Fill Credentials
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('AdminPassword123!');
                    clearError();
                    setFieldErrors({});
                  }}
                  className="px-2.5 py-1 rounded bg-[#0f1710] border border-[#c5a66a]/30 hover:border-[#c5a66a]/70 text-[11px] text-[#c5a66a] font-mono cursor-pointer transition-all hover:bg-[#1a261c]"
                >
                  Admin / AdminPassword123!
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('player1');
                    setPassword('UserPassword123!');
                    clearError();
                    setFieldErrors({});
                  }}
                  className="px-2.5 py-1 rounded bg-[#0f1710] border border-[#c5a66a]/30 hover:border-[#c5a66a]/70 text-[11px] text-[#8fa879] font-mono cursor-pointer transition-all hover:bg-[#1a261c]"
                >
                  Player1 / UserPassword123!
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom gold accent bar */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #c5a66a44, transparent)' }} />
      </div>
    </div>
  );
}

