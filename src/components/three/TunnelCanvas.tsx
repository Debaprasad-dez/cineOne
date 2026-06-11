import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import TimelineTunnel, { type DecadeGroup } from './TimelineTunnel';
import type { TMDBMovie } from '@/types/movie';

interface Props {
  groups: DecadeGroup[];
  progress: number;
  onHover: (info: { movie: TMDBMovie; decade: number } | null) => void;
  onSelect: (movie: TMDBMovie) => void;
  onProgress: (pct: number, decade: number) => void;
}

export default function TunnelCanvas(props: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 24], fov: 62 }} gl={{ antialias: true }} dpr={[1, 1.5]}>
      <color attach="background" args={[0x030306]} />
      <fog attach="fog" args={[0x030306, 16, 85]} />
      {/* two star shells at different depths for parallax richness */}
      <Stars radius={130} depth={80} count={3500} factor={4} fade speed={0.4} />
      <Stars radius={60} depth={40} count={1200} factor={2.5} saturation={0.4} fade speed={0.9} />
      <Suspense fallback={null}>
        <TimelineTunnel {...props} />
      </Suspense>
    </Canvas>
  );
}
