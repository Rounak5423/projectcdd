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
  buttonClass: string;
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
      title: 'Emergency Grain Reserves Release',
      category: 'Nutrition & Famine Relief',
      icon: <Utensils className="w-5 h-5 text-amber-400" />,
      cost: '500 Materials + 200 GRC',
      description: 'Mobilize strategic national stockpiles to supply 5,000 units of emergency food immediately.',
      projectedImpacts: [
        'Eliminates starvation hazard within 1 cycle',
        'Improves citizen happiness by +12%',
        'De-escalates food-driven civil grievances',
      ],
      buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    {
      id: 'expand_hospital',
      title: 'Deploy Field Hospitals & Mobile Triage',
      category: 'Healthcare Infrastructure',
      icon: <Building className="w-5 h-5 text-blue-400" />,
      cost: '1,200 Materials + 350 GRC',
      description: 'Rapidly construct secondary emergency clinical pavilions, adding +2,000 acute hospital beds.',
      projectedImpacts: [
        'Drops bed occupancy back below 100%',
        'Reduces hospital overflow deaths to zero',
        'Restores full triage protocol for trauma victims',
      ],
      buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    {
      id: 'emergency_water',
      title: 'Emergency Desalination & Aqueduct Surge',
      category: 'Hydration & Sanitation',
      icon: <Droplets className="w-5 h-5 text-cyan-400" />,
      cost: '800 Materials + 150 GRC',
      description: 'Run deep-aquifer pumps and coastal desalination plants at maximum output (+6,000 water units).',
      projectedImpacts: [
        'Halts acute dehydration mortality',
        'Re-establishes clean municipal water access',
        'Recovers biological vitality index by +15%',
      ],
      buttonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    },
    {
      id: 'civic_accord',
      title: 'Civic De-Escalation & Citizen Accord',
      category: 'Governance & Stability',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      cost: '400 GRC Council Allocation',
      description: 'Convene district representatives, implement temporary tax moratorium, and meet key protest demands.',
      projectedImpacts: [
        'Reduces protest intensity by -40%',
        'Restores civic stability index above 0.70',
        'Prevents critical infrastructure strikes',
      ],
      buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
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
      setLastActionResult(`Successfully enacted: ${activePreset.title}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Intervention execution failed.');
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            CAUSAL POLICY INTERVENTIONS (WHAT-IF SCENARIOS)
          </h3>
          <p className="text-xs text-slate-400">Enact targeted governance levers to test and break destructive causal loops.</p>
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
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'border-cyan-500/80 bg-cyan-950/20 text-white ring-1 ring-cyan-500/50'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="p-2 rounded-md bg-slate-900 border border-slate-800 shrink-0">
                  {preset.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{preset.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{preset.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Preset Details & Projections */}
        <div className="lg:col-span-2 bg-slate-950/60 rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  {activePreset.category}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{activePreset.title}</h4>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Cost: {activePreset.cost}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">{activePreset.description}</p>

            <div className="bg-slate-900/90 rounded-lg p-3.5 border border-slate-800 mb-4">
              <span className="text-xs font-semibold text-slate-200 block mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                PROJECTED DOWNSTREAM CAUSAL OUTCOMES:
              </span>
              <ul className="space-y-1.5">
                {activePreset.projectedImpacts.map((impact, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{impact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            {lastActionResult && (
              <div className="mb-3 p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lastActionResult}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                activePreset.buttonClass
              } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isExecuting ? 'Executing Intervention...' : 'Enact Causal Policy Directive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

