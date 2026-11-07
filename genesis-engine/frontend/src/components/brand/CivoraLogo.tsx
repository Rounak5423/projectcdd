import React from 'react';

interface CivoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'emblem' | 'compact' | 'icon';
  theme?: 'dark' | 'light' | 'gold';
}

/**
 * Classical Architectural Emblem:
 * Greek/Roman Temple on a Mountain, Globe Latitude/Longitude Grid,
 * Symmetrical Laurel Wreath, and 8-Point Compass Star.
 */
export function CivoraEmblem({
  className = '',
  size = 56,
}: {
  className?: string;
  size?: number | string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] ${className}`}
    >
      <defs>
        {/* Antique Metallic Gold Gradients */}
        <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#faecd0" />
          <stop offset="25%" stopColor="#dfb74a" />
          <stop offset="60%" stopColor="#ad8223" />
          <stop offset="90%" stopColor="#f3d77e" />
          <stop offset="100%" stopColor="#876214" />
        </linearGradient>

        <linearGradient id="goldMedium" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#876214" />
          <stop offset="35%" stopColor="#caa23d" />
          <stop offset="70%" stopColor="#edd48d" />
          <stop offset="100%" stopColor="#9a711b" />
        </linearGradient>

        <linearGradient id="goldDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#856116" />
          <stop offset="100%" stopColor="#3d2a08" />
        </linearGradient>

        {/* Deep Forest Green Radial Glow */}
        <radialGradient id="greenAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a2e22" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#0d1711" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#080e0a" stopOpacity="0" />
        </radialGradient>

        {/* Shading Filter for Engraved/Metallic Emboss */}
        <filter id="civoraEmboss" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Atmospheric Background Glow */}
      <circle cx="120" cy="120" r="115" fill="url(#greenAura)" />

      {/* ================= CELESTIAL GLOBE GRID ================= */}
      <g stroke="url(#goldMedium)" strokeWidth="1.2" opacity="0.65">
        {/* Outer Circular Globe Meridian */}
        <circle cx="120" cy="126" r="82" fill="none" strokeWidth="2.2" stroke="url(#goldLight)" />
        <circle cx="120" cy="126" r="80" fill="none" strokeDasharray="1.5 3.5" strokeWidth="0.9" />

        {/* Latitudinal Ellipses */}
        <ellipse cx="120" cy="126" rx="82" ry="24" fill="none" />
        <ellipse cx="120" cy="126" rx="82" ry="52" fill="none" />
        <ellipse cx="120" cy="126" rx="82" ry="72" fill="none" />

        {/* Longitudinal Ellipses */}
        <ellipse cx="120" cy="126" rx="26" ry="82" fill="none" />
        <ellipse cx="120" cy="126" rx="55" ry="82" fill="none" />

        {/* Equator & Prime Meridian Axis */}
        <line x1="38" y1="126" x2="202" y2="126" strokeWidth="1.5" />
        <line x1="120" y1="44" x2="120" y2="208" strokeWidth="1.5" />

        {/* Subtle Constellation / Map Stars */}
        <circle cx="70" cy="88" r="1.5" fill="#f5ebc9" />
        <circle cx="168" cy="82" r="1.2" fill="#f5ebc9" />
        <circle cx="178" cy="154" r="1.4" fill="#f5ebc9" />
        <circle cx="62" cy="162" r="1.2" fill="#f5ebc9" />
      </g>

      {/* ================= RUGGED MOUNTAIN & ASCENT PATH ================= */}
      <g filter="url(#civoraEmboss)">
        {/* Mountain Silhouette Base */}
        <path
          d="M 40 216 L 76 172 L 96 182 L 120 148 L 144 182 L 164 172 L 200 216 Z"
          fill="#0c1510"
          stroke="url(#goldDark)"
          strokeWidth="1.5"
        />

        {/* Left Crags & Terraces */}
        <path
          d="M 52 216 L 82 178 L 96 182 L 110 162 L 100 216 Z"
          fill="#142219"
          stroke="url(#goldMedium)"
          strokeWidth="1"
        />
        {/* Right Crags & Terraces */}
        <path
          d="M 188 216 L 158 178 L 144 182 L 130 162 L 140 216 Z"
          fill="#18271e"
          stroke="url(#goldMedium)"
          strokeWidth="1"
        />

        {/* Winding Ascending Road to Temple */}
        <path
          d="M 120 216 Q 106 198 126 184 T 120 156"
          fill="none"
          stroke="url(#goldLight)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 120 216 Q 106 198 126 184 T 120 156"
          fill="none"
          stroke="#111a14"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          strokeLinecap="round"
        />
      </g>

      {/* ================= CLASSICAL GREEK/ROMAN TEMPLE ================= */}
      <g filter="url(#civoraEmboss)">
        {/* Foundation Steps (Stereobate & Stylobate) */}
        <rect x="74" y="152" width="92" height="4.5" fill="url(#goldDark)" stroke="url(#goldLight)" strokeWidth="0.8" />
        <rect x="78" y="147.5" width="84" height="4.5" fill="url(#goldMedium)" stroke="url(#goldLight)" strokeWidth="0.8" />
        <rect x="82" y="143" width="76" height="4.5" fill="url(#goldLight)" stroke="url(#goldDark)" strokeWidth="0.8" />

        {/* Temple Sanctuary Back Wall & Inner Portal */}
        <rect x="85" y="112" width="70" height="31" fill="#0b130e" stroke="url(#goldDark)" strokeWidth="1" />
        {/* Central Arched Portal */}
        <path
          d="M 112 143 L 112 124 Q 120 119 128 124 L 128 143 Z"
          fill="#050a07"
          stroke="url(#goldLight)"
          strokeWidth="1"
        />

        {/* Six Classical Fluted Columns (Hexastyle Facade) */}
        {[86, 99, 112, 125, 138, 151].map((colX, i) => (
          <g key={i}>
            {/* Column Base Plinth */}
            <rect x={colX - 1.5} y="140" width="7" height="3" fill="url(#goldDark)" stroke="url(#goldLight)" strokeWidth="0.6" />
            {/* Fluted Column Shaft */}
            <rect x={colX} y="115" width="4" height="25" fill="url(#goldLight)" stroke="url(#goldDark)" strokeWidth="0.6" />
            <line x1={colX + 1.3} y1="116" x2={colX + 1.3} y2="139" stroke="url(#goldDark)" strokeWidth="0.6" opacity="0.7" />
            <line x1={colX + 2.7} y1="116" x2={colX + 2.7} y2="139" stroke="#fff4db" strokeWidth="0.6" opacity="0.8" />
            {/* Capital (Doric/Ionic with echinus & abacus) */}
            <path
              d={`M ${colX - 2.5} 113 L ${colX + 6.5} 113 L ${colX + 5} 115 L ${colX - 1} 115 Z`}
              fill="url(#goldLight)"
              stroke="url(#goldDark)"
              strokeWidth="0.6"
            />
          </g>
        ))}

        {/* Entablature (Architrave + Frieze with Triglyphs + Cornice) */}
        <rect x="80" y="109" width="80" height="4" fill="url(#goldDark)" stroke="url(#goldLight)" strokeWidth="0.8" />
        <rect x="78" y="105" width="84" height="4" fill="url(#goldMedium)" stroke="url(#goldLight)" strokeWidth="0.8" />
        {/* Miniature Triglyphs */}
        {[84, 96, 108, 120, 132, 144, 156].map((tx, idx) => (
          <rect key={idx} x={tx} y="105.5" width="2" height="3" fill="#2d2008" />
        ))}
        {/* Projecting Cornice */}
        <rect x="75" y="102" width="90" height="3" fill="url(#goldLight)" stroke="url(#goldDark)" strokeWidth="0.8" />

        {/* Triangular Pediment */}
        <path
          d="M 72 102 L 120 78 L 168 102 Z"
          fill="url(#goldMedium)"
          stroke="url(#goldLight)"
          strokeWidth="1.6"
        />
        {/* Inner Tympanum Relief */}
        <path
          d="M 79 100 L 120 82 L 161 100 Z"
          fill="#111c15"
          stroke="url(#goldDark)"
          strokeWidth="0.8"
        />
        {/* Tympanum Center Medallion (All-Seeing Eye / Empire Rose) */}
        <circle cx="120" cy="93" r="3.2" fill="url(#goldLight)" stroke="url(#goldDark)" strokeWidth="0.6" />
        <polygon points="120,89 121.5,92.5 125,93 121.5,93.5 120,97 118.5,93.5 115,93 118.5,92.5" fill="#fff7e0" />

        {/* Acroterion Finials at Temple Roof Edges */}
        <circle cx="120" cy="77" r="2.2" fill="url(#goldLight)" />
        <circle cx="73" cy="102" r="1.8" fill="url(#goldLight)" />
        <circle cx="167" cy="102" r="1.8" fill="url(#goldLight)" />
      </g>

      {/* ================= SYMMETRICAL LAUREL WREATH ================= */}
      <g filter="url(#civoraEmboss)">
        {/* Left Laurel Bough */}
        <path
          d="M 120 220 C 70 216 32 176 32 126 C 32 90 52 58 84 42"
          fill="none"
          stroke="url(#goldDark)"
          strokeWidth="1.8"
        />
        {/* Left Laurel Leaves */}
        {[
          { cx: 34, cy: 154, rot: 35 },
          { cx: 30, cy: 136, rot: 20 },
          { cx: 30, cy: 118, rot: 5 },
          { cx: 35, cy: 100, rot: -15 },
          { cx: 44, cy: 82, rot: -30 },
          { cx: 58, cy: 66, rot: -45 },
          { cx: 74, cy: 52, rot: -60 },
          { cx: 94, cy: 42, rot: -75 },
        ].map((leaf, idx) => (
          <g key={`leaf-l-${idx}`} transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.rot})`}>
            {/* Outer Leaf */}
            <path
              d="M 0 -11 C 6 -6 8 4 0 11 C -8 4 -6 -6 0 -11 Z"
              fill="url(#goldLight)"
              stroke="url(#goldDark)"
              strokeWidth="0.8"
            />
            {/* Inner Rib */}
            <line x1="0" y1="-9" x2="0" y2="9" stroke="url(#goldDark)" strokeWidth="0.8" opacity="0.8" />
            {/* Accompanying Olive Berry */}
            {idx % 2 === 0 && <circle cx="7" cy="-2" r="2" fill="url(#goldMedium)" />}
          </g>
        ))}

        {/* Right Laurel Bough */}
        <path
          d="M 120 220 C 170 216 208 176 208 126 C 208 90 188 58 156 42"
          fill="none"
          stroke="url(#goldDark)"
          strokeWidth="1.8"
        />
        {/* Right Laurel Leaves */}
        {[
          { cx: 206, cy: 154, rot: -35 },
          { cx: 210, cy: 136, rot: -20 },
          { cx: 210, cy: 118, rot: -5 },
          { cx: 205, cy: 100, rot: 15 },
          { cx: 196, cy: 82, rot: 30 },
          { cx: 182, cy: 66, rot: 45 },
          { cx: 166, cy: 52, rot: 60 },
          { cx: 146, cy: 42, rot: 75 },
        ].map((leaf, idx) => (
          <g key={`leaf-r-${idx}`} transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.rot})`}>
            {/* Outer Leaf */}
            <path
              d="M 0 -11 C 6 -6 8 4 0 11 C -8 4 -6 -6 0 -11 Z"
              fill="url(#goldLight)"
              stroke="url(#goldDark)"
              strokeWidth="0.8"
            />
            {/* Inner Rib */}
            <line x1="0" y1="-9" x2="0" y2="9" stroke="url(#goldDark)" strokeWidth="0.8" opacity="0.8" />
            {idx % 2 === 0 && <circle cx="-7" cy="-2" r="2" fill="url(#goldMedium)" />}
          </g>
        ))}

        {/* Bottom Ribbon Knot connecting laurels */}
        <path
          d="M 108 221 C 114 217 126 217 132 221 C 127 227 113 227 108 221 Z"
          fill="url(#goldLight)"
          stroke="url(#goldDark)"
          strokeWidth="1"
        />
        <circle cx="120" cy="221" r="3" fill="#faecd0" stroke="url(#goldDark)" strokeWidth="0.8" />
      </g>

      {/* ================= RADIANT 8-POINT COMPASS STAR ================= */}
      <g filter="url(#civoraEmboss)">
        {/* Celestial Star Center at apex (x: 120, y: 32) */}
        {/* Outer Halo Rays */}
        <circle cx="120" cy="32" r="26" fill="url(#greenAura)" opacity="0.6" />

        {/* Eight Major & Minor Points with 3D Chiseled Facets */}
        {/* 1. North Major Point */}
        <polygon points="120,4 123.5,30 120,32" fill="url(#goldLight)" />
        <polygon points="120,4 116.5,30 120,32" fill="url(#goldDark)" />

        {/* 2. South Major Point */}
        <polygon points="120,60 116.5,34 120,32" fill="url(#goldLight)" />
        <polygon points="120,60 123.5,34 120,32" fill="url(#goldDark)" />

        {/* 3. East Major Point */}
        <polygon points="148,32 122,28.5 120,32" fill="url(#goldLight)" />
        <polygon points="148,32 122,35.5 120,32" fill="url(#goldDark)" />

        {/* 4. West Major Point */}
        <polygon points="92,32 118,35.5 120,32" fill="url(#goldLight)" />
        <polygon points="92,32 118,28.5 120,32" fill="url(#goldDark)" />

        {/* 5. North-East Diagonal Point */}
        <polygon points="138,14 122,29.5 120,32" fill="url(#goldLight)" />
        <polygon points="138,14 124.5,32 120,32" fill="url(#goldDark)" />

        {/* 6. South-East Diagonal Point */}
        <polygon points="138,50 124.5,32 120,32" fill="url(#goldLight)" />
        <polygon points="138,50 122,34.5 120,32" fill="url(#goldDark)" />

        {/* 7. South-West Diagonal Point */}
        <polygon points="102,50 118,34.5 120,32" fill="url(#goldLight)" />
        <polygon points="102,50 115.5,32 120,32" fill="url(#goldDark)" />

        {/* 8. North-West Diagonal Point */}
        <polygon points="102,14 115.5,32 120,32" fill="url(#goldLight)" />
        <polygon points="102,14 118,29.5 120,32" fill="url(#goldDark)" />

        {/* Star Center Radiant Gem */}
        <circle cx="120" cy="32" r="3.6" fill="#fff7e3" stroke="url(#goldDark)" strokeWidth="0.8" />
        <circle cx="120" cy="32" r="1.5" fill="#dfb74a" />
      </g>
    </svg>
  );
}

/**
 * Compact Icon for Sidebars, Favicons, Topbars, and App Badges
 */
export function CivoraIcon({
  size = 32,
  className = '',
}: {
  size?: number | string;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-lg bg-gradient-to-b from-[#1c2c22] via-[#101c15] to-[#09110c] border border-[#a18131]/60 flex items-center justify-center p-0.5 shadow-lg overflow-hidden group hover:border-[#dfb74a] transition-all ${className}`}
    >
      {/* Background subtle radial luster */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(223,183,74,0.18)_0%,transparent_75%)] pointer-events-none" />
      <CivoraEmblem size="94%" />
    </div>
  );
}

/**
 * Full Horizontal Wordmark:
 * Architectural Emblem + "CIVORA" with star inside 'O' +
 * "CIVILISATION SIMULATION ENGINE" with engraved filigree rules.
 */
export function CivoraWordmark({
  className = '',
  emblemSize = 64,
  showSubtitle = true,
}: {
  className?: string;
  emblemSize?: number;
  showSubtitle?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      {/* Architectural Emblem */}
      <CivoraEmblem size={emblemSize} />

      {/* Classical Serif Typography Suite */}
      <div className="flex flex-col justify-center">
        {/* Exact Brand Name: CIVORA with embedded star in the 'O' */}
        <div className="flex items-center">
          <span
            className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-[0.24em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#dfb74a] to-[#99701d] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Cinzel', 'Trajan Pro', 'Baskerville', 'Georgia', serif" }}
          >
            CIV
          </span>

          {/* Custom 'O' with Eight-Point Compass Star in Center */}
          <span className="relative inline-flex items-center justify-center mx-[0.04em]">
            <span
              className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-[0.24em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#dfb74a] to-[#99701d] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              style={{ fontFamily: "'Cinzel', 'Trajan Pro', 'Baskerville', 'Georgia', serif" }}
            >
              O
            </span>
            {/* Suspended Golden Compass Star inside the 'O' */}
            <svg
              className="absolute inset-0 m-auto w-[42%] h-[42%] pointer-events-none drop-shadow-[0_0_6px_rgba(250,236,208,0.7)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <polygon points="12,1 13.5,10.5 12,12" fill="#fff7e0" />
              <polygon points="12,1 10.5,10.5 12,12" fill="#99701d" />
              <polygon points="12,23 10.5,13.5 12,12" fill="#fff7e0" />
              <polygon points="12,23 13.5,13.5 12,12" fill="#99701d" />
              <polygon points="23,12 13.5,10.5 12,12" fill="#fff7e0" />
              <polygon points="23,12 13.5,13.5 12,12" fill="#99701d" />
              <polygon points="1,12 10.5,13.5 12,12" fill="#fff7e0" />
              <polygon points="1,12 10.5,10.5 12,12" fill="#99701d" />
              <polygon points="20,4 13.2,11 12,12" fill="#f5d376" />
              <polygon points="20,20 13,13.2 12,12" fill="#caa23d" />
              <polygon points="4,20 10.8,13 12,12" fill="#f5d376" />
              <polygon points="4,4 11,10.8 12,12" fill="#caa23d" />
              <circle cx="12" cy="12" r="1.5" fill="#fffbee" />
            </svg>
          </span>

          <span
            className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-[0.24em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#dfb74a] to-[#99701d] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Cinzel', 'Trajan Pro', 'Baskerville', 'Georgia', serif" }}
          >
            RA
          </span>
        </div>

        {/* Subtitle with Filigree Rules & Laurel Accents */}
        {showSubtitle && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8f7742] to-transparent" />
            <span
              className="text-[9px] sm:text-[10px] lg:text-[11px] font-serif font-semibold tracking-[0.32em] uppercase text-[#e8dfc8] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] whitespace-nowrap"
              style={{ fontFamily: "'Cinzel', 'Trajan Pro', 'Baskerville', 'Georgia', serif" }}
            >
              CIVILISATION SIMULATION ENGINE
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8f7742] to-transparent" />
          </div>
        )}

        {/* Delicate Laurel Branch Ornament below subtitle */}
        {showSubtitle && (
          <div className="flex items-center justify-center gap-2 mt-0.5 opacity-80">
            <svg width="68" height="8" viewBox="0 0 68 8" fill="none" className="text-[#c6a76a]">
              {/* Left laurel branch */}
              <path d="M 32 4 C 24 3 14 5 4 4" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="28" cy="2" r="1" fill="currentColor" />
              <circle cx="20" cy="2" r="1" fill="currentColor" />
              <circle cx="12" cy="2" r="1" fill="currentColor" />
              {/* Center Diamond */}
              <polygon points="34,1 36,4 34,7 32,4" fill="#faecd0" />
              {/* Right laurel branch */}
              <path d="M 36 4 C 44 3 54 5 64 4" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="40" cy="2" r="1" fill="currentColor" />
              <circle cx="48" cy="2" r="1" fill="currentColor" />
              <circle cx="56" cy="2" r="1" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CivoraLogo({
  variant = 'full',
  size = 'md',
  className = '',
}: CivoraLogoProps) {
  if (variant === 'icon') {
    const iconSizes = { sm: 24, md: 32, lg: 44, xl: 56 };
    return <CivoraIcon size={iconSizes[size]} className={className} />;
  }

  if (variant === 'emblem') {
    const emblemSizes = { sm: 40, md: 64, lg: 96, xl: 140 };
    return <CivoraEmblem size={emblemSizes[size]} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <CivoraWordmark
        emblemSize={size === 'sm' ? 28 : size === 'md' ? 36 : 48}
        showSubtitle={false}
        className={className}
      />
    );
  }

  // Full Wordmark
  const fullSizes = { sm: 44, md: 58, lg: 76, xl: 96 };
  return <CivoraWordmark emblemSize={fullSizes[size]} className={className} />;
}

