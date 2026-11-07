import React, { useState, useMemo } from 'react';
import {
  Globe2,
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  Building2,
  GitBranch,
  FlaskConical,
  Microscope,
  Compass,
  Coins,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Target,
  ChevronDown,
  Crown,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { useAuth } from '../../context/AuthContext';
import { CivoraIcon } from '../brand/CivoraLogo';

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

interface NavSection {
  title: string;
  items: {
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[];
}

const baseNavigation: NavSection[] = [
  {
    title: 'THE EMPIRE',
    items: [
      { name: 'Overview', icon: LayoutDashboard },
      { name: 'World Explorer', icon: Globe2, badge: '3D' },
      { name: 'Population', icon: Users },
      { name: 'Infrastructure', icon: Building2 },
      { name: 'Economy & Resources', icon: ChartNoAxesCombined },
    ],
  },
  {
    title: 'THE COUNCIL',
    items: [
      { name: 'Council of Advisors', icon: Crown, badge: '6' },
    ],
  },
  {
    title: 'DEVELOPMENT',
    items: [
      { name: 'Technology Tree', icon: GitBranch },
      { name: 'Research Wallet', icon: Coins, badge: 'CRC' },
      { name: 'Policy Laboratory', icon: FlaskConical },
    ],
  },
  {
    title: 'THE FUTURE',
    items: [
      { name: 'Future Simulator', icon: Microscope },
      { name: 'Research Observatory', icon: Compass },
    ],
  },
  {
    title: 'LEGACY',
    items: [
      { name: 'Civilisation Chronicle', icon: BookOpen },
      { name: 'Achievements', icon: Trophy },
      { name: 'Missions & Challenges', icon: Target },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { civilization } = useGameState();
  const { isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sections = useMemo(() => {
    if (!isAdmin) return baseNavigation;
    return [
      ...baseNavigation,
      {
        title: 'SYSTEM',
        items: [
          { name: 'Settings', icon: Settings },
          { name: 'Admin Console', icon: ShieldCheck, badge: 'RBAC' },
        ],
      },
    ];
  }, [isAdmin]);

  return (
    <aside
      className={`shrink-0 bg-[#171D18] border-r border-[#2B372C] flex flex-col h-screen select-none text-[#EAE3D2] z-40 shadow-2xl relative transition-all duration-200 ease-out ${
        isCollapsed ? 'w-[64px]' : 'w-[230px]'
      }`}
    >
      {/* Brand Header */}
      <div className="px-3 py-3.5 border-b border-[#2B372C] bg-[#121713] flex items-center justify-between">
        <div
          onClick={() => onNavigate('Overview')}
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer group"
          title="CIVORA — Civilisation Simulation Engine"
        >
          <CivoraIcon size={34} />

          {!isCollapsed && (
            <div className="min-w-0">
              <h1
                className="text-xs font-serif font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#EAE3D2] via-[#C5A66A] to-[#9F8859] truncate leading-none font-cinzel"
              >
                CIVORA
              </h1>
              <p className="text-[8px] font-mono text-[#A5AD9D] tracking-wider mt-1 truncate uppercase">
                SIMULATION ENGINE
              </p>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-[#A5AD9D] hover:text-[#C5A66A] hover:bg-[#202820] transition-colors"
          title={isCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav List */}
      <div className="px-2 py-3 flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {sections.map((section) => {
          const isSectionClosed = !isCollapsed && !!collapsedSections[section.title];

          return (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-mono font-bold tracking-[0.14em] text-[#7A8473] hover:text-[#C5A66A] uppercase truncate transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-150 ${
                      isSectionClosed ? '-rotate-90 text-[#7A8473]' : 'text-[#A5AD9D]'
                    }`}
                  />
                </button>
              ) : (
                <div className="h-px bg-[#2B372C] my-2 mx-1" />
              )}

              {!isSectionClosed && (
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
                        } py-1.5 rounded text-xs font-medium transition-all relative ${
                          active
                            ? 'bg-[#202820] text-[#FFFFFF] font-semibold border-l-2 border-[#C5A66A] shadow-sm'
                            : 'text-[#A5AD9D] hover:bg-[#1C231E] hover:text-[#EAE3D2]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={16}
                            className={active ? 'text-[#C5A66A]' : 'text-[#7A8473] group-hover:text-[#A5AD9D]'}
                          />
                          {!isCollapsed && (
                            <span className="truncate text-[12px] tracking-wide font-medium">
                              {item.name}
                            </span>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                            item.badge === '3D'
                              ? 'bg-[#17231B] text-[#8FA879] border-[#3D4F3F]'
                              : item.badge === 'CRC'
                              ? 'bg-[#202820] text-[#C5A66A] border-[#9F8859]/40'
                              : 'bg-[#1C231E] text-[#D6A75E] border-[#3D4F3F]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Civilisation Status Badge */}
      {!isCollapsed && (
        <div className="p-2.5 mx-2 mb-2 rounded bg-[#1C231E] border border-[#2B372C]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-[#A5AD9D] uppercase tracking-wider">{civilization.era}</span>
            <span className="text-[#C5A66A] font-bold">LVL {civilization.level}</span>
          </div>
          <div className="h-1 rounded-full bg-[#121713] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8FA879] to-[#C5A66A] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (civilization.xp / civilization.xpToNextLevel) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-[#7A8473] mt-1">
            <span>Progress to Next Age</span>
            <span>{Math.round((civilization.xp / civilization.xpToNextLevel) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Footer Settings Row */}
      {!isAdmin && (
        <div className="p-2 border-t border-[#2B372C] bg-[#121713]">
          <button
            onClick={() => onNavigate('Settings')}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-2 px-2.5'
            } py-1.5 rounded text-xs text-[#A5AD9D] hover:text-[#EAE3D2] hover:bg-[#202820] transition-colors`}
            title="System Preferences & Audio"
          >
            <Settings size={15} />
            {!isCollapsed && <span className="text-[11px]">System Settings</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
