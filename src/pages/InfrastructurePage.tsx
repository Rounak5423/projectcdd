import React, { useState, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import { buildingCatalog } from '../data/initialGameData';
import { BuildingCatalogItem, BuildingCategory, PlacedBuilding } from '../types/game';
import { soundFx } from '../services/soundFx';
import {
  Building2,
  Home,
  Wheat,
  ShoppingBag,
  Factory,
  GraduationCap,
  HeartPulse,
  Zap,
  Landmark,
  Leaf,
  Navigation,
  Compass,
  Hammer,
  Clock,
  Users,
  Box,
  Coins,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Wrench,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info,
  X
} from 'lucide-react';

interface InfrastructurePageProps {
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

const CATEGORIES: { id: BuildingCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All Catalogues', icon: Layers },
  { id: 'residential', label: 'Residential', icon: Home },
  { id: 'agriculture', label: 'Agriculture', icon: Wheat },
  { id: 'commercial', label: 'Commercial', icon: ShoppingBag },
  { id: 'industrial', label: 'Industrial', icon: Factory },
  { id: 'research', label: 'Research', icon: Cpu },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { id: 'energy', label: 'Energy Grid', icon: Zap },
  { id: 'government', label: 'Government', icon: Landmark },
  { id: 'environment', label: 'Environment', icon: Leaf },
  { id: 'transportation', label: 'Transportation', icon: Navigation },
];

export const InfrastructurePage: React.FC<InfrastructurePageProps> = ({ onNavigate, onClose }) => {
  const {
    resources,
    placedBuildings,
    setConstructionMode,
    civilization,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'catalog' | 'active_assets'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<BuildingCatalogItem | null>(null);
  const [selectedPlacedBuilding, setSelectedPlacedBuilding] = useState<PlacedBuilding | null>(null);

  // Derived metrics
  const metrics = useMemo(() => {
    const totalPlaced = placedBuildings.length;
    const operational = placedBuildings.filter(b => b.status === 'active').length;
    const underConstruction = placedBuildings.filter(b => b.status === 'constructing').length;
    const damaged = placedBuildings.filter(b => b.status === 'offline').length;

    // Housing capacity
    const totalHousing = 1450000;
    const housingUtilisation = Math.min(100, Math.round((resources.population / totalHousing) * 100));

    return {
      totalPlaced,
      operational,
      underConstruction,
      damaged,
      conditionIndex: totalPlaced > 0 ? Math.round((operational / totalPlaced) * 100) : 98,
      housingUtilisation,
      gridEfficiency: 96,
      transitConnectivity: 88,
    };
  }, [placedBuildings, resources.population]);

  // Filtered catalogue items
  const filteredCatalog = useMemo(() => {
    return buildingCatalog.filter((item: BuildingCatalogItem) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEra = selectedEra === 'all' || (item.minTechLevel <= (selectedEra === 'Settlement' ? 1 : selectedEra === 'Agricultural' ? 2 : selectedEra === 'Industrial' ? 3 : 5));
      return matchCat && matchSearch && matchEra;
    });
  }, [selectedCategory, searchQuery, selectedEra]);

  const handleStartConstruction = (item: BuildingCatalogItem) => {
    soundFx.playClick();
    setConstructionMode(true, item);
    if (onNavigate) {
      onNavigate('World Explorer');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                INFRASTRUCTURE & CONSTRUCTION
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Imperial Works Ministry
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Architectural blueprints, zoning expansion, civic works and resource installations for {civilization.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Catalog / Assets toggle */}
          <div className="flex items-center p-1 bg-[#171D18] border border-[#C5A66A]/30 rounded">
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('catalog'); }}
              className={`px-4 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all ${
                activeTab === 'catalog'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              Building Catalog
            </button>
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('active_assets'); }}
              className={`px-4 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all ${
                activeTab === 'active_assets'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              Active Structures ({placedBuildings.length})
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
              title="Return to World View"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-6 gap-3 px-8 py-3.5 bg-[#17231B]/60 border-b border-[#C5A66A]/15 font-sans">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Total Structures</span>
          <span className="text-lg font-serif font-bold text-[#EAE3D2] mt-0.5">
            {metrics.totalPlaced} <span className="text-xs font-normal text-[#8FA879]">({metrics.operational} Active)</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Structural Integrity</span>
          <span className="text-lg font-serif font-bold text-[#8FA879] mt-0.5">
            {metrics.conditionIndex}% <span className="text-xs text-[#A5AD9D]">Operational</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Housing Utilisation</span>
          <span className="text-lg font-serif font-bold text-[#C5A66A] mt-0.5">
            {metrics.housingUtilisation}% <span className="text-xs text-[#A5AD9D]">Capacity</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Power Grid Status</span>
          <span className="text-lg font-serif font-bold text-[#EAE3D2] mt-0.5">
            {metrics.gridEfficiency}% <span className="text-xs text-[#8FA879]">Stable</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Transit Density</span>
          <span className="text-lg font-serif font-bold text-[#EAE3D2] mt-0.5">
            {metrics.transitConnectivity}% <span className="text-xs text-[#A5AD9D]">Flow</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Under Erection</span>
          <span className="text-lg font-serif font-bold text-[#D6A75E] mt-0.5">
            {metrics.underConstruction} <span className="text-xs text-[#A5AD9D]">Sites</span>
          </span>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === 'catalog' ? (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Category Column */}
          <div className="w-64 flex-shrink-0 border-r border-[#C5A66A]/20 bg-[#171D18]/80 flex flex-col p-4 gap-1 overflow-y-auto">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#C5A66A] px-2 mb-2">
              SECTORS & DOMAINS
            </span>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'all'
                ? buildingCatalog.length
                : buildingCatalog.filter((b: BuildingCatalogItem) => b.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => { soundFx.playClick(); setSelectedCategory(cat.id); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-all text-xs font-sans ${
                    isSelected
                      ? 'bg-[#C5A66A]/15 border border-[#C5A66A]/60 text-[#C5A66A] font-semibold'
                      : 'border border-transparent text-[#A5AD9D] hover:bg-[#202820] hover:text-[#EAE3D2]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-[#C5A66A] text-[#171D18]' : 'bg-[#202820] text-[#A5AD9D]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Catalog Grid View */}
          <div className="flex-1 min-w-0 flex flex-col p-6 overflow-hidden">
            {/* Filter / Search Bar */}
            <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
                <input
                  type="text"
                  placeholder="Search blueprints by name, category, or specifications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#202820] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 focus:outline-none focus:border-[#C5A66A]"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#A5AD9D]">Filter by Era:</span>
                <select
                  value={selectedEra}
                  onChange={e => setSelectedEra(e.target.value)}
                  className="bg-[#202820] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] px-3 py-1.5 focus:outline-none focus:border-[#C5A66A]"
                >
                  <option value="all">All Technological Eras</option>
                  <option value="Settlement">Settlement Age</option>
                  <option value="Agricultural">Agricultural Age</option>
                  <option value="Industrial">Industrial Age</option>
                  <option value="Digital">Digital / Modern</option>
                </select>
              </div>
            </div>

            {/* Grid of Buildings */}
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCatalog.map((item: BuildingCatalogItem) => {
                const canAfford =
                  resources.materials >= item.costMaterials &&
                  resources.grc >= item.costCredits;

                return (
                  <div
                    key={item.id}
                    className="group relative bg-[#202820]/90 border border-[#C5A66A]/25 hover:border-[#C5A66A]/80 rounded p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-[#C5A66A]/5"
                  >
                    <div>
                      {/* Category tag & Min Tech */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#A5AD9D]">
                          Tech Tier {item.minTechLevel}
                        </span>
                      </div>

                      {/* Title & Lore */}
                      <h3 className="font-serif text-lg font-semibold text-[#EAE3D2] group-hover:text-[#C5A66A] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#A5AD9D] font-sans mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Vital Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#C5A66A]/15 text-xs font-sans">
                        <div className="flex items-center gap-1.5 text-[#EAE3D2]">
                          <Box className="w-3.5 h-3.5 text-[#C5A66A]" />
                          <span>Cost: <strong>{item.costMaterials}</strong> Mat</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#EAE3D2]">
                          <Coins className="w-3.5 h-3.5 text-[#C5A66A]" />
                          <span>CRC: <strong>{item.costCredits}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#EAE3D2]">
                          <Zap className="w-3.5 h-3.5 text-[#D6A75E]" />
                          <span>Energy: {item.energyReq > 0 ? `-${item.energyReq}` : `+${Math.abs(item.energyReq)}`} MW</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#EAE3D2]">
                          <Clock className="w-3.5 h-3.5 text-[#A5AD9D]" />
                          <span>Build: {item.constructionDurationDays} Days</span>
                        </div>
                      </div>

                      {/* Production / Population Bonus Pill */}
                      {item.productionAmount > 0 && (
                        <div className="mt-3 px-2 py-1 bg-[#17231B] border border-[#8FA879]/30 rounded text-[11px] text-[#8FA879] flex items-center justify-between">
                          <span>Yield: +{item.productionAmount} {item.productionType || 'Output'} / day</span>
                          <TrendingUp className="w-3 h-3" />
                        </div>
                      )}
                      {item.populationCapacity > 0 && (
                        <div className="mt-3 px-2 py-1 bg-[#17231B] border border-[#C5A66A]/30 rounded text-[11px] text-[#C5A66A] flex items-center justify-between">
                          <span>Shelter: +{item.populationCapacity.toLocaleString()} Citizens</span>
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Action Deck */}
                    <div className="mt-5 pt-3 border-t border-[#C5A66A]/20 flex items-center gap-2">
                      <button
                        onClick={() => { soundFx.playClick(); setDetailItem(item); }}
                        className="px-3 py-1.5 border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/10 rounded text-xs font-serif transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleStartConstruction(item)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-serif font-bold tracking-wider uppercase transition-all shadow ${
                          canAfford
                            ? 'bg-[#C5A66A] text-[#171D18] hover:bg-[#D8CBAA]'
                            : 'bg-[#283228] text-[#A5AD9D] border border-[#C5A66A]/20 hover:border-[#C5A66A]/50'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Deploy Blueprint</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Active Assets & Structures Table */
        <div className="flex-1 min-h-0 p-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg text-[#EAE3D2] tracking-wide">
                INSTALLED CIVIC & INDUSTRIAL ASSETS
              </h2>
              <p className="text-xs text-[#A5AD9D]">
                Operational registry of all standing structures across municipal sectors.
              </p>
            </div>
            <div className="text-xs font-mono text-[#C5A66A]">
              Total Operational Units: {placedBuildings.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border border-[#C5A66A]/20 rounded bg-[#202820]/60">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#171D18] text-[#A5AD9D] font-mono text-[10px] uppercase tracking-wider border-b border-[#C5A66A]/20">
                <tr>
                  <th className="py-3 px-4">Structure Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">District / Coordinates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Workers</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A66A]/10 text-[#EAE3D2]">
                {placedBuildings.map(b => (
                  <tr key={b.id} className="hover:bg-[#283228]/50 transition-colors">
                    <td className="py-3 px-4 font-serif font-semibold text-[#EAE3D2] flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#C5A66A]" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-mono text-[#A5AD9D]">
                      {b.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#A5AD9D]">
                      {b.districtId || 'Central Grid'} ({Math.round(b.x)}, {Math.round(b.z)})
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                        b.status === 'active'
                          ? 'border-[#8FA879]/40 bg-[#8FA879]/10 text-[#8FA879]'
                          : b.status === 'constructing'
                          ? 'border-[#D6A75E]/40 bg-[#D6A75E]/10 text-[#D6A75E]'
                          : 'border-[#C87569]/40 bg-[#C87569]/10 text-[#C87569]'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {b.workersAssigned} / {b.workersNeeded}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#171D18] rounded-full overflow-hidden border border-[#C5A66A]/20">
                          <div
                            className="h-full bg-[#8FA879]"
                            style={{ width: `${b.health || 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[#8FA879]">{b.health || 100}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { soundFx.playClick(); setSelectedPlacedBuilding(b); }}
                        className="px-2.5 py-1 text-[11px] font-serif border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#C5A66A]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blueprint Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#202820] border border-[#C5A66A]/40 rounded-sm shadow-2xl overflow-hidden font-sans">
            <div className="px-6 py-4 border-b border-[#C5A66A]/20 flex items-center justify-between bg-[#171D18]">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#C5A66A]" />
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">{detailItem.name}</h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-[#A5AD9D] hover:text-[#EAE3D2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#A5AD9D] leading-relaxed">
                {detailItem.description}
              </p>

              <div className="p-4 bg-[#171D18] border border-[#C5A66A]/20 rounded space-y-2 text-xs">
                <span className="text-[10px] uppercase font-mono text-[#C5A66A] tracking-wider">
                  Operational Parameters & Directives
                </span>
                <div className="grid grid-cols-2 gap-3 pt-2 text-[#EAE3D2]">
                  <div>Material Foundation: <strong>{detailItem.costMaterials} units</strong></div>
                  <div>Fiscal Allocation: <strong>{detailItem.costCredits} CRC</strong></div>
                  <div>Power Consumption: <strong>{detailItem.energyReq} MW</strong></div>
                  <div>Water Allocation: <strong>{detailItem.waterReq} kL/cycle</strong></div>
                  <div>Workforce Requirement: <strong>{detailItem.workerReq} Specialists</strong></div>
                  <div>Civilian Shelter: <strong>{detailItem.populationCapacity.toLocaleString()} Citizens</strong></div>
                  <div>Erection Timeframe: <strong>{detailItem.constructionDurationDays} Solar Days</strong></div>
                  <div>Daily Maintenance: <strong>{detailItem.maintenanceCost} Mat/day</strong></div>
                </div>
              </div>

              <div className="text-xs text-[#D8CBAA] bg-[#C5A66A]/10 border border-[#C5A66A]/30 p-3 rounded">
                <strong>Deployment Protocol:</strong> Selecting "Issue Construction Directive" will transition to the 3D World Explorer. Left-click any valid terrain tile to place the architectural foundation grid.
              </div>
            </div>

            <div className="px-6 py-4 bg-[#171D18] border-t border-[#C5A66A]/20 flex justify-end gap-3">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 border border-[#C5A66A]/30 text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2] rounded"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  const item = detailItem;
                  setDetailItem(null);
                  handleStartConstruction(item);
                }}
                className="px-5 py-2 bg-[#C5A66A] text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider rounded hover:bg-[#D8CBAA] transition-colors flex items-center gap-2"
              >
                <Hammer className="w-4 h-4" />
                <span>Issue Construction Directive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Inspector Modal */}
      {selectedPlacedBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#202820] border border-[#C5A66A]/40 rounded-sm shadow-2xl p-6 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#C5A66A]" />
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">{selectedPlacedBuilding.name}</h3>
              </div>
              <button onClick={() => setSelectedPlacedBuilding(null)} className="text-[#A5AD9D] hover:text-[#EAE3D2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#C5A66A]/10">
                <span className="text-[#A5AD9D]">Asset ID</span>
                <span className="font-mono text-[#EAE3D2]">{selectedPlacedBuilding.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#C5A66A]/10">
                <span className="text-[#A5AD9D]">Operational State</span>
                <span className="font-mono uppercase text-[#8FA879]">{selectedPlacedBuilding.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#C5A66A]/10">
                <span className="text-[#A5AD9D]">Structural Health</span>
                <span className="font-mono text-[#8FA879]">{selectedPlacedBuilding.health || 100}% Integrity</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#C5A66A]/10">
                <span className="text-[#A5AD9D]">Assigned Labor Force</span>
                <span className="font-mono text-[#EAE3D2]">{selectedPlacedBuilding.workersAssigned} / {selectedPlacedBuilding.workersNeeded}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#C5A66A]/20 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPlacedBuilding(null)}
                className="px-4 py-2 border border-[#C5A66A]/30 text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2] rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfrastructurePage;
