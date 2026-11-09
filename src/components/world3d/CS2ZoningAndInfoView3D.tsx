import React, { useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight } from './Terrain';
import { soundFx } from '../../services/soundFx';

// Cities: Skylines II Color Palette
const ZONE_COLORS = {
  residential_low: '#2ecc71',
  residential_high: '#27ae60',
  commercial_low: '#3498db',
  commercial_high: '#2980b9',
  industrial: '#f39c12',
  office: '#9b59b6',
  none: '#7f8c8d',
};

export default function CS2ZoningAndInfoView3D() {
  const {
    activeInfoView,
    activeZoneTool,
    zonedTiles,
    paintZoneTile,
    isBulldozerActive,
    demolishBuilding,
    placedBuildings,
    selectBuilding,
    triggerToast,
  } = useGameState();

  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);

  // 1. Zoned Cell Grid Meshes (Cities: Skylines II Style Curb Lot Grid)
  const zoneCells = useMemo(() => {
    return zonedTiles.map((tile) => {
      const y = getTerrainHeight(tile.x, tile.z) + 0.08;
      const color = ZONE_COLORS[tile.zoneType] || '#ffffff';
      return {
        ...tile,
        y,
        color,
      };
    });
  }, [zonedTiles]);

  return (
    <group name="cs2-simulation-layer">
      {/* 1. CITIES SKYLINES II ZONING CELL OVERLAYS (Visible only when zoning tool or zoning/land value info view is active) */}
      {(Boolean(activeZoneTool) || activeInfoView === 'land_value') &&
        zoneCells.map((cell) => (
          <group key={cell.id} position={[cell.x, cell.y, cell.z]}>
            {/* Base Zoned Lot Square */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                if (activeZoneTool) {
                  e.stopPropagation();
                  paintZoneTile(cell.x, cell.z, activeZoneTool);
                }
              }}
            >
              <planeGeometry args={[3.6, 3.6]} />
              <meshBasicMaterial
                color={cell.color}
                transparent
                opacity={activeZoneTool ? 0.65 : 0.35}
                depthWrite={false}
              />
            </mesh>

            {/* Border Wireframe for authentic CS2 cell look */}
            <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(3.6, 3.6)]} />
              <lineBasicMaterial color={cell.color} linewidth={2} />
            </lineSegments>

            {/* Dynamic Building Level Badge (Level 1–5 in CS2) */}
            {cell.isOccupied && activeInfoView === 'land_value' && (
              <Html position={[0, 1.2, 0]} center distanceFactor={28} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-black/80 border border-[#2ecc71] text-[#2ecc71] font-mono text-[9px] font-bold shadow-md">
                  LVL {cell.buildingLevel}
                </div>
              </Html>
            )}
          </group>
        ))}

      {/* 2. ELECTRICITY INFO VIEW OVERLAY */}
      {activeInfoView === 'electricity' && (
        <group name="electricity-overlay">
          {placedBuildings.map((b) => {
            const isPowerSource = b.category === 'energy';
            return (
              <group key={`elec-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.8, 2.6, 16]} />
                  <meshBasicMaterial
                    color={isPowerSource ? '#f1c40f' : '#2ecc71'}
                    transparent
                    opacity={0.7}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <Html position={[0, 4.0, 0]} center distanceFactor={35} pointerEvents="none">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1b1c10]/90 border border-[#f1c40f] text-[#f1c40f] text-[9px] font-mono font-bold shadow-lg">
                    <span>⚡</span>
                    <span>{isPowerSource ? 'GENERATOR' : 'GRID CONNECTED'}</span>
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      )}

      {/* 3. WATER & SEWAGE INFO VIEW OVERLAY */}
      {activeInfoView === 'water' && (
        <group name="water-overlay">
          {placedBuildings.map((b) => (
            <group key={`water-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.6, 2.3, 16]} />
                <meshBasicMaterial color="#3498db" transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={35} pointerEvents="none">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#0e171f]/90 border border-[#3498db] text-[#5dade2] text-[9px] font-mono font-bold shadow-lg">
                  <span>💧</span>
                  <span>WATER FLOW OK</span>
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 4. TRAFFIC FLOW INFO VIEW OVERLAY */}
      {activeInfoView === 'traffic' && (
        <group name="traffic-overlay">
          {placedBuildings.map((b, idx) => {
            const isHeavyTraffic = idx % 3 === 0;
            const color = isHeavyTraffic ? '#e74c3c' : '#2ecc71';
            return (
              <group key={`traffic-${b.id}`} position={[b.x, b.y + 0.12, b.z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[2.5, 16]} />
                  <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
                </mesh>
                {isHeavyTraffic && (
                  <Html position={[0, 3.6, 0]} center distanceFactor={32} pointerEvents="none">
                    <div className="px-1.5 py-0.5 rounded bg-[#2b1417]/90 border border-[#e74c3c] text-[#f5b7b1] text-[9px] font-mono font-bold">
                      🚦 CONGESTION
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      )}

      {/* 5. POLLUTION PLUMES OVERLAY */}
      {activeInfoView === 'pollution' && (
        <group name="pollution-overlay">
          {placedBuildings
            .filter((b) => b.category === 'industrial' || b.category === 'energy')
            .map((b) => (
              <group key={`smog-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[7.5, 24]} />
                  <meshBasicMaterial color="#8e44ad" transparent opacity={0.35} side={THREE.DoubleSide} />
                </mesh>
                <Html position={[0, 5.0, 0]} center distanceFactor={32} pointerEvents="none">
                  <div className="px-2 py-0.5 rounded bg-[#231526]/90 border border-[#9b59b6] text-[#d7bde2] text-[9px] font-mono font-bold">
                    🏭 INDUSTRIAL PLUME
                  </div>
                </Html>
              </group>
            ))}
        </group>
      )}

      {/* 5.1 CRIME & SECURITY OVERLAY */}
      {activeInfoView === 'crime' && (
        <group name="crime-overlay">
          {placedBuildings.map((b) => (
            <group key={`sec-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.5, 3.2, 16]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={32} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-[#0a192f]/90 border border-[#3b82f6] text-[#93c5fd] text-[9px] font-mono font-bold">
                  🛡️ PATROL: 98% SECURE
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 5.2 HEALTHCARE COVERAGE OVERLAY */}
      {activeInfoView === 'health' && (
        <group name="health-overlay">
          {placedBuildings.map((b) => (
            <group key={`hlth-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.0, 3.0, 16]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={32} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-[#2b0d0e]/90 border border-[#ef4444] text-[#fca5a5] text-[9px] font-mono font-bold">
                  ❤️ CLINIC ACCESS / 82 YR
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 5.3 EDUCATION COGNITIVE GRID OVERLAY */}
      {activeInfoView === 'education' && (
        <group name="education-overlay">
          {placedBuildings.map((b) => (
            <group key={`edu-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.2, 3.4, 16]} />
                <meshBasicMaterial color="#8b5cf6" transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={32} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-[#1f1035]/90 border border-[#8b5cf6] text-[#c4b5fd] text-[9px] font-mono font-bold">
                  🎓 ACADEMY COGNITIVE SHIELD
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 5.4 PUBLIC TRANSIT CORRIDORS OVERLAY */}
      {activeInfoView === 'transit' && (
        <group name="transit-overlay">
          {placedBuildings.map((b) => (
            <group key={`trans-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.6, 2.4, 16]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.7} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={32} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-[#092618]/90 border border-[#10b981] text-[#6ee7b7] text-[9px] font-mono font-bold">
                  🚌 TRANSIT STOP: 5 MIN
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 5.5 NOISE EXPOSURE OVERLAY */}
      {activeInfoView === 'noise' && (
        <group name="noise-overlay">
          {placedBuildings.map((b) => (
            <group key={`noise-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[5.0, 16]} />
                <meshBasicMaterial color="#e67e22" transparent opacity={0.25} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={32} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-[#2e1806]/90 border border-[#e67e22] text-[#fdba74] text-[9px] font-mono font-bold">
                  🔊 58 dB AMBIENT
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 5.6 UNEMPLOYMENT & JOB MARKET OVERLAY */}
      {activeInfoView === 'unemployment' && (
        <group name="unemployment-overlay">
          {placedBuildings.map((b) => (
            <group key={`unemp-${b.id}`} position={[b.x, b.y + 0.1, b.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.8, 2.5, 16]} />
                <meshBasicMaterial color="#f97316" transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 3.8, 0]} center distanceFactor={32} pointerEvents="none">
                <div className="px-1.5 py-0.5 rounded bg-[#2a1306]/90 border border-[#f97316] text-[#fed7aa] text-[9px] font-mono font-bold">
                  💼 JOBS: 91% SATURATED
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 6. BULLDOZER INTERACTION TARGETING OVERLAY */}
      {isBulldozerActive && (
        <group name="bulldozer-targeting">
          {placedBuildings.map((b) => (
            <mesh
              key={`demolish-${b.id}`}
              position={[b.x, b.y + 1.5, b.z]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredBuildingId(b.id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                if (hoveredBuildingId === b.id) setHoveredBuildingId(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playExplosion?.();
                demolishBuilding(b.id);
                triggerToast({
                  type: 'build',
                  title: `🚜 DEMOLISHED: ${b.name}`,
                  subtitle: `Reclaimed +150 Materials. Site cleared.`,
                });
              }}
            >
              <boxGeometry args={[4.2, 4.2, 4.2]} />
              <meshBasicMaterial
                color="#e74c3c"
                wireframe
                transparent
                opacity={hoveredBuildingId === b.id ? 0.9 : 0.25}
              />
              {hoveredBuildingId === b.id && (
                <Html position={[0, 3.2, 0]} center distanceFactor={28} pointerEvents="none">
                  <div className="px-2 py-1 rounded bg-[#3b1c1e] border-2 border-[#e74c3c] text-white font-mono text-[10px] font-bold shadow-2xl flex items-center gap-1 animate-bounce">
                    <span>🚜</span>
                    <span>CLICK TO DEMOLISH</span>
                  </div>
                </Html>
              )}
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

