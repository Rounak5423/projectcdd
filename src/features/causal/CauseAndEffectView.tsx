import React, { useState } from 'react';
import {
  GitCommit,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Activity,
  AlertTriangle,
  Compass,
  Radio,
} from 'lucide-react';
import { CausalTraceGraph, CausalNode, CausalLink } from './types';

interface CauseAndEffectViewProps {
  traceGraph: CausalTraceGraph | null;
}

export const CauseAndEffectView: React.FC<CauseAndEffectViewProps> = ({ traceGraph }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!traceGraph) {
    return (
      <div className="p-8 text-center text-[#8e9c8c] bg-[#141b16] rounded-xl border border-[#2b392d]">
        <Activity className="w-8 h-8 mx-auto mb-2 text-[#c5a66a] animate-spin" />
        <p className="font-cinzel text-sm">Translating imperial causal graphs and telemetry links...</p>
      </div>
    );
  }

  const { nodes, links, summary, contributing_factors } = traceGraph;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const getStatusColor = (status: 'normal' | 'warning' | 'critical', isSelected: boolean) => {
    if (isSelected) {
      return 'border-[#c5a66a] bg-[#1a251d] ring-2 ring-[#c5a66a]/80 shadow-lg shadow-[#c5a66a]/10';
    }
    switch (status) {
      case 'critical':
        return 'border-[#5e1c20] bg-[#221316] text-[#fca5a5] hover:border-[#83282f] shadow-rose-950/30';
      case 'warning':
        return 'border-[#5e441c] bg-[#221c13] text-[#fcd34d] hover:border-[#8a6528] shadow-amber-950/30';
      default:
        return 'border-[#2b392d] bg-[#141b16] text-[#e7d8c5] hover:border-[#3d5040] shadow-black/40';
    }
  };

  const getImpactBadge = (impact: 'mitigating' | 'aggravating' | 'neutral') => {
    switch (impact) {
      case 'aggravating':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#5e1c20] bg-[#2d1214] text-[#fca5a5]">
            Aggravating
          </span>
        );
      case 'mitigating':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#1e502c] bg-[#122b1a] text-[#86efac]">
            Mitigating
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#2b392d] bg-[#18221b] text-[#8e9c8c]">
            Neutral
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Summary */}
      <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#c5a66a]/5 to-transparent pointer-events-none rounded-full blur-2xl" />
        <div className="flex items-start gap-3.5 relative">
          <div className="p-2.5 rounded-lg bg-[#18221b] border border-[#2b392d] shrink-0 text-[#c5a66a]">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-cinzel text-sm font-bold text-white tracking-wider flex items-center gap-2">
                CAUSAL PROPAGATION CHAIN & DYNAMICS
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2820] text-[#c5a66a] border border-[#2b392d]">
                  CYCLE TICK {traceGraph.tick}
                </span>
              </h4>
            </div>
            <p className="text-xs text-[#a5b59e] mt-1.5 leading-relaxed">{summary}</p>
            {contributing_factors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#2b392d]/60">
                <span className="text-[10px] font-cinzel text-[#c5a66a] uppercase tracking-wider self-center mr-1">
                  Contributing Pressures:
                </span>
                {contributing_factors.map((f, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#221c13] text-[#fcd34d] border border-[#5e441c] flex items-center gap-1 font-mono"
                  >
                    <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Causal Flow Nodes Pipeline */}
      <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cinzel text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c5a66a]" />
            REALM SYSTEM COUPLING NODES
          </h3>
          <span className="text-[11px] text-[#8fa879] font-mono">Select a node to inspect internal pressures</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-md ${
                  getStatusColor(node.status, isSelected)
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5 text-[#8fa879]">
                  <span className="uppercase text-[10px] tracking-wider font-semibold">{node.category}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      node.status === 'critical'
                        ? 'bg-rose-500 shadow-sm shadow-rose-500 animate-pulse'
                        : node.status === 'warning'
                        ? 'bg-amber-400 shadow-sm shadow-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <div className="font-cinzel text-sm font-bold text-white mb-2 line-clamp-1">{node.label}</div>
                <div className="text-xl font-bold font-mono text-[#c5a66a]">{node.display_value}</div>
                <p className="text-[11px] text-[#8e9c8c] mt-2 line-clamp-2 leading-relaxed">{node.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details & Active Causal Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Detail */}
        {selectedNode && (
          <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#c5a66a]" />
                  NODE TELEMETRY: {selectedNode.label}
                </h4>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded uppercase font-mono font-bold border ${
                    selectedNode.status === 'critical'
                      ? 'bg-[#2d1214] border-[#5e1c20] text-[#fca5a5]'
                      : selectedNode.status === 'warning'
                      ? 'bg-[#2d2212] border-[#5e441c] text-[#fcd34d]'
                      : 'bg-[#122b1a] border-[#1e502c] text-[#86efac]'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>
              <p className="text-xs text-[#a5b59e] leading-relaxed mb-4">{selectedNode.description}</p>
            </div>

            <div className="bg-[#18221b] p-3.5 rounded-lg border border-[#2b392d] space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-[#2b392d]/60">
                <span className="text-[#8e9c8c]">Measured Imperial Value:</span>
                <span className="text-[#c5a66a] font-bold text-sm">{selectedNode.display_value}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2b392d]/60">
                <span className="text-[#8e9c8c]">Normalized Coupling Index:</span>
                <span className="text-white font-semibold">{selectedNode.value}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8e9c8c]">Crown Subsystem:</span>
                <span className="text-[#8fa879] uppercase font-bold">{selectedNode.category}</span>
              </div>
            </div>
          </div>
        )}

        {/* Causal Edges / Transmission Table */}
        <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-[#8fa879]" />
              LIVE TRANSMISSIONS & COUPLING WEIGHTS
            </h4>
            <span className="text-[11px] text-[#8e9c8c] font-mono">{links.length} Active Edges</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {links.map((link, idx) => {
              const srcNode = nodes.find((n) => n.id === link.source);
              const tgtNode = nodes.find((n) => n.id === link.target);
              return (
                <div key={idx} className="bg-[#18221b] p-3 rounded-lg border border-[#2b392d] text-xs">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-medium text-white font-cinzel">
                      <span className="text-xs">{srcNode?.label || link.source}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c5a66a]" />
                      <span className="text-xs text-[#c5a66a]">{tgtNode?.label || link.target}</span>
                    </div>
                    {getImpactBadge(link.impact)}
                  </div>
                  <p className="text-[#8e9c8c] text-[11px] mb-2 leading-relaxed">{link.description}</p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8fa879] pt-1.5 border-t border-[#2b392d]/50">
                    <span className="text-[#8e9c8c]">Transmission Strength:</span>
                    <span className={link.strength < 0 ? 'text-[#fca5a5] font-bold' : 'text-[#86efac] font-bold'}>
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
