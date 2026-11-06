import React, { useState } from 'react';
import {
  Building2,
  Hammer,
  Zap,
  Droplets,
  Users,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  MapPin,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { BuildingCategory, BuildingCatalogItem, PlacedBuilding } from '../types/game';

const categories: { id: BuildingCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Architectures' },
  { id: 'residential', label: 'Residential' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'energy', label: 'Energy' },
  { id: 'research', label: 'Research' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'government', label: 'Government' },
  { id: 'environment', label: 'Environment' },
];

export default function InfrastructurePage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const {
    catalog,
    placedBuildings,
    resources,
    districts,
    setConstructionMode,
    placeBuilding,
    upgradeBuilding,
    demolishBuilding,
    selectBuilding,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'catalog' | 'active'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<BuildingCatalogItem | null>(null);
  const [targetDistrictId, setTargetDistrictId] = useState<string>('dist-citadel');

  const filteredCatalog = catalog.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPlaced = placedBuildings.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConfirmDirectConstruction = () => {
    if (!selectedCatalogItem) return;
    const dist = districts.find((d) => d.id === targetDistrictId);
    const offsetX = (Math.random() - 0.5) * (dist ? dist.radius * 0.8 : 10);
    const offsetZ = (Math.random() - 0.5) * (dist ? dist.radius * 0.8 : 10);
    const targetX = (dist ? dist.x : 0) + offsetX;
    const targetZ = (dist ? dist.z : 0) + offsetZ;

    placeBuilding(selectedCatalogItem.id, targetX, targetZ, targetDistrictId);
    setSelectedCatalogItem(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#ede8dc] max-w-7xl mx-auto">
      {/* Header & Infrastructure Network Vitals */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#252f36] gap-4">
        <div>
          <span className="eyebrow text-[#c29b38]">CIVILISATIONAL WORKS & URBAN MATRIX</span>
          <h1 className="text-2xl font-bold text-[#ede8dc] mt-0.5">Construction & Infrastructure</h1>
          <p className="text-xs text-[#8a8376] mt-1">
            Manage heavy civil assets, power grids, arcologies, and deploy new technological structures across 10 architectural disciplines.
          </p>
        </div>

        {/* Global Grid Metrics */}
        <div className="flex items-center gap-4 bg-[#161c20] p-3 rounded-lg border border-[#2b353b] text-xs font-mono">
          <div>
            <span className="text-[#8a8376] block text-[10px]">POWER GRID</span>
            <span className="text-[#dfb74a] font-bold">11,200 MW (+85)</span>
          </div>
          <div className="w-px h-6 bg-[#252f36]" />
          <div>
            <span className="text-[#8a8376] block text-[10px]">FACILITIES</span>
            <span className="text-[#ede8dc] font-bold">{placedBuildings.length} Operational</span>
          </div>
          <div className="w-px h-6 bg-[#252f36]" />
          <div>
            <span className="text-[#8a8376] block text-[10px]">GRID STABILITY</span>
            <span className="text-[#7ea376] font-bold">98.4%</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center bg-[#101416] p-1 rounded-lg border border-[#232b30]">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'catalog'
                ? 'bg-[#252f36] text-[#ffffff] font-bold border border-[#3b4952] shadow-xs'
                : 'text-[#8a8376] hover:text-[#ede8dc]'
            }`}
          >
            <Hammer size={14} className="text-[#c29b38]" />
            Architectural Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'active'
                ? 'bg-[#252f36] text-[#ffffff] font-bold border border-[#3b4952] shadow-xs'
                : 'text-[#8a8376] hover:text-[#ede8dc]'
            }`}
          >
            <Building2 size={14} className="text-[#7ea376]" />
            Commissioned Facilities ({placedBuildings.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8376]" />
          <input
            type="text"
            placeholder="Search architectures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#101416] border border-[#252f36] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#ede8dc] placeholder-[#8a8376] outline-none focus:border-[#445663]"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[#29353e] text-[#ffffff] border border-[#445663] font-semibold'
                : 'bg-[#161c20] text-[#8a8376] hover:bg-[#1e252a] hover:text-[#ede8dc]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ARCHITECTURAL CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCatalog.map((item) => {
            const canAfford = resources.materials >= item.costMaterials;

            return (
              <div
                key={item.id}
                className="panel p-5 bg-[#161c20] border-[#2b353b] flex flex-col justify-between hover:border-[#8f7742] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#7ea376] font-semibold">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-[#ede8dc] mt-0.5">{item.name}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#c29b38] px-2 py-0.5 rounded bg-[#221f15] border border-[#4d3f1d]">
                      Lvl {item.minTechLevel}+
                    </span>
                  </div>

                  <p className="text-xs text-[#8a8376] mt-2 leading-relaxed">{item.description}</p>

                  {/* Spec Sheet */}
                  <div className="mt-4 pt-3 border-t border-[#232b30] grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-[#101416] border border-[#232b30]">
                      <span className="text-[#8e9b8b] text-[10px] block">MATERIAL COST</span>
                      <span className="font-bold text-[#c6a76a]">{item.costMaterials} Units</span>
                    </div>
                    <div className="p-2 rounded bg-[#131914] border border-[#242f25]">
                      <span className="text-[#8e9b8b] text-[10px] block">ENERGY IMPACT</span>
                      <span className="font-bold text-[#e5c97b]">
                        {item.energyReq > 0 ? `-${item.energyReq} MW` : `+${Math.abs(item.energyReq)} MW`}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#131914] border border-[#242f25]">
                      <span className="text-[#8e9b8b] text-[10px] block">CREW REQ.</span>
                      <span className="font-bold text-[#f0f3eb]">{item.workerReq} Specialists</span>
                    </div>
                    <div className="p-2 rounded bg-[#131914] border border-[#242f25]">
                      <span className="text-[#8e9b8b] text-[10px] block">CONSTRUCT TIME</span>
                      <span className="font-bold text-[#82a6bd]">{item.constructionDurationDays} Days</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#29342a] flex items-center justify-between">
                  <span className="text-xs text-[#9da99b]">
                    Maint: <span className="font-mono text-[#f3f5ef]">{item.maintenanceCost}/d</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedCatalogItem(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#263327] hover:bg-[#324434] text-[#dce9ca] border border-[#445b46]"
                    >
                      Commission
                    </button>
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        setConstructionMode(true, item);
                        onNavigate('World Explorer');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        canAfford
                          ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5d7756] shadow-md'
                          : 'bg-[#212721] text-[#697268] border border-[#2f3830] cursor-not-allowed'
                      }`}
                    >
                      <Hammer size={13} />
                      <span>Place in 3D</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ACTIVE COMMISSIONED FACILITIES */}
      {activeTab === 'active' && (
        <div className="panel overflow-hidden bg-[#182119] border-[#313f32]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141a15] border-b border-[#2d3a2e] text-[#9da99b] font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-4">Facility Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Efficiency</th>
                  <th className="p-4">Workforce</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263127]">
                {filteredPlaced.map((b) => (
                  <tr key={b.id} className="hover:bg-[#1e271f] transition-colors">
                    <td className="p-4 font-semibold text-[#f0f3eb] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#a6bd82]" />
                      <span>{b.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-[#232c24] text-[#a6bd82] border border-[#394a3a]">
                        {b.category}
                      </span>
                    </td>
                    <td className="p-4 text-[#c4cebf]">{b.districtId}</td>
                    <td className="p-4 font-mono font-bold text-[#c6a76a]">Lvl {b.level}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#131914] overflow-hidden">
                          <div
                            className="h-full bg-[#a6bd82] rounded-full"
                            style={{ width: `${b.efficiency}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px]">{b.efficiency}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      {b.workersAssigned} / {b.workersNeeded}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          selectBuilding(b.id);
                          onNavigate('World Explorer');
                        }}
                        className="px-2.5 py-1 rounded bg-[#273428] hover:bg-[#344435] text-[#dce9ca] text-[11px] font-medium border border-[#445b46]"
                      >
                        Inspect 3D
                      </button>
                      <button
                        disabled={b.level >= b.maxLevel || resources.materials < b.level * 280}
                        onClick={() => upgradeBuilding(b.id)}
                        className="px-2.5 py-1 rounded bg-[#354332] hover:bg-[#475b43] text-[#c6a76a] text-[11px] font-medium border border-[#52634d] disabled:opacity-40"
                      >
                        Upgrade
                      </button>
                      <button
                        onClick={() => demolishBuilding(b.id)}
                        className="p-1 rounded text-[#d47e69] hover:bg-[#382320] transition-colors"
                        title="Demolish Facility"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONSTRUCTION CONFIRMATION MODAL */}
      {selectedCatalogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#19221a] border border-[#39443a] rounded-xl shadow-2xl p-6 text-[#e8e9e3]">
            <div className="flex items-start justify-between pb-3 border-b border-[#2d3a2e]">
              <div>
                <span className="text-[10px] font-mono text-[#c6a76a] font-bold uppercase">
                  CONSTRUCTION AUTHORIZATION ORDER
                </span>
                <h3 className="text-lg font-bold text-[#f3f5ef] mt-0.5">
                  {selectedCatalogItem.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCatalogItem(null)}
                className="p-1 rounded text-[#9da99b] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <p className="text-xs text-[#adb8a9] leading-relaxed">
                {selectedCatalogItem.description}
              </p>

              {/* District Allocation Selector */}
              <div>
                <label className="text-[10px] font-mono text-[#9da99b] uppercase block mb-1">
                  Target Municipal District
                </label>
                <select
                  value={targetDistrictId}
                  onChange={(e) => setTargetDistrictId(e.target.value)}
                  className="w-full bg-[#131914] border border-[#2b392d] rounded-lg px-3 py-2 text-xs text-[#f3f5ee] outline-none"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Requirements Breakdown */}
              <div className="p-3.5 rounded-lg bg-[#131914] border border-[#253026] space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#9da99b]">Structural Materials Required:</span>
                  <span className="text-[#c6a76a] font-bold">
                    {selectedCatalogItem.costMaterials} Units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9da99b]">Energy Grid Impact:</span>
                  <span className="text-[#e5c97b]">
                    {selectedCatalogItem.energyReq > 0
                      ? `-${selectedCatalogItem.energyReq} MW`
                      : `+${Math.abs(selectedCatalogItem.energyReq)} MW`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9da99b]">Workforce Quota:</span>
                  <span className="text-[#f0f3eb]">{selectedCatalogItem.workerReq} Specialists</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2d3a2e] flex items-center justify-between">
              <button
                onClick={() => {
                  setConstructionMode(true, selectedCatalogItem);
                  setSelectedCatalogItem(null);
                  onNavigate('World Explorer');
                }}
                className="text-xs text-[#a6bd82] hover:underline flex items-center gap-1"
              >
                <MapPin size={13} /> Switch to Manual 3D Terrain Placement
              </button>

              <button
                disabled={resources.materials < selectedCatalogItem.costMaterials}
                onClick={handleConfirmDirectConstruction}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] border border-[#6b8563] shadow-md"
              >
                Ratify & Construct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
