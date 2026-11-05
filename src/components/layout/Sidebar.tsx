import React from 'react';
import {
  Globe2,
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  Building2,
  Boxes,
  GitBranch,
  FlaskConical,
  Microscope,
  Compass,
  Coins,
  Trophy,
  Settings,
  Home,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

const navigation = [
  {
    title: 'CIVILISATION',
    items: [
      { name: 'Overview', icon: LayoutDashboard },
      { name: 'World Explorer', icon: Globe2, badge: '3D' },
      { name: 'Population', icon: Users },
      { name: 'Economy', icon: ChartNoAxesCombined },
      { name: 'Infrastructure', icon: Building2 },
      { name: 'Resources', icon: Boxes },
    ],
  },
  {
    title: 'DEVELOPMENT & SCIENCE',
    items: [
      { name: 'Technology', icon: GitBranch },
      { name: 'Policy Laboratory', icon: FlaskConical },
      { name: 'Future Simulator', icon: Microscope },
      { name: 'Research Observatory', icon: Compass },
    ],
  },
  {
    title: 'PROGRESSION & EXPEDITION',
    items: [
      { name: 'Research Wallet', icon: Coins },
      { name: 'Achievements', icon: Trophy },
      { name: 'Genesis Portal', icon: Home },
      { name: 'World Creation Studio', icon: PlusCircle },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { civilization } = useGameState();

  return (
    <aside className="w-[245px] shrink-0 bg-[#171d18] border-r border-[#39443a] flex flex-col h-screen select-none text-[#e8e9e3] z-40">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#39443a] bg-[#141914]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#405439] to-[#253323] border border-[#5d7754] flex items-center justify-center shadow-lg">
            <Globe2 size={22} className="text-[#dce9ca]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-[3px] text-[#f3f5ef]">GENESIS</h1>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6a76a]" />
            </div>
            <p className="text-[9px] font-mono tracking-[1.8px] text-[#9da99b]">
              CIVILISATION ENGINE
            </p>
          </div>
        </div>

        {/* Civilisation Quick Bar */}
        <div className="mt-3 pt-3 border-t border-[#2a362b] flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] text-[#9da99b] uppercase font-mono">ACTIVE ENTITY</p>
            <p className="font-semibold text-[#f0f3eb] truncate max-w-[120px]">{civilization.name}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#c6a76a] px-2 py-0.5 rounded bg-[#272317] border border-[#4d3e20]">
            LVL {civilization.level}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="px-3 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-mono tracking-widest text-[#7f8f7c] px-3 mb-2 uppercase">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#334230] text-[#dce9ca] border border-[#5a7251] shadow-md'
                        : 'text-[#a2aca0] hover:bg-[#202920] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={active ? 'text-[#c6a76a]' : 'text-[#7e8e7c]'}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#293628] text-[#a6bd82] border border-[#445b42]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-[#39443a] bg-[#141914]">
        <button
          onClick={() => onNavigate('Settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
            activePage === 'Settings'
              ? 'bg-[#334230] text-[#dce9ca] border border-[#5a7251]'
              : 'text-[#9da99b] hover:bg-[#202920] hover:text-white'
          }`}
        >
          <Settings size={16} />
          <span>System Settings</span>
        </button>
      </div>
    </aside>
  );
}
