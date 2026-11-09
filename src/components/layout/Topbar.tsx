import React, { useState } from 'react';
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
  Crown,
  Gift,
  LogOut,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';
import { CivoraIcon } from '../brand/CivoraLogo';
import { AuthUser } from '../../services/authApi';
import CS2ChirperWidget from '../cs2/CS2ChirperWidget';
import ResourceDetailModal, { SelectedResourceKey } from './ResourceDetailModal';
import NotificationCenter from './NotificationCenter';

function TopbarComponent({
  isRightPanelOpen,
  onToggleRightPanel,
  user,
  onLogout,
  onNavigate,
  onOpenDiagnostics,
}: {
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
  onOpenDiagnostics?: () => void;
}) {
  const {
    resources,
    rates,
    civilization,
    events,
    setActiveDrawer,
    quests,
    claimQuest,
    activeProtest,
    setIsProtestModalOpen,
    setIsDemoModalOpen,
    economyReport,
  } = useGameState();

  const [selectedResource, setSelectedResource] = useState<SelectedResourceKey | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unreadCount = events.filter((e) => !e.isRead).length;
  const activeUnclaimedQuest = quests?.find((q) => q.isCompleted && !q.isClaimed);

  const { resources: resFlow, economy } = economyReport;

  const resourcePills: {
    key: SelectedResourceKey;
    label: string;
    val: string;
    rate: string;
    isNegative: boolean;
    isCritical?: boolean;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    color: string;
    isTreasury?: boolean;
    tooltip: string;
  }[] = [
    {
      key: 'population',
      label: 'Citizens',
      val: `${(resources.population / 1000000).toFixed(2)}M`,
      rate: `+${rates.populationGrowthRate}%`,
      isNegative: false,
      icon: Users,
      color: '#8FA879',
      tooltip: 'Demographic Workforce: Fuels civic and industrial throughput.',
    },
    {
      key: 'food',
      label: 'Food Rations',
      val: `${(resources.food / 1000).toFixed(1)}k`,
      rate: resFlow.foodNet >= 0 ? `+${resFlow.foodNet}` : `${resFlow.foodNet}`,
      isNegative: resFlow.foodNet < 0,
      isCritical: resFlow.foodNet < 0 && resources.food < 500,
      icon: Wheat,
      color: '#C5A66A',
      tooltip: 'Nutritional Security: Essential sustenance for civil health.',
    },
    {
      key: 'water',
      label: 'Fresh Water',
      val: `${(resources.water / 1000).toFixed(1)}k`,
      rate: resFlow.waterNet >= 0 ? `+${resFlow.waterNet}` : `${resFlow.waterNet}`,
      isNegative: resFlow.waterNet < 0,
      isCritical: resFlow.waterNet < 0 && resources.water < 500,
      icon: Droplets,
      color: '#6e98b3',
      tooltip: 'Hydrological Grid: Fresh drinking water & industrial cooling.',
    },
    {
      key: 'energy',
      label: 'Power Grid',
      val: `${resources.energy} MW`,
      rate: resFlow.energyNetMW >= 0 ? `+${resFlow.energyNetMW}` : `${resFlow.energyNetMW}`,
      isNegative: resFlow.energyNetMW < 0,
      isCritical: resFlow.energyNetMW < 0,
      icon: Zap,
      color: '#D6A75E',
      tooltip: 'Power Capacity: Clean kinetic & solar generation grid.',
    },
    {
      key: 'materials',
      label: 'Building Materials',
      val: `${(resources.materials / 1000).toFixed(1)}k`,
      rate: resFlow.materialsNet >= 0 ? `+${resFlow.materialsNet}` : `${resFlow.materialsNet}`,
      isNegative: resFlow.materialsNet < 0,
      icon: Package,
      color: '#9F8859',
      tooltip: 'Structural Fabrication: Materials needed for construction & upgrades.',
    },
    {
      key: 'research',
      label: 'Research Points',
      val: resources.researchPoints.toLocaleString(),
      rate: `+${rates.researchRate}`,
      isNegative: false,
      icon: FlaskConical,
      color: '#8FA879',
      tooltip: 'Scientific Output: Fuels Technology Tree discoveries.',
    },
    {
      key: 'crc',
      label: 'Treasury (CRC)',
      val: resources.grc.toLocaleString(),
      rate: economy.netDailyCashFlow >= 0 ? `+${economy.netDailyCashFlow}` : `${economy.netDailyCashFlow}`,
      isNegative: economy.netDailyCashFlow < 0,
      icon: Coins,
      color: '#C5A66A',
      isTreasury: true,
      tooltip: 'Civora Research Credits (CRC): Authoritative milestone grants.',
    },
  ];

  return (
    <>
      <header className="h-[52px] shrink-0 bg-[#171D18] border-b border-[#2B372C] flex items-center justify-between px-3.5 lg:px-5 select-none text-[#EAE3D2] shadow-md z-30">
        {/* Civilisation Identity */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveDrawer('codex')}
          title="Inspect Civilisation Codex & Status"
        >
          <CivoraIcon size={32} />

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-[#EAE3D2] tracking-wide font-cinzel group-hover:text-[#C5A66A] transition-colors truncate max-w-[130px] lg:max-w-[170px]">
                {civilization.name}
              </h2>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#202820] text-[#C5A66A] border border-[#3D4F3F]">
                L{civilization.level}
              </span>
            </div>
            <div className="text-[9px] font-mono text-[#A5AD9D] leading-none mt-0.5">
              <span>{civilization.era}</span>
              <span className="mx-1 text-[#7A8473]">·</span>
              <span>Yr {civilization.currentYear.toString().padStart(3, '0')}, D{civilization.currentDay}</span>
            </div>
          </div>
        </div>

        {/* Center Strategic Resource Ribbon */}
        <div className="hidden md:flex items-center gap-1 bg-[#121713] px-2 py-1 rounded border border-[#2B372C]">
          {resourcePills.map((res) => {
            const Icon = res.icon;
            return (
              <button
                key={res.key}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedResource(res.key);
                }}
                title={res.tooltip}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all relative ${
                  res.isTreasury
                    ? 'bg-[#202820] border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#283228]'
                    : res.isCritical
                    ? 'bg-[#C87569]/15 border border-[#C87569]/40 text-[#C87569] hover:bg-[#C87569]/25 animate-pulse'
                    : 'hover:bg-[#202820] text-[#EAE3D2]'
                }`}
              >
                <Icon size={13} style={{ color: res.color }} className="shrink-0" />
                <span className="font-mono font-bold text-[11px]">{res.val}</span>
                <span
                  className={`font-mono text-[9px] flex items-center ${
                    res.isNegative ? 'text-[#C87569]' : 'text-[#8FA879]'
                  }`}
                >
                  {res.rate}
                </span>

                {res.isCritical && (
                  <AlertTriangle size={10} className="text-[#C87569] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Notifications, Protest, Demo & Profile */}
        <div className="flex items-center gap-2">
          {/* Active Historical Twin Civil Protest Pill */}
          {activeProtest && (
            <button
              onClick={() => {
                soundFx.playCrowdChant();
                setIsProtestModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C87569]/15 hover:bg-[#C87569]/25 border border-[#C87569] text-[11px] font-bold text-[#EAE3D2] transition-all shadow-xs animate-pulse"
              title={`Active Civil Protest: ${activeProtest.title} (Click to resolve)`}
            >
              <span className="text-xs">📢</span>
              <span className="hidden sm:inline">Protest in {activeProtest.districtName.split(' ')[0]}</span>
              <span className="text-[10px] font-mono text-[#C5A66A] uppercase bg-[#171D18] px-1 py-0.2 rounded border border-[#C87569]/40">
                Resolve
              </span>
            </button>
          )}

          {/* Small claimable reward indicator if quest ready */}
          {activeUnclaimedQuest && (
            <button
              onClick={() => claimQuest(activeUnclaimedQuest.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202820] hover:bg-[#283228] border border-[#C5A66A] text-[11px] font-bold text-[#C5A66A] transition-all shadow-xs"
              title={`Claim Completed Quest: ${activeUnclaimedQuest.title} (+${activeUnclaimedQuest.rewardGrc} CRC)`}
            >
              <Gift size={12} className="text-[#C5A66A]" />
              <span className="hidden sm:inline">Reward Available</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A66A] animate-ping" />
            </button>
          )}

          {/* High Council Chamber Direct Shortcut */}
          {onNavigate && (
            <button
              onClick={() => {
                soundFx.playClick();
                onNavigate('Council of Advisors');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202820] hover:bg-[#C5A66A]/20 border border-[#C5A66A]/60 text-[#C5A66A] font-serif text-xs font-bold transition-all shadow-sm"
              title="Open Royal Council Chamber (3D)"
            >
              <Crown size={13} className="text-[#C5A66A]" />
              <span className="hidden sm:inline">The Council</span>
              <span className="px-1 py-0.2 rounded bg-[#C5A66A]/20 text-[8px] font-mono font-bold text-[#EAE3D2]">
                3D
              </span>
            </button>
          )}

          {/* Notifications Center Bell */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsNotificationOpen(true);
            }}
            className="relative p-1.5 rounded bg-[#202820] hover:bg-[#283228] border border-[#2B372C] text-[#A5AD9D] hover:text-[#C5A66A] transition-colors"
            title="Open High Council Event Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-[#C5A66A] text-[#121713] text-[9px] font-mono font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Chirper Network Widget (Cities: Skylines II Citizen Voices) */}
          <CS2ChirperWidget />

          {/* Presenter Suite / Capabilities Showcase */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsDemoModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202820] hover:bg-[#283228] border border-[#C5A66A]/40 text-[11px] font-bold text-[#C5A66A] transition-all shadow-xs font-cinzel"
            title="Open Presenter Suite: Showcase All Potential Capabilities"
          >
            <span>Presenter</span>
          </button>

          {/* User Profile Badge & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#2B372C]">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#A5AD9D]">
                <Crown size={13} className="text-[#C5A66A]" />
                <span className="font-semibold text-[#EAE3D2] hidden lg:inline">{user.username}</span>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onLogout();
                  }}
                  className="p-1 rounded text-[#7A8473] hover:text-[#C87569] hover:bg-[#202820] transition-colors"
                  title="Sign out of Civora session"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}

          {/* Developer Performance Telemetry Dashboard Toggle */}
          {onOpenDiagnostics && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenDiagnostics();
              }}
              className="p-1.5 rounded bg-[#202820] hover:bg-[#283228] border border-[#2B372C] hover:border-[#C5A66A]/40 text-[#A5AD9D] hover:text-[#C5A66A] transition-colors"
              title="Open Performance Telemetry & Diagnostics (F2 / Ctrl+Shift+P)"
            >
              <Activity size={15} />
            </button>
          )}

          {/* Tactical 3D Inspector Panel Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleRightPanel();
            }}
            className={`p-1.5 rounded border transition-colors ${
              isRightPanelOpen
                ? 'bg-[#283228] border-[#C5A66A] text-[#C5A66A]'
                : 'bg-[#202820] border-[#2B372C] text-[#A5AD9D] hover:text-[#EAE3D2]'
            }`}
            title={isRightPanelOpen ? 'Close Tactical Inspector' : 'Open Tactical Inspector'}
          >
            {isRightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </div>
      </header>

      {/* Resource Detail Information Drawer / Modal */}
      <ResourceDetailModal
        resourceKey={selectedResource}
        onClose={() => setSelectedResource(null)}
      />

      {/* Centralized Notification Center */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
}

export default React.memo(TopbarComponent);
