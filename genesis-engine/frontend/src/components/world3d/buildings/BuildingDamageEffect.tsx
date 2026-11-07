import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BuildingDamageEffect({
  health,
  status,
}: {
  health: number;
  status: 'active' | 'constructing' | 'upgrading' | 'offline';
}) {
  const smokeRef1 = useRef<THREE.Group>(null);
  const smokeRef2 = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.Mesh>(null);

  const isDamaged = health < 70;
  const isCritical = health < 45 || status === 'offline';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (isDamaged && smokeRef1.current) {
      smokeRef1.current.position.y = 1.8 + ((t * 1.6) % 1.4);
      smokeRef1.current.scale.setScalar(0.4 + ((t * 1.6) % 1.4) * 0.6);
    }
    if (isCritical && smokeRef2.current) {
      smokeRef2.current.position.y = 1.8 + (((t + 0.4) * 1.6) % 1.4);
      smokeRef2.current.scale.setScalar(0.4 + (((t + 0.4) * 1.6) % 1.4) * 0.6);
    }
    if (isDamaged && sparkRef.current) {
      const isVisible = Math.sin(t * 18.0) > 0.4;
      sparkRef.current.visible = isVisible;
    }
  });

  if (!isDamaged && status !== 'offline') return null;

  return (
    <group>
      {/* Damage Smoke Plume 1 */}
      <group ref={smokeRef1} position={[-0.4, 2.0, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.26, 6, 6]} />
          <meshBasicMaterial color="#403c39" transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Heavy Damage Smoke Plume 2 */}
      {isCritical && (
        <group ref={smokeRef2} position={[0.5, 2.0, -0.4]}>
          <mesh>
            <sphereGeometry args={[0.3, 6, 6]} />
            <meshBasicMaterial color="#2d2926" transparent opacity={0.55} />
          </mesh>
        </group>
      )}

      {/* Short Circuit Electrical Sparks */}
      <mesh ref={sparkRef} position={[0.2, 1.2, 0.8]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshBasicMaterial color="#ffeaa7" />
      </mesh>
    </group>
  );
}

