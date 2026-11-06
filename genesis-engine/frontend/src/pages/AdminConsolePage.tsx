import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Activity,
  Globe2,
  Coins,
  RefreshCw,
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  UserX,
  UserCheck,
  X,
} from 'lucide-react';
import { civilizationApi, AdminStats, AdminUser } from '../services/civilizationApi';
import { useAuth } from '../context/AuthContext';

export default function AdminConsolePage() {
  const { user: currentAdmin, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  // Reset Password Modal state
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d1012] text-[#ede8dc]">
        <div className="bg-[#14181b] border border-[#6b2c31] rounded-xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[#2e191b] border border-[#6b2c31] flex items-center justify-center text-[#e06c75] mx-auto">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#e06c75] uppercase tracking-wider">
              403 FORBIDDEN · ACCESS DENIED
            </h2>
            <p className="text-xs text-[#8a8376] mt-1.5 leading-relaxed">
              Administrative credentials are required to view user accounts, system telemetry, and platform governance controls.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, usersRes] = await Promise.all([
        civilizationApi.getAdminStats(),
        civilizationApi.getAdminUsers(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      } else if (!usersRes.success) {
        setErrorMsg(usersRes.message || 'Access denied: Administrator privileges required.');
      }
    } catch {
      setErrorMsg('Failed to communicate with administration service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (user: AdminUser) => {
    setErrorMsg('');
    setSuccessMsg('');
    const res = await civilizationApi.updateAdminUser(user.id, { is_active: !user.is_active });
    if (res.success) {
      setSuccessMsg(`User ${user.username} successfully ${!user.is_active ? 'activated' : 'suspended'}.`);
      loadData();
    } else {
      setErrorMsg(res.message || 'Action failed');
    }
  };

  const handleChangeRole = async (user: AdminUser) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    setErrorMsg('');
    setSuccessMsg('');
    const res = await civilizationApi.updateAdminUser(user.id, { role: nextRole });
    if (res.success) {
      setSuccessMsg(`Role for ${user.username} modified to ${nextRole.toUpperCase()}.`);
      loadData();
    } else {
      setErrorMsg(res.message || 'Role change failed');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Permanently delete account for "${user.username}"?`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    const res = await civilizationApi.deleteAdminUser(user.id);
    if (res.success) {
      setSuccessMsg(`Account ${user.username} deleted.`);
      loadData();
    } else {
      setErrorMsg(res.message || 'Deletion failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await civilizationApi.createAdminUser({
      username: newUsername,
      email: newEmail,
      password: newPassword,
      role: newRole,
    });
    if (res.success) {
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setSuccessMsg(`User account created successfully.`);
      loadData();
    } else {
      setErrorMsg(res.message || 'Account creation failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    const res = await civilizationApi.updateAdminUser(resetTargetUser.id, { password: resetPasswordVal });
    if (res.success) {
      setResetTargetUser(null);
      setResetPasswordVal('');
      setSuccessMsg(`Password updated for ${resetTargetUser.username}.`);
    } else {
      setErrorMsg(res.message || 'Password update failed');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1012] p-4 lg:p-6 text-[#ede8dc] space-y-5 custom-scrollbar">
      {/* Header Banner */}
      <div className="bg-[#14181b] border border-[#8f7742]/40 rounded-xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#282012] border border-[#8f7742] flex items-center justify-center text-[#dfb74a]">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-bold text-[#dfb74a] tracking-wider uppercase">
                GENESIS SYSTEM ADMINISTRATION & USER CONTROL
              </h1>
              <p className="text-xs text-[#8a8376] mt-0.5">
                Centralized authority over platform users, role allocation, and multi-tenant civilisation monitoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#8f7742] hover:bg-[#a98d4e] text-[#111417] text-xs font-bold transition-all shadow-sm"
          >
            <UserPlus size={14} />
            <span>CREATE USER</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e252b] hover:bg-[#28323a] border border-[#2b353b] text-xs font-semibold text-[#ede8dc] transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-[#2e191b] border border-[#6b2c31] text-[#e06c75] text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-[#14261c] border border-[#244f37] text-[#7ea376] text-xs flex items-center gap-2">
          <ShieldCheck size={15} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Platform Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#14181b] border border-[#262f35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8376] flex items-center gap-1">
            <Users size={11} className="text-[#dfb74a]" /> Total Accounts
          </span>
          <p className="text-xl font-bold font-mono text-[#dfb74a]">{stats?.total_users ?? '-'}</p>
          <p className="text-[10px] text-[#8a8376]">Registered Players</p>
        </div>

        <div className="bg-[#14181b] border border-[#262f35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8376] flex items-center gap-1">
            <Activity size={11} className="text-[#7ea376]" /> Active Accounts
          </span>
          <p className="text-xl font-bold font-mono text-[#7ea376]">{stats?.active_users ?? '-'}</p>
          <p className="text-[10px] text-[#8a8376]">Authorized Sessions</p>
        </div>

        <div className="bg-[#14181b] border border-[#262f35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8376] flex items-center gap-1">
            <Globe2 size={11} className="text-[#6e98b3]" /> Civilisations
          </span>
          <p className="text-xl font-bold font-mono text-[#6e98b3]">{stats?.total_worlds ?? '-'}</p>
          <p className="text-[10px] text-[#8a8376]">Simulated Worlds</p>
        </div>

        <div className="bg-[#14181b] border border-[#262f35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8376] flex items-center gap-1">
            <Users size={11} className="text-[#c4b37d]" /> Global Population
          </span>
          <p className="text-xl font-bold font-mono text-[#ede8dc]">
            {stats?.total_population ? stats.total_population.toLocaleString() : '-'}
          </p>
          <p className="text-[10px] text-[#8a8376]">Across All Settlements</p>
        </div>

        <div className="bg-[#14181b] border border-[#262f35] rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8376] flex items-center gap-1">
            <Coins size={11} className="text-[#dfb74a]" /> Global GDP
          </span>
          <p className="text-xl font-bold font-mono text-[#dfb74a]">
            {stats?.total_gdp ? `$${(stats.total_gdp / 1e9).toFixed(1)}B` : '-'}
          </p>
          <p className="text-[10px] text-[#8a8376]">Collective Economic Output</p>
        </div>
      </div>

      {/* User Roster Table */}
      <div className="bg-[#14181b] border border-[#262f35] rounded-xl p-4 lg:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#262f35] pb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[#ede8dc] uppercase tracking-wider">
              USER ROSTER &amp; ACCOUNT GOVERNANCE
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#20272c] text-[#dfb74a] border border-[#3b4750]">
              {users.length} RECORDS
            </span>
          </div>
          <span className="text-[11px] text-[#8a8376] hidden sm:inline">
            Direct database modification with instantaneous enforcement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#242c32] text-[#8a8376] text-[10px] font-mono uppercase">
                <th className="py-2 px-3">Identity</th>
                <th className="py-2 px-3">Email Address</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Owned Civilisations</th>
                <th className="py-2 px-3">Registered</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e252b] font-mono text-xs">
              {users.map((u) => {
                const isSelf = currentAdmin?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-[#181d21] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{u.role === 'admin' ? '👑' : '👤'}</span>
                        <div>
                          <p className={`font-bold ${u.role === 'admin' ? 'text-[#dfb74a]' : 'text-[#ede8dc]'}`}>
                            {u.username} {isSelf && <span className="text-[9px] text-[#8a8376] font-normal">(You)</span>}
                          </p>
                          <p className="text-[9px] text-[#6c767e]">{u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-[#aba393] text-[11px]">{u.email}</td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          u.role === 'admin'
                            ? 'bg-[#332612] text-[#dfb74a] border-[#8f7742]'
                            : 'bg-[#152720] text-[#7ea376] border-[#2b4c3e]'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          u.is_active
                            ? 'bg-[#152720] text-[#7ea376] border-[#2b4c3e]'
                            : 'bg-[#2e191b] text-[#e06c75] border-[#6b2c31]'
                        }`}
                      >
                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 max-w-[200px]">
                      {u.worlds && u.worlds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.worlds.map((w) => (
                            <span
                              key={w.id}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-[#1f262c] border border-[#2e3b43] text-[#6e98b3]"
                              title={`Level ${w.level || 1} Civilisation`}
                            >
                              {w.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#6c767e] text-[10px]">None</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-[#8a8376] text-[10px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                      {!isSelf ? (
                        <>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                              u.is_active
                                ? 'bg-[#2a1719] hover:bg-[#3d1e21] text-[#e06c75] border-[#5e2b2f]'
                                : 'bg-[#14261c] hover:bg-[#1d3a2a] text-[#7ea376] border-[#2b4c3e]'
                            }`}
                            title={u.is_active ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            {u.is_active ? 'SUSPEND' : 'ACTIVATE'}
                          </button>

                          <button
                            onClick={() => handleChangeRole(u)}
                            className="px-2 py-1 rounded bg-[#1e252b] hover:bg-[#28323a] text-[#8a8376] hover:text-[#ede8dc] border border-[#2b353b] text-[10px] font-semibold transition-colors"
                            title={`Switch role to ${u.role === 'admin' ? 'User' : 'Admin'}`}
                          >
                            ROLE: {u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                          </button>

                          <button
                            onClick={() => { setResetTargetUser(u); setResetPasswordVal(''); }}
                            className="px-2 py-1 rounded bg-[#1e252b] hover:bg-[#28323a] text-[#dfb74a] border border-[#2b353b] text-[10px] font-semibold transition-colors"
                            title="Reset User Password"
                          >
                            <KeyRound size={11} className="inline mr-0.5" /> PWD
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="px-2 py-1 rounded bg-[#2a1719] hover:bg-[#3d1e21] text-[#e06c75] border border-[#5e2b2f] text-[10px] transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 size={11} className="inline mr-0.5" /> DEL
                          </button>
                        </>
                      ) : (
                        <span className="text-[#6c767e] text-[10px] pr-2">Current Admin</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin: Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14181b] border border-[#8f7742] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262f35] pb-2.5">
              <h3 className="text-xs font-bold text-[#dfb74a] uppercase tracking-wide">
                CREATE USER (ADMIN CONSOLE)
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-[#8a8376] hover:text-[#ede8dc]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8a8376] text-[10px] font-mono mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#dfb74a] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#8a8376] text-[10px] font-mono mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#dfb74a] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#8a8376] text-[10px] font-mono mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#dfb74a] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#8a8376] text-[10px] font-mono mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                  className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#dfb74a] rounded px-2.5 py-1.5 text-[#dfb74a] outline-none font-mono"
                >
                  <option value="user">Standard User (Game Only)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#262f35]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-1.5 rounded bg-[#1e252b] hover:bg-[#28323a] text-[#8a8376] hover:text-[#ede8dc] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded bg-[#8f7742] hover:bg-[#a98d4e] text-[#111417] text-xs font-bold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14181b] border border-[#8f7742] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262f35] pb-2.5">
              <h3 className="text-xs font-bold text-[#dfb74a] uppercase tracking-wide">
                RESET USER PASSWORD
              </h3>
              <button
                onClick={() => setResetTargetUser(null)}
                className="p-1 rounded text-[#8a8376] hover:text-[#ede8dc]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <p className="text-[#8a8376] text-xs">
                Setting new credentials for <strong className="text-[#dfb74a]">{resetTargetUser.username}</strong>
              </p>

              <div>
                <label className="block text-[#8a8376] text-[10px] font-mono mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#101416] border border-[#2b353b] focus:border-[#dfb74a] rounded px-2.5 py-1.5 text-[#ede8dc] outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#262f35]">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="flex-1 py-1.5 rounded bg-[#1e252b] hover:bg-[#28323a] text-[#8a8376] hover:text-[#ede8dc] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded bg-[#8f7742] hover:bg-[#a98d4e] text-[#111417] text-xs font-bold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

