import { Children, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion, useSpring, useMotionValue } from "motion/react";
import { useLocation } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1];

export function PageFade({ children }) {
  const location = useLocation();
  const reduce = useReducedMotion();
  if (reduce) return children;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.42, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function Reveal({ children, className, delay = 0, y = 28 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18, margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, delay = 0.08, style, onView = true }) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate={onView ? undefined : "show"}
      whileInView={onView ? "show" : undefined}
      viewport={onView ? { once: true, amount: 0.01, margin: "120px" } : undefined}
      variants={{ show: { transition: { staggerChildren: delay } } }}
    >
      {items.map((child, i) => (
        <motion.div
          key={child.key || i}
          variants={{
            hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function SplitTitle({ text, as: Tag = "h1" }) {
  const reduce = useReducedMotion();
  const words = String(text).split(" ");
  if (reduce) return <Tag className="split-title gradient-ink">{text}</Tag>;
  return (
    <Tag className="split-title gradient-ink">
      {words.map((word, i) => (
        <span className="split-word" key={`${word}-${i}`}>
          <motion.span
            initial={{ y: "108%", opacity: 0, filter: "blur(10px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.08 + i * 0.055, duration: 0.78, ease }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function Magnet({ children, strength = 0.28, className }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 });

  if (reduce) return <div className={className}>{children}</div>;

  function onMove(e) {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y, display: "inline-flex" }}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function StarBorder({ children, className }) {
  return <span className={`star-border ${className || ""}`}>{children}</span>;
}

export function GlareCard({ children, className }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [spot, setSpot] = useState({ x: 50, y: 50, on: false });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  if (reduce) return <div className={className}>{children}</div>;

  function onMove(e) {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setSpot({ x: px * 100, y: py * 100, on: true });
    setTilt({ x: (py - 0.5) * -8, y: (px - 0.5) * 10 });
  }

  return (
    <motion.div
      ref={ref}
      className={`glare-card ${className || ""}`}
      onMouseMove={onMove}
      onMouseLeave={() => {
        setSpot((s) => ({ ...s, on: false }));
        setTilt({ x: 0, y: 0 });
      }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y, y: spot.on ? -6 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        transformPerspective: 900,
        "--gx": `${spot.x}%`,
        "--gy": `${spot.y}%`,
        "--ga": spot.on ? 1 : 0,
      }}
    >
      {children}
    </motion.div>
  );
}

function SparkBurst({ x, y }) {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const angle = ((Math.PI * 2) / 10) * i + Math.random() * 0.25;
    const dist = 22 + Math.random() * 18;
    return { i, angle, dist };
  });
  return (
    <>
      {rays.map(({ i, angle, dist }) => (
        <motion.span
          key={i}
          className="spark"
          style={{ left: x, top: y }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            scale: 0.2,
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

export function ClickSpark() {
  const reduce = useReducedMotion();
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (reduce) return undefined;
    function onClick(e) {
      if (e.target.closest("canvas, input, textarea, select")) return;
      const id = `${Date.now()}-${Math.random()}`;
      setBursts((list) => [...list.slice(-6), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setBursts((list) => list.filter((b) => b.id !== id));
      }, 500);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [reduce]);

  if (reduce || typeof document === "undefined") return null;
  return createPortal(
    <div className="spark-layer" aria-hidden="true">
      {bursts.map((b) => (
        <SparkBurst key={b.id} x={b.x} y={b.y} />
      ))}
    </div>,
    document.body,
  );
}
