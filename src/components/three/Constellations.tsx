import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { Constellation, GalaxyNode } from '@/utils/galaxy';

const FONT = `${import.meta.env.BASE_URL}Syne-Bold.ttf`;

interface Props {
  constellations: Constellation[];
  nodes: GalaxyNode[];
  activeGenre: string | null;
}

// Soft particle cloud around a nebula center, drifting subtly.
function NebulaDust({
  center,
  color,
  count = 90,
  radius = 5,
  visible,
}: {
  center: [number, number, number];
  color: string;
  count?: number;
  radius?: number;
  visible: boolean;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // points clustered toward center with gaussian-ish falloff
      const r = Math.pow(Math.random(), 0.6) * radius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = center[0] + r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = center[1] + r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = center[2] + r * Math.cos(phi);
    }
    return arr;
  }, [center, count, radius]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
      const mat = ref.current.material as THREE.PointsMaterial;
      mat.opacity = visible ? 0.55 : 0.08;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color={color} size={0.18} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </Points>
  );
}

// Breathing core: pulsing inner glow at the cluster center.
function PulseCore({ center, color, visible }: { center: [number, number, number]; color: string; visible: boolean }) {
  const inner = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (inner.current) {
      const s = 0.55 + Math.sin(t * 1.4) * 0.06;
      inner.current.scale.setScalar(s);
    }
    if (halo.current) {
      const s = 0.9 + Math.sin(t * 0.9) * 0.12;
      halo.current.scale.setScalar(s);
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (visible ? 0.35 : 0.06) + Math.sin(t * 0.9) * 0.06;
    }
  });

  return (
    <group position={center}>
      <mesh ref={halo}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={inner}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={visible ? 0.85 : 0.18} />
      </mesh>
    </group>
  );
}

// Pulsing dashed-feel beam between center and a node — uses opacity wave.
function Beam({
  from,
  to,
  color,
  visible,
  phase,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  visible: boolean;
  phase: number;
}) {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const base = visible ? 0.35 : 0.04;
    const wave = visible ? 0.18 * Math.sin(state.clock.elapsedTime * 1.4 + phase) : 0;
    ref.current.material.opacity = base + wave;
  });
  return <Line ref={ref} points={[from, to]} color={color} lineWidth={1.2} transparent opacity={0.3} />;
}

export default function Constellations({ constellations, nodes, activeGenre }: Props) {
  const nodeMap = useMemo(() => {
    const m = new Map<number, GalaxyNode>();
    nodes.forEach((n) => m.set(n.movie.id, n));
    return m;
  }, [nodes]);

  return (
    <>
      {constellations.map((c) => {
        const visible = activeGenre === null || activeGenre === c.genre;
        return (
          <group key={c.genre}>
            <NebulaDust center={c.center} color={c.color} visible={visible} />
            <PulseCore center={c.center} color={c.color} visible={visible} />

            {c.nodeIds.map((id, i) => {
              const node = nodeMap.get(id);
              if (!node) return null;
              return (
                <Beam
                  key={id}
                  from={c.center}
                  to={node.position}
                  color={c.color}
                  visible={visible}
                  phase={i * 0.7}
                />
              );
            })}

            <Billboard position={[c.center[0], c.center[1] + 4.5, c.center[2]]}>
              <Text
                font={FONT}
                fontSize={0.95}
                letterSpacing={0.2}
                color={c.color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={visible ? 0.95 : 0.18}
                outlineWidth={0.018}
                outlineColor={c.color}
                outlineOpacity={visible ? 0.55 : 0.1}
              >
                {c.genre.toUpperCase()}
              </Text>
              <Text
                font={FONT}
                position={[0, -0.95, 0]}
                fontSize={0.32}
                letterSpacing={0.45}
                color="#F2F0FF"
                anchorX="center"
                anchorY="middle"
                fillOpacity={visible ? 0.55 : 0.12}
              >
                {`${c.nodeIds.length} FILMS`}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </>
  );
}
