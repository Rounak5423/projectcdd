import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Droplets,
  CloudLightning,
  Activity,
  Sun,
  Shield,
  ShieldAlert,
  Users,
  Ambulance,
  Wrench,
  LifeBuoy,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Sliders,
  DollarSign,
  HeartPulse,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import {
  DisasterType,
  DisasterIntensity,
} from '../../types/disaster';

interface DisasterDashboardProps {
  onClose?: () => void;
}

export default function DisasterManagementDashboard({ onClose }: DisasterDashboardProps) {
  const {
    disasterState,
    triggerDisaster,
    dispatchEmergencyResponse,
    restoreAllDisasters,
    toggleAutoDisasters,
    districts,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'overview' | 'emergency' | 'controls'>('overview');

  // Manual Trigger Form States
  const [selectedType, setSelectedType] = useState<DisasterType>('wildfire');
  const [selectedIntensity, setSelectedIntensity] = useState<DisasterIntensity>('medium');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('dist-residential');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const activeDisaster = disasterState.activeDisaster;
  const risks = disasterState.risks;
  const forces = disasterState.emergencyForces;
  const settings = disasterState.settings;

  const handleConfirmTrigger = () => {
    triggerDisaster(selectedType, selectedIntensity, selectedDistrict);
    setShowConfirmModal(false);
    setActiveTab('overview');
  };

  const disasterIcons: Record<DisasterType, React.ElementType> = {
    flood: Droplets,
    wildfire: Flame,
    drought: Sun,
    storm: CloudLightning,
    earthquake: Activity,
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-4xl bg-[#131914]/98 border-2 border-[#364438] rounded-2xl shadow-2xl backdrop-blur-2xl text-[#e8e9e3] flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ================= 1. HEADER ================= */}
      <div className="p-4 sm:p-5 border-b border-[#2b372d] bg-[#18211a]/95 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2a1717] border border-[#4d2828] text-[#e74c3c]">
            <ShieldAlert size={22} className="text-[#e74c3c]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#e74c3c] uppercase font-bold">
                CIVIL DEFENSE & EMERGENCY CORPS
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  activeDisaster
                    ? 'bg-[#3b1717] text-[#e74c3c] border border-[#6b2626] animate-pulse'
                    : 'bg-[#1b3823] text-[#2ecc71] border border-[#2b5936]'
                }`}
              >
                {activeDisaster ? `Disaster: ${activeDisaster.stage}` : 'Status: Secure'}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#f3f5ef] tracking-tight">
              Natural Disasters & Emergency Response
            </h2>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141b15] border border-[#2d3a2f]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'emergency'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Emergency Corps
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'controls'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Disaster Controls
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-[#8e9c8c] hover:text-[#e8e9e3] hover:bg-[#202921] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. BODY CONTENT ================= */}
      <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
        {/* ACTIVE DISASTER HERO BANNER (IF ACTIVE) */}
        {activeDisaster ? (
          <div className="p-4 rounded-xl bg-[#281515] border-2 border-[#7a2a2a] shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#4d2222]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#3d1818] border border-[#6b2222]">
                  {React.createElement(disasterIcons[activeDisaster.type], {
                    size: 24,
                    className: 'text-[#ff5252] animate-pulse',
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#ff8080] tracking-wide uppercase">
                      {activeDisaster.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4d1f1f] text-[#ffb3b3] font-bold uppercase">
                      {activeDisaster.intensity} Intensity
                    </span>
                  </div>
                  <span className="text-xs text-[#d19c9c] block mt-0.5">
                    District: {districts.find((d) => d.id === activeDisaster.districtId)?.name || 'Central Corridor'} · Radius: {activeDisaster.radius}m
                  </span>
                </div>
              </div>

              {/* Immediate Containment Action Button */}
              <button
                onClick={dispatchEmergencyResponse}
                className="px-3.5 py-2 rounded-lg bg-[#27ae60] hover:bg-[#2ecc71] text-white font-mono text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LifeBuoy size={14} />
                <span>RUSH EMERGENCY CONTAINMENT</span>
              </button>
            </div>

            {/* Containment & Impact Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#1c1212] border border-[#3b1d1d]">
                <span className="text-[9px] text-[#b38585] block">CONTAINMENT STATUS</span>
                <span className="font-bold text-[#2ecc71]">{activeDisaster.containmentPercent}%</span>
                <div className="w-full h-1.5 bg-[#2d1b1b] rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#2ecc71] transition-all duration-300"
                    style={{ width: `${activeDisaster.containmentPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-2 rounded bg-[#1c1212] border border-[#3b1d1d]">
                <span className="text-[9px] text-[#b38585] block">DISPLACED RESIDENTS</span>
                <span className="font-bold text-[#f1c40f]">
                  {activeDisaster.displacedPopulation.toLocaleString()}
                </span>
                <span className="text-[9px] text-[#9c8282] block mt-1">
                  Sheltered: {activeDisaster.shelteredPopulation.toLocaleString()}
                </span>
              </div>

              <div className="p-2 rounded bg-[#1c1212] border border-[#3b1d1d]">
                <span className="text-[9px] text-[#b38585] block">STRUCTURES AFFECTED</span>
                <span className="font-bold text-[#ff6b6b]">
                  {activeDisaster.affectedBuildingIds.length} Buildings
                </span>
                <span className="text-[9px] text-[#9c8282] block mt-1">Integrity Impacted</span>
              </div>

              <div className="p-2 rounded bg-[#1c1212] border border-[#3b1d1d]">
                <span className="text-[9px] text-[#b38585] block">ESTIMATED LOSSES</span>
                <span className="font-bold text-[#e74c3c]">
                  -{activeDisaster.economicDamageCredits} Cr
                </span>
                <span className="text-[9px] text-[#9c8282] block mt-1">
                  Rebuild: ~{activeDisaster.estimatedRepairCost} Cr
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* NO DISASTER ACTIVE - STABLE BANNER */
          <div className="p-4 rounded-xl bg-[#19231c] border border-[#2b3c2e] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-[#2ecc71]" />
              <div>
                <span className="font-bold text-sm text-[#f3f5ef] block">
                  Civilian Protection Grid: All Districts Secure
                </span>
                <span className="text-xs text-[#8f9d8d]">
                  No active natural disasters detected. Emergency response corps on alert.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8f9d8d]">THREAT LEVEL:</span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  risks.overallThreatLevel === 'Severe'
                    ? 'bg-[#3d1a1a] text-[#e74c3c]'
                    : risks.overallThreatLevel === 'High'
                    ? 'bg-[#3b2717] text-[#f39c12]'
                    : risks.overallThreatLevel === 'Elevated'
                    ? 'bg-[#332b17] text-[#f1c40f]'
                    : 'bg-[#1b3823] text-[#2ecc71]'
                }`}
              >
                {risks.overallThreatLevel}
              </span>
            </div>
          </div>
        )}

        {/* ================= TAB 1: OVERVIEW & RISKS ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 5 Environmental Risk Gauges */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
              <span className="text-xs font-mono font-bold text-[#a6bd82] uppercase block mb-3">
                INTELLIGENT HAZARD RISK RADAR (SIMULATION-DRIVEN)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Flood Risk */}
                <div className="p-3 rounded-lg bg-[#131914] border border-[#243026]">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="flex items-center gap-1.5 text-[#3498db]">
                      <Droplets size={14} /> Fluvial Flood Risk
                    </span>
                    <span className="font-bold text-[#f3f5ef]">{risks.floodRiskPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b231d] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        risks.floodRiskPercent > 70 ? 'bg-[#e74c3c]' : risks.floodRiskPercent > 40 ? 'bg-[#f1c40f]' : 'bg-[#3498db]'
                      }`}
                      style={{ width: `${risks.floodRiskPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8f9d8d] mt-1 block">
                    Influenced by rainfall, riverbank proximity & reservoir stress
                  </span>
                </div>

                {/* 2. Wildfire Risk */}
                <div className="p-3 rounded-lg bg-[#131914] border border-[#243026]">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="flex items-center gap-1.5 text-[#e67e22]">
                      <Flame size={14} /> Wildfire Risk
                    </span>
                    <span className="font-bold text-[#f3f5ef]">{risks.wildfireRiskPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b231d] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        risks.wildfireRiskPercent > 70 ? 'bg-[#e74c3c]' : risks.wildfireRiskPercent > 40 ? 'bg-[#f1c40f]' : 'bg-[#e67e22]'
                      }`}
                      style={{ width: `${risks.wildfireRiskPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8f9d8d] mt-1 block">
                    Influenced by peak diurnal heat, clear weather & dry vegetation
                  </span>
                </div>

                {/* 3. Drought Risk */}
                <div className="p-3 rounded-lg bg-[#131914] border border-[#243026]">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="flex items-center gap-1.5 text-[#f1c40f]">
                      <Sun size={14} /> Aquifer Drought Risk
                    </span>
                    <span className="font-bold text-[#f3f5ef]">{risks.droughtRiskPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b231d] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        risks.droughtRiskPercent > 70 ? 'bg-[#e74c3c]' : risks.droughtRiskPercent > 40 ? 'bg-[#f1c40f]' : 'bg-[#f39c12]'
                      }`}
                      style={{ width: `${risks.droughtRiskPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8f9d8d] mt-1 block">
                    Influenced by municipal water deficit & reservoir depletion
                  </span>
                </div>

                {/* 4. Severe Storm Risk */}
                <div className="p-3 rounded-lg bg-[#131914] border border-[#243026]">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="flex items-center gap-1.5 text-[#9b59b6]">
                      <CloudLightning size={14} /> Supercell Storm Risk
                    </span>
                    <span className="font-bold text-[#f3f5ef]">{risks.stormRiskPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b231d] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        risks.stormRiskPercent > 70 ? 'bg-[#e74c3c]' : risks.stormRiskPercent > 40 ? 'bg-[#f1c40f]' : 'bg-[#9b59b6]'
                      }`}
                      style={{ width: `${risks.stormRiskPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8f9d8d] mt-1 block">
                    Influenced by overcast cloud density & atmospheric barometric shift
                  </span>
                </div>

                {/* 5. Seismic Fault Risk */}
                <div className="p-3 rounded-lg bg-[#131914] border border-[#243026] sm:col-span-2">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="flex items-center gap-1.5 text-[#e74c3c]">
                      <Activity size={14} /> Tectonic Seismic Risk
                    </span>
                    <span className="font-bold text-[#f3f5ef]">{risks.seismicRiskPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b231d] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        risks.seismicRiskPercent > 70 ? 'bg-[#e74c3c]' : risks.seismicRiskPercent > 40 ? 'bg-[#f1c40f]' : 'bg-[#e74c3c]'
                      }`}
                      style={{ width: `${risks.seismicRiskPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8f9d8d] mt-1 block">
                    Influenced by structural load from high-rise arcologies & subterranean tectonic tension
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: EMERGENCY CORPS ================= */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Medical Response Force */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={16} className="text-[#00e5ff]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">
                      MEDICAL RESPONSE FLEET
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162729] text-[#00e5ff] font-bold">
                    {forces.medicalUnitsTotal} Ambulances
                  </span>
                </div>
                <p className="text-xs text-[#8f9d8d] mt-2">
                  Supported by Oasis Cellular Care Clinic. Treats injured citizens and stabilizes public health.
                </p>
              </div>

              {/* Fire & Rescue Force */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-[#f39c12]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">
                      FIRE SUPPRESSION CREWS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2b2114] text-[#f39c12] font-bold">
                    {forces.fireCrewsTotal} Suppression Units
                  </span>
                </div>
                <p className="text-xs text-[#8f9d8d] mt-2">
                  Mobilized from industrial basin infrastructure to extinguish wildfires and structural fires.
                </p>
              </div>

              {/* Civil Rescue & Evacuation Teams */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#a6bd82]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">
                      CIVIL RESCUE & EVACUATION
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2a20] text-[#a6bd82] font-bold">
                    {forces.rescueTeamsTotal} Tactical Teams
                  </span>
                </div>
                <p className="text-xs text-[#8f9d8d] mt-2">
                  Coordinates orderly citizen evacuation into high-integrity shelters (Citadel & Arcologies).
                </p>
              </div>

              {/* Engineering Repair Battalions */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-[#e67e22]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">
                      INFRASTRUCTURE REPAIR CORPS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a1e16] text-[#e67e22] font-bold">
                    {forces.repairEngineersTotal} Engineer Battalions
                  </span>
                </div>
                <p className="text-xs text-[#8f9d8d] mt-2">
                  Foundry structural units mobilized to repair damaged roads, bridges, and building frameworks.
                </p>
              </div>
            </div>

            {/* Emergency Shelter Capacity */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d] flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#c6a76a] uppercase block">
                  EMERGENCY SHELTER CAPABILITY
                </span>
                <span className="text-xs text-[#8f9d8d]">
                  Hardened subterranean basements in Elysium Citadel and Arcology Spires.
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-mono font-bold text-[#f3f5ef]">
                  {forces.shelterCapacityTotal.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono text-[#8f9d8d] block">Citizen Capacity</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CONTROLS & MANUAL SIMULATION ================= */}
        {activeTab === 'controls' && (
          <div className="space-y-4">
            {/* Automatic Disasters Setting */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d] flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#f3f5ef] block">
                  AUTOMATIC DISASTER SIMULATION
                </span>
                <span className="text-xs text-[#8f9d8d]">
                  Allows spontaneous natural events to emerge naturally based on environmental risk.
                </span>
              </div>
              <button
                onClick={toggleAutoDisasters}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                  settings.autoDisastersEnabled
                    ? 'bg-[#27ae60] text-white border-[#2ecc71]'
                    : 'bg-[#222c24] text-[#8f9d8d] border-[#374939]'
                }`}
              >
                {settings.autoDisastersEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Manual Disaster Trigger Console */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d] space-y-3">
              <span className="text-xs font-mono font-bold text-[#c6a76a] uppercase block">
                MANUAL DISASTER TRIGGER CONSOLE (FOR CONTROLLED DRILLS)
              </span>

              {/* Disaster Type Picker */}
              <div>
                <span className="text-[10px] font-mono text-[#8f9d8d] block mb-1">SELECT PHENOMENON TYPE:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(['flood', 'wildfire', 'drought', 'storm', 'earthquake'] as DisasterType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`p-2 rounded-lg border text-xs font-mono font-bold capitalize flex items-center justify-center gap-1.5 transition-all ${
                        selectedType === t
                          ? 'bg-[#3b2323] border-[#8a3333] text-[#ff7676]'
                          : 'bg-[#141b16] border-[#29352a] text-[#8f9d8d] hover:bg-[#1e2720]'
                      }`}
                    >
                      {React.createElement(disasterIcons[t], { size: 13 })}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Picker */}
              <div>
                <span className="text-[10px] font-mono text-[#8f9d8d] block mb-1">SELECT INTENSITY:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['low', 'medium', 'high', 'critical'] as DisasterIntensity[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedIntensity(lvl)}
                      className={`p-2 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
                        selectedIntensity === lvl
                          ? 'bg-[#3b271b] border-[#8a5229] text-[#f39c12]'
                          : 'bg-[#141b16] border-[#29352a] text-[#8f9d8d] hover:bg-[#1e2720]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* District Picker */}
              <div>
                <span className="text-[10px] font-mono text-[#8f9d8d] block mb-1">TARGET EPICENTER DISTRICT:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#141b16] border border-[#2d3a2f] text-xs font-mono text-[#f3f5ef]"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex-1 w-full py-2.5 px-4 rounded-xl bg-[#a93226] hover:bg-[#c0392b] text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle size={15} />
                  <span>TRIGGER DISASTER PHENOMENON</span>
                </button>

                <button
                  onClick={restoreAllDisasters}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-[#1b3823] hover:bg-[#255232] text-[#2ecc71] border border-[#2b5936] font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Restores all buildings to 100% integrity and clears active hazards"
                >
                  <RotateCcw size={14} />
                  <span>EMERGENCY RESTORE ALL</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= CONFIRMATION MODAL ================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#191e1a] border-2 border-[#7a2c2c] rounded-2xl p-5 space-y-4 shadow-2xl text-[#e8e9e3]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#3d1818] text-[#e74c3c]">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#f5f7f2]">Confirm Disaster Drill Trigger</h3>
                <span className="text-xs text-[#8f9d8d]">Destructive physical simulation warning</span>
              </div>
            </div>

            <p className="text-xs text-[#cdd8cc] leading-relaxed">
              Are you sure you want to trigger a{' '}
              <strong className="text-[#ff7676] uppercase font-mono">
                {selectedIntensity} {selectedType}
              </strong>{' '}
              in{' '}
              <strong className="text-[#c6a76a]">
                {districts.find((d) => d.id === selectedDistrict)?.name}
              </strong>
              ? Real structural damage will be inflicted on buildings within the disaster radius.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e3b30]">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono font-medium text-[#8f9d8d] hover:bg-[#253227] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTrigger}
                className="px-4 py-2 rounded-lg bg-[#c0392b] hover:bg-[#d94436] text-white text-xs font-mono font-bold transition-colors shadow-lg"
              >
                Confirm & Trigger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

