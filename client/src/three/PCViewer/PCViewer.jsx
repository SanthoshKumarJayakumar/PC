import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useBuildStore } from "../../store/buildStore.js";
import { ComponentModel } from "../models/ComponentModel.jsx";

const PRESETS = {
  default: { pos: [0.62, 0.18, 0.42], target: [0, 0.02, 0] },
  front: { pos: [0.08, 0.08, 0.72], target: [0, 0, 0.05] },
  back: { pos: [0.1, 0.12, -0.72], target: [0, 0, 0] },
  left: { pos: [-0.7, 0.12, 0.1], target: [0, 0, 0] },
  right: { pos: [0.78, 0.1, 0.05], target: [0, 0.02, 0] },
  top: { pos: [0.05, 0.85, 0.08], target: [0, 0, 0] },
  gpu: { pos: [0.42, 0.02, 0.22], target: [0.03, -0.03, 0.02] },
  cpu: { pos: [0.22, 0.2, 0.16], target: [-0.03, 0.09, 0.01] },
  ram: { pos: [0.24, 0.18, 0.2], target: [-0.03, 0.1, 0.09] },
  motherboard: { pos: [0.42, 0.14, 0.12], target: [-0.05, 0.04, 0] },
  cooler: { pos: [0.28, 0.28, 0.16], target: [-0.03, 0.16, 0.01] },
  psu: { pos: [0.35, -0.08, 0.12], target: [0.01, -0.16, -0.06] },
  storage: { pos: [0.22, 0.06, -0.02], target: [-0.05, 0.01, -0.11] },
  cabinet: { pos: [0.62, 0.18, 0.42], target: [0, 0.02, 0] },
  fans: { pos: [0.2, 0.08, 0.48], target: [0, 0.04, 0.17] },
};

const SLOTS = ["cabinet", "motherboard", "cpu", "ram", "gpu", "storage", "cooler", "psu", "fans"];

function CameraRig({ autoRotate }) {
  const preset = useBuildStore((s) => s.cameraPreset);
  const showcase = useBuildStore((s) => s.showcase);
  const { camera, controls } = useThree();
  const goal = PRESETS[preset] || PRESETS.default;
  const t = useRef(new THREE.Vector3(...goal.target));

  useFrame((state, dt) => {
    if (showcase || autoRotate) {
      const a = state.clock.elapsedTime * 0.22;
      camera.position.lerp(new THREE.Vector3(Math.cos(a) * 0.68, 0.2, Math.sin(a) * 0.5), 0.05);
      camera.lookAt(0, 0.02, 0);
      return;
    }
    camera.position.lerp(new THREE.Vector3(...goal.pos), Math.min(1, dt * 2.2));
    t.current.lerp(new THREE.Vector3(...goal.target), Math.min(1, dt * 2.2));
    if (controls) {
      controls.target.lerp(t.current, Math.min(1, dt * 2.2));
      controls.update();
    }
  });
  return null;
}

function Scene({ autoRotate }) {
  const components = useBuildStore((s) => s.components);
  const rgb = useBuildStore((s) => s.rgb);

  useEffect(() => {
    document.documentElement.style.setProperty("--rgb", rgb.color);
  }, [rgb.color]);

  return (
    <>
      <color attach="background" args={["#eef1f5"]} />
      <fog attach="fog" args={["#eef1f5", 2.2, 4.6]} />
      <ambientLight intensity={0.78} />
      <spotLight position={[0.9, 1.4, 0.6]} intensity={1.55} angle={0.42} penumbra={0.7} castShadow shadow-mapSize={1024} />
      <spotLight position={[-0.6, 0.8, -0.4]} intensity={0.45} color="#6ea2ff" />
      <pointLight position={[0.2, 0.05, 0.1]} intensity={rgb.enabled ? 0.9 : 0.15} color={rgb.color} distance={1.2} />
      <Environment preset="studio" environmentIntensity={0.55} />
      <group position={[0, -0.02, 0]}>
        {SLOTS.map((slot) => (
          <ComponentModel
            key={slot + (components[slot]?.id || "default")}
            slot={slot}
            component={components[slot] || { id: `default-${slot}`, name: slot, compatibilityMetadata: {} }}
            category={slot}
          />
        ))}
      </group>
      <ContactShadows position={[0, -0.25, 0]} opacity={0.28} scale={1.6} blur={2.5} far={0.8} color="#8a919c" />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} autoRotate={false} minDistance={0.4} maxDistance={1.8} maxPolarAngle={Math.PI / 1.7} />
      <CameraRig autoRotate={autoRotate} />
      <PerspectiveCamera makeDefault fov={38} position={[0.62, 0.18, 0.42]} />
    </>
  );
}

export function PCViewer({ className, autoRotate = false, fallback }) {
  const webgl = useMemo(() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  }, []);

  if (webgl === false) {
    return (
      <div className={`viewer-fallback ${className || ""}`}>
        {fallback || <p>3D preview unavailable. Configure and purchase from the lists instead.</p>}
      </div>
    );
  }

  return (
    <div className={`viewer ${className || ""}`}>
      <Suspense fallback={<div className="viewer-load">Loading PC…</div>}>
        <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <Scene autoRotate={autoRotate} />
        </Canvas>
      </Suspense>
    </div>
  );
}
