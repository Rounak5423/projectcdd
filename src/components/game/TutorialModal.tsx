import React, { useState } from 'react';
import {
  X,
  Compass,
  Layers,
  Activity,
  Brain,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../../services/soundFx';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to CIVORA & GENESIS Engine',
      icon: Compass,
      color: '#dfb74a',
      badge: 'Urban Simulation Command Center',
      content: (
        <div className="space-y-3 text-xs text-[#a0aba3] leading-relaxed">
          <p>
            You are in command of an autonomous artificial civilization. The simulation couples macro-economic feedback loops with deep Cities: Skylines II-grade agent pathfinding and continuous 2D urban diffusion fields.
          </p>
          <div className="p-3 bg-[#0d1410] border border-[#dfb74a]/30 rounded-lg">
            <span className="text-[#faecd0] font-bold block mb-1">🎮 Viewport Camera Controls:</span>
            <ul className="list-disc pl-4 space-y-1 text-[#8f9d94]">
              <li><strong className="text-white">Left Click + Drag:</strong> Orbit and rotate the 3D world</li>
              <li><strong className="text-white">Right Click + Drag:</strong> Smooth tactical pan</li>
              <li><strong className="text-white">Scroll Wheel:</strong> Zoom directly to cursor location</li>
              <li><strong className="text-white">Presets:</strong> Isometric, Top-Down, and Panoramic in the bottom HUD</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Demand-Driven RCI Zoning & Life-Paths',
      icon: Layers,
      color: '#3498db',
      badge: 'Urban Planning Framework',
      content: (
        <div className="space-y-3 text-xs text-[#a0aba3] leading-relaxed">
          <p>
            Unlike static placers, buildings in GENESIS dynamically grow, upgrade, or abandon based on real municipal demand (RCI), land value, and service saturation.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-[#0a1f14] border border-[#2ecc71]/30 rounded">
              <span className="text-[#2ecc71] font-bold block">Residential (Low & High)</span>
              <span>Drives population migration and workforce availability.</span>
            </div>
            <div className="p-2.5 bg-[#0a1628] border border-[#3498db]/30 rounded">
              <span className="text-[#3498db] font-bold block">Commercial (Low & High)</span>
              <span>Supplies consumer goods and generates sales tax revenues.</span>
            </div>
            <div className="p-2.5 bg-[#251909] border border-[#f39c12]/30 rounded">
              <span className="text-[#f39c12] font-bold block">Industrial Manufacturing</span>
              <span>Processes raw commodities into high-value alloy components.</span>
            </div>
            <div className="p-2.5 bg-[#1b102b] border border-[#9b59b6]/30 rounded">
              <span className="text-[#9b59b6] font-bold block">High-Tech Offices</span>
              <span>Employs educated citizens; shielded from industrial pollution.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '12 Multi-Channel 3D Info Views',
      icon: Activity,
      color: '#e74c3c',
      badge: 'Telemetry & Shader Overlays',
      content: (
        <div className="space-y-3 text-xs text-[#a0aba3] leading-relaxed">
          <p>
            Toggle the Info Views button in the top bar to inspect city networks projected directly onto the 3D WebGL terrain:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-[#8f9d94]">
            <li><strong className="text-[#f1c40f]">Electricity & Water:</strong> Live grid load ratios and sewage treatment efficiency.</li>
            <li><strong className="text-[#e74c3c]">Traffic Flow:</strong> Congestion-weighted A* routing and public transit lines.</li>
            <li><strong className="text-[#2ecc71]">Land Value:</strong> Real estate prices driving Level 1 through 5 building upgrades.</li>
            <li><strong className="text-[#9b59b6]">Pollution & Noise:</strong> Wind-advected smog plumes and highway acoustic levels.</li>
            <li><strong className="text-[#3b82f6]">Crime, Health & Education:</strong> Precinct security radars and clinic radius.</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Cognitive Science & The AI Paradox',
      icon: Brain,
      color: '#a855f7',
      badge: 'Core Scientific Research',
      content: (
        <div className="space-y-3 text-xs text-[#a0aba3] leading-relaxed">
          <p>
            The hallmark of GENESIS is mathematical modeling of the <strong className="text-white">AI Dependency Paradox</strong>:
          </p>
          <div className="p-3 bg-[#180d24] border border-[#a855f7]/40 rounded-lg font-mono text-[11px] text-[#e9d5ff]">
            dD/dt = κ · A^γ - μ · S · D
          </div>
          <p>
            Unchecked AI automation rapidly accelerates task completion but induces cognitive atrophy in independent reasoning. Maintain <strong className="text-amber-400">Cognitive Scaffolding</strong> policies and academy education to preserve human critical problem solving!
          </p>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0f1713] border border-[#dfb74a]/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#243328] bg-[#09110d]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${current.color}20`, borderColor: `${current.color}60`, borderWidth: 1 }}
            >
              <Icon className="w-5 h-5" style={{ color: current.color }} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8f9d94] block">
                {current.badge} • Step {currentStep + 1} of {steps.length}
              </span>
              <h3 className="text-base font-bold font-serif text-[#faecd0]">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#8f9d94] hover:text-white hover:bg-[#1a2920] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 min-h-[220px]">
          {current.content}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[#243328] bg-[#09110d]">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  soundFx.playClick();
                  setCurrentStep(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-[#dfb74a]' : 'w-2 bg-[#2a3c30] hover:bg-[#405847]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setCurrentStep((s) => s - 1);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#2a3c30] text-[#a0aba3] hover:text-white text-xs font-semibold hover:bg-[#18261e] transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setCurrentStep((s) => s + 1);
                }}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold shadow-md hover:from-amber-400 hover:to-amber-500 transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Begin Simulation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
