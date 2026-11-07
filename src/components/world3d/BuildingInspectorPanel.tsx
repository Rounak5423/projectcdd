import React, { useState } from 'react';
import {
  X,
  ArrowUpCircle,
  RotateCw,
  Move,
  Trash2,
  AlertTriangle,
  Zap,
  Droplets,
  Users,
  Activity,
  Shield,
  Coins,
  Check,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

export default function BuildingInspectorPanel() {
  const {
    selectedBuilding,
    selectBuilding,
    resources,
    districts,
    upgradeBuilding,
    demolishBuilding,
    rotateBuilding,
    startRelocation,
    repairBuilding,
  } = useGameState();

  const [confirmDemolish, setConfirmDemolish] = useState<boolean>(false);

  if (!selectedBuilding) return null;

  const district = districts.find((d) => d.id === selectedBuilding.districtId);
  const upgradeCost = selectedBuilding.level * 280;
  const canAffordUpgrade =
    resources.materials >= upgradeCost && selectedBuilding.level < selectedBuilding.maxLevel;
  const isMaxLevel = selectedBuilding.level >= selectedBuilding.maxLevel;

  const repairCost = Math.max(15, Math.round((100 - selectedBuilding.health) * 2.5));
  const canAffordRepair = resources.materials >= repairCost && selectedBuilding.health < 100;

  // Category styling
  const categoryStyles: Record<string, { label: string; bg: string; text: string; border: string }> = {
    residential: { label: 'Residential Sector', bg: 'bg-[#1b2b3a]', text: 'text-[#82a6bd]', border: 'border-[#30485d]' },
    commercial: { label: 'Commercial Exchange', bg: 'bg-[#332a19]', text: 'text-[#c6a76a]', border: 'border-[#59492a]' },
    healthcare: { label: 'Healthcare & Longevity', bg: 'bg-[#331c1c]', text: 'text-[#e57373]', border: 'border-[#5a2e2e]' },
    education: { label: 'Academic & Science', bg: 'bg-[#291e36]', text: 'text-[#ba68c8]', border: 'border-[#493460]' },
    industrial: { label: 'Heavy Manufacturing', bg: 'bg-[#332317]', text: 'text-[#ffb74d]', border: 'border-[#5c3e29]' },
    infrastructure: { label: 'Civil Infrastructure', bg: 'bg-[#1e2a22]', text: 'text-[#a6bd82]', border: 'border-[#35483a]' },
    environment: { label: 'Ecology & Biosphere', bg: 'bg-[#16291a]', text: 'text-[#81c784]', border: 'border-[#2d4d33]' },
    energy: { label: 'Energy Generation', bg: 'bg-[#332b17]', text: 'text-[#ffd54f]', border: 'border-[#5c4d29]' },
    agriculture: { label: 'Agricultural Biomass', bg: 'bg-[#1e2a1b]', text: 'text-[#aed581]', border: 'border-[#384e32]' },
    government: { label: 'Civic Governance', bg: 'bg-[#2b2416]', text: 'text-[#e0be70]', border: 'border-[#544529]' },
  };

  const style = categoryStyles[selectedBuilding.category] || categoryStyles.infrastructure;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-20 right-4 z-30 w-[360px] max-w-[calc(100vw-2rem)] bg-[#161c17]/96 border-2 border-[#3c4a3d] hover:border-[#526654] rounded-2xl shadow-2xl backdrop-blur-2xl text-[#e8e9e3] flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* 1. HEADER & IDENTITY */}
      <div className="p-4 border-b border-[#2d382f] bg-[#1a221c]/90 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold border ${style.bg} ${style.text} ${style.border}`}
            >
              {style.label}
            </span>
            <span className="text-[10px] font-mono text-[#8f9d8d]">
              {district ? district.name : 'Sector Core'}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#f5f7f2] mt-1 truncate">
            {selectedBuilding.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {/* Level Stars */}
            <div className="flex items-center gap-1">
              {Array.from({ length: selectedBuilding.maxLevel }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < selectedBuilding.level ? 'bg-[#c6a76a] shadow-sm' : 'bg-[#2d382e]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-[#c6a76a]">
              Level {selectedBuilding.level} of {selectedBuilding.maxLevel}
            </span>
          </div>
        </div>

        <button
          onClick={() => selectBuilding(null)}
          className="p-1.5 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#253227] transition-colors"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. VITALS & OPERATIONAL STATUS */}
      <div className="p-4 space-y-3">
        {/* Health & Efficiency Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {/* Structural Integrity */}
          <div className="p-2.5 rounded-xl bg-[#121713] border border-[#263528] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-[#8e9c8c]">
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-[#81c784]" /> INTEGRITY
              </span>
              <span className="font-bold text-[#f0f3eb]">{selectedBuilding.health}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#202921] rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 ${
                  selectedBuilding.health > 70
                    ? 'bg-[#2ecc71]'
                    : selectedBuilding.health > 35
                    ? 'bg-[#f39c12]'
                    : 'bg-[#e74c3c]'
                }`}
                style={{ width: `${selectedBuilding.health}%` }}
              />
            </div>
            {selectedBuilding.health < 100 && (
              <button
                disabled={!canAffordRepair}
                onClick={() => repairBuilding(selectedBuilding.id)}
                className={`mt-2 py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition-colors ${
                  canAffordRepair
                    ? 'bg-[#293d2b] hover:bg-[#354f38] text-[#a6bd82] border-[#446648]'
                    : 'bg-[#1b221c] text-[#556354] border-[#29352a] cursor-not-allowed'
                }`}
              >
                <Wrench size={10} /> Repair ({repairCost} Mat.)
              </button>
            )}
          </div>

          {/* Operational Efficiency */}
          <div className="p-2.5 rounded-xl bg-[#121713] border border-[#263528] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-[#8e9c8c]">
              <span className="flex items-center gap-1">
                <Activity size={12} className="text-[#c6a76a]" /> EFFICIENCY
              </span>
              <span className="font-bold text-[#c6a76a]">{selectedBuilding.efficiency}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#202921] rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#c6a76a] transition-all duration-300"
                style={{ width: `${selectedBuilding.efficiency}%` }}
              />
            </div>
            <span className="text-[9px] text-[#8e9c8c] mt-2 block">
              Status: <span className="text-[#a6bd82] font-semibold uppercase">{selectedBuilding.status}</span>
            </span>
          </div>
        </div>

        {/* Workforce & Resource Telemetry */}
        <div className="p-2.5 rounded-xl bg-[#121713] border border-[#263528] grid grid-cols-3 gap-2 text-center font-mono">
          <div>
            <span className="text-[9px] text-[#8e9c8c] flex items-center justify-center gap-1">
              <Users size={11} className="text-[#82a6bd]" /> WORKERS
            </span>
            <span className="text-xs font-bold text-[#f0f3eb] mt-0.5 block">
              {selectedBuilding.workersAssigned} / {selectedBuilding.workersNeeded}
            </span>
          </div>

          <div>
            <span className="text-[9px] text-[#8e9c8c] flex items-center justify-center gap-1">
              <Zap size={11} className="text-[#ffb74d]" /> GRID LOAD
            </span>
            <span className="text-xs font-bold text-[#f0f3eb] mt-0.5 block">
              {selectedBuilding.category === 'energy' ? '+320 MW' : '-45 MW'}
            </span>
          </div>

          <div>
            <span className="text-[9px] text-[#8e9c8c] flex items-center justify-center gap-1">
              <Coins size={11} className="text-[#e0be70]" /> UPKEEP
            </span>
            <span className="text-xs font-bold text-[#f0f3eb] mt-0.5 block">
              28 GRC/yr
            </span>
          </div>
        </div>

        {/* World Location Coordinates */}
        <div className="px-3 py-1.5 rounded-lg bg-[#141b16] border border-[#243026] flex items-center justify-between text-[10px] font-mono text-[#8e9c8c]">
          <span>GRID COORDINATES:</span>
          <span className="text-[#a6bd82] font-semibold">
            X: {selectedBuilding.x.toFixed(1)}m · Z: {selectedBuilding.z.toFixed(1)}m · Y: {selectedBuilding.y.toFixed(1)}m
          </span>
        </div>
      </div>

      {/* 3. CONTEXTUAL MANAGEMENT ACTIONS */}
      <div className="p-4 pt-1 border-t border-[#2d382f] bg-[#18201a]/90 space-y-2">
        {/* Upgrade Facility Action */}
        <button
          disabled={!canAffordUpgrade}
          onClick={() => upgradeBuilding(selectedBuilding.id)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
            isMaxLevel
              ? 'bg-[#1b251d] text-[#6e7d6d] border border-[#2a382c] cursor-not-allowed'
              : canAffordUpgrade
              ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#e3f2dc] border border-[#5d7756] shadow-lg cursor-pointer'
              : 'bg-[#202921] text-[#707c6f] border border-[#2d3a2e] cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={16} className={canAffordUpgrade ? 'text-[#a6bd82]' : ''} />
            <span>{isMaxLevel ? 'MAXIMUM TECH LEVEL REACHED' : `UPGRADE FACILITY (LVL ${selectedBuilding.level + 1})`}</span>
          </div>
          {!isMaxLevel && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162017] border border-[#2b3a2d]">
              {upgradeCost} Mat.
            </span>
          )}
        </button>

        {/* Secondary Actions Row: Rotate & Relocate */}
        <div className="grid grid-cols-2 gap-2">
          {/* Rotate 45° */}
          <button
            onClick={() => rotateBuilding(selectedBuilding.id, Math.PI / 4)}
            className="py-2 px-3 rounded-xl bg-[#202921] hover:bg-[#2e3b2f] text-[#dce9ca] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#334235] transition-colors cursor-pointer"
            title="Rotate structure in place by 45 degrees"
          >
            <RotateCw size={14} className="text-[#a6bd82]" />
            <span>Rotate 45°</span>
          </button>

          {/* Relocate Facility */}
          <button
            onClick={() => startRelocation(selectedBuilding.id)}
            className="py-2 px-3 rounded-xl bg-[#202921] hover:bg-[#2e3b2f] text-[#dce9ca] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#334235] transition-colors cursor-pointer"
            title="Move this facility to a new validated terrain site"
          >
            <Move size={14} className="text-[#c6a76a]" />
            <span>Relocate</span>
          </button>
        </div>

        {/* Demolish Action with Modal Confirmation */}
        {!confirmDemolish ? (
          <button
            onClick={() => setConfirmDemolish(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-[#241715] hover:bg-[#38211e] text-[#d47e69] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#4a2a24] transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Demolish Structure</span>
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-[#2b1715] border border-[#6b2f27] space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f5b7b1]">
              <AlertTriangle size={15} className="text-[#e74c3c]" />
              <span>Confirm Demolition?</span>
            </div>
            <p className="text-[11px] text-[#fcdad7] leading-relaxed">
              Decommissioning this structure will permanently dismantle it and refund{' '}
              <strong className="text-white">150 materials</strong>.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setConfirmDemolish(false)}
                className="py-1 px-2 rounded-lg bg-[#202821] hover:bg-[#2d382e] text-xs text-[#dce9ca] font-semibold border border-[#39483a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  demolishBuilding(selectedBuilding.id);
                  setConfirmDemolish(false);
                }}
                className="py-1 px-2 rounded-lg bg-[#c0392b] hover:bg-[#e74c3c] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Demolish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

