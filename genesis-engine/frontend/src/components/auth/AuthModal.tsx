import React, { useState } from 'react';
import { Crown, User, X, Shield, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, user, login, register, loginAsDemo, logout } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        const res = await login(username, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Authentication failed');
        } else {
          setIsAuthModalOpen(false);
        }
      } else {
        const res = await register(username, email, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Registration failed');
        } else {
          setIsAuthModalOpen(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (role: 'player' | 'admin') => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginAsDemo(role);
      setIsAuthModalOpen(false);
    } catch {
      setErrorMsg('Demo sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#14181b] border border-[#3b4750] rounded-xl max-w-md w-full p-5 text-[#ede8dc] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262f35] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#20272c] border border-[#8f7742]/50 flex items-center justify-center text-[#c29b38]">
              <Shield size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-[#ede8dc]">AUTHENTICATION & ACCESS CONTROL</h2>
              <p className="text-[10px] text-[#8a8376]">Role-Based Civilisation Management</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded text-[#8a8376] hover:text-[#ede8dc] hover:bg-[#20272c]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Active Session Info */}
        {user && (
          <div className="bg-[#1b2227] border border-[#2e3b43] rounded-lg p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">{user.role === 'admin' ? '👑' : '👤'}</span>
              <div>
                <p className="font-bold text-[#ede8dc] leading-tight">{user.username}</p>
                <p className="text-[10px] text-[#8a8376] font-mono">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  user.role === 'admin'
                    ? 'bg-[#332612] text-[#dfb74a] border-[#8f7742]'
                    : 'bg-[#152720] text-[#7ea376] border-[#2b4c3e]'
                }`}
              >
                {user.role.toUpperCase()}
              </span>
              <button
                onClick={logout}
                className="text-[10px] px-2 py-1 rounded bg-[#271b1d] text-[#e06c75] border border-[#52292d] hover:bg-[#382023] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* 1-Click Fast Demo Switcher */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#8a8376] block">
            Fast 1-Click Demo Accounts:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoSwitch('player')}
              disabled={loading}
              className="p-2.5 rounded-lg border border-[#2b4c3e] bg-[#13221b] hover:bg-[#182d24] text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-[#7ea376] font-bold text-xs">
                <User size={13} />
                <span>Demo Player</span>
              </div>
              <p className="text-[10px] text-[#8a8376] mt-0.5">Role: USER (Game Only)</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSwitch('admin')}
              disabled={loading}
              className="p-2.5 rounded-lg border border-[#8f7742]/60 bg-[#282012] hover:bg-[#342a17] text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-[#dfb74a] font-bold text-xs">
                <Crown size={13} />
                <span>Demo Admin</span>
              </div>
              <p className="text-[10px] text-[#8a8376] mt-0.5">Role: ADMIN (Full Control)</p>
            </button>
          </div>
        </div>

        {/* Custom Login / Register Tabs */}
        <div className="border-t border-[#262f35] pt-3">
          <div className="flex border border-[#262f35] rounded-md p-0.5 mb-3 bg-[#111417]">
            <button
              type="button"
              onClick={() => { setTab('signin'); setErrorMsg(''); }}
              className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                tab === 'signin' ? 'bg-[#222a31] text-[#ede8dc]' : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                tab === 'register' ? 'bg-[#222a31] text-[#ede8dc]' : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
            >
              Register New
            </button>
          </div>

          {errorMsg && (
            <div className="mb-3 p-2 rounded bg-[#2e191b] border border-[#6b2c31] text-[#e06c75] text-xs flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[#8a8376] text-[11px] mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. player1"
                className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#c29b38] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
              />
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-[#8a8376] text-[11px] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@genesis.ai"
                  className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#c29b38] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-[#8a8376] text-[11px] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#c29b38] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="flex-1 py-1.5 rounded bg-[#1e252b] hover:bg-[#28323a] text-[#8a8376] hover:text-[#ede8dc] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 rounded bg-[#8f7742] hover:bg-[#a98d4e] text-[#111417] text-xs font-bold transition-colors"
              >
                {loading ? 'Processing...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

