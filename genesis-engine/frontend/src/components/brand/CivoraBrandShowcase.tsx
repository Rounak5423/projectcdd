import React, { useState } from 'react';
import {
  CivoraEmblem,
  CivoraWordmark,
  CivoraIcon,
} from './CivoraLogo';
import { Shield, Sparkles, Check, Copy, ExternalLink, Download } from 'lucide-react';

export default function CivoraBrandShowcase() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colors = [
    { name: 'Imperial Antique Gold', hex: '#DFB74A', role: 'Primary Emblem & Wordmark' },
    { name: 'Warm Ivory', hex: '#FBF7EE', role: 'Star Highlights & Classical Accents' },
    { name: 'Deep Forest Green', hex: '#0C1510', role: 'Atmospheric Brand Field' },
    { name: 'Verdant Forest Mid', hex: '#14221A', role: 'Mountain & Environmental Shading' },
    { name: 'Dark Charcoal Patina', hex: '#14181B', role: 'Tactical UI Containers' },
    { name: 'Engraved Gold Shadow', hex: '#5E4514', role: 'Bas-Relief & Chiseled Depth' },
  ];

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="w-full space-y-6 text-[#ede8dc] select-none">
      {/* 1. CINEMATIC HERO WIDESCREEN BANNER */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#8f7742] shadow-2xl bg-[#0a110d]">
        <img
          src="/brand/civora-banner.jpg"
          alt="CIVORA — Civilisation Simulation Engine"
          className="w-full h-auto max-h-[320px] object-cover object-center filter brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09110c] via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#1f2820]/90 text-[#dfb74a] border border-[#5e4e24]">
              OFFICIAL BRAND IDENTITY
            </span>
            <p className="text-xs text-[#d1c8b4] mt-1 font-serif">
              Classical architectural emblem with Greek/Roman temple, celestial globe, laurel boughs, and 8-point compass star.
            </p>
          </div>
        </div>
      </div>

      {/* 2. VECTOR WORDMARK & EMBLEM STUDIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Horizontal Wordmark Card */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-gradient-to-br from-[#121c16] via-[#0d1510] to-[#070c09] border border-[#5e4e24] shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#a18131] uppercase tracking-wider block">
              PRIMARY HORIZONTAL WORDMARK
            </span>
            <h3 className="text-sm font-bold text-[#f0ebe0]">
              Full Identity Lockup
            </h3>
          </div>

          <div className="py-8 px-4 flex items-center justify-center bg-[#09100b] rounded-lg border border-[#2d3a2c]/60 my-4 shadow-inner">
            <CivoraWordmark emblemSize={72} />
          </div>

          <div className="text-[11px] text-[#8e8574] leading-relaxed flex items-center justify-between border-t border-[#253226] pt-3">
            <span>Features bespoke star glyph embedded within the central &apos;O&apos;.</span>
            <span className="font-mono text-[#dfb74a] text-[10px]">SVG / Vector Scalable</span>
          </div>
        </div>

        {/* Standalone Architectural Emblem Study */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#121c16] via-[#0d1510] to-[#070c09] border border-[#5e4e24] shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#a18131] uppercase tracking-wider block">
              ARCHITECTURAL EMBLEM
            </span>
            <h3 className="text-sm font-bold text-[#f0ebe0]">
              Temple, Globe & Compass Star
            </h3>
          </div>

          <div className="py-4 flex items-center justify-center my-2">
            <CivoraEmblem size={132} />
          </div>

          <div className="text-[11px] text-[#8e8574] leading-relaxed border-t border-[#253226] pt-3">
            Hexastyle facade, tympanum rosette, mountain crags, and dual laurel boughs.
          </div>
        </div>
      </div>

      {/* 3. APPLICATION ICON SCALE TESTING & COLOR SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Scale App Icon Verification */}
        <div className="p-5 rounded-xl bg-[#0f1511] border border-[#2d382e] shadow-lg space-y-4">
          <div>
            <span className="text-[10px] font-mono text-[#a18131] uppercase tracking-wider block">
              ICON SCALABILITY TEST
            </span>
            <h4 className="text-xs font-bold text-[#ede8dc]">
              Legibility at All Native Strategy UI Densities
            </h4>
          </div>

          <div className="flex items-center justify-around p-4 rounded-lg bg-[#090d0a] border border-[#1e261f]">
            {/* 64px */}
            <div className="flex flex-col items-center gap-2">
              <CivoraIcon size={64} />
              <span className="text-[10px] font-mono text-[#8a8376]">64px</span>
            </div>
            {/* 48px */}
            <div className="flex flex-col items-center gap-2">
              <CivoraIcon size={48} />
              <span className="text-[10px] font-mono text-[#8a8376]">48px</span>
            </div>
            {/* 36px */}
            <div className="flex flex-col items-center gap-2">
              <CivoraIcon size={36} />
              <span className="text-[10px] font-mono text-[#8a8376]">36px (HUD)</span>
            </div>
            {/* 28px */}
            <div className="flex flex-col items-center gap-2">
              <CivoraIcon size={28} />
              <span className="text-[10px] font-mono text-[#8a8376]">28px</span>
            </div>
            {/* 20px */}
            <div className="flex flex-col items-center gap-2">
              <CivoraIcon size={20} />
              <span className="text-[10px] font-mono text-[#8a8376]">20px (Tab)</span>
            </div>
          </div>
        </div>

        {/* Color Palette Specification */}
        <div className="p-5 rounded-xl bg-[#0f1511] border border-[#2d382e] shadow-lg space-y-3">
          <div>
            <span className="text-[10px] font-mono text-[#a18131] uppercase tracking-wider block">
              CHROMATIC SPECIFICATION
            </span>
            <h4 className="text-xs font-bold text-[#ede8dc]">
              Antique Metallic Gold, Warm Ivory & Forest Green
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => handleCopy(c.hex)}
                className="p-2 rounded-lg bg-[#141b16] border border-[#243026] hover:border-[#dfb74a] transition-all text-left group"
              >
                <div
                  className="w-full h-6 rounded mb-1.5 border border-black/40 shadow-xs flex items-center justify-end px-1.5"
                  style={{ backgroundColor: c.hex }}
                >
                  {copiedColor === c.hex ? (
                    <Check size={11} className="text-black font-bold" />
                  ) : null}
                </div>
                <span className="text-[10px] font-bold text-[#ede8dc] block truncate">
                  {c.name}
                </span>
                <span className="text-[9px] font-mono text-[#dfb74a] block">
                  {c.hex}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

