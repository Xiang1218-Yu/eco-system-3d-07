import { useRef, useMemo, useEffect, type ComponentRef, type RefObject } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Organism3D } from '@/components/Organisms/Organism';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';
import { getSpeciesById } from '@/data/species';

function Glass() {
  const thickness = 0.08;
  const width = AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX + thickness * 2;
  const height = AQUARIUM_BOUNDS.maxY - AQUARIUM_BOUNDS.minY + thickness * 2;
  const depth = AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ + thickness * 2;

  return (
    <group>
      <mesh position={[0, 0, AQUARIUM_BOUNDS.maxZ + thickness / 2]}>
        <boxGeometry args={[width, height, thickness]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0}
          metalness={0}
          transmission={0.95}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      <mesh position={[0, 0, AQUARIUM_BOUNDS.minZ - thickness / 2]}>
        <boxGeometry args={[width, height, thickness]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0}
          metalness={0}
          transmission={0.95}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      <mesh position={[AQUARIUM_BOUNDS.maxX + thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, depth]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0}
          metalness={0}
          transmission={0.95}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      <mesh position={[AQUARIUM_BOUNDS.minX - thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, depth]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0}
          metalness={0}
          transmission={0.95}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      <mesh position={[0, AQUARIUM_BOUNDS.minY - thickness / 2, 0]} receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <meshPhysicalMaterial
          color="#1a3a5c"
          transparent
          opacity={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function Water() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.MeshPhysicalMaterial;
      material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  const width = AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX;
  const height = AQUARIUM_BOUNDS.maxY - AQUARIUM_BOUNDS.minY;
  const depth = AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ;

  return (
    <mesh ref={waterRef} position={[0, 0, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshPhysicalMaterial
        color="#0ea5e9"
        transparent
        opacity={0.35}
        roughness={0}
        metalness={0}
        transmission={0.9}
        thickness={1}
        ior={1.33}
      />
    </mesh>
  );
}

function Substrate() {
  const particles = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const count = 800;
    const sandColors = [
      new THREE.Color('#d4a574'),
      new THREE.Color('#c9956c'),
      new THREE.Color('#e8c9a0'),
      new THREE.Color('#b8865a'),
    ];

    for (let i = 0; i < count; i++) {
      positions.push(
        AQUARIUM_BOUNDS.minX + 0.1 + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX - 0.2),
        AQUARIUM_BOUNDS.minY + 0.02 + Math.random() * 0.06,
        AQUARIUM_BOUNDS.minZ + 0.1 + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ - 0.2),
      );
      const color = sandColors[Math.floor(Math.random() * sandColors.length)];
      colors.push(color.r, color.g, color.b);
    }

    return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors sizeAttenuation transparent opacity={0.9} />
    </points>
  );
}

function LightRays() {
  const raysRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={raysRef}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[i * 1.5 - 3, 0, 0]} rotation={[0, 0, 0.1]}>
          <coneGeometry args={[0.3, 4, 8, 1, true]} />
          <meshBasicMaterial color="#fef3c7" transparent opacity={0.06} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Bubbles() {
  const bubblesRef = useRef<THREE.Points>(null);
  const count = 50;

  const { positions, sizes, phases } = useMemo(() => {
    const pos: number[] = [];
    const siz: number[] = [];
    const pha: number[] = [];

    for (let i = 0; i < count; i++) {
      pos.push(
        AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX),
        AQUARIUM_BOUNDS.minY + Math.random() * (AQUARIUM_BOUNDS.maxY - AQUARIUM_BOUNDS.minY),
        AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ),
      );
      siz.push(0.02 + Math.random() * 0.04);
      pha.push(Math.random() * Math.PI * 2);
    }

    return { positions: new Float32Array(pos), sizes: new Float32Array(siz), phases: pha };
  }, []);

  useFrame((state) => {
    if (bubblesRef.current) {
      const posAttr = bubblesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        posAttr.array[idx + 1] += 0.005 + sizes[i] * 0.05;
        posAttr.array[idx] += Math.sin(state.clock.elapsedTime * 2 + phases[i]) * 0.003;

        if ((posAttr.array as Float32Array)[idx + 1] > AQUARIUM_BOUNDS.maxY) {
          (posAttr.array as Float32Array)[idx + 1] = AQUARIUM_BOUNDS.minY;
          (posAttr.array as Float32Array)[idx] =
            AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX);
          (posAttr.array as Float32Array)[idx + 2] =
            AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ);
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={bubblesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function ClickableArea({ onAquariumClick }: { onAquariumClick: (point: THREE.Vector3) => void }) {
  const mouseDownPos = useRef<THREE.Vector2 | null>(null);
  const selectedSpeciesId = useEcosystemStore((s) => s.selectedSpeciesId);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!selectedSpeciesId) return;
    mouseDownPos.current = new THREE.Vector2(e.clientX, e.clientY);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!selectedSpeciesId) return;
    e.stopPropagation();

    if (mouseDownPos.current) {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        mouseDownPos.current = null;
        return;
      }
    }
    mouseDownPos.current = null;
    onAquariumClick(e.point);
  };

  return (
    <mesh
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      visible={false}
    >
      <boxGeometry
        args={[
          AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX,
          AQUARIUM_BOUNDS.maxY - AQUARIUM_BOUNDS.minY,
          AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ,
        ]}
      />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function TrackingRig({
  controlsRef,
}: {
  controlsRef: RefObject<ComponentRef<typeof OrbitControls>>;
}) {
  const trackedOrganismId = useEcosystemStore((s) => s.trackedOrganismId);
  const setTrackedOrganism = useEcosystemStore((s) => s.setTrackedOrganism);
  const trackedOrganism = useEcosystemStore((s) =>
    s.organisms.find((organism) => organism.id === s.trackedOrganismId),
  );
  const species = trackedOrganism ? getSpeciesById(trackedOrganism.speciesId) : null;

  const haloRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const cameraOffsetRef = useRef<THREE.Vector3 | null>(null);
  const savedTargetRef = useRef<THREE.Vector3 | null>(null);
  const missingTargetRef = useRef(false);

  useEffect(() => {
    if (!trackedOrganismId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTrackedOrganism(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trackedOrganismId, setTrackedOrganism]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;

    if (!trackedOrganismId || !trackedOrganism) {
      if (trackedOrganismId && !missingTargetRef.current) {
        missingTargetRef.current = true;
        setTrackedOrganism(null);
      }

      if (controls && savedTargetRef.current) {
        controls.target.copy(savedTargetRef.current);
        controls.update();
      }
      savedTargetRef.current = null;
      cameraOffsetRef.current = null;
      return;
    }

    missingTargetRef.current = false;

    if (!cameraOffsetRef.current || !controls) {
      if (controls) {
        savedTargetRef.current = controls.target.clone();
        cameraOffsetRef.current = state.camera.position.clone().sub(trackedOrganism.position);
      }
    } else {
      const desiredCameraPosition = trackedOrganism.position.clone().add(cameraOffsetRef.current);
      const cameraAlpha = 1 - Math.exp(-delta * 3.5);
      state.camera.position.lerp(desiredCameraPosition, cameraAlpha);

      const targetAlpha = 1 - Math.exp(-delta * 5);
      controls.target.lerp(trackedOrganism.position, targetAlpha);
      controls.update();
    }

    if (haloRef.current) {
      haloRef.current.position.copy(trackedOrganism.position);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.06;
      haloRef.current.scale.setScalar(pulse);
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.8;
    }
  });

  if (!trackedOrganism || !species) return null;

  const haloColor = species.color;

  return (
    <group ref={haloRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[species.size * 0.9, species.size * 1.15, 48]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[species.size * 1.28, species.size * 1.38, 48]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

interface Aquarium3DProps {
  onAquariumClick: (point: THREE.Vector3) => void;
}

export function Aquarium3D({ onAquariumClick }: Aquarium3DProps) {
  const { organisms } = useEcosystemStore();
  const trackedOrganismId = useEcosystemStore((s) => s.trackedOrganismId);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 8], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={[0x0a1628]} />
      <fog attach="fog" args={[0x0a1628, 10, 20]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[2, 5, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#a5f3fc" distance={10} />
      <pointLight position={[-3, 1, -2]} intensity={0.3} color="#60a5fa" distance={8} />

      <Water />
      <Glass />
      <Substrate />
      <LightRays />
      <Bubbles />

      {organisms.map((organism) => {
        const species = getSpeciesById(organism.speciesId);
        if (!species) return null;
        return (
          <Organism3D
            key={organism.id}
            organism={organism}
            species={species}
          />
        );
      })}

      <TrackingRig controlsRef={controlsRef} />

      <ClickableArea onAquariumClick={onAquariumClick} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
      </EffectComposer>

      <OrbitControls
        ref={controlsRef}
        enabled={!trackedOrganismId}
        enablePan={false}
        minDistance={4}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
