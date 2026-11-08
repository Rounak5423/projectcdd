import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Activity,
  Users,
  Coins,
  Smile,
  Zap,
  Brain,
  Calendar,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';

interface CS2StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CS2StatisticsModal({ isOpen, onClose }: CS2StatisticsModalProps) {
  const { resources, civilization } = useGameState();

  const [activeCategory, setActiveCategory] = useState<'population' | 'economy' | 'happiness' | 'utilities' | 'cognitive'>('population');
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('30');

  if (!isOpen) return null;

  // Generate realistic, continuous time series curves based on current simulation state
  const pointsCount = timeRange === '30' ? 30 : timeRange === '90' ? 45 : 60;
  const currentPop = resources.population;
  const currentGrc = resources.grc;
  const currentHappiness = resources.happiness;
  const currentStability = resources.stability;
  const currentEnergy = resources.energy;

  const generateDataSeries = (base: number, volatility: number, trend: number) => {
    const points: number[] = [];
    let val = base * (1 - (pointsCount * trend) / 100);
    for (let i = 0; i < pointsCount; i++) {
      const noise = (Math.sin(i * 0.8) + Math.cos(i * 1.5)) * volatility;
      val = val * (1 + trend / 100) + noise;
      points.push(Math.max(0, Math.round(val)));
    }
    // ensure last point hits actual current value
    points[points.length - 1] = base;
    return points;
  };

  const popSeries = generateDataSeries(currentPop, 1200, 0.4);
  const grcSeries = generateDataSeries(currentGrc, 40, 0.6);
  const happinessSeries = generateDataSeries(currentHappiness, 0.8, 0.1);
  const stabilitySeries = generateDataSeries(currentStability, 0.6, 0.1);
  const energySeries = generateDataSeries(currentEnergy, 15, 0.3);
  const cognitiveSeries = generateDataSeries(72, 1.2, -0.2); // AI paradox trend

  let activeSeries: number[] = popSeries;
  let seriesLabel = 'Total Urban Population';
  let seriesUnit = 'Citizens';
  let seriesColor = '#2ecc71';
  let seriesMin = Math.min(...activeSeries);
  let seriesMax = Math.max(...activeSeries);

  if (activeCategory === 'economy') {
    activeSeries = grcSeries;
    seriesLabel = 'City Treasury Reserves (GRC)';
    seriesUnit = 'GRC';
    seriesColor = '#dfb74a';
  } else if (activeCategory === 'happiness') {
    activeSeries = happinessSeries;
    seriesLabel = 'Citizen Civic Happiness';
    seriesUnit = '%';
    seriesColor = '#3498db';
  } else if (activeCategory === 'utilities') {
    activeSeries = energySeries;
    seriesLabel = 'Power Grid Capacity Output';
    seriesUnit = 'MW';
    seriesColor = '#f39c12';
  } else if (activeCategory === 'cognitive') {
    activeSeries = cognitiveSeries;
    seriesLabel = 'Human Critical Reasoning Quotient (AI Paradox)';
    seriesUnit = 'CRQ';
    seriesColor = '#9b59b6';
  }

  seriesMin = Math.min(...activeSeries);
  seriesMax = Math.max(...activeSeries);
  const rangeDiff = seriesMax - seriesMin || 1;

  // Build SVG path
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 20;

  const pointsString = activeSeries
    .map((val, idx) => {
      const x = padding + (idx / (activeSeries.length - 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - ((val - seriesMin) / rangeDiff) * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaString = `${padding},${svgHeight - padding} ${pointsString} ${svgWidth - padding},${svgHeight - padding}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0f1713] border border-[#dfb74a]/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#e8ece9]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#243328] bg-[#09110d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8f9d94] block">
                Time Series & Municipal Telemetry
              </span>
              <h2 className="text-base sm:text-lg font-bold font-serif text-[#faecd0]">
                City Statistics & Longitudinal Trends
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-[#142119] p-0.5 rounded-lg border border-[#273a2e] text-[11px] font-mono">
              {(['30', '90', '365'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    soundFx.playClick();
                    setTimeRange(r);
                  }}
                  className={`px-2.5 py-1 rounded transition ${
                    timeRange === r
                      ? 'bg-[#293d2e] text-[#faecd0] font-bold shadow-xs'
                      : 'text-[#8f9d94] hover:text-white'
                  }`}
                >
                  {r === '365' ? '1 Year' : `${r} Days`}
                </button>
              ))}
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
        </div>

        {/* Category Nav */}
        <div className="flex border-b border-[#1e2e23] bg-[#0b1410] px-4 gap-1 text-xs">
          {[
            { id: 'population', label: 'Demographics', icon: Users },
            { id: 'economy', label: 'Treasury & GDP', icon: Coins },
            { id: 'happiness', label: 'Citizen Well-being', icon: Smile },
            { id: 'utilities', label: 'Grid & Energy', icon: Zap },
            { id: 'cognitive', label: 'AI Paradox Index', icon: Brain },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveCategory(cat.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition ${
                  isActive
                    ? 'border-[#dfb74a] text-[#dfb74a] bg-[#142219]'
                    : 'border-transparent text-[#8f9d94] hover:text-[#e8ece9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Chart Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Chart Card */}
          <div className="p-4 rounded-xl bg-[#0b1410] border border-[#1e2e23] space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-[#8f9d94] uppercase block">Active Metric</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seriesColor }} />
                  {seriesLabel}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#8f9d94] uppercase block">Current Value</span>
                <span className="text-base font-bold font-mono" style={{ color: seriesColor }}>
                  {activeSeries[activeSeries.length - 1].toLocaleString()} {seriesUnit}
                </span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="w-full bg-[#080d0a] rounded-lg p-2 border border-[#16221a] relative overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 sm:h-56">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={seriesColor} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={seriesColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#1b2a20" strokeDasharray="3 3" />
                <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#1b2a20" strokeDasharray="3 3" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#2b3e32" />

                {/* Area Gradient Fill */}
                <polygon points={areaString} fill="url(#chartGradient)" />

                {/* Line Path */}
                <polyline
                  fill="none"
                  stroke={seriesColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />

                {/* Current Value Marker Circle */}
                <circle
                  cx={svgWidth - padding}
                  cy={svgHeight - padding - ((activeSeries[activeSeries.length - 1] - seriesMin) / rangeDiff) * (svgHeight - padding * 2)}
                  r="4.5"
                  fill={seriesColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Min and Max Range Labels */}
              <div className="flex justify-between text-[10px] font-mono text-[#8f9d94] px-3 pt-1">
                <span>Min: {seriesMin.toLocaleString()} {seriesUnit}</span>
                <span>Interval: Day 1 to Day {timeRange} (Year {civilization.currentYear})</span>
                <span>Max: {seriesMax.toLocaleString()} {seriesUnit}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#111c15] rounded-xl border border-[#203125]">
              <span className="text-[10px] text-[#8f9d94] block uppercase font-mono">Civic Stability</span>
              <span className="text-sm font-bold font-mono text-[#2ecc71] mt-0.5 block">{currentStability}%</span>
              <span className="text-[10px] text-[#8f9d94] mt-0.5 block">High social coherence</span>
            </div>

            <div className="p-3 bg-[#111c15] rounded-xl border border-[#203125]">
              <span className="text-[10px] text-[#8f9d94] block uppercase font-mono">Daily GRC Rate</span>
              <span className="text-sm font-bold font-mono text-[#dfb74a] mt-0.5 block">+180 GRC/cycle</span>
              <span className="text-[10px] text-[#8f9d94] mt-0.5 block">Net positive cash flow</span>
            </div>

            <div className="p-3 bg-[#111c15] rounded-xl border border-[#203125]">
              <span className="text-[10px] text-[#8f9d94] block uppercase font-mono">Power Margin</span>
              <span className="text-sm font-bold font-mono text-[#f39c12] mt-0.5 block">+{resources.energy} MW</span>
              <span className="text-[10px] text-[#8f9d94] mt-0.5 block">Clean fusion & solar</span>
            </div>

            <div className="p-3 bg-[#111c15] rounded-xl border border-[#203125]">
              <span className="text-[10px] text-[#8f9d94] block uppercase font-mono">AI Scaffolding</span>
              <span className="text-sm font-bold font-mono text-[#9b59b6] mt-0.5 block">72% Active</span>
              <span className="text-[10px] text-[#8f9d94] mt-0.5 block">Curriculum safeguarded</span>
            </div>
          </div>
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
            Close Statistics Panel
          </button>
        </div>
      </div>
    </div>
  );
}
