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
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

export default function Topbar({
  isRightPanelOpen,
  onToggleRightPanel,
}: {
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}) {
  const { resources, rates, civilization, events, setActiveDrawer } = useGameState();
  const unreadCount = events.filter((e) => !e.isRead).length;

  const resourceItems = [
    {
      label: 'POPULATION',
      val: `${(resources.population / 1000000).toFixed(2)}M`,
      rate: `+${rates.populationGrowthRate}%`,
      icon: Users,
      color: '#a6bd82',
    },
    {
      label: 'FOOD',
      val: resources.food.toLocaleString(),
      rate: `+${rates.foodRate}/d`,
      icon: Wheat,
      color: '#c4d49d',
    },
    {
      label: 'WATER',
      val: resources.water.toLocaleString(),
      rate: `+${rates.waterRate}/d`,
      icon: Droplets,
      color: '#82a6bd',
    },
    {
      label: 'ENERGY',
      val: `${resources.energy.toLocaleString()} MW`,
      rate: `+${rates.energyRate}/d`,
      icon: Zap,
      color: '#e5c97b',
    },
    {
      label: 'MATERIALS',
      val: resources.materials.toLocaleString(),
      rate: `+${rates.materialsRate}/d`,
      icon: Package,
      color: '#bd9fa6',
    },
    {
      label: 'RESEARCH',
      val: resources.researchPoints.toLocaleString(),
      rate: `+${rates.researchRate}/d`,
      icon: FlaskConical,
      color: '#82bd8e',
    },
    {
      label: 'GRC CREDITS',
      val: resources.grc.toLocaleString(),
      rate: `+${rates.grcEarnRate}/d`,
      icon: Coins,
      color: '#c6a76a',
      highlight: true,
    },
  ];

  return (
    <header className="h-[74px] shrink-0 bg-[#171d18] border-b border-[#39443a] flex items-center justify-between px-4 lg:px-6 gap-3 select-none text-[#e8e9e3] shadow-md z-30">
      {/* Civilisation & Date Banner */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setActiveDrawer('codex')}
        title="View Civilisation Codex & Archives"
      >
        <div className="w-10 h-10 rounded-lg bg-[#273328] border border-[#4a5f4b] flex items-center justify-center font-bold text-sm text-[#c6a76a] group-hover:border-[#c6a76a] transition-colors">
          {civilization.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm lg:text-base font-bold text-[#f3f5ef] group-hover:text-[#c6a76a] transition-colors">
              {civilization.name}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a2416] text-[#c6a76a] border border-[#524424] font-semibold">
              LVL {civilization.level}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9da99b] mt-0.5">
            <span className="text-[#a6bd82] font-medium">{civilization.era} Era</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-[#c6a76a]">
              Year {civilization.currentYear.toString().padStart(3, '0')} · Day {civilization.currentDay.toString().padStart(3, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Resource HUD Bar */}
      <div className="hidden xl:flex items-center gap-4 bg-[#141914] px-4 py-2 rounded-xl border border-[#2b352c]">
        {resourceItems.map((res) => {
          const Icon = res.icon;
          return (
            <div
              key={res.label}
              className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                res.highlight ? 'bg-[#262215] border border-[#4d3f23]' : ''
              }`}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: `${res.color}22` }}
              >
                <Icon size={14} style={{ color: res.color }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono tracking-wider text-[#9da99b]">
                    {res.label}
                  </span>
                  <span className="text-[9px] font-mono text-[#a6bd82]">{res.rate}</span>
                </div>
                <p className="text-xs font-mono font-bold text-[#f0f3eb] leading-tight">
                  {res.val}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Quick Controls & Modals */}
      <div className="flex items-center gap-3">
        {/* Compact GRC Display for smaller screens */}
        <div className="xl:hidden flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#262215] border border-[#4d3f23]">
          <Coins size={14} className="text-[#c6a76a]" />
          <span className="text-xs font-mono font-bold text-[#c6a76a]">{resources.grc} GRC</span>
        </div>

        {/* Codex Archive Button */}
        <button
          onClick={() => setActiveDrawer('codex')}
          className="p-2 rounded-lg bg-[#202921] border border-[#344435] text-[#9da99b] hover:text-[#e8e9e3] hover:border-[#617c63] transition-colors"
          title="Open Civilisation Archives & Codex"
        >
          <BookOpen size={17} />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setActiveDrawer('notifications')}
          className="relative p-2 rounded-lg bg-[#202921] border border-[#344435] text-[#9da99b] hover:text-[#e8e9e3] hover:border-[#617c63] transition-colors"
          title="Civilisation Alerts & Chronicle"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c6a76a] text-[#151916] text-[10px] font-mono font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Right Info Panel Toggle */}
        <button
          onClick={onToggleRightPanel}
          className={`p-2 rounded-lg border transition-colors ${
            isRightPanelOpen
              ? 'bg-[#394b35] text-[#dce9ca] border-[#6b8563]'
              : 'bg-[#202921] text-[#9da99b] border-[#344435] hover:text-[#e8e9e3]'
          }`}
          title={isRightPanelOpen ? 'Collapse Tactical HUD' : 'Expand Tactical HUD'}
        >
          {isRightPanelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>
    </header>
  );
}
