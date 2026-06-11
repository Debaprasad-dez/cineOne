import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { GalaxyNode, Constellation } from '@/utils/galaxy';
import { glowTexture, nebulaTexture } from '@/utils/glowTexture';
import MovieNode from './MovieNode';
import Constellations from './Constellations';

export type GalaxyMode = 'cluster' | 'tunnel';

interface SceneProps {
  nodes: GalaxyNode[];
  constellations: Constellation[];
  activeGenre: string | null;
  selected: GalaxyNode | null;
  onSelect: (n: GalaxyNode | null) => void;
  onHover: (n: GalaxyNode | null) => void;
  embedded?: boolean;
}

// Tau Ceti — a warm amber heart at the galaxy's center, breathing slowly.
function GalacticCore() {
  const outer = useRef<THREE.Sprite>(null);
  const inner = useRef<THREE.Sprite>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outer.current) {
      outer.current.scale.setScalar(13 + Math.sin(t * 0.5) * 1.2);
      (outer.current.material as THREE.SpriteMaterial).opacity = 0.3 + Math.sin(t * 0.5) * 0.06;
    }
    if (inner.current) {
      inner.current.scale.setScalar(5.5 + Math.sin(t * 0.9 + 1) * 0.5);
    }
  });

  return (
    <group>
      <sprite ref={outer} scale={[13, 13, 1]} raycast={() => null}>
        <spriteMaterial map={nebulaTexture('rgba(232,161,74,1)')} transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={inner} scale={[5.5, 5.5, 1]} raycast={() => null}>
        <spriteMaterial map={glowTexture('rgba(255,214,150,1)')} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight intensity={1.6} color="#E8A14A" distance={50} decay={1.8} />
    </group>
  );
}

// Spiral dust disk — thousands of faint motes swirling around the core,
// shifting from warm amber near the heart to cold violet at the rim.
function DustDisk() {
  const COUNT = 1800;
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const inner = new THREE.Color('#E8A14A');
    const outer = new THREE.Color('#7B5EA7');
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const arm = i % 3;
      const t = Math.pow(Math.random(), 0.7);
      const r = 4 + t * 26;
      const angle = arm * ((Math.PI * 2) / 3) + t * 4.2 + (Math.random() - 0.5) * 0.9;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (1.2 + t * 3.5);
      pos[i * 3 + 2] = Math.sin(angle) * r;
      c.copy(inner).lerp(outer, t);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((_s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });

  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture('rgba(255,255,255,1)')}
        vertexColors
        size={0.32}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Far nebulae framing the whole scene.
function NebulaVeils() {
  const veils = useMemo(
    () => [
      { color: 'rgba(123,94,167,1)', pos: [-45, 22, -50] as const, scale: 90 },
      { color: 'rgba(199,62,46,1)', pos: [50, -18, -60] as const, scale: 85 },
      { color: 'rgba(78,205,196,1)', pos: [10, 35, -70] as const, scale: 70 },
    ],
    [],
  );
  return (
    <>
      {veils.map((v, i) => (
        <sprite key={i} raycast={() => null} position={[v.pos[0], v.pos[1], v.pos[2]]} scale={[v.scale, v.scale, 1]}>
          <spriteMaterial map={nebulaTexture(v.color)} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </>
  );
}

// Subtly tilts the galaxy toward the cursor, hinting it's interactive.
function ParallaxGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const tx = state.pointer.y * 0.18;
    const ty = state.pointer.x * 0.25;
    ref.current.rotation.x += (tx - ref.current.rotation.x) * 0.04;
    ref.current.rotation.y += (ty - ref.current.rotation.y) * 0.04;
  });
  return <group ref={ref}>{children}</group>;
}

// Only drives the camera while a node is selected. When nothing is selected,
// it does nothing so OrbitControls retains whatever view the user dragged to.
function CameraRig({ selected }: { selected: GalaxyNode | null }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!selected) return;
    const [x, y, z] = selected.position;
    target.current.set(x + 4, y + 2, z + 6);
    look.current.set(x, y, z);
    camera.position.lerp(target.current, 0.05);
    camera.lookAt(look.current);
  });
  return null;
}

function Scene({ nodes, constellations, activeGenre, selected, onSelect, onHover, embedded }: SceneProps) {
  return (
    <>
      <fog attach="fog" args={[0x050508, 22, 90]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#7B5EA7" />
      <pointLight position={[20, 20, 20]} intensity={0.6} color="#E8624A" />
      <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={0.5} />
      <Stars radius={70} depth={30} count={1500} factor={2.2} saturation={0.5} fade speed={1} />
      <NebulaVeils />
      <GalacticCore />
      <DustDisk />

      {(() => {
        const content = (
          <>
            <Constellations constellations={constellations} nodes={nodes} activeGenre={activeGenre} />
            {nodes.map((node) => (
              <MovieNode
                key={node.movie.id}
                node={node}
                dimmed={activeGenre !== null && activeGenre !== node.genre}
                selected={selected?.movie.id === node.movie.id}
                onSelect={onSelect}
                onHover={onHover}
              />
            ))}
          </>
        );
        return embedded ? <ParallaxGroup>{content}</ParallaxGroup> : content;
      })()}
      {!embedded && <CameraRig selected={selected} />}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={70}
        enabled={!selected && !embedded}
        autoRotate={embedded}
        autoRotateSpeed={0.4}
      />
    </>
  );
}

export default function GalaxyScene(props: SceneProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 32], fov: 60 }}
      gl={{ antialias: true }}
      onPointerMissed={() => props.onSelect(null)}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={[0x050508]} />
      <Scene {...props} />
    </Canvas>
  );
}
