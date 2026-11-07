import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { soundFx } from '../../services/soundFx';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Pause / Resume Simulation Loop' },
    { key: '1, 2, 3, 4', desc: 'Set Simulation Speed (1x, 2x, 5x, 10x)' },
    { key: 'B', desc: 'Toggle Precision 3D Bulldozer Demolition Tool' },
    { key: 'Z', desc: 'Open / Close CS2 Zoning Tool Dock' },
    { key: 'I', desc: 'Toggle 12 Multi-Channel 3D Info Views Panel' },
    { key: 'C', desc: 'Open / Close Live Citizen Chirper Feed' },
    { key: 'M', desc: 'Open City Milestones & Growth Progression Road' },
    { key: 'T', desc: 'Switch Camera to Orthographic Top-Down Preset' },
    { key: 'P', desc: 'Switch Camera to Street-Level Panoramic Preset' },
    { key: 'Ctrl + Z', desc: 'Undo Recent Building or Zoning Action' },
    { key: 'Ctrl + Y', desc: 'Redo Recent Building or Zoning Action' },
    { key: 'Esc', desc: 'Deselect Target / Close Tool / Return to 3D Viewport' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0f1713] border border-[#dfb74a]/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#243328] bg-[#09110d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8f9d94] block">
                Quick Navigation & Controls
              </span>
              <h3 className="text-base font-bold font-serif text-[#faecd0]">
                Keyboard Shortcuts Cheatsheet
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

        {/* Shortcuts Grid */}
        <div className="p-6 max-h-[420px] overflow-y-auto divide-y divide-[#1e2e23]">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs">
              <span className="text-[#c0cbca]">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-[#16221b] border border-[#2b3e32] text-amber-300 font-mono text-[11px] font-bold shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#243328] bg-[#09110d] flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-[#18261e] border border-[#2a3c30] hover:bg-[#203328] text-white text-xs font-semibold transition"
          >
            Close Cheatsheet
          </button>
        </div>
      </div>
    </div>
  );
}
