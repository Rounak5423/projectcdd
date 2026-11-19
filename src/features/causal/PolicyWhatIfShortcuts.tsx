import React, { useState } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  Building,
  Utensils,
  Droplets,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Crown,
  Coins,
} from 'lucide-react';
import { soundFx } from '../../services/soundFx';

interface PolicyWhatIfShortcutsProps {
  onExecutePolicy: (policyType: string) => Promise<void>;
  isExecuting: boolean;
}

interface InterventionPreset {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  cost: string;
  projectedImpacts: string[];
  description: string;
  accentColor: string;
}

export const PolicyWhatIfShortcuts: React.FC<PolicyWhatIfShortcutsProps> = ({
  onExecutePolicy,
  isExecuting,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('emergency_food');
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const presets: InterventionPreset[] = [
    {
      id: 'emergency_food',
      title: 'Release Imperial Grain Reserves',
      category: 'Nutrition & Famine Relief',
      icon: <Utensils className="w-5 h-5 text-[#f59e0b]" />,
      cost: '500 Materials + 200 Imperial Credits',
      description: 'Mobilize strategic national granaries to disburse 5,000 units of emergency rations across distressed quarters.',
      projectedImpacts: [
        'Eliminates starvation hazard across citizen quarters within 1 cycle',
        'Improves citizen morale and happiness by +12%',
        'De-escalates food-driven civil grievances and riot risks',
      ],
      accentColor: 'from-amber-600 to-amber-700',
    },
    {
      id: 'expand_hospital',
      title: 'Deploy Field Infirmaries & Trauma Triage',
      category: 'Imperial Healthcare Protocol',
      icon: <Building className="w-5 h-5 text-[#60a5fa]" />,
      cost: '1,200 Materials + 350 Imperial Credits',
      description: 'Rapidly erect emergency clinical wards and trauma pavilions, adding +2,000 acute hospital beds.',
      projectedImpacts: [
        'Drops municipal bed occupancy back safely below 100%',
        'Reduces clinical overflow deaths to zero',
        'Restores triage protocols for wounded and afflicted citizens',
      ],
      accentColor: 'from-blue-600 to-blue-700',
    },
    {
      id: 'emergency_water',
      title: 'Surge Aqueducts & Clean Springs',
      category: 'Hydration & Sanitation',
      icon: <Droplets className="w-5 h-5 text-[#38bdf8]" />,
      cost: '800 Materials + 150 Imperial Credits',
      description: 'Open emergency floodgates, activate deep aquifer cisterns, and deploy cleansing caravans (+6,000 water units).',
      projectedImpacts: [
        'Halts acute dehydration mortality immediately',
        'Re-establishes clean municipal water access for all districts',
        'Recovers civilization vitality and hygiene index by +15%',
      ],
      accentColor: 'from-cyan-600 to-cyan-700',
    },
    {
      id: 'civic_accord',
      title: 'Proclaim Imperial Civic Accord',
      category: 'Crown Governance & Concord',
      icon: <ShieldCheck className="w-5 h-5 text-[#2ecc71]" />,
      cost: '400 Imperial Credits Council Allocation',
      description: 'Convene district elders, declare a temporary tax holiday, and address key grievance petitions.',
      projectedImpacts: [
        'Reduces civil protest intensity and strike risk by -40%',
        'Restores realm civic stability index above 0.70',
        'Prevents sabotage and strikes on vital public infrastructure',
      ],
      accentColor: 'from-emerald-600 to-emerald-700',
    },
  ];

  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0];

  const handleExecute = async () => {
    soundFx.playClick();
    setLastActionResult(null);
    setErrorMessage(null);
    try {
      await onExecutePolicy(activePreset.id);
      soundFx.playSuccess();
      setLastActionResult(`Decree enacted: ${activePreset.title}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Decree execution failed.');
    }
  };

  return (
    <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#2b392d]/60">
        <div>
          <h3 className="font-cinzel text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#c5a66a]" />
            CAUSAL POLICY INTERVENTIONS & WHAT-IF DIRECTIVES
          </h3>
          <p className="text-xs text-[#8fa879] mt-0.5">Enact targeted governance decrees to neutralize destructive causal feedback loops.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset Selector */}
        <div className="space-y-2.5">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedPresetId(preset.id);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'border-[#c5a66a] bg-[#1a251d] text-white ring-1 ring-[#c5a66a]/70 shadow-md shadow-[#c5a66a]/10'
                    : 'border-[#2b392d] bg-[#18221b] text-[#8e9c8c] hover:border-[#3d5040] hover:text-[#e7d8c5]'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-[#141b16] border border-[#2b392d] shrink-0">
                  {preset.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-cinzel text-xs font-bold text-white truncate">{preset.title}</div>
                  <div className="text-[10px] text-[#8fa879] font-mono truncate mt-0.5">{preset.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Preset Details & Projections */}
        <div className="lg:col-span-2 bg-[#18221b] rounded-xl p-5 border border-[#2b392d] flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3 gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#c5a66a] font-bold">
                  {activePreset.category}
                </span>
                <h4 className="font-cinzel text-base font-bold text-white mt-1">{activePreset.title}</h4>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#141b16] text-[#c5a66a] border border-[#2b392d] shrink-0 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#c5a66a]" />
                {activePreset.cost}
              </span>
            </div>

            <p className="text-xs text-[#a5b59e] leading-relaxed mb-4">{activePreset.description}</p>

            <div className="bg-[#141b16] rounded-xl p-4 border border-[#2b392d] mb-4">
              <span className="font-cinzel text-xs font-bold text-white block mb-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2ecc71]" />
                PROJECTED DOWNSTREAM CAUSAL SHIFTS
              </span>
              <ul className="space-y-2">
                {activePreset.projectedImpacts.map((impact, idx) => (
                  <li key={idx} className="text-xs text-[#dcd2c4] flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-[#c5a66a] shrink-0" />
                    <span>{impact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            {lastActionResult && (
              <div className="mb-3 p-3 rounded-lg bg-[#122b1a] border border-[#1e502c] text-[#86efac] text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-[#2ecc71] shrink-0" />
                <span>{lastActionResult}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-3 rounded-lg bg-[#2d1214] border border-[#5e1c20] text-[#fca5a5] text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`w-full py-3 px-5 rounded-lg font-cinzel font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-[#c5a66a] bg-gradient-to-r from-[#c5a66a] to-[#d4af37] text-[#0f1411] hover:brightness-110 active:scale-[0.99] ${
                isExecuting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Crown className="w-4 h-4" />
              {isExecuting ? 'Proclaiming Imperial Decree...' : 'Proclaim Imperial Decree'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
