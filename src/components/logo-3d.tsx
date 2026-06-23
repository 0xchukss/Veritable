"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Environment,
  Float,
  MeshReflectorMaterial,
  Sparkles,
} from "@react-three/drei";
// Postprocessing removed for stability
import * as THREE from "three";

/**
 * Veritable 3D logo — a self-contained scene with:
 *  - matte black hex base
 *  - levitating glass frame
 *  - neon-glowing edges (bloom postprocessing)
 *  - a slowly rotating placeholder hologram
 *  - polished concrete reflective floor
 *  - idle auto-orbit camera (pauses on interaction)
 *  - hover-brighten on neon
 *  - click-to-swap user model
 *
 * Canvas is lazy-loaded so the landing renders first and 3D hydrates after.
 */

// The hologram shapes a user can cycle through by clicking.
const HOLOGRAM_SHAPES = ["icosahedron", "octahedron", "torus", "dodecahedron"] as const;
type HologramShape = (typeof HOLOGRAM_SHAPES)[number];

function HologramGeometry({ shape }: { shape: HologramShape }) {
  switch (shape) {
    case "icosahedron":
      return <icosahedronGeometry args={[0.7, 0]} />;
    case "octahedron":
      return <octahedronGeometry args={[0.8, 0]} />;
    case "torus":
      return <torusGeometry args={[0.45, 0.18, 16, 48]} />;
    case "dodecahedron":
      return <dodecahedronGeometry args={[0.7, 0]} />;
  }
}

/** The levitating, rotating hologram with a wireframe + emissive core. */
function Hologram({
  shape,
  bright,
  scrollRef,
}: {
  shape: HologramShape;
  bright: boolean;
  scrollRef?: any;
}) {
  const group = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
    if (wire.current) wire.current.rotation.y -= delta * 0.6;
    // As the user scrolls, the hologram rises and the camera lifts past it.
    const rawScroll = scrollRef?.get ? scrollRef.get() : scrollRef?.current;
    const s = typeof rawScroll === 'number' && !Number.isNaN(rawScroll) ? rawScroll : 0;
    if (group.current) group.current.position.y = s * 1.4;
  });

  const coreIntensity = bright ? 2.4 : 1.4;

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
        {/* Solid emissive core */}
        <mesh>
          <HologramGeometry shape={shape} />
          <meshStandardMaterial
            color="#2563eb"
            emissive="#3b82f6"
            emissiveIntensity={coreIntensity}
            transparent
            opacity={0.55}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        {/* Bright wireframe overlay */}
        <mesh ref={wire} scale={1.06}>
          <HologramGeometry shape={shape} />
          <meshBasicMaterial
            color="#93c5fd"
            wireframe
            transparent
            opacity={bright ? 0.9 : 0.55}
          />
        </mesh>
      </Float>
    </group>
  );
}

/** Matte-black hex base with a subtle bevel feel via low metalness. */
function HexBase() {
  return (
    <mesh position={[0, -0.85, 0]} receiveShadow>
      <cylinderGeometry args={[1.25, 1.25, 0.35, 6]} />
      <meshStandardMaterial color="#0a0a0f" roughness={0.5} metalness={0.25} />
    </mesh>
  );
}

/** The levitating glass frame — a thin hex ring of transmission material. */
function GlassFrame({
  hovered,
  bright,
}: {
  hovered: boolean;
  bright: boolean;
}) {
  const edgeColor = bright || hovered ? "#60a5fa" : "#2563eb";
  return (
    <group position={[0, 0.05, 0]}>
      {/* Glass ring */}
      <mesh>
        <torusGeometry args={[1.18, 0.045, 24, 96]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          transmission={0.95}
          thickness={0.4}
          roughness={0.05}
          ior={1.4}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Neon edge highlight (drives the bloom) */}
      <mesh scale={1.005}>
        <torusGeometry args={[1.18, 0.012, 16, 96]} />
        <meshStandardMaterial
          color={edgeColor}
          emissive={edgeColor}
          emissiveIntensity={bright ? 3.2 : hovered ? 2.4 : 1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Polished concrete floor (lightly glossy, no heavy raymarching reflections to prevent crashes). */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <meshStandardMaterial
        color="#0c0c11"
        roughness={0.4}
        metalness={0.8}
      />
    </mesh>
  );
}

/**
 * Idle auto-orbit blended with a scroll-driven lift. As the user scrolls down
 * the page, the camera rises and tilts so the hologram ascends past the viewer.
 * Orbit pauses while the user is interacting (hover/click).
 */
function ScrollCamera({
  active,
  scrollRef,
}: {
  active: boolean;
  scrollRef?: any;
}) {
  const angleRef = useRef(0);

  useFrame((state, delta) => {
    // Only increment orbit angle if not interacting
    if (!active) {
      angleRef.current += delta * 0.12;
    }
    const angle = angleRef.current;
    
    // Handle either MotionValue or plain React ref gracefully
    const rawScroll = scrollRef?.get ? scrollRef.get() : scrollRef?.current;
    const s = typeof rawScroll === 'number' && !Number.isNaN(rawScroll) ? rawScroll : 0;

    const radius = 4.2;
    const baseX = Math.sin(angle) * radius;
    const baseZ = Math.cos(angle) * radius;

    // Scroll lift: 0 at top → rises and tilts down as user scrolls.
    // Clamp 's' between 0 and 1 so the camera never pulls back into the fog!
    const clampedS = Math.min(Math.max(s, 0), 1);
    const lift = clampedS * 2.0;
    
    // The hologram rises by s * 1.4. We should track it with the camera.
    const targetY = 0.3 + clampedS * 1.4;

    state.camera.position.x = baseX;
    state.camera.position.z = baseZ + clampedS * 2.0; // pull camera back more to keep it in frame
    state.camera.position.y = 1.1 + lift + Math.sin(angle) * 0.25;
    state.camera.lookAt(0, targetY, 0);
  });
  return null;
}

function Scene({
  hovered,
  setHovered,
  shape,
  setShape,
  interacting,
  setInteracting,
  scrollRef,
}: {
  hovered: boolean;
  setHovered: (v: boolean) => void;
  shape: HologramShape;
  setShape: (s: HologramShape) => void;
  interacting: boolean;
  setInteracting: (v: boolean) => void;
  scrollRef?: any;
}) {
  const bright = hovered;

  const cycle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const idx = HOLOGRAM_SHAPES.indexOf(shape);
    setShape(HOLOGRAM_SHAPES[(idx + 1) % HOLOGRAM_SHAPES.length]);
  };

  return (
    <>
      <color attach="background" args={["#08080b"]} />
      <fog attach="fog" args={["#08080b", 7, 16]} />

      <ambientLight intensity={0.4} />
      <spotLight
        position={[4, 6, 3]}
        angle={0.5}
        penumbra={1}
        intensity={2.4}
        color="#60a5fa"
        castShadow
      />
      <pointLight position={[-3, 1, -2]} intensity={1.2} color="#2563eb" />

      <Environment preset="night" />

      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setInteracting(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          setInteracting(false);
        }}
        onClick={cycle}
      >
        <HexBase />
        <GlassFrame hovered={hovered} bright={bright} />
        <Hologram shape={shape} bright={bright} scrollRef={scrollRef} />
      </group>

      <Sparkles
        count={40}
        scale={[6, 3, 6]}
        position={[0, 0.5, 0]}
        size={2}
        speed={0.3}
        color="#93c5fd"
        opacity={0.6}
      />

      <Floor />
      <ScrollCamera active={interacting} scrollRef={scrollRef} />

      {/* Postprocessing removed completely to fix silent black-screen WebGL crash on some devices */}
    </>
  );
}

/**
 * The full 3D scene rendered inside a real Canvas, as a fixed full-page layer.
 *
 * Browser-only — never run during SSR (postprocessing reads GL state that does
 * not exist on the server). Import via `logo-3d-client.tsx` (ssr:false).
 *
 * `scrollRef` is a shared mutable that the parent updates on scroll; the scene
 * reads it each frame without triggering React re-renders.
 */
export function Logo3D({
  scrollRef,
  className,
}: {
  scrollRef?: any; // MotionValue<number>
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [shape, setShape] = useState<HologramShape>("icosahedron");

  return (
    <div className={className || "pointer-events-auto fixed inset-0 z-0 h-screen w-screen"}>
      <Canvas
        shadows="basic"
        dpr={[1, 1.8]}
        camera={{ position: [4.2, 1.1, 0], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <Scene
          hovered={hovered}
          setHovered={setHovered}
          shape={shape}
          setShape={setShape}
          interacting={interacting}
          setInteracting={setInteracting}
          scrollRef={scrollRef}
        />
      </Canvas>
    </div>
  );
}
