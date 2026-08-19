import * as THREE from "three";

const cache = new Map();

export function getCachedGltf(url) {
  if (!url) return null;
  return cache.get(url) || null;
}

export function rememberGltf(url, gltf) {
  cache.set(url, gltf);
}

export function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v && v.isTexture) v.dispose();
        });
        m.dispose();
      });
    }
  });
}

export function metal(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.72,
    roughness: 0.28,
    ...extra,
  });
}
