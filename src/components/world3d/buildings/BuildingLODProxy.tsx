import React from 'react';
import * as THREE from 'three';

// Low-Poly LOD Proxy Models for Distant Viewing
// Each proxy uses only 1-2 simple geometric meshes with shared materials for ultra-low draw calls

interface LODProxyProps {
  category: string;
  modelType: string;
  level: number;
  isSelected: boolean;
}

const resMat = new THREE.MeshStandardMaterial({ color: '#4a69bd', roughness: 0.6 });
const comMat = new THREE.MeshStandardMaterial({ color: '#d38c35', roughness: 0.5 });
const healthMat = new THREE.MeshStandardMaterial({ color: '#eb4d4b', roughness: 0.5 });
const eduMat = new THREE.MeshStandardMaterial({ color: '#8854d0', roughness: 0.6 });
const indMat = new THREE.MeshStandardMaterial({ color: '#57606f', roughness: 0.7 });
const infraMat = new THREE.MeshStandardMaterial({ color: '#00a8ff', roughness: 0.5 });
const envMat = new THREE.MeshStandardMaterial({ color: '#2ed573', roughness: 0.8 });
const citadelMat = new THREE.MeshStandardMaterial({ color: '#c6a76a', roughness: 0.4, metalness: 0.4 });
const selMat = new THREE.MeshStandardMaterial({ color: '#f5cd79', roughness: 0.3 });

export const BuildingLODProxy = React.memo(function BuildingLODProxy({
  category,
  modelType,
  level,
  isSelected,
}: LODProxyProps) {
  const heightBoost = (level - 1) * 0.4;

  if (category === 'residential') {
    const h = (modelType === 'arcology' || modelType === 'highrise' ? 4.8 : 2.4) + heightBoost;
    return (
      <group raycast={() => null}>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[2.0, h, 2.0]} />
          <primitive object={isSelected ? selMat : resMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (category === 'commercial') {
    const h = (modelType === 'tower' || modelType === 'complex' ? 5.2 : 2.2) + heightBoost;
    return (
      <group raycast={() => null}>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[2.2, h, 2.2]} />
          <primitive object={isSelected ? selMat : comMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (category === 'healthcare') {
    const h = 2.8 + heightBoost;
    return (
      <group raycast={() => null}>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[2.8, h, 2.4]} />
          <primitive object={isSelected ? selMat : healthMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (category === 'education') {
    const h = 2.6 + heightBoost;
    return (
      <group raycast={() => null}>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[2.6, h, 2.6]} />
          <primitive object={isSelected ? selMat : eduMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (category === 'industrial') {
    const h = 2.2 + heightBoost;
    return (
      <group raycast={() => null}>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[3.2, h, 2.6]} />
          <primitive object={isSelected ? selMat : indMat} attach="material" />
        </mesh>
        <mesh position={[1.1, h + 0.8, -0.6]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 1.6, 6]} />
          <primitive object={indMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (category === 'infrastructure' || category === 'government') {
    if (modelType === 'citadel') {
      return (
        <group raycast={() => null}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[2.2, 2.6, 3.6, 12]} />
            <primitive object={isSelected ? selMat : citadelMat} attach="material" />
          </mesh>
          <mesh position={[0, 4.2, 0]} castShadow>
            <coneGeometry args={[1.6, 1.8, 12]} />
            <primitive object={citadelMat} attach="material" />
          </mesh>
        </group>
      );
    }
    const h = 2.0 + heightBoost;
    return (
      <group raycast={() => null}>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[2.8, h, 2.4]} />
          <primitive object={isSelected ? selMat : infraMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (category === 'environment' || category === 'agriculture') {
    return (
      <group raycast={() => null}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[1.8, 8, 6]} />
          <primitive object={isSelected ? selMat : envMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // Default fallback proxy
  return (
    <group raycast={() => null}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2.0, 3.0, 2.0]} />
        <primitive object={isSelected ? selMat : resMat} attach="material" />
      </mesh>
    </group>
  );
});

