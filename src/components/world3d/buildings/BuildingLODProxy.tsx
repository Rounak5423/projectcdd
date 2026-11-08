import React from 'react';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';

interface LODProxyProps {
  catalogId?: string;
  category: string;
  modelType: string;
  level: number;
  isSelected: boolean;
}

// Architectural Material Palette for High-Fidelity Silhouette Rendering
const wallWhiteMat = new THREE.MeshStandardMaterial({ color: '#e6eae3', roughness: 0.5 });
const wallStoneMat = new THREE.MeshStandardMaterial({ color: '#c5cdc4', roughness: 0.6 });
const wallBrickMat = new THREE.MeshStandardMaterial({ color: '#995a3a', roughness: 0.7 });
const wallCharcoalMat = new THREE.MeshStandardMaterial({ color: '#2f3833', roughness: 0.4 });
const wallIndustrialMat = new THREE.MeshStandardMaterial({ color: '#444e54', roughness: 0.7 });

const roofSlateMat = new THREE.MeshStandardMaterial({ color: '#273340', roughness: 0.35, metalness: 0.2 });
const roofCopperMat = new THREE.MeshStandardMaterial({ color: '#2c8a66', roughness: 0.4, metalness: 0.4 });
const roofGoldMat = new THREE.MeshStandardMaterial({ color: '#c6a76a', roughness: 0.25, metalness: 0.7 });

const glassDayMat = new THREE.MeshStandardMaterial({ color: '#2c3e50', roughness: 0.1, metalness: 0.8 });
const glassNightMat = new THREE.MeshStandardMaterial({
  color: '#ffeaa7',
  emissive: '#ffbe44',
  emissiveIntensity: 1.8,
  roughness: 0.3,
});

const plinthMat = new THREE.MeshStandardMaterial({ color: '#242a25', roughness: 0.85 });
const trimWoodMat = new THREE.MeshStandardMaterial({ color: '#7a5538', roughness: 0.6 });
const steelMat = new THREE.MeshStandardMaterial({ color: '#3d4440', roughness: 0.4, metalness: 0.8 });
const redCrossMat = new THREE.MeshBasicMaterial({ color: '#e74c3c' });
const selGlowMat = new THREE.MeshStandardMaterial({ color: '#e0be70', roughness: 0.3, emissive: '#c6a76a', emissiveIntensity: 0.4 });

// Underground foundation plinth (prevents any floating gaps across uneven terrain)
function FoundationPlinth({ width = 3.6, depth = 3.2 }: { width?: number; depth?: number }) {
  return (
    <group raycast={() => null}>
      {/* Subterranean anchor slab sinking -0.55m into bedrock */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <boxGeometry args={[width, 0.55, depth]} />
        <primitive object={plinthMat} attach="material" />
      </mesh>
      {/* Surface curb apron */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[width + 0.3, 0.08, depth + 0.3]} />
        <primitive object={plinthMat} attach="material" />
      </mesh>
    </group>
  );
}

export const BuildingLODProxy = React.memo(function BuildingLODProxy({
  catalogId = '',
  category,
  modelType,
  level,
  isSelected,
}: LODProxyProps) {
  const isNight = useIsNight();
  const glassMat = isNight ? glassNightMat : glassDayMat;
  const heightBoost = (level - 1) * 0.4;
  const cid = catalogId.toLowerCase();

  // 1. RESIDENTIAL CATEGORY
  if (category === 'residential') {
    // A. Single-Family House / Villa (Pitched Roof, Porch, Chimney)
    if (cid.includes('house') || modelType === 'house') {
      const h = 2.4 + heightBoost;
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={3.4} depth={3.0} />

          {/* Main House Body */}
          <mesh position={[-0.3, h * 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, h * 0.85, 2.1]} />
            <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
          </mesh>

          {/* Pitched Gable Roof with Eaves */}
          <mesh position={[-0.3, h * 0.85 + 0.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[1.55, 1.55, 2.35]} />
            <primitive object={roofSlateMat} attach="material" />
          </mesh>

          {/* Horizontal Window Band & Doorway Silhouette */}
          <mesh position={[-0.3, h * 0.45, 1.08]} castShadow>
            <boxGeometry args={[1.6, 0.4, 0.05]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
          <mesh position={[-0.3, 0.4, 1.08]}>
            <boxGeometry args={[0.5, 0.8, 0.04]} />
            <primitive object={trimWoodMat} attach="material" />
          </mesh>

          {/* Attached Garage / Side Wing */}
          <mesh position={[0.9, h * 0.3, -0.1]} castShadow>
            <boxGeometry args={[1.3, h * 0.6, 1.6]} />
            <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
          </mesh>

          {/* Chimney Stack */}
          <mesh position={[-0.8, h + 0.4, -0.4]} castShadow>
            <boxGeometry args={[0.35, 0.9, 0.35]} />
            <primitive object={wallBrickMat} attach="material" />
          </mesh>
        </group>
      );
    }

    // B. Modular Townhouse / Brownstone Habitat
    if (cid.includes('modular') || modelType === 'modular') {
      const h = 3.2 + heightBoost * 0.6;
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={3.6} depth={3.2} />
          {/* Main Brick Facade */}
          <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, h, 2.6]} />
            <primitive object={isSelected ? selGlowMat : wallBrickMat} attach="material" />
          </mesh>
          {/* Mansard Roof */}
          <mesh position={[0, h + 0.45, 0]} castShadow>
            <boxGeometry args={[3.0, 0.7, 2.4]} />
            <primitive object={roofSlateMat} attach="material" />
          </mesh>
          {/* Window Bands */}
          {[-0.8, 0.8].map((wx, i) => (
            <mesh key={i} position={[wx, h * 0.5, 1.32]}>
              <boxGeometry args={[0.7, h * 0.75, 0.04]} />
              <primitive object={glassMat} attach="material" />
            </mesh>
          ))}
        </group>
      );
    }

    // C. High-Rise Arcology / Stepped Residential Spire
    const towerH = 5.2 + heightBoost * 1.2;
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.2} depth={3.8} />

        {/* Podium Base */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 1.6, 3.2]} />
          <primitive object={isSelected ? selGlowMat : wallCharcoalMat} attach="material" />
        </mesh>

        {/* Central Tower Shaft */}
        <mesh position={[0, towerH * 0.5 + 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, towerH, 2.6]} />
          <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
        </mesh>

        {/* Prominent Vertical Balcony & Window Strip Columns */}
        {[-0.9, 0, 0.9].map((offset, i) => (
          <mesh key={i} position={[offset, towerH * 0.5 + 0.5, 1.33]} castShadow>
            <boxGeometry args={[0.55, towerH * 0.85, 0.08]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
        ))}

        {/* Penthouse Setback Crown */}
        <mesh position={[0, towerH + 0.9, 0]} castShadow>
          <boxGeometry args={[1.8, 0.8, 1.8]} />
          <primitive object={roofCopperMat} attach="material" />
        </mesh>

        {/* Rooftop Pergola / Antenna Mast */}
        <mesh position={[0, towerH + 1.8, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 1.2, 6]} />
          <primitive object={steelMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 2. COMMERCIAL CATEGORY
  if (category === 'commercial') {
    // A. Retail Boutique / Shops (Storefront, Awning, Signboard)
    if (modelType === 'shop') {
      const h = 2.4 + heightBoost;
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={3.4} depth={2.8} />

          {/* Storefront Main Body */}
          <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.7, h, 2.1]} />
            <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
          </mesh>

          {/* Expansive Display Window Strip */}
          <mesh position={[0.3, 0.7, 1.07]}>
            <boxGeometry args={[1.5, 0.75, 0.05]} />
            <primitive object={glassMat} attach="material" />
          </mesh>

          {/* Entrance Door */}
          <mesh position={[-0.8, 0.5, 1.07]}>
            <boxGeometry args={[0.6, 1.0, 0.05]} />
            <primitive object={wallCharcoalMat} attach="material" />
          </mesh>

          {/* Storefront Canopy Awning */}
          <mesh position={[0.3, 1.15, 1.25]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[1.7, 0.06, 0.5]} />
            <primitive object={redCrossMat} attach="material" />
          </mesh>

          {/* Parapet Roof with HVAC Plant */}
          <mesh position={[-0.6, h + 0.25, 0]} castShadow>
            <boxGeometry args={[0.7, 0.5, 0.7]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
        </group>
      );
    }

    // B. Corporate Office Tower / Commercial Exchange (Glass Facade & Stepped Spire)
    const comH = 5.6 + heightBoost * 1.3;
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.2} depth={4.0} />

        {/* Grand Civic Retail Podium */}
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 1.8, 3.4]} />
          <primitive object={isSelected ? selGlowMat : wallCharcoalMat} attach="material" />
        </mesh>

        {/* Glass Skyscraper Tower Shaft */}
        <mesh position={[0, comH * 0.5 + 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.0, comH, 2.8]} />
          <primitive object={glassMat} attach="material" />
        </mesh>

        {/* Architectural Steel Corner Columns */}
        {[-1.5, 1.5].map((x, xi) =>
          [-1.4, 1.4].map((z, zi) => (
            <mesh key={`${xi}_${zi}`} position={[x, comH * 0.5 + 0.6, z]}>
              <boxGeometry args={[0.2, comH, 0.2]} />
              <primitive object={steelMat} attach="material" />
            </mesh>
          ))
        )}

        {/* Stepped Corporate Crown & Zenith Spire */}
        <mesh position={[0, comH + 0.9, 0]} castShadow>
          <boxGeometry args={[2.0, 0.8, 1.9]} />
          <primitive object={roofSlateMat} attach="material" />
        </mesh>
        <mesh position={[0, comH + 1.9, 0]}>
          <coneGeometry args={[0.25, 1.4, 8]} />
          <primitive object={roofGoldMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 3. HEALTHCARE CATEGORY (Hospital & Medical Clinics)
  if (category === 'healthcare') {
    const medH = 3.2 + heightBoost * 0.8;
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.4} depth={3.8} />

        {/* Central Clinical Pavilion (Hospital White) */}
        <mesh position={[0, medH * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, medH, 2.6]} />
          <primitive object={isSelected ? selGlowMat : wallWhiteMat} attach="material" />
        </mesh>

        {/* Cross-Wing Lateral Medical Ward */}
        <mesh position={[-0.4, medH * 0.45, 0.3]} castShadow receiveShadow>
          <boxGeometry args={[2.2, medH * 0.9, 3.2]} />
          <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
        </mesh>

        {/* Emergency Vehicle Entrance Canopy Portico */}
        <mesh position={[0.8, 0.6, 1.6]}>
          <boxGeometry args={[1.6, 0.12, 1.0]} />
          <primitive object={wallCharcoalMat} attach="material" />
        </mesh>

        {/* Horizontal Medical Glass Ribbons */}
        <mesh position={[0, medH * 0.65, 1.32]}>
          <boxGeometry args={[3.2, 0.5, 0.06]} />
          <primitive object={glassMat} attach="material" />
        </mesh>

        {/* Distinctive Red Cross Healthcare Emblem */}
        <group position={[0.8, medH * 0.75, 1.35]}>
          <mesh>
            <boxGeometry args={[0.55, 0.16, 0.05]} />
            <primitive object={redCrossMat} attach="material" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.16, 0.55, 0.05]} />
            <primitive object={redCrossMat} attach="material" />
          </mesh>
        </group>

        {/* Rooftop Helipad / Ventilation */}
        <mesh position={[-0.6, medH + 0.1, 0.3]}>
          <cylinderGeometry args={[0.85, 0.85, 0.1, 16]} />
          <primitive object={wallCharcoalMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 4. EDUCATION CATEGORY (Polytechnic Academy & Schools)
  if (category === 'education') {
    const eduH = 2.8 + heightBoost * 0.7;
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.2} depth={3.6} />

        {/* Classical Academic Brick/Stone Wings */}
        <mesh position={[0, eduH * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, eduH, 2.5]} />
          <primitive object={isSelected ? selGlowMat : wallBrickMat} attach="material" />
        </mesh>

        {/* Pitched Slate Roof */}
        <mesh position={[0, eduH + 0.45, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[1.9, 1.9, 2.6]} />
          <primitive object={roofSlateMat} attach="material" />
        </mesh>

        {/* Central Academic Clock Tower / Cupola */}
        <mesh position={[0, eduH + 1.2, 0]} castShadow>
          <boxGeometry args={[1.0, 1.4, 1.0]} />
          <primitive object={wallWhiteMat} attach="material" />
        </mesh>
        <mesh position={[0, eduH + 2.2, 0]} castShadow>
          <coneGeometry args={[0.65, 0.9, 8]} />
          <primitive object={roofCopperMat} attach="material" />
        </mesh>

        {/* Symmetrical Window Grid Pattern */}
        {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
          <mesh key={i} position={[x, eduH * 0.5, 1.28]}>
            <boxGeometry args={[0.45, eduH * 0.55, 0.05]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
        ))}

        {/* Columned Entrance Portico */}
        <mesh position={[0, 0.5, 1.4]}>
          <boxGeometry args={[1.2, 0.95, 0.4]} />
          <primitive object={wallWhiteMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 5. INDUSTRIAL CATEGORY (Factories, Smelters, Warehouses)
  if (category === 'industrial') {
    const indH = 2.6 + heightBoost * 0.6;
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.4} depth={3.8} />

        {/* Heavy Industrial Cladding Hall */}
        <mesh position={[-0.2, indH * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, indH, 3.0]} />
          <primitive object={isSelected ? selGlowMat : wallIndustrialMat} attach="material" />
        </mesh>

        {/* Sawtooth / Monitor Factory Roof */}
        <mesh position={[-0.2, indH + 0.45, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[1.8, 1.8, 3.1]} />
          <primitive object={steelMat} attach="material" />
        </mesh>

        {/* Twin Industrial Chimneys / Exhaust Stacks */}
        <mesh position={[1.3, indH + 1.2, -0.6]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 2.4, 8]} />
          <primitive object={wallBrickMat} attach="material" />
        </mesh>
        <mesh position={[1.3, indH + 0.9, 0.6]} castShadow>
          <cylinderGeometry args={[0.18, 0.24, 1.8, 8]} />
          <primitive object={wallBrickMat} attach="material" />
        </mesh>

        {/* Large Freight Bay Loading Doors */}
        <mesh position={[-0.4, 0.7, 1.52]}>
          <boxGeometry args={[1.6, 1.3, 0.06]} />
          <primitive object={wallCharcoalMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 6. ENERGY & POWER CATEGORY (Tokamak Fusion, Solar Arrays, Wind Turbines)
  if (category === 'energy') {
    if (modelType === 'turbine') {
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={2.4} depth={2.4} />
          {/* Tapered Wind Turbine Tower */}
          <mesh position={[0, 2.8, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.28, 5.6, 8]} />
            <primitive object={isSelected ? selGlowMat : wallWhiteMat} attach="material" />
          </mesh>
          {/* Nacelle Generator Housing */}
          <mesh position={[0, 5.6, 0.2]} castShadow>
            <boxGeometry args={[0.45, 0.4, 1.1]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
          {/* Triple Rotor Blade Star */}
          {[0, 1, 2].map((i) => {
            const rot = (i * Math.PI * 2) / 3;
            return (
              <mesh key={i} position={[0, 5.6, 0.75]} rotation={[0, 0, rot]}>
                <boxGeometry args={[0.1, 2.4, 0.03]} />
                <primitive object={wallWhiteMat} attach="material" />
              </mesh>
            );
          })}
        </group>
      );
    }

    if (modelType === 'solar') {
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={3.8} depth={3.4} />
          {/* 3 Tilted Photovoltaic Collector Arrays */}
          {[-1.0, 0, 1.0].map((x, i) => (
            <mesh key={i} position={[x, 0.7, 0]} rotation={[0.45, 0, 0]} castShadow>
              <boxGeometry args={[0.85, 0.06, 2.2]} />
              <primitive object={roofSlateMat} attach="material" />
            </mesh>
          ))}
          {/* Support Space Frame Stanchions */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[3.2, 0.4, 2.6]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
        </group>
      );
    }

    // Default Fusion Tokamak Generator
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.2} depth={4.0} />
        {/* Tokamak Reactor Containment Ring */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.8, 2.2, 2.4, 16]} />
          <primitive object={isSelected ? selGlowMat : wallCharcoalMat} attach="material" />
        </mesh>
        {/* Toroidal Cooling Manifold Dome */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <sphereGeometry args={[1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={steelMat} attach="material" />
        </mesh>
        {/* Power Transformer Sub-bays */}
        <mesh position={[1.6, 0.6, 0]}>
          <boxGeometry args={[0.9, 1.1, 1.8]} />
          <primitive object={steelMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 7. INFRASTRUCTURE & GOVERNMENT (Water Tower, Water Treatment, High Council Citadel)
  if (category === 'infrastructure' || category === 'government') {
    if (modelType === 'citadel' || cid.includes('citadel')) {
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={6.8} depth={5.6} />
          {/* Base Terrace Podium & Stairs */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.8, 0.7, 5.4]} />
            <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.15, 2.9]} receiveShadow>
            <boxGeometry args={[3.4, 0.3, 0.8]} />
            <primitive object={wallCharcoalMat} attach="material" />
          </mesh>
          {/* East and West Legislative Wings */}
          {[-2.3, 2.3].map((wx, i) => (
            <group key={i} position={[wx, 1.35, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.0, 1.3, 4.4]} />
                <primitive object={wallStoneMat} attach="material" />
              </mesh>
              <mesh position={[0, 0.95, 0]} castShadow>
                <boxGeometry args={[1.8, 0.6, 4.2]} />
                <primitive object={roofSlateMat} attach="material" />
              </mesh>
            </group>
          ))}
          {/* Central Portico with Pediment */}
          <mesh position={[0, 1.4, 1.8]} castShadow>
            <boxGeometry args={[2.6, 1.4, 0.8]} />
            <primitive object={wallWhiteMat} attach="material" />
          </mesh>
          <mesh position={[0, 2.3, 1.8]} castShadow>
            <cylinderGeometry args={[0.02, 1.5, 0.4, 3]} />
            <primitive object={wallWhiteMat} attach="material" />
          </mesh>
          {/* Rotunda Drum & Golden Dome */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[1.7, 1.7, 1.6, 16]} />
            <primitive object={wallStoneMat} attach="material" />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <sphereGeometry args={[1.6, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={roofGoldMat} attach="material" />
          </mesh>
          <mesh position={[0, 4.5, 0]}>
            <coneGeometry args={[0.2, 0.8, 8]} />
            <primitive object={roofGoldMat} attach="material" />
          </mesh>
        </group>
      );
    }

    if (modelType === 'water_treatment') {
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={3.8} depth={3.4} />
          {/* Elevated Cylindrical Water Storage Tank on Structural Columns */}
          <mesh position={[0, 2.6, 0]} castShadow>
            <cylinderGeometry args={[1.25, 1.25, 1.8, 16]} />
            <primitive object={isSelected ? selGlowMat : steelMat} attach="material" />
          </mesh>
          {/* Domed Roof Cap */}
          <mesh position={[0, 3.65, 0]} castShadow>
            <sphereGeometry args={[1.27, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={roofSlateMat} attach="material" />
          </mesh>
          {/* 4 Sturdy Lattice Support Pillars */}
          {[-0.8, 0.8].map((x, xi) =>
            [-0.8, 0.8].map((z, zi) => (
              <mesh key={`${xi}_${zi}`} position={[x, 1.0, z]}>
                <cylinderGeometry args={[0.07, 0.09, 2.0, 6]} />
                <primitive object={steelMat} attach="material" />
              </mesh>
            ))
          )}
        </group>
      );
    }

    // Default Infrastructure Substation
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={3.6} depth={3.2} />
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 2.0, 2.4]} />
          <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[1.6, 0.5, 1.6]} />
          <primitive object={steelMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 8. AGRICULTURE & BIOSPHERE (Bio-Domes & Parklands)
  if (category === 'agriculture' || category === 'environment') {
    if (modelType === 'hydroponic' || modelType === 'dome') {
      return (
        <group raycast={() => null}>
          <FoundationPlinth width={4.2} depth={4.2} />
          {/* Circular Hydroponic Pod Retaining Wall */}
          <mesh position={[0, 0.4, 0]} receiveShadow>
            <cylinderGeometry args={[2.0, 2.1, 0.7, 18]} />
            <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
          </mesh>
          {/* Geodesic Translucent Bio-Dome Shell */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <sphereGeometry args={[1.85, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
          {/* Internal Biosphere Spire */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.1, 0.15, 1.4, 8]} />
            <primitive object={roofCopperMat} attach="material" />
          </mesh>
        </group>
      );
    }

    // Elysium Central Biosphere Park
    return (
      <group raycast={() => null}>
        <FoundationPlinth width={4.2} depth={3.8} />
        {/* Landscaped Green Lawn Apron */}
        <mesh position={[0, 0.18, 0]} receiveShadow>
          <boxGeometry args={[3.8, 0.35, 3.4]} />
          <primitive object={roofCopperMat} attach="material" />
        </mesh>
        {/* Central Garden Pavilion Pergola */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 1.4, 8, 1, true]} />
          <primitive object={wallWhiteMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.85, 0]} castShadow>
          <coneGeometry args={[1.3, 0.8, 8]} />
          <primitive object={roofSlateMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // 9. DEFAULT ARCHITECTURAL FALLBACK
  return (
    <group raycast={() => null}>
      <FoundationPlinth width={3.4} depth={3.0} />
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.6, 2.2]} />
        <primitive object={isSelected ? selGlowMat : wallStoneMat} attach="material" />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <boxGeometry args={[1.6, 0.4, 1.5]} />
        <primitive object={roofSlateMat} attach="material" />
      </mesh>
    </group>
  );
});
