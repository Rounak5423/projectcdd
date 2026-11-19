import React from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Flame,
  HeartCrack,
  Activity,
  CheckCircle,
  Scroll,
} from 'lucide-react';
import { CausalEvent } from './types';

interface CausalEventFeedProps {
  events: CausalEvent[];
}

export const CausalEventFeed: React.FC<CausalEventFeedProps> = ({ events }) => {
  const getSeverityStyle = (severity: 'info' | 'warning' | 'emergency' | 'critical') => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-[#5e1c20] bg-[#221316] text-[#fca5a5]',
          badge: 'bg-[#2d1214] text-[#fca5a5] border-[#5e1c20]',
          icon: <Flame className="w-4 h-4 text-rose-400" />,
        };
      case 'emergency':
        return {
          border: 'border-[#6b1e25] bg-[#261317] text-[#fca5a5]',
          badge: 'bg-[#331418] text-[#fca5a5] border-[#6b1e25]',
          icon: <HeartCrack className="w-4 h-4 text-rose-400" />,
        };
      case 'warning':
        return {
          border: 'border-[#5e441c] bg-[#221c13] text-[#fcd34d]',
          badge: 'bg-[#2d2212] text-[#fcd34d] border-[#5e441c]',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          border: 'border-[#2b392d] bg-[#18221b] text-[#e7d8c5]',
          badge: 'bg-[#141b16] text-[#8fa879] border-[#2b392d]',
          icon: <Scroll className="w-4 h-4 text-[#c5a66a]" />,
        };
    }
  };

  return (
    <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2b392d]/60">
        <h3 className="font-cinzel text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#c5a66a]" />
          IMPERIAL DISPATCHES & CRISIS REGISTER
        </h3>
        <span className="text-xs text-[#8fa879] font-mono">
          {events.length} Dispatches Logged
        </span>
      </div>

      {events.length === 0 ? (
        <div className="p-8 text-center text-[#8e9c8c] bg-[#18221b] rounded-lg border border-[#2b392d]">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-[#2ecc71]" />
          <p className="font-cinzel text-sm font-bold text-white">Imperial Concord Holds</p>
          <p className="text-xs text-[#8e9c8c] mt-1">
            No civilian revolts, catastrophic famines, or hospital collapses recorded in recent cycles.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
          {events.map((evt) => {
            const style = getSeverityStyle(evt.severity);
            return (
              <div
                key={evt.id}
                className={`p-4 rounded-xl border transition-all ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {style.icon}
                    <span className="font-cinzel text-sm font-bold text-white tracking-wide">{evt.title}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className={`px-2 py-0.5 rounded border uppercase font-bold text-[10px] ${style.badge}`}>
                      {evt.severity}
                    </span>
                    <span className="text-[#8e9c8c]">Y{evt.year} D{evt.day} <span className="text-[#c5a66a]">(T{evt.tick})</span></span>
                  </div>
                </div>
                <p className="text-xs text-[#dcd2c4] leading-relaxed mb-2">{evt.description}</p>
                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-black/30 font-mono text-[10px]">
                    {Object.entries(evt.metadata).map(([k, v]) => (
                      <span key={k} className="bg-[#0f1411]/80 px-2 py-0.5 rounded border border-[#2b392d] text-[#8fa879]">
                        {k}: <span className="text-white font-semibold">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
