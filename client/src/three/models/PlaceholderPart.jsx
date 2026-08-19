import { useMemo } from "react";
import { metal } from "../loaders/ModelCache.js";

const COLORS = {
  cpu: "#3a3f48",
  motherboard: "#1a3324",
  gpu: "#1c2430",
  ram: "#2a3140",
  storage: "#2b2b2b",
  cooler: "#4a5564",
  cabinet: "#14171c",
  psu: "#101318",
  fans: "#1a1e24",
};

export function PlaceholderPart({ category, rgbColor = "#00eaff", rgbOn = false }) {
  const mats = useMemo(() => {
    const body = metal(COLORS[category] || "#222");
    const accent = metal(rgbOn ? rgbColor : "#2a3038", {
      emissive: rgbOn ? rgbColor : "#000",
      emissiveIntensity: rgbOn ? 0.55 : 0,
    });
    return { body, accent };
  }, [category, rgbColor, rgbOn]);

  if (category === "cabinet") {
    return (
      <group>
        <mesh position={[0, 0, -0.02]} material={mats.body} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.46, 0.42]} />
        </mesh>
        <mesh position={[0.112, 0.04, 0.02]} material={metal("#88c8d8", { transparent: true, opacity: 0.18, metalness: 0.1, roughness: 0.05 })}>
          <boxGeometry args={[0.004, 0.36, 0.34]} />
        </mesh>
        <mesh position={[0, 0.22, 0.2]} material={mats.accent}>
          <boxGeometry args={[0.18, 0.01, 0.01]} />
        </mesh>
      </group>
    );
  }
  if (category === "motherboard") {
    return (
      <mesh material={mats.body} castShadow>
        <boxGeometry args={[0.24, 0.006, 0.3]} />
      </mesh>
    );
  }
  if (category === "cpu") {
    return (
      <mesh material={mats.accent} castShadow>
        <boxGeometry args={[0.045, 0.008, 0.045]} />
      </mesh>
    );
  }
  if (category === "gpu") {
    return (
      <group>
        <mesh material={mats.body} castShadow>
          <boxGeometry args={[0.28, 0.04, 0.11]} />
        </mesh>
        <mesh position={[0, 0.022, 0]} material={mats.accent}>
          <boxGeometry args={[0.26, 0.004, 0.02]} />
        </mesh>
      </group>
    );
  }
  if (category === "ram") {
    return (
      <group>
        <mesh position={[-0.012, 0, 0]} material={mats.body} castShadow>
          <boxGeometry args={[0.008, 0.04, 0.13]} />
        </mesh>
        <mesh position={[0.012, 0, 0]} material={mats.accent} castShadow>
          <boxGeometry args={[0.008, 0.04, 0.13]} />
        </mesh>
      </group>
    );
  }
  if (category === "psu") {
    return (
      <mesh material={mats.body} castShadow>
        <boxGeometry args={[0.15, 0.086, 0.14]} />
      </mesh>
    );
  }
  if (category === "cooler") {
    return (
      <group>
        <mesh material={mats.body} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.06, 16]} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.accent}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
        </mesh>
      </group>
    );
  }
  if (category === "fans") {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.accent} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 16]} />
      </mesh>
    );
  }
  if (category === "storage") {
    return (
      <mesh material={mats.body} castShadow>
        <boxGeometry args={[0.08, 0.004, 0.022]} />
      </mesh>
    );
  }
  return (
    <mesh material={mats.body}>
      <boxGeometry args={[0.04, 0.04, 0.04]} />
    </mesh>
  );
}
