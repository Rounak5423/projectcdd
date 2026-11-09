import React, { useState } from 'react';
import {
  GitCommit,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CausalTraceGraph, CausalNode, CausalLink } from './types';

interface CauseAndEffectViewProps {
  traceGraph: CausalTraceGraph | null;
}

export const CauseAndEffectView: React.FC<CauseAndEffectViewProps> = ({ traceGraph }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!traceGraph) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
        <Activity className="w-8 h-8 mx-auto mb-2 text-slate-500 animate-spin" />
        <p>Loading causal graph dependencies...</p>
      </div>
    );
  }

  const { nodes, links, summary, contributing_factors } = traceGraph;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const getStatusColor = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical':
        return 'border-rose-500/70 bg-rose-950/20 text-rose-300 shadow-rose-950/50';
      case 'warning':
        return 'border-amber-500/70 bg-amber-950/20 text-amber-300 shadow-amber-950/50';
      default:
        return 'border-slate-800 bg-slate-900/80 text-slate-200 shadow-slate-950/50';
    }
  };

  const getImpactBadge = (impact: 'mitigating' | 'aggravating' | 'neutral') => {
    switch (impact) {
      case 'aggravating':
        return <span className="text-xs px-2 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-700/50">Aggravating</span>;
      case 'mitigating':
        return <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">Mitigating</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Neutral</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Summary */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-white">CAUSAL PROPAGATION CHAIN (TICK {traceGraph.tick})</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{summary}</p>
          {contributing_factors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {contributing_factors.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-600/30">
                  ⚠️ {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Causal Flow Nodes Pipeline */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white tracking-wide mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          SYSTEM COUPLING PIPELINE (SELECT A NODE TO INSPECT)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-lg ${
                  getStatusColor(node.status)
                } ${isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1 text-slate-400">
                  <span className="uppercase text-[10px] tracking-wider">{node.category}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    node.status === 'critical' ? 'bg-rose-500 animate-ping' : node.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                </div>
                <div className="text-sm font-semibold text-white mb-2 line-clamp-1">{node.label}</div>
                <div className="text-lg font-bold font-mono text-cyan-300">{node.display_value}</div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{node.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details & Active Causal Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Detail */}
        {selectedNode && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                NODE METADATA: {selectedNode.label}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded uppercase font-mono ${
                selectedNode.status === 'critical' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {selectedNode.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{selectedNode.description}</p>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Measured Value:</span>
                <span className="text-cyan-300 font-bold">{selectedNode.display_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normalized Index:</span>
                <span className="text-white">{selectedNode.value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Engine Subsystem:</span>
                <span className="text-slate-200 uppercase">{selectedNode.category}</span>
              </div>
            </div>
          </div>
        )}

        {/* Causal Edges / Transmission Table */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-emerald-400" />
            LIVE LINK TRANSMISSIONS & COUPLING WEIGHTS
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {links.map((link, idx) => {
              const srcNode = nodes.find((n) => n.id === link.source);
              const tgtNode = nodes.find((n) => n.id === link.target);
              return (
                <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <span>{srcNode?.label || link.source}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tgtNode?.label || link.target}</span>
                    </div>
                    {getImpactBadge(link.impact)}
                  </div>
                  <p className="text-slate-400 text-[11px] mb-1.5">{link.description}</p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Link Weight:</span>
                    <span className={link.strength < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {link.strength > 0 ? '+' : ''}{link.strength.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

