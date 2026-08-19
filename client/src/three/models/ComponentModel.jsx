import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RigPart, SLOT_LAYOUT, variantFor } from "./RigParts.jsx";
import { useBuildStore } from "../../store/buildStore.js";

export function ComponentModel({ slot, component, category }) {
  const group = useRef();
  const exploded = useBuildStore((s) => s.exploded);
  const selected = useBuildStore((s) => s.selectedSlot === slot);
  const hovered = useBuildStore((s) => s.hoveredSlot === slot);
  const setSlot = useBuildStore((s) => s.setSlot);
  const setHovered = useBuildStore((s) => s.setHovered);
  const rgb = useBuildStore((s) => s.rgb);
  const xray = useBuildStore((s) => s.xray);
  const model = component?.models?.[0] || component?.model;
  const [gltfFail, setGltfFail] = useState(false);
  const layout = SLOT_LAYOUT[slot] || SLOT_LAYOUT.cabinet;
  const rest = useMemo(() => new THREE.Vector3(layout.x, layout.y, layout.z), [layout.x, layout.y, layout.z]);
  const explodedPos = useMemo(
    () => new THREE.Vector3(layout.x + layout.ex, layout.y + layout.ey, layout.z + layout.ez),
    [layout.x, layout.y, layout.z, layout.ex, layout.ey, layout.ez],
  );

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.position.lerp(exploded ? explodedPos : rest, Math.min(1, dt * 6));
  });

  useEffect(() => {
    setGltfFail(false);
  }, [model?.modelUrl]);

  const url = model?.modelUrl;
  const showGltf = url && !gltfFail;
  const rgbOn = rgb.enabled && rgb.mode !== "off";

  return (
    <group
      ref={group}
      position={[layout.x, layout.y, layout.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(slot);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSlot(slot);
      }}
    >
      {showGltf ? (
        <ModelErrorBoundary
          fallback={<RigPart category={category} rgbColor={rgb.color} rgbOn={rgbOn} xray={xray} variant={variantFor(slot, component)} />}
          onError={() => setGltfFail(true)}
        >
          <GltfPart url={url} />
        </ModelErrorBoundary>
      ) : (
        <RigPart category={category} rgbColor={rgb.color} rgbOn={rgbOn} xray={xray} variant={variantFor(slot, component)} />
      )}
      {selected && (
        <mesh>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#4df0ff" />
        </mesh>
      )}
      {hovered && component?.name && (
        <Html distanceFactor={1.15} position={[0.04, 0.06, 0]} style={{ pointerEvents: "none" }}>
          <div className="hotspot">
            <strong>{component.name}</strong>
            {component.price != null && <span>₹{Number(component.price).toLocaleString("en-IN")}</span>}
            <em>Click to configure</em>
          </div>
        </Html>
      )}
    </group>
  );
}

function GltfPart({ url }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene.clone()} />;
}

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: false };
  }
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}
