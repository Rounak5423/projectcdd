import React from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Flame,
  HeartCrack,
  Activity,
  CheckCircle,
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
          border: 'border-rose-500/60 bg-rose-950/20 text-rose-200',
          badge: 'bg-rose-900/60 text-rose-300 border-rose-700/60',
          icon: <Flame className="w-4 h-4 text-rose-400" />,
        };
      case 'emergency':
        return {
          border: 'border-red-500/60 bg-red-950/20 text-red-200',
          badge: 'bg-red-900/60 text-red-300 border-red-700/60',
          icon: <HeartCrack className="w-4 h-4 text-red-400" />,
        };
      case 'warning':
        return {
          border: 'border-amber-500/60 bg-amber-950/20 text-amber-200',
          badge: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          border: 'border-slate-800 bg-slate-900/60 text-slate-300',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Activity className="w-4 h-4 text-cyan-400" />,
        };
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          REAL-TIME CAUSAL INCIDENTS & CRISIS LOG
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {events.length} events logged
        </span>
      </div>

      {events.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/80">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
          <p className="text-sm">No humanitarian crises or civil unrest recorded in recent cycles.</p>
          <p className="text-xs text-slate-500 mt-1">Resource supplies are stable and hospital triage is functioning normally.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {events.map((evt) => {
            const style = getSeverityStyle(evt.severity);
            return (
              <div
                key={evt.id}
                className={`p-3.5 rounded-lg border transition-all ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    {style.icon}
                    <span className="text-sm font-semibold text-white">{evt.title}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={`px-2 py-0.5 rounded border uppercase font-bold text-[10px] ${style.badge}`}>
                      {evt.severity}
                    </span>
                    <span className="text-slate-400">Y{evt.year} D{evt.day} (T{evt.tick})</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
                    {Object.entries(evt.metadata).map(([k, v]) => (
                      <span key={k} className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                        {k}: <span className="text-slate-200">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
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

