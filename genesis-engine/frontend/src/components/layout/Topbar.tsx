import React from 'react';
import {
  Users,
  Wheat,
  Droplets,
  Zap,
  Package,
  FlaskConical,
  Coins,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  BookOpen,
  Crown,
  Activity,
  Target,
  Sparkles,
  Gift,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({
  isRightPanelOpen,
  onToggleRightPanel,
}: {
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}) {
  const { resources, rates, civilization, events, setActiveDrawer, quests, claimQuest } = useGameState();
  const { user, isAdmin, setIsAuthModalOpen } = useAuth();
  const unreadCount = events.filter((e) => !e.isRead).length;

  const activeUnclaimedQuest = quests?.find((q) => q.isCompleted && !q.isClaimed);

  const resourcePills = [
    { label: 'Population', val: `${(resources.population / 1000000).toFixed(2)}M`, rate: `+${rates.populationGrowthRate}%`, icon: Users, color: '#7ea376' },
    { label: 'Food Rations', val: `${(resources.food / 1000).toFixed(1)}k`, rate: `+${rates.foodRate}`, icon: Wheat, color: '#c4b37d' },
    { label: 'Fresh Water', val: `${(resources.water / 1000).toFixed(1)}k`, rate: `+${rates.waterRate}`, icon: Droplets, color: '#6e98b3' },
    { label: 'Power Grid', val: `${resources.energy} MW`, rate: `+${rates.energyRate}`, icon: Zap, color: '#d9a941' },
    { label: 'Timber & Stone', val: `${(resources.materials / 1000).toFixed(1)}k`, rate: `+${rates.materialsRate}`, icon: Package, color: '#aa9b8d' },
    { label: 'Research Points', val: resources.researchPoints.toLocaleString(), rate: `+${rates.researchRate}`, icon: FlaskConical, color: '#78a689' },
    { label: 'Treasury (GRC)', val: resources.grc.toLocaleString(), rate: `+${rates.grcEarnRate}`, icon: Coins, color: '#c29b38', isTreasury: true },
  ];

  return (
    <header className="h-[48px] shrink-0 bg-[#14181b] border-b border-[#262f35] flex items-center justify-between px-3.5 lg:px-5 select-none text-[#ede8dc] shadow-sm z-30">
      {/* Civilisation Identity */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => setActiveDrawer('codex')}
        title="View Civilisation Codex & Status"
      >
        <div className="w-7 h-7 rounded-md border border-[#8f7742]/60 bg-[#1c2328] flex items-center justify-center text-[#c29b38] shadow-xs group-hover:border-[#c29b38] transition-colors">
          <Crown size={14} />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-bold text-[#ede8dc] tracking-wide group-hover:text-[#c29b38] transition-colors truncate max-w-[130px] lg:max-w-[170px]">
              {civilization.name}
            </h2>
            <span className="text-[9px] font-mono font-bold px-1 rounded bg-[#20272c] text-[#c29b38] border border-[#3b4750]">
              L{civilization.level}
            </span>
          </div>
          <div className="text-[9px] font-mono text-[#8a8376] leading-none mt-0.5">
            <span>{civilization.era} Era</span>
            <span className="mx-1">·</span>
            <span>Yr {civilization.currentYear.toString().padStart(3, '0')}, D{civilization.currentDay}</span>
          </div>
        </div>
      </div>

      {/* Center Compact Strategic Resource Ribbon */}
      <div className="hidden md:flex items-center gap-1.5 bg-[#0f1214] px-2.5 py-1 rounded-md border border-[#232b30]">
        {resourcePills.map((res) => {
          const Icon = res.icon;
          return (
            <div
              key={res.label}
              title={`${res.label}: ${res.val} (${res.rate}/cycle)`}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors ${
                res.isTreasury
                  ? 'bg-[#221f15] border border-[#5e4e24] text-[#dfb74a]'
                  : 'hover:bg-[#1a2024] text-[#ede8dc]'
              }`}
            >
              <Icon size={12} style={{ color: res.color }} className="shrink-0" />
              <span className="font-mono font-bold text-[11px]">{res.val}</span>
              <span className="font-mono text-[9px] text-[#7ea376]">{res.rate}</span>
            </div>
          );
        })}
      </div>

      {/* Right Controls: Subtle Claim Indicator & HUD Actions */}
      <div className="flex items-center gap-2">
        {/* Small claimable reward indicator if quest ready (replaces oversized banner) */}
        {activeUnclaimedQuest && (
          <button
            onClick={() => claimQuest(activeUnclaimedQuest.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2d2512] hover:bg-[#3d3216] border border-[#8f7742] text-[11px] font-bold text-[#dfb74a] transition-all shadow-xs"
            title={`Claim Completed Quest: ${activeUnclaimedQuest.title} (+${activeUnclaimedQuest.rewardGrc} GRC)`}
          >
            <Gift size={12} className="text-[#dfb74a]" />
            <span className="hidden sm:inline">Reward Available</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#dfb74a] animate-ping" />
          </button>
        )}

        {/* Small screen compact Treasury GRC */}
        <div className="md:hidden flex items-center gap-1 px-2 py-1 rounded bg-[#221f15] border border-[#5e4e24] text-[11px] font-mono font-bold text-[#dfb74a]">
          <Coins size={11} />
          <span>{resources.grc}</span>
        </div>

        {/* Codex Action */}
        <button
          onClick={() => setActiveDrawer('codex')}
          className="p-1.5 rounded-md bg-[#192025] hover:bg-[#222a30] border border-[#2b353b] text-[#aba393] hover:text-[#ede8dc] transition-colors"
          title="Civilisation Codex & Lore"
        >
          <BookOpen size={14} />
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setActiveDrawer('notifications')}
          className="relative p-1.5 rounded-md bg-[#192025] hover:bg-[#222a30] border border-[#2b353b] text-[#aba393] hover:text-[#ede8dc] transition-colors"
          title="Chronicle & Alerts"
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#c29b38] text-[#111416] text-[8px] font-mono font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Auth Status & Account Switcher */}
        <div
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#192025] hover:bg-[#222a30] border border-[#2b353b] hover:border-[#c29b38]/50 cursor-pointer transition-colors text-xs"
          title="Account & Role Management (Click to Switch User)"
        >
          <span className="text-xs">{isAdmin ? '👑' : '👤'}</span>
          <span className="font-bold text-[11px] text-[#ede8dc] hidden sm:inline">{user?.username || 'player1'}</span>
          <span
            className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${
              isAdmin
                ? 'bg-[#332612] text-[#dfb74a] border-[#8f7742]/60'
                : 'bg-[#152720] text-[#7ea376] border-[#2b4c3e]'
            }`}
          >
            {user?.role?.toUpperCase() || 'USER'}
          </span>
        </div>

        {/* Tactical Vitals / Inspector Toggle */}
        <button
          onClick={onToggleRightPanel}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold transition-all ${
            isRightPanelOpen
              ? 'bg-[#29353e] text-[#ede8dc] border-[#556977]'
              : 'bg-[#192025] text-[#aba393] border-[#2b353b] hover:text-[#ede8dc] hover:bg-[#222a30]'
          }`}
          title={isRightPanelOpen ? 'Close Inspector Panel' : 'Open Inspector Panel'}
        >
          <Activity size={13} />
          <span className="hidden sm:inline text-[11px]">Vitals</span>
          {isRightPanelOpen ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
        </button>
      </div>
    </header>
  );
}
