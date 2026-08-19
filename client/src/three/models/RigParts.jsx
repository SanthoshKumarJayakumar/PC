import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const SLOT_LAYOUT = {
  cabinet: { x: 0, y: 0, z: 0, ex: 0, ey: 0, ez: 0 },
  motherboard: { x: -0.052, y: 0.035, z: -0.015, ex: -0.1, ey: 0, ez: 0 },
  cpu: { x: -0.038, y: 0.09, z: 0.01, ex: 0, ey: 0.1, ez: 0 },
  ram: { x: -0.038, y: 0.1, z: 0.09, ex: 0, ey: 0.12, ez: 0 },
  gpu: { x: 0.028, y: -0.035, z: 0.02, ex: 0.14, ey: 0, ez: 0.04 },
  storage: { x: -0.048, y: 0.01, z: -0.11, ex: -0.06, ey: 0, ez: -0.06 },
  cooler: { x: -0.03, y: 0.155, z: 0.01, ex: 0, ey: 0.14, ez: 0 },
  psu: { x: 0.01, y: -0.168, z: -0.06, ex: 0, ey: -0.12, ez: 0 },
  fans: { x: 0.0, y: 0.04, z: 0.175, ex: 0, ey: 0, ez: 0.12 },
};

function useMats(rgbColor, rgbOn) {
  return useMemo(() => {
    const chassis = new THREE.MeshStandardMaterial({ color: "#12151b", metalness: 0.82, roughness: 0.32 });
    const dark = new THREE.MeshStandardMaterial({ color: "#0a0c10", metalness: 0.7, roughness: 0.4 });
    const alum = new THREE.MeshStandardMaterial({ color: "#8a919c", metalness: 0.88, roughness: 0.22 });
    const pcb = new THREE.MeshStandardMaterial({ color: "#15261c", metalness: 0.15, roughness: 0.55 });
    const gold = new THREE.MeshStandardMaterial({ color: "#b08a3c", metalness: 0.9, roughness: 0.25 });
    const shroud = new THREE.MeshStandardMaterial({ color: "#1a1f28", metalness: 0.45, roughness: 0.38 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#9fd7e8",
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.86,
      thickness: 0.012,
      transparent: true,
      opacity: 1,
      ior: 1.45,
    });
    const rgb = new THREE.MeshStandardMaterial({
      color: rgbOn ? rgbColor : "#1c222c",
      emissive: rgbOn ? rgbColor : "#000000",
      emissiveIntensity: rgbOn ? 1.15 : 0,
      metalness: 0.2,
      roughness: 0.35,
    });
    const glassXray = new THREE.MeshPhysicalMaterial({
      color: "#9fd7e8",
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity: 0.12,
      transmission: 0.2,
    });
    const rubber = new THREE.MeshStandardMaterial({ color: "#111", roughness: 0.9, metalness: 0.05 });
    return { chassis, dark, alum, pcb, gold, shroud, glass, glassXray, rgb, rubber };
  }, [rgbColor, rgbOn]);
}

function Fan({ position, rotation = [Math.PI / 2, 0, 0], radius = 0.052, rgbOn, color, spin = 1 }) {
  const ref = useRef();
  const mats = useMats(color, rgbOn);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 4.5 * spin;
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mats.dark}>
        <cylinderGeometry args={[radius + 0.006, radius + 0.006, 0.012, 24]} />
      </mesh>
      <mesh material={mats.rgb}>
        <torusGeometry args={[radius, 0.004, 8, 24]} />
      </mesh>
      <group ref={ref}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[radius * 0.42, 0, 0]} material={mats.alum}>
            <boxGeometry args={[radius * 0.72, 0.003, 0.016]} />
          </mesh>
        ))}
        <mesh material={mats.rgb}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
        </mesh>
      </group>
    </group>
  );
}

export function RigPart({ category, rgbColor = "#4df0ff", rgbOn = true, xray = false, variant = "atx" }) {
  const m = useMats(rgbColor, rgbOn);

  if (category === "cabinet") {
    const compact = variant === "itx";
    const w = compact ? 0.18 : 0.22;
    const h = compact ? 0.34 : 0.47;
    const d = compact ? 0.34 : 0.44;
    return (
      <group>
        <mesh position={[0, -h / 2 - 0.012, 0]} material={m.rubber} receiveShadow>
          <boxGeometry args={[0.16, 0.016, 0.28]} />
        </mesh>
        <mesh position={[-w / 2 + 0.006, 0, 0]} material={m.chassis} castShadow receiveShadow>
          <boxGeometry args={[0.012, h, d]} />
        </mesh>
        <mesh position={[0, h / 2 - 0.006, 0]} material={m.chassis} castShadow>
          <boxGeometry args={[w, 0.012, d]} />
        </mesh>
        <mesh position={[0, -h / 2 + 0.01, 0]} material={m.dark} receiveShadow>
          <boxGeometry args={[w - 0.01, 0.02, d - 0.02]} />
        </mesh>
        <mesh position={[0, 0, -d / 2 + 0.006]} material={m.chassis} castShadow>
          <boxGeometry args={[w, h, 0.012]} />
        </mesh>
        <mesh position={[0, 0.02, d / 2 - 0.01]} material={m.dark} castShadow>
          <boxGeometry args={[w - 0.04, h - 0.08, 0.008]} />
        </mesh>
        <mesh position={[0.02, 0.18, d / 2 - 0.004]} material={m.rgb}>
          <boxGeometry args={[0.08, 0.006, 0.004]} />
        </mesh>
        <mesh position={[w / 2 - 0.004, 0.02, 0.01]} material={xray ? m.glassXray : m.glass} castShadow>
          <boxGeometry args={[0.005, h - 0.05, d - 0.06]} />
        </mesh>
        <mesh position={[0, -h / 2 + 0.055, 0.02]} material={m.dark}>
          <boxGeometry args={[w - 0.03, 0.07, d - 0.08]} />
        </mesh>
      </group>
    );
  }

  if (category === "motherboard") {
    return (
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh material={m.pcb} castShadow>
          <boxGeometry args={[0.244, 0.006, 0.305]} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-0.1 + (i % 4) * 0.06, 0.004, -0.12 + Math.floor(i / 4) * 0.08]} material={m.gold}>
            <boxGeometry args={[0.012, 0.002, 0.012]} />
          </mesh>
        ))}
        <mesh position={[0.09, 0.01, 0.12]} material={m.alum}>
          <boxGeometry args={[0.04, 0.018, 0.08]} />
        </mesh>
      </group>
    );
  }

  if (category === "cpu") {
    return (
      <group>
        <mesh material={m.alum} castShadow>
          <boxGeometry args={[0.04, 0.005, 0.04]} />
        </mesh>
        <mesh position={[0, 0.003, 0]} material={m.dark}>
          <boxGeometry args={[0.028, 0.002, 0.028]} />
        </mesh>
      </group>
    );
  }

  if (category === "gpu") {
    const long = variant === "long";
    const len = long ? 0.31 : 0.24;
    return (
      <group>
        <mesh material={m.shroud} castShadow>
          <boxGeometry args={[len, 0.042, 0.112]} />
        </mesh>
        <mesh position={[len / 2 - 0.01, 0, 0]} material={m.alum}>
          <boxGeometry args={[0.012, 0.1, 0.12]} />
        </mesh>
        <mesh position={[0, -0.022, 0]} material={m.dark}>
          <boxGeometry args={[len - 0.02, 0.004, 0.1]} />
        </mesh>
        <Fan position={[-len * 0.18, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={0.038} rgbOn={rgbOn} color={rgbColor} />
        <Fan position={[len * 0.12, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={0.038} rgbOn={rgbOn} color={rgbColor} spin={1.1} />
        <mesh position={[0, 0.022, 0.05]} material={m.rgb}>
          <boxGeometry args={[len * 0.7, 0.003, 0.006]} />
        </mesh>
      </group>
    );
  }

  if (category === "ram") {
    return (
      <group>
        {[-0.014, 0.014].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh material={m.shroud} castShadow>
              <boxGeometry args={[0.008, 0.042, 0.133]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={m.rgb}>
              <boxGeometry args={[0.009, 0.004, 0.12]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (category === "psu") {
    return (
      <group>
        <mesh material={m.dark} castShadow>
          <boxGeometry args={[0.15, 0.086, 0.14]} />
        </mesh>
        <Fan position={[0, 0.01, 0.04]} rotation={[0, 0, 0]} radius={0.04} rgbOn={false} color={rgbColor} spin={0.4} />
        <mesh position={[0.072, 0, 0]} material={m.alum}>
          <boxGeometry args={[0.004, 0.07, 0.1]} />
        </mesh>
      </group>
    );
  }

  if (category === "cooler") {
    if (variant === "aio") {
      return (
        <group>
          <mesh material={m.shroud} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.028, 20]} />
          </mesh>
          <mesh position={[0, 0.16, 0.16]} material={m.alum} castShadow>
            <boxGeometry args={[0.12, 0.028, 0.36]} />
          </mesh>
          <mesh position={[0, 0.08, 0.08]} material={m.dark}>
            <cylinderGeometry args={[0.008, 0.008, 0.18, 8]} />
          </mesh>
          <mesh material={m.rgb}>
            <torusGeometry args={[0.028, 0.004, 8, 20]} />
          </mesh>
        </group>
      );
    }
    return (
      <group>
        <mesh position={[-0.028, 0.02, 0]} material={m.alum} castShadow>
          <boxGeometry args={[0.028, 0.12, 0.105]} />
        </mesh>
        <mesh position={[0.028, 0.02, 0]} material={m.alum} castShadow>
          <boxGeometry args={[0.028, 0.12, 0.105]} />
        </mesh>
        {[ -0.02, 0, 0.02, 0.04].map((z) => (
          <mesh key={z} position={[0, -0.02, z]} rotation={[0, 0, Math.PI / 2]} material={m.gold}>
            <cylinderGeometry args={[0.003, 0.003, 0.07, 8]} />
          </mesh>
        ))}
        <Fan position={[0.05, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.048} rgbOn={rgbOn} color={rgbColor} />
      </group>
    );
  }

  if (category === "fans") {
    return (
      <group>
        <Fan position={[0, 0.07, 0]} rgbOn={rgbOn} color={rgbColor} />
        <Fan position={[0, -0.07, 0]} rgbOn={rgbOn} color={rgbColor} spin={0.85} />
      </group>
    );
  }

  if (category === "storage") {
    return (
      <group>
        <mesh material={m.alum} castShadow>
          <boxGeometry args={[0.08, 0.006, 0.022]} />
        </mesh>
        <mesh position={[0, 0.004, 0]} material={m.dark}>
          <boxGeometry args={[0.07, 0.003, 0.018]} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh material={m.dark}>
      <boxGeometry args={[0.03, 0.03, 0.03]} />
    </mesh>
  );
}

export function variantFor(slot, component) {
  const meta = component?.compatibilityMetadata || {};
  if (slot === "gpu") return Number(meta.lengthMm || 0) >= 300 ? "long" : "compact";
  if (slot === "cooler") return meta.type === "aio" ? "aio" : "air";
  if (slot === "cabinet") return (meta.formFactors || []).includes("ATX") ? "atx" : "itx";
  return "atx";
}
