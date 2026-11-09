import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Microscope,
  Sparkles,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  Activity,
} from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { soundFx } from '../../services/soundFx';

interface ResearchObservatoryProps {
  onEnterObservatory: () => void;
}

export default function ResearchObservatory({
  onEnterObservatory,
}: ResearchObservatoryProps) {
  const experiments = [
    {
      title: 'The AI Dependency Paradox',
      category: 'Flagship Autonomous Cognition',
      status: 'In Progress (Day 134 / 180)',
      progress: 74,
      hypothesis:
        'Evaluating whether excessive cognitive automation in civil service creates structural societal fragility or accelerates planetary ascension.',
      variables: '36,000 Augmented Citizens • Automated Judicial Tribunals • 5 Policy Epochs',
      riskTier: 'Tier IV High Consequence',
      outcomeTrajectory: 'Divergent: Harmony +14% vs Innovation Atrophy -8%',
    },
    {
      title: 'Universal Hydro-Rationing Under Climate Flux',
      category: 'Resource Scarcity Protocol',
      status: 'Completed & Certified',
      progress: 100,
      hypothesis:
        'Testing demographic resilience when agricultural water quotas are reallocated to urban energy plants during dry cycles.',
      variables: '3 River Basins • 80,000 Citizens • Extreme Drought Seed',
      riskTier: 'Tier II Moderate Friction',
      outcomeTrajectory: 'Stabilised: Civil Unrest averted through grain subsidies',
    },
    {
      title: 'Algorithmic Guild Universal Basic Income',
      category: 'Fiscal Statecraft Simulation',
      status: 'Awaiting Next Research Epoch',
      progress: 48,
      hypothesis:
        'Simulating trade volume and artisan guild retention when 40% of treasury surplus is distributed unconditionally to lower-caste households.',
      variables: '12 Districts • 4 Trade Factions • Real-time Price Index',
      riskTier: 'Tier III Structural Reform',
      outcomeTrajectory: 'Projected: Inflation risk dampened by capital investment',
    },
  ];

  const handleEnter = () => {
    soundFx.playEureka();
    onEnterObservatory();
  };

  return (
    <section
      id="observatory"
      className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none"
    >
      {/* Observatory Header */}
      <div className="text-center space-y-3 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16221a] border border-[#c5a66a]/50 text-[#dfb74a] text-[10px] font-mono tracking-widest uppercase shadow-lg"
        >
          <Compass size={16} className="text-[#dfb74a] animate-spin" style={{ animationDuration: '14s' }} />
          <span>CIVORA RESEARCH OBSERVATORY</span>
        </motion.div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          THE FUTURE IS NOT WRITTEN.
          <br />
          IT IS EXPLORED.
        </h2>

        <p
          className="text-base sm:text-lg font-serif italic text-[#d8cbaa] max-w-2xl mx-auto"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Simulations do not prophesy destiny; they rigorously map the branching possibilities of human civilisation under
          controlled empirical assumptions.
        </p>

        <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent mt-4" />
      </div>

      {/* Featured Flagship Experiment Card with Rotating Astrolabe Rings */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 sm:p-10 lg:p-12 rounded-3xl bg-gradient-to-br from-[#16251b] via-[#0f1a13] to-[#08100a] border-2 border-[#dfb74a] shadow-[0_24px_64px_rgba(0,0,0,0.9),0_0_35px_rgba(223,183,74,0.2)] relative overflow-hidden mb-12"
      >
        {/* Sacred Concentric Astrolabe Rings */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full border border-[#dfb74a]/20 pointer-events-none animate-astrolabe" />
        <div className="absolute -top-28 -right-28 w-104 h-104 rounded-full border border-dashed border-[#dfb74a]/15 pointer-events-none animate-astrolabe-reverse" />
        <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-[#dfb74a]/30 animate-ping pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#2d3a2e] relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#dfb74a] mb-1">
              <Microscope size={20} className="animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest">
                FLAGSHIP COGNITIVE SIMULATION
              </span>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-serif font-black text-[#faecd0]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              The AI Dependency Paradox
            </h3>
            <p
              className="text-xs sm:text-sm text-[#d8cbaa] font-serif italic mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Evaluating cognitive divergence and socio-political fragility across augmented subjects over a 180-day cycle.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="px-5 py-2.5 rounded-2xl bg-[#070c08]/90 border border-[#dfb74a]/70 shadow-lg">
              <span className="text-[9px] font-mono text-[#77786d] uppercase block">
                TELEMETRY CYCLE
              </span>
              <span className="text-sm font-mono font-bold text-[#faecd0] flex items-center gap-2">
                <Activity size={14} className="text-[#dfb74a] animate-pulse" />
                <span>Day 134 / 180 (74%)</span>
              </span>
            </div>

            <button
              onClick={handleEnter}
              className="btn-civora-primary px-7 py-3 rounded-xl font-serif font-black text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer border border-[#dfb74a]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>INSPECT SIMULATION</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Experiment Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 relative z-10">
          <div className="p-5 rounded-2xl bg-[#0a120c]/90 border border-[#233125]">
            <span className="text-[10px] font-mono text-[#dfb74a] font-bold uppercase block">
              COHORT PARAMETERS
            </span>
            <p className="text-xs text-[#eae3d2] font-mono mt-1.5 leading-relaxed">
              36,000 citizens equipped with autonomous cognitive augmentation in civic bureaucracy.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a120c]/90 border border-[#233125]">
            <span className="text-[10px] font-mono text-[#dfb74a] font-bold uppercase block">
              OBSERVED DIVERGENCE
            </span>
            <p className="text-xs text-[#faecd0] font-mono mt-1.5 leading-relaxed">
              Bureaucratic speed +42% • Critical problem-solving retention dropped by 18%.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a120c]/90 border border-[#233125]">
            <span className="text-[10px] font-mono text-[#dfb74a] font-bold uppercase block">
              ETHICAL RISK VECTOR
            </span>
            <p className="text-xs text-[#dfb74a] font-mono mt-1.5 leading-relaxed">
              High reliance: abrupt loss of AI nodes triggers severe civil paralysis.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Secondary Experiment Dossiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiments.slice(1).map((exp) => (
          <motion.div
            key={exp.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-7 rounded-2xl bg-[#101b13] border border-[#c5a66a]/30 hover:border-[#dfb74a] transition-all flex flex-col justify-between space-y-4 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#dfb74a] uppercase font-bold">
                  {exp.category}
                </span>
                <span className="text-[10px] font-mono text-[#faecd0] px-2.5 py-0.5 rounded-full bg-black/50 border border-[#2d3a2e]">
                  {exp.status}
                </span>
              </div>

              <h4
                className="text-lg sm:text-xl font-serif font-black text-[#faecd0]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {exp.title}
              </h4>

              <p
                className="text-xs font-serif text-[#d8cbaa] leading-relaxed mt-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {exp.hypothesis}
              </p>
            </div>

            <div className="pt-3 border-t border-[#233125] flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-[#77786d]">
                {exp.riskTier}
              </span>
              <button
                onClick={handleEnter}
                className="text-xs font-serif font-bold text-[#dfb74a] hover:text-[#faecd0] flex items-center gap-1.5 transition-colors cursor-pointer"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <span>Examine Protocol</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Observatory CTA Bar */}
      <div className="mt-14 text-center">
        <button
          onClick={handleEnter}
          className="btn-civora-primary hero-beacon px-9 py-4 rounded-xl font-serif font-black text-sm tracking-[0.18em] uppercase inline-flex items-center gap-3 shadow-2xl border-2 border-[#dfb74a] cursor-pointer"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Compass size={18} className="text-[#faecd0] animate-spin" style={{ animationDuration: '8s' }} />
          <span>ENTER THE RESEARCH OBSERVATORY</span>
        </button>
      </div>
    </section>
  );
}
