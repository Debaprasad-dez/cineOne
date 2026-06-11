import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { TMDBMovie } from '@/types/movie';
import { posterUrl } from '@/services/tmdb';
import { glowTexture, nebulaTexture } from '@/utils/glowTexture';

const SPACING = 30; // z per decade
const RADIUS = 8;
const FONT = `${import.meta.env.BASE_URL}Syne-Bold.ttf`;

// Project Hail Mary palette: Tau Ceti amber, Astrophage crimson, deep violet space.
const AMBER = '#E8A14A';
const CRIMSON = '#E8624A';
const ASTROPHAGE = '#C73E2E';
const VIOLET = '#7B5EA7';
const TEAL = '#4ECDC4';
const RING_COLORS = [AMBER, CRIMSON, VIOLET, TEAL];

export interface DecadeGroup {
  decade: number;
  films: TMDBMovie[];
}

interface HoverInfo {
  movie: TMDBMovie;
  decade: number;
}

interface Props {
  groups: DecadeGroup[];
  progress: number; // 0..1, driven by wheel from the page
  onHover: (info: HoverInfo | null) => void;
  onSelect: (movie: TMDBMovie) => void;
  onProgress: (pct: number, decade: number) => void;
}

// The Petrova line — a faint luminous thread of Astrophage running down the
// tunnel's spine, the breadcrumb trail the camera follows through time.
function PetrovaLine({ length }: { length: number }) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.16 + Math.sin(state.clock.elapsedTime * 1.8) * 0.05;
  });

  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -length / 2 + 25]}>
      {/* hot core */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[0.035, 0.035, length + 60, 8, 1, true]} />
        <meshBasicMaterial color={CRIMSON} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* soft halo around the core */}
      <mesh ref={glowRef} raycast={() => null}>
        <cylinderGeometry args={[0.5, 0.5, length + 60, 12, 1, true]} />
        <meshBasicMaterial color={ASTROPHAGE} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Astrophage stream: a migration of glowing red-amber motes drifting up the
// tunnel toward the camera, wrapping around as they pass.
function AstrophageStream({ length }: { length: number }) {
  const COUNT = 700;
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, seeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sds = new Float32Array(COUNT);
    const a = new THREE.Color(ASTROPHAGE);
    const b = new THREE.Color(AMBER);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      // most motes hug the spine; some drift wide
      const r = 0.3 + Math.pow(Math.random(), 2.2) * (RADIUS - 1.5);
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = 30 - Math.random() * (length + 70);
      c.copy(a).lerp(b, Math.random());
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      sds[i] = 2 + Math.random() * 5; // per-mote speed
    }
    return { positions: pos, colors: col, seeds: sds };
  }, [length]);

  useFrame((state, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const camZ = state.camera.position.z;
    for (let i = 0; i < COUNT; i++) {
      let z = arr[i * 3 + 2] + seeds[i] * dt; // drift toward the camera
      if (z > camZ + 12) z -= length + 80; // wrap behind the horizon
      arr[i * 3 + 2] = z;
    }
    attr.needsUpdate = true;
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
        size={0.55}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Distant nebulae — vast soft veils of color hanging beyond the rings.
function NebulaBackdrops({ length }: { length: number }) {
  const planes = useMemo(
    () => [
      { color: 'rgba(123,94,167,1)', pos: [-30, 14, -length * 0.35] as const, scale: 70 },
      { color: 'rgba(199,62,46,1)', pos: [34, -10, -length * 0.65] as const, scale: 80 },
      { color: 'rgba(232,161,74,1)', pos: [-26, -16, -length * 0.9] as const, scale: 65 },
      { color: 'rgba(78,205,196,1)', pos: [28, 18, -length - 30] as const, scale: 75 },
    ],
    [length],
  );

  return (
    <>
      {planes.map((p, i) => (
        <sprite key={i} raycast={() => null} position={[p.pos[0], p.pos[1], p.pos[2]]} scale={[p.scale, p.scale, 1]}>
          <spriteMaterial
            map={nebulaTexture(p.color)}
            transparent
            opacity={0.32}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </>
  );
}

// A decade gate: paired luminous rings with a slow pulse, Hail Mary spin-drive style.
function DecadeRing({ z, color }: { z: number; color: string }) {
  const glow = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!glow.current) return;
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 1.1 + z * 0.2) * 0.012;
    glow.current.scale.setScalar(s);
    (glow.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 1.1 + z * 0.2) * 0.08;
  });

  return (
    <group position={[0, 0, z]}>
      {/* crisp structural ring */}
      <mesh raycast={() => null}>
        <torusGeometry args={[RADIUS, 0.045, 12, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* wide glow ring behind it */}
      <mesh ref={glow} raycast={() => null}>
        <torusGeometry args={[RADIUS, 0.5, 12, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* secondary inner ring for depth */}
      <mesh raycast={() => null} position={[0, 0, -1.6]}>
        <torusGeometry args={[RADIUS * 0.92, 0.025, 10, 80]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FilmSphere({
  movie,
  position,
  decade,
  accent,
  onHover,
  onSelect,
}: {
  movie: TMDBMovie;
  position: [number, number, number];
  decade: number;
  accent: string;
  onHover: (info: HoverInfo | null) => void;
  onSelect: (m: TMDBMovie) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);
  const tex = useTexture(posterUrl(movie.poster_path, 'w342'));
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y += dt * 0.25;
    // gentle orbital bob, like debris caught in the ring's spin
    ref.current.position.y = position[1] + Math.sin(t * 0.7 + phase) * 0.25;
    const target = hovered ? 1.5 : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    if (halo.current) {
      const mat = halo.current.material as THREE.SpriteMaterial;
      mat.opacity += ((hovered ? 0.85 : 0.35) - mat.opacity) * 0.12;
    }
  });

  return (
    <group ref={ref} position={position}>
      <sprite ref={halo} scale={[3.6, 3.6, 1]} raycast={() => null}>
        <spriteMaterial
          map={glowTexture(accent === AMBER ? 'rgba(232,161,74,1)' : 'rgba(232,98,74,1)')}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover({ movie, decade });
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(movie);
        }}
      >
        <sphereGeometry args={[1.1, 28, 28]} />
        <meshStandardMaterial
          map={tex}
          emissive={new THREE.Color(VIOLET)}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

export default function TimelineTunnel({ groups, progress, onHover, onSelect, onProgress }: Props) {
  const total = (groups.length - 1) * SPACING;
  const smooth = useRef(0);
  const camLight = useRef<THREE.PointLight>(null);

  const layout = useMemo(
    () =>
      groups.map((g, ring) => ({
        ...g,
        z: -ring * SPACING,
        color: RING_COLORS[ring % RING_COLORS.length],
        films: g.films.map((film, i) => {
          const angle = (i / g.films.length) * Math.PI * 2;
          return {
            film,
            pos: [Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, -ring * SPACING] as [number, number, number],
          };
        }),
      })),
    [groups],
  );

  useFrame((state) => {
    // ease toward the target progress for buttery camera motion
    smooth.current += (progress - smooth.current) * 0.08;
    const offset = smooth.current;
    const z = 20 - offset * total;
    // weave through the tunnel with a slow banking roll — flying, not scrolling
    state.camera.position.set(Math.sin(offset * Math.PI * 2) * 2.5, Math.cos(offset * Math.PI * 1.5) * 1.5, z);
    state.camera.lookAt(Math.sin(offset * Math.PI * 2) * 0.8, 0, z - 12);
    state.camera.rotation.z = Math.sin(offset * Math.PI * 3) * 0.06;

    if (camLight.current) camLight.current.position.set(0, 0, z + 2);

    const ring = Math.min(groups.length - 1, Math.round((offset * total) / SPACING));
    onProgress(offset, groups[ring]?.decade ?? groups[0].decade);
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      {/* lantern travelling with the camera — warm Tau Ceti light */}
      <pointLight ref={camLight} intensity={2.2} color={AMBER} distance={45} decay={1.6} />
      <pointLight position={[0, 0, -total - 20]} intensity={2} color={ASTROPHAGE} distance={80} />

      <PetrovaLine length={total} />
      <AstrophageStream length={total} />
      <NebulaBackdrops length={total} />

      {layout.map((g) => (
        <group key={g.decade}>
          <DecadeRing z={g.z} color={g.color} />
          <Billboard position={[0, RADIUS + 2.4, g.z]}>
            <Text
              font={FONT}
              fontSize={2}
              letterSpacing={0.08}
              color={g.color}
              anchorX="center"
              outlineWidth={0.05}
              outlineColor={g.color}
              outlineOpacity={0.4}
              outlineBlur={0.4}
            >
              {`${g.decade}s`}
            </Text>
          </Billboard>
          {g.films.map(({ film, pos }) => (
            <FilmSphere
              key={film.id}
              movie={film}
              position={pos}
              decade={g.decade}
              accent={g.color}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
        </group>
      ))}
    </>
  );
}
