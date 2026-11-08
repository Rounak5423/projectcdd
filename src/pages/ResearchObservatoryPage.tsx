import React, { useState } from 'react';
import {
  Compass,
  BrainCircuit,
  Microscope,
  Sparkles,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Play,
  BarChart2,
  Download,
  X,
  FileText,
  ShieldAlert,
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { soundFx } from '../services/soundFx';

interface ResearchObservatoryPageProps {
  onClose?: () => void;
}

const cohortTelemetry = [
  { metric: 'Cognitive Capability', groupA: 94, groupB: 88, groupC: 62 },
  { metric: 'Innovation Velocity', groupA: 55, groupB: 92, groupC: 86 },
  { metric: 'Institutional Resilience', groupA: 91, groupB: 85, groupC: 48 },
  { metric: 'Economic Output', groupA: 64, groupB: 89, groupC: 96 },
  { metric: 'Citizen Wellbeing', groupA: 78, groupB: 84, groupC: 72 },
  { metric: 'Systemic Vulnerability', groupA: 18, groupB: 35, groupC: 82 },
];

export const ResearchObservatoryPage: React.FC<ResearchObservatoryPageProps> = ({ onClose }) => {
  const { experiments, resources, startExperiment, civilization } = useGameState();
  const [selectedExpId, setSelectedExpId] = useState<string>(experiments[0].id);

  const activeExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  const handleExportPaper = () => {
    soundFx.playSuccess();
    const paper = `# EMPIRICAL RESEARCH MONOGRAPH: ${activeExp.title.toUpperCase()}
*Civora Imperial Research Observatory · Scientific Audit Series*
*Author: Imperial Council on Societal Dynamics · Year ${civilization.currentYear}*

## Abstract
${activeExp.hypothesis}

## Core Research Inquiry
"${activeExp.researchQuestion}"

## Experimental Methodology & Cohorts
${activeExp.experimentalGroups.map(g => `- **${g.name}** (N = ${g.sampleSize.toLocaleString()}): ${g.description} [Exposure: ${g.aiExposure}]`).join('\n')}

## Empirical Findings & Observations
${activeExp.findings || 'Longitudinal data reveals sharp divergence in self-directed problem-solving capability when autonomous cognitive agents surpass 80% decision delegation.'}

## Significance & Societal Directives
Statistical testing confirms p < 0.001 significance across all three cohorts over the 36-month observational window.
`;

    const blob = new Blob([paper], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CIVORA_Research_Paper_${activeExp.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                RESEARCH OBSERVATORY & EMPIRICAL TRIALS
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Longitudinal Sciences
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Empirical trials, longitudinal societal cohorts, and statistical audits on civilisational resilience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPaper}
            className="flex items-center gap-2 px-4 py-2 border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/15 rounded text-xs font-serif tracking-wider uppercase transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Monograph</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Experiment Selector Ribbon */}
      <div className="flex-shrink-0 px-8 py-4 bg-[#17231B]/70 border-b border-[#C5A66A]/15 grid grid-cols-1 md:grid-cols-2 gap-4">
        {experiments.map((exp) => {
          const isSelected = exp.id === activeExp.id;

          return (
            <div
              key={exp.id}
              onClick={() => { soundFx.playClick(); setSelectedExpId(exp.id); }}
              className={`p-4 rounded border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#202820] border-[#C5A66A] shadow-md'
                  : 'bg-[#171D18] border-[#C5A66A]/20 hover:border-[#C5A66A]/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-[#C5A66A] font-bold">
                    TRIAL PROTOCOL · {exp.durationDays} SOLAR DAYS
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      exp.status === 'Active'
                        ? 'bg-[#8FA879]/15 text-[#8FA879] border-[#8FA879]/30'
                        : 'bg-[#202820] text-[#A5AD9D] border-[#C5A66A]/20'
                    }`}
                  >
                    {exp.status}
                  </span>
                </div>
                <h3 className="font-serif text-base font-bold text-[#EAE3D2]">{exp.title}</h3>
                <p className="text-xs text-[#A5AD9D] mt-1 line-clamp-2 leading-relaxed">
                  {exp.researchQuestion}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#C5A66A]/15 flex items-center justify-between text-xs font-mono">
                <span className="text-[#A5AD9D]">
                  Cohort Size: {exp.experimentalGroups.reduce((acc, g) => acc + g.sampleSize, 0).toLocaleString()} Subjects
                </span>
                <span className="text-[#C5A66A] font-bold">{exp.grcCost} CRC</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Observatory Body: Featured Experiment */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-6">
        {/* Flagship Header */}
        <div className="p-6 rounded bg-[#202820]/90 border border-[#C5A66A]/30 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[#C5A66A]/20">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#171D18] border border-[#C5A66A]/40 text-[10px] font-mono text-[#C5A66A] font-bold uppercase mb-2">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>FLAGSHIP CIVILISATIONAL INQUIRY</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#EAE3D2]">{activeExp.title}</h2>
              <p className="text-xs text-[#D8CBAA] mt-1 italic leading-relaxed">
                "{activeExp.researchQuestion}"
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeExp.status === 'Active' ? (
                <span className="px-4 py-2 rounded bg-[#17231B] border border-[#8FA879]/40 text-xs font-mono text-[#8FA879] font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8FA879] animate-ping" />
                  Trial Active: Cycle {activeExp.currentDay} / {activeExp.durationDays}
                </span>
              ) : (
                <button
                  disabled={resources.grc < activeExp.grcCost}
                  onClick={() => {
                    soundFx.playReward();
                    startExperiment(activeExp.id);
                  }}
                  className={`px-5 py-2.5 rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow ${
                    resources.grc >= activeExp.grcCost
                      ? 'bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18]'
                      : 'bg-[#171D18] text-[#A5AD9D]/40 border border-[#C5A66A]/20 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Commence Trial ({activeExp.grcCost} CRC)</span>
                </button>
              )}
            </div>
          </div>

          {/* Hypothesis and Cohorts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 lg:col-span-1 space-y-3">
              <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                SCIENTIFIC HYPOTHESIS
              </span>
              <p className="text-xs text-[#A5AD9D] leading-relaxed font-sans">{activeExp.hypothesis}</p>

              <div className="pt-3 border-t border-[#C5A66A]/15 space-y-1 text-xs font-sans">
                <span className="text-[10px] font-mono uppercase text-[#A5AD9D] block">
                  Independent Variables Under Surveillance:
                </span>
                {activeExp.independentVariables.map((v, i) => (
                  <div key={i} className="text-[#EAE3D2] flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8FA879]" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 lg:col-span-2 space-y-3">
              <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                CONTROLLED EXPERIMENTAL COHORTS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeExp.experimentalGroups.map((group, i) => (
                  <div key={i} className="p-3.5 rounded bg-[#202820] border border-[#C5A66A]/20 space-y-1.5">
                    <span className="font-serif font-bold text-xs text-[#EAE3D2] block">{group.name}</span>
                    <p className="text-[11px] text-[#A5AD9D] leading-relaxed">{group.description}</p>
                    <div className="pt-2 text-[10px] font-mono text-[#8FA879]">
                      Sample: {group.sampleSize.toLocaleString()} citizens
                    </div>
                    <div className="text-[10px] font-mono text-[#C5A66A] font-semibold">
                      {group.aiExposure}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Charts: Cognitive Divergence vs Velocity & Multi-cohort Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Longitudinal Chart */}
          <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                  LONGITUDINAL TELEMETRY
                </span>
                <h3 className="font-serif text-sm font-bold text-[#EAE3D2] mt-0.5">
                  Cognitive Independence vs Velocity Over 36 Months
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeExp.dataPoints} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="exposureMonth" stroke="#A5AD9D" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A5AD9D" fontSize={10} tickLine={false} domain={[30, 105]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171D18', borderColor: '#C5A66A', color: '#EAE3D2', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="cognitiveIndependence" name="Cognitive Independence" stroke="#C87569" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="problemSolvingVelocity" name="Problem Solving Velocity" stroke="#8FA879" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="creativeDivergence" name="Torrance Divergence" stroke="#C5A66A" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cohort Comparative BarChart */}
          <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                  COHORT PROFILE COMPARISON
                </span>
                <h3 className="font-serif text-sm font-bold text-[#EAE3D2] mt-0.5">
                  Group A (No AI) vs Group B (Limited) vs Group C (Broad)
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortTelemetry} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="metric" stroke="#A5AD9D" fontSize={9} interval={0} angle={-15} textAnchor="end" tickLine={false} />
                  <YAxis stroke="#A5AD9D" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#171D18', borderColor: '#C5A66A', fontSize: '11px' }} />
                  <Bar dataKey="groupA" name="Group A (No AI)" fill="#C5A66A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="groupB" name="Group B (Limited)" fill="#8FA879" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="groupC" name="Group C (Broad)" fill="#C87569" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interim Research Findings */}
        {activeExp.findings && (
          <div className="p-5 rounded bg-[#17231B] border border-[#8FA879]/30 text-xs space-y-2">
            <span className="font-mono text-[#C5A66A] font-bold text-[10px] uppercase tracking-wider block">
              PUBLISHED OBSERVATORY AUDIT & PEER REVIEW
            </span>
            <p className="text-[#EAE3D2] leading-relaxed font-serif text-sm">
              "{activeExp.findings}"
            </p>
            <div className="pt-2 text-[10px] font-mono text-[#A5AD9D] flex items-center justify-between">
              <span>Statistical Significance: <strong>p &lt; 0.001 (High Confidence)</strong></span>
              <span>Audited by: <strong>Civora Imperial Science Academy</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchObservatoryPage;
