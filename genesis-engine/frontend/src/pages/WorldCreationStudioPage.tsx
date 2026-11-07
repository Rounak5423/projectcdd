import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Globe,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Mountain,
  Sun,
  Droplets,
  Zap,
  Wheat,
  Scale,
  Shield,
  Layers,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { TechEra } from '../types/game';

interface WorldForm {
  name: string;
  planet: string;
  leaderTitle: string;
  terrainType: 'Verdant River Valley' | 'Highland Plateau' | 'Archipelago' | 'Boreal Basin' | 'Arid Oasis';
  climateType: 'Temperate' | 'Subtropical' | 'Subpolar' | 'Continental';
  waterAvailability: 'Abundant' | 'Moderate' | 'Scarce';
  resourceRichness: 'Bountiful' | 'Standard' | 'Challenging';
  startingPopulation: number;
  initialWealth: number; // in credits
  techEra: TechEra;
  governanceModel: string;
  environmentalProtectionLevel: 'Strict Conservation' | 'Balanced Stewardship' | 'Industrial Priority';
}

export default function WorldCreationStudioPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { createNewCivilization } = useGameState();
  const [step, setStep] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [form, setForm] = useState<WorldForm>({
    name: 'Neo Arcadia',
    planet: 'Terra Nova II',
    leaderTitle: 'High Strategist',
    terrainType: 'Verdant River Valley',
    climateType: 'Temperate',
    waterAvailability: 'Abundant',
    resourceRichness: 'Bountiful',
    startingPopulation: 250000,
    initialWealth: 15000,
    techEra: 'Foundational',
    governanceModel: 'Techno-Democratic Federation',
    environmentalProtectionLevel: 'Balanced Stewardship',
  });

  // Procedural 2D Topographic Canvas Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Palette based on terrain & climate
    let baseColor = '#243224';
    let hillColor = '#3a4e37';
    let waterColor = '#30545c';

    if (form.terrainType === 'Highland Plateau') {
      baseColor = '#36342e';
      hillColor = '#575246';
      waterColor = '#3a5054';
    } else if (form.terrainType === 'Arid Oasis') {
      baseColor = '#423725';
      hillColor = '#5e4f35';
      waterColor = '#355f69';
    } else if (form.terrainType === 'Boreal Basin') {
      baseColor = '#202b28';
      hillColor = '#35453f';
      waterColor = '#2d454a';
    }

    // Background terrain fill
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Contour rings
    ctx.strokeStyle = hillColor;
    ctx.lineWidth = 1.5;
    for (let r = 20; r < 140; r += 18) {
      ctx.beginPath();
      ctx.ellipse(w * 0.4, h * 0.45, r * 1.3, r, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mountain peak hatching
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.3, 35, 0, Math.PI * 2);
    ctx.fill();

    // River curve
    ctx.strokeStyle = waterColor;
    ctx.lineWidth = form.waterAvailability === 'Abundant' ? 14 : 7;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.85);
    ctx.bezierCurveTo(w * 0.3, h * 0.8, w * 0.5, h * 0.3, w, h * 0.15);
    ctx.stroke();

    // Grid coordinates
    ctx.strokeStyle = '#ffffff0f';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, [form.terrainType, form.climateType, form.waterAvailability]);

  // Handle finalize creation
  const handleFoundCivilization = () => {
    createNewCivilization({
      name: form.name,
      planet: form.planet,
      leaderTitle: form.leaderTitle,
      terrainType: form.terrainType,
      climateType: form.climateType,
      governanceModel: form.governanceModel,
      era: form.techEra,
    });
    onNavigate('World Explorer');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#39443a] gap-2">
        <div>
          <span className="eyebrow text-[#c6a76a]">CIVILISATION FORGE</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">World Creation Studio</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Configure foundational terrain, biogeography, initial wealth, and strategic governance model.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#9da99b]">PHASE {step} OF 4</span>
          <div className="w-24 h-1.5 rounded-full bg-[#202720] overflow-hidden">
            <div
              className="h-full bg-[#c6a76a] rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Step Forms */}
        <div className="panel p-6 bg-[#1a231b] border-[#374737] space-y-6">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#f3f5ee] flex items-center gap-2">
                <Globe size={18} className="text-[#a6bd82]" />
                Step 1: Civilisational Identity & Registry
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                    Civilisation Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-sm text-[#f3f5ee] focus:border-[#a6bd82] outline-none"
                    placeholder="e.g. Elysium Confederation"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                    Designated Planet
                  </label>
                  <input
                    type="text"
                    value={form.planet}
                    onChange={(e) => setForm({ ...form, planet: e.target.value })}
                    className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-sm text-[#f3f5ee] focus:border-[#a6bd82] outline-none"
                    placeholder="e.g. Kepler-452c"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                    Leader Executive Title
                  </label>
                  <input
                    type="text"
                    value={form.leaderTitle}
                    onChange={(e) => setForm({ ...form, leaderTitle: e.target.value })}
                    className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-sm text-[#f3f5ee] focus:border-[#a6bd82] outline-none"
                    placeholder="e.g. High Architect"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                    Initial Governance Model
                  </label>
                  <select
                    value={form.governanceModel}
                    onChange={(e) => setForm({ ...form, governanceModel: e.target.value })}
                    className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-sm text-[#f3f5ee] focus:border-[#a6bd82] outline-none"
                  >
                    <option>Techno-Democratic Federation</option>
                    <option>Autonomous Algorithmic Commons</option>
                    <option>Stratocratic Council of Science</option>
                    <option>Corporate Meritocracy</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TERRAIN & BIOGEOGRAPHY */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#f3f5ee] flex items-center gap-2">
                <Mountain size={18} className="text-[#c6a76a]" />
                Step 2: Biogeography & Planetary Terrain
              </h2>

              <div className="space-y-3">
                <label className="text-xs font-mono text-[#9da99b] uppercase block">
                  Topographical Biome
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'Verdant River Valley', desc: 'High fertility, abundant water, ideal for agrisector' },
                    { id: 'Highland Plateau', desc: 'Rich in heavy minerals, high wind kinetic potential' },
                    { id: 'Archipelago', desc: 'Pristine ocean currents, high trade potential' },
                    { id: 'Boreal Basin', desc: 'Cold climate, stable geology, superior computing thermal sinks' },
                    { id: 'Arid Oasis', desc: 'Intense solar radiation, high geothermal output' },
                  ].map((biome) => (
                    <div
                      key={biome.id}
                      onClick={() => setForm({ ...form, terrainType: biome.id as any })}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        form.terrainType === biome.id
                          ? 'bg-[#2a382c] border-[#a6bd82]'
                          : 'bg-[#151c16] border-[#2c392d] hover:bg-[#1d261e]'
                      }`}
                    >
                      <span className="font-semibold text-xs text-[#f0f3eb]">{biome.id}</span>
                      <p className="text-[10px] text-[#9da99b] mt-0.5">{biome.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                      Planetary Climate
                    </label>
                    <select
                      value={form.climateType}
                      onChange={(e) => setForm({ ...form, climateType: e.target.value as any })}
                      className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-xs text-[#f3f5ee]"
                    >
                      <option>Temperate</option>
                      <option>Subtropical</option>
                      <option>Subpolar</option>
                      <option>Continental</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                      Water Hydro-Reserve
                    </label>
                    <select
                      value={form.waterAvailability}
                      onChange={(e) => setForm({ ...form, waterAvailability: e.target.value as any })}
                      className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-xs text-[#f3f5ee]"
                    >
                      <option>Abundant</option>
                      <option>Moderate</option>
                      <option>Scarce</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESOURCES & ECONOMIC SEEDING */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#f3f5ee] flex items-center gap-2">
                <Zap size={18} className="text-[#e5c97b]" />
                Step 3: Initial Wealth & Natural Mineral Richness
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                    Resource Richness Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Bountiful', 'Standard', 'Challenging'].map((rich) => (
                      <button
                        key={rich}
                        onClick={() => setForm({ ...form, resourceRichness: rich as any })}
                        className={`py-2 rounded-lg text-xs font-semibold border ${
                          form.resourceRichness === rich
                            ? 'bg-[#394a37] text-[#dce9ca] border-[#6b8564]'
                            : 'bg-[#151c16] text-[#8e9c8c] border-[#2c392d]'
                        }`}
                      >
                        {rich}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9da99b]">Starting Pioneer Population</span>
                    <span className="font-mono text-[#c6a76a] font-bold">
                      {(form.startingPopulation / 1000).toLocaleString()}k Citizens
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="50000"
                    value={form.startingPopulation}
                    onChange={(e) => setForm({ ...form, startingPopulation: Number(e.target.value) })}
                    className="w-full accent-[#a6bd82]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9da99b] uppercase block mb-1">
                    Environmental Protection Protocol
                  </label>
                  <select
                    value={form.environmentalProtectionLevel}
                    onChange={(e) =>
                      setForm({ ...form, environmentalProtectionLevel: e.target.value as any })
                    }
                    className="w-full bg-[#141914] border border-[#344435] rounded-lg px-3 py-2 text-xs text-[#f3f5ee]"
                  >
                    <option>Strict Conservation</option>
                    <option>Balanced Stewardship</option>
                    <option>Industrial Priority</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#f3f5ee] flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#a6bd82]" />
                Step 4: Civilisation Charter Review
              </h2>

              <div className="p-4 rounded-lg bg-[#141a15] border border-[#2e3b2f] space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#252f26]">
                  <span className="text-[#9da99b]">Civilisation Entity:</span>
                  <span className="font-bold text-[#f3f5ef]">{form.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#252f26]">
                  <span className="text-[#9da99b]">Target Celestial Body:</span>
                  <span className="text-[#e8e9e3]">{form.planet}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#252f26]">
                  <span className="text-[#9da99b]">Ecosystem Biome:</span>
                  <span className="text-[#e8e9e3]">{form.climateType} {form.terrainType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#252f26]">
                  <span className="text-[#9da99b]">Governance System:</span>
                  <span className="text-[#a6bd82]">{form.governanceModel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#252f26]">
                  <span className="text-[#9da99b]">Pioneer Population:</span>
                  <span className="font-mono text-[#c6a76a]">{(form.startingPopulation / 1000).toLocaleString()}k</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#9da99b]">Ecological Mandate:</span>
                  <span className="text-[#e8e9e3]">{form.environmentalProtectionLevel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2e3b2f]">
            <button
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                step === 1
                  ? 'text-[#586355] cursor-not-allowed'
                  : 'bg-[#202921] hover:bg-[#2b382d] text-[#e8e9e3]'
              }`}
            >
              <ChevronLeft size={14} /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] flex items-center gap-1 border border-[#6b8563] shadow-md"
              >
                Proceed <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFoundCivilization}
                className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#c6a76a] hover:bg-[#d6b77a] text-[#151916] flex items-center gap-2 shadow-xl"
              >
                <Sparkles size={15} />
                Found Civilisation & Enter 3D World
              </button>
            )}
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="panel p-5 bg-[#172018] border-[#314032] flex flex-col justify-between space-y-4">
          <div>
            <span className="eyebrow text-[#c6a76a]">TOPOGRAPHIC SYNTHESIS</span>
            <h3 className="text-sm font-bold text-[#f3f5ee] mt-1">Satellite Topo Preview</h3>

            {/* Canvas terrain render */}
            <div className="mt-3 rounded-lg overflow-hidden border border-[#2f3d30] shadow-inner bg-[#141914] relative">
              <canvas ref={canvasRef} width={300} height={200} className="w-full h-auto block" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-[#a6bd82] backdrop-blur-sm">
                SCALE: 1:50,000 CONTOURS
              </div>
            </div>

            {/* Stat impact meters */}
            <div className="mt-4 space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#9da99b]">Agrarian Fertility</span>
                  <span className="font-mono text-[#a6bd82]">
                    {form.waterAvailability === 'Abundant' ? '92%' : '65%'}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#121612]">
                  <div
                    className="h-full bg-[#a6bd82] rounded-full"
                    style={{ width: form.waterAvailability === 'Abundant' ? '92%' : '65%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#9da99b]">Mineral Extractability</span>
                  <span className="font-mono text-[#c6a76a]">
                    {form.resourceRichness === 'Bountiful' ? '88%' : '72%'}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#121612]">
                  <div
                    className="h-full bg-[#c6a76a] rounded-full"
                    style={{ width: form.resourceRichness === 'Bountiful' ? '88%' : '72%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-[#131814] border border-[#253026] text-[11px] text-[#9da99b]">
            Starting parameters automatically calibrate initial resource rates and district generation upon charter ratification.
          </div>
        </div>
      </div>
    </div>
  );
}
