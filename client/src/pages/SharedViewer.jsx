import { useEffect } from "react";
import { PCViewer } from "../three/PCViewer/PCViewer.jsx";
import { useBuildStore } from "../store/buildStore.js";

export function SharedViewer({ cfg }) {
  const load = useBuildStore((s) => s.loadFromConfig);
  useEffect(() => {
    load(cfg);
  }, [cfg, load]);
  return <PCViewer />;
}
