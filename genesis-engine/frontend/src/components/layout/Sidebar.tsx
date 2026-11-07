import React, { useState } from 'react';
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
  PlusCircle,
  Crown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { useAuth } from '../../context/AuthContext';
import { CivoraIcon } from '../brand/CivoraLogo';

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { civilization } = useGameState();
  const { isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      title: 'SETTLEMENT',
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
      title: 'GOVERNANCE & SCIENCE',
      items: [
        { name: 'Technology', icon: GitBranch },
        { name: 'Policy Laboratory', icon: FlaskConical },
        { name: 'Future Simulator', icon: Microscope },
        { name: 'Research Observatory', icon: Compass },
      ],
    },
    {
      title: 'PROGRESSION',
      items: [
        { name: 'Research Wallet', icon: Coins },
        { name: 'Achievements', icon: Trophy },
        { name: 'World Creation Studio', icon: PlusCircle },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'ADMINISTRATION',
            items: [
              { name: 'Admin Console', icon: ShieldAlert, badge: 'ADMIN' },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`shrink-0 bg-[#14181b] border-r border-[#242c32] flex flex-col h-screen select-none text-[#ede8dc] z-40 shadow-xl relative transition-all duration-200 ease-out ${
        isCollapsed ? 'w-[60px]' : 'w-[210px]'
      }`}
    >
      {/* Brand Header */}
      <div className="px-2.5 py-3 border-b border-[#242c32] bg-[#0f1411] flex items-center justify-between">
        <div
          onClick={() => onNavigate('Overview')}
          className="flex items-center gap-2 overflow-hidden cursor-pointer group"
          title="CIVORA — Civilisation Simulation Engine"
        >
          <CivoraIcon size={34} />

          {!isCollapsed && (
            <div className="min-w-0">
              <h1
                className="text-xs font-serif font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#faecd0] via-[#dfb74a] to-[#c6a23d] truncate leading-none"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                CIVORA
              </h1>
              <p className="text-[8px] font-mono text-[#a18131] tracking-wider mt-1 truncate uppercase">
                Sim Engine
              </p>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#1f262c] transition-colors"
          title={isCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav List */}
      <div className="px-2 py-3 flex-1 overflow-y-auto custom-scrollbar space-y-3.5">
        {navigation.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <p className="text-[9px] font-mono font-bold tracking-wider text-[#6c767e] uppercase px-2 mb-1 truncate">
                {section.title}
              </p>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.name)}
                    title={isCollapsed ? item.name : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
                    } py-1.5 rounded-md text-xs font-medium transition-all relative ${
                      active
                        ? 'bg-[#222a31] text-[#ffffff] font-semibold shadow-xs'
                        : 'text-[#aba393] hover:bg-[#1a2025] hover:text-[#ede8dc]'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-[#c29b38]" />
                    )}

                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        size={15}
                        className={active ? 'text-[#c29b38]' : 'text-[#79858f]'}
                      />
                      {!isCollapsed && (
                        <span className="truncate text-[12px]">{item.name}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#101416] text-[#7ea376] border border-[#2b353b]">
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

      {/* Footer Settings Row */}
      <div className="p-2 border-t border-[#242c32] bg-[#111417]">
        <button
          onClick={() => onNavigate('Settings')}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-2 px-2'
          } py-1.5 rounded-md text-xs text-[#8a8376] hover:text-[#ede8dc] hover:bg-[#1a2025] transition-colors`}
          title="Settings & Simulation Controls"
        >
          <Settings size={14} />
          {!isCollapsed && <span className="text-[11px]">System Preferences</span>}
        </button>
      </div>
    </aside>
  );
}
