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
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { Experiment } from '../types/game';

export default function ResearchObservatoryPage() {
  const { experiments, resources, startExperiment } = useGameState();
  const [selectedExpId, setSelectedExpId] = useState<string>(experiments[0].id);

  const activeExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">EMPIRICAL LABORATORY</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Research Observatory</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Conduct controlled longitudinal social and technological experiments, including the civilisational AI Dependency Paradox.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">RESEARCH CREDITS (GRC)</span>
            <span className="text-sm font-bold text-[#c6a76a]">{resources.grc} Available</span>
          </div>
        </div>
      </div>

      {/* Experiment Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experiments.map((exp) => {
          const isSelected = exp.id === activeExp.id;

          return (
            <div
              key={exp.id}
              onClick={() => setSelectedExpId(exp.id)}
              className={`panel p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#1e271f] border-[#a6bd82] ring-1 ring-[#a6bd82] shadow-xl'
                  : 'bg-[#182119] border-[#313f32] hover:border-[#4d614e]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#c6a76a] font-bold">
                    TRIAL PROTOCOL · {exp.durationDays} DAYS
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      exp.status === 'Active'
                        ? 'bg-[#253727] text-[#a6bd82] border border-[#3e5640]'
                        : 'bg-[#29352a] text-[#82a6bd] border border-[#3f5241]'
                    }`}
                  >
                    {exp.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#f3f5ef] mt-1">{exp.title}</h3>
                <p className="text-xs text-[#9da99b] mt-1 line-clamp-2 leading-relaxed">
                  {exp.researchQuestion}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#29342a] flex items-center justify-between text-xs font-mono">
                <span className="text-[#8e9c8c]">
                  Cohort Size: {exp.experimentalGroups.reduce((acc, g) => acc + g.sampleSize, 0).toLocaleString()}
                </span>
                <span className="text-[#c6a76a] font-bold">{exp.grcCost} GRC</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FEATURED: The AI Dependency Paradox In-Depth View */}
      <div className="panel p-6 bg-[#182119] border-[#313f32] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[#29342a]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#272216] border border-[#4d3f23] text-[10px] font-mono text-[#c6a76a] font-bold uppercase mb-2">
              <BrainCircuit size={12} />
              FLAGSHIP CIVILISATIONAL INQUIRY
            </div>
            <h2 className="text-xl font-bold text-[#f3f5ef]">{activeExp.title}</h2>
            <p className="text-xs text-[#dce9ca] mt-1 italic leading-relaxed">
              "{activeExp.researchQuestion}"
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeExp.status === 'Active' ? (
              <span className="px-4 py-2 rounded-lg bg-[#273729] border border-[#48634b] text-xs font-mono text-[#a6bd82] font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#a6bd82] animate-ping" />
                Trial Active: Day {activeExp.currentDay} / {activeExp.durationDays}
              </span>
            ) : (
              <button
                disabled={resources.grc < activeExp.grcCost}
                onClick={() => startExperiment(activeExp.id)}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  resources.grc >= activeExp.grcCost
                    ? 'bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] border border-[#6b8563]'
                    : 'bg-[#222822] text-[#697268] cursor-not-allowed'
                }`}
              >
                <Play size={14} className="fill-current" />
                <span>Commence Trial ({activeExp.grcCost} GRC)</span>
              </button>
            )}
          </div>
        </div>

        {/* Hypothesis and Experimental Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="panel p-4 bg-[#141914] border-[#273228] lg:col-span-1 space-y-3">
            <span className="eyebrow text-[#c6a76a]">SCIENTIFIC HYPOTHESIS</span>
            <p className="text-xs text-[#adb8a9] leading-relaxed">{activeExp.hypothesis}</p>

            <div className="pt-3 border-t border-[#232c24] space-y-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-[#9da99b] block">
                Independent Variables:
              </span>
              {activeExp.independentVariables.map((v, i) => (
                <div key={i} className="text-[#e8e9e3] flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a6bd82]" />
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4 bg-[#141914] border-[#273228] lg:col-span-2 space-y-3">
            <span className="eyebrow text-[#c6a76a]">CONTROLLED EXPERIMENTAL COHORTS</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeExp.experimentalGroups.map((group, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#182119] border border-[#2d3a2e] space-y-1">
                  <span className="font-bold text-xs text-[#f3f5ef] block">{group.name}</span>
                  <p className="text-[10px] text-[#9da99b] leading-relaxed">{group.description}</p>
                  <div className="pt-2 text-[10px] font-mono text-[#a6bd82]">
                    Sample: {group.sampleSize.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono text-[#c6a76a] font-semibold">
                    {group.aiExposure}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistical Visualisation of Cognitive Divergence vs Velocity */}
        {activeExp.dataPoints && (
          <div className="panel p-5 bg-[#141914] border-[#273228] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow text-[#c6a76a]">EMPIRICAL TELEMETRY STREAM</span>
                <h3 className="text-sm font-bold text-[#f3f5ef] mt-0.5">
                  Cognitive Independence vs Problem Solving Velocity Over 36 Months
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-[#d47e69]">
                  <span className="w-2 h-2 rounded bg-[#d47e69]" /> Cognitive Independence (/100)
                </span>
                <span className="flex items-center gap-1 text-[#a6bd82]">
                  <span className="w-2 h-2 rounded bg-[#a6bd82]" /> Task Velocity (/100)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeExp.dataPoints} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="exposureMonth" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} label={{ value: 'Months of Exposure', position: 'insideBottom', offset: -4, fill: '#8e9c8c', fontSize: 10 }} />
                  <YAxis stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} domain={[30, 105]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171d18', borderColor: '#39443a', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="cognitiveIndependence" name="Cognitive Independence" stroke="#d47e69" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="problemSolvingVelocity" name="Problem Solving Velocity" stroke="#a6bd82" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="creativeDivergence" name="Torrance Divergence" stroke="#c6a76a" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Interim Research Findings */}
        {activeExp.findings && (
          <div className="p-4 rounded-xl bg-[#1d271e] border border-[#3f5440] text-xs space-y-1">
            <span className="font-mono text-[#c6a76a] font-bold text-[10px] uppercase block">
              PUBLISHED OBSERVATORY AUDIT
            </span>
            <p className="text-[#dce9ca] leading-relaxed">{activeExp.findings}</p>
          </div>
        )}
      </div>
    </div>
  );
}
