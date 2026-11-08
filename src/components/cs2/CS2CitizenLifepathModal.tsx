import React from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Home,
  Heart,
  Activity,
  Smile,
  Wallet,
  Clock,
  Sparkles,
  MapPin,
  X,
  Calendar,
} from 'lucide-react';
import { Citizen } from '../../types/game';
import { soundFx } from '../../services/soundFx';

interface CS2CitizenLifepathModalProps {
  citizen: Citizen | null;
  onClose: () => void;
}

export default function CS2CitizenLifepathModal({ citizen, onClose }: CS2CitizenLifepathModalProps) {
  if (!citizen) return null;

  // Derive lifepath details if not explicitly populated
  const lifeStage = citizen.lifeStage || (citizen.age < 18 ? 'Teen' : citizen.age > 65 ? 'Senior' : 'Adult');
  const wealthTier = citizen.wealthTier || (citizen.income > 80000 ? 'Wealthy' : citizen.income > 45000 ? 'Comfortable' : 'Modest');
  const homeAddress = citizen.homeAddress || `${citizen.district} Spire #${Math.floor(citizen.age * 3.4)}`;
  const workplace = citizen.workplaceAddress || `${citizen.occupation} at Sector Hub 0${Math.floor(citizen.age % 4) + 1}`;
  const commute = citizen.commuteTimeMin || Math.floor((100 - citizen.happiness) * 0.25) + 12;

  // Synthesize realistic lifepath chronological milestones
  const events = citizen.lifepathEvents || [
    {
      year: Math.max(1, 142 - citizen.age),
      day: 84,
      title: 'Birth in Settlement',
      description: `Born in ${citizen.district} district nursery wards.`,
      category: 'birth',
    },
    {
      year: Math.max(1, 142 - citizen.age + 16),
      day: 140,
      title: 'Education Milestone',
      description: `Completed ${citizen.educationLevel} degree program with academic commendation.`,
      category: 'education',
    },
    {
      year: Math.max(1, 142 - citizen.age + 22),
      day: 215,
      title: 'Workforce Induction',
      description: `Hired as professional ${citizen.occupation} with starting salary of $${citizen.income.toLocaleString()}.`,
      category: 'career',
    },
    {
      year: 141,
      day: 300,
      title: 'Real Estate Relocation',
      description: `Moved into modern apartment at ${homeAddress}.`,
      category: 'relocation',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#14191d] border border-[#3b4752] rounded-2xl max-w-md w-full p-5 text-[#ede8dc] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252f36] pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={citizen.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
                alt={citizen.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#c29b38] shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">
                {lifeStage === 'Child' ? '🧒' : lifeStage === 'Teen' ? '🧑' : lifeStage === 'Senior' ? '👴' : '👨'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#ede8dc]">{citizen.name}</h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#1e2a22] text-[#2ecc71] border border-[#2b4d36]">
                  {lifeStage.toUpperCase()} · {citizen.age} YRS
                </span>
              </div>
              <p className="text-[10px] text-[#8a8376] font-mono mt-0.5">{citizen.occupation}</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#20292f]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Socio-Economic Vitals Card */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-[#182126] border border-[#26353d]">
            <span className="text-[9px] text-[#8a8376] block">WEALTH TIER</span>
            <span className="font-bold text-[#f1c40f]">{wealthTier}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#182126] border border-[#26353d]">
            <span className="text-[9px] text-[#8a8376] block">ANNUAL INCOME</span>
            <span className="font-bold text-[#2ecc71]">${citizen.income.toLocaleString()}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#182126] border border-[#26353d]">
            <span className="text-[9px] text-[#8a8376] block">HAPPINESS</span>
            <span className="font-bold text-[#3498db]">{citizen.happiness}%</span>
          </div>
        </div>

        {/* Location & Commute */}
        <div className="space-y-1.5 text-xs bg-[#182025] p-2.5 rounded-lg border border-[#26343d]">
          <div className="flex items-center gap-2 text-[#aba393]">
            <Home size={13} className="text-[#c29b38] shrink-0" />
            <span className="text-[11px] truncate">Residence: <strong className="text-[#ede8dc]">{homeAddress}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[#aba393]">
            <Briefcase size={13} className="text-[#3498db] shrink-0" />
            <span className="text-[11px] truncate">Workplace: <strong className="text-[#ede8dc]">{workplace}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[#aba393]">
            <Clock size={13} className="text-[#2ecc71] shrink-0" />
            <span className="text-[11px]">Daily Commute: <strong className="text-[#ede8dc]">{commute} mins (Smooth Traffic)</strong></span>
          </div>
        </div>

        {/* Lifepath Chronological Timeline (Iconic CS2 Feature) */}
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8a8376] mb-2 flex items-center gap-1.5">
            <Sparkles size={11} className="text-[#c29b38]" />
            CITIZEN LIFEPATH TIMELINE
          </h4>

          <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
            {events.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c29b38] mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1 p-2 rounded-lg bg-[#182126] border border-[#25323a]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ede8dc] text-[11px]">{evt.title}</span>
                    <span className="text-[9px] font-mono text-[#8a8376]">Yr {evt.year}, D{evt.day}</span>
                  </div>
                  <p className="text-[10px] text-[#8a8376] mt-0.5 leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

