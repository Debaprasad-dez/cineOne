import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GalaxyNode } from '@/utils/galaxy';
import { posterUrl } from '@/services/tmdb';
import { glowTexture } from '@/utils/glowTexture';

interface Props {
  node: GalaxyNode;
  dimmed: boolean;
  selected: boolean;
  onSelect: (node: GalaxyNode) => void;
  onHover: (node: GalaxyNode | null) => void;
}

// hex -> rgba string for the cached glow sprite
function rgba(hex: string): string {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},1)`;
}

export default function MovieNode({ node, dimmed, selected, onSelect, onHover }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(posterUrl(node.movie.poster_path, 'w342'));
  const haloMap = useMemo(() => glowTexture(rgba(node.color)), [node.color]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    mesh.rotation.y += dt * 0.15;
    const targetScale = (hovered || selected ? 1.4 : 1) * node.scale;
    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    const targetOpacity = dimmed ? 0.1 : 1;
    mat.opacity += (targetOpacity - mat.opacity) * 0.12;
    mat.emissiveIntensity += ((hovered ? 0.9 : node.glow * 0.5) - mat.emissiveIntensity) * 0.12;
    if (haloRef.current) {
      const haloMat = haloRef.current.material as THREE.SpriteMaterial;
      const haloTarget = dimmed ? 0.03 : hovered || selected ? 0.75 : 0.25 + node.glow * 0.2;
      haloMat.opacity += (haloTarget - haloMat.opacity) * 0.12;
      haloRef.current.scale.setScalar(mesh.scale.x * 3.2);
    }
  });

  return (
    <group position={node.position}>
      <sprite ref={haloRef} scale={[3.2, 3.2, 1]} raycast={() => null}>
        <spriteMaterial map={haloMap} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(node);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          ref={matRef}
          map={texture}
          emissive={new THREE.Color(node.color)}
          emissiveIntensity={node.glow * 0.5}
          transparent
          opacity={1}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
