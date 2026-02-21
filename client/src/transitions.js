import { useEffect, useRef, useState } from "react";

// ─── Screen slide transition ──────────────────────────────────────
// Wraps any screen content with an entrance animation.
// dir: "up" | "down" | "left" | "right"

export function useScreenEnter(dir = "up", duration = 220) {
  const [style, setStyle] = useState(() => getInitial(dir));

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setStyle({ opacity: 1, transform: "translate(0,0)", transition: `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(0.22,1,0.36,1)` });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return style;
}

function getInitial(dir) {
  const map = {
    up: "translateY(18px)",
    down: "translateY(-18px)",
    left: "translateX(24px)",
    right: "translateX(-24px)",
  };
  return { opacity: 0, transform: map[dir] || map.up, transition: "none" };
}

// ─── Animated counting number ─────────────────────────────────────
// Counts from prev value to next value when it changes

export function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const frame = useRef(null);

  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(+(start + diff * ease).toFixed(2));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else { setDisplay(target); prev.current = target; }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target]);

  return display;
}

// ─── Flash effect hook ────────────────────────────────────────────
// Returns a flashing class/style trigger you can use on any element

export function useFlash() {
  const [flashing, setFlashing] = useState(false);

  const flash = () => {
    setFlashing(true);
    setTimeout(() => setFlashing(false), 300);
  };

  return [flashing, flash];
}

// ─── Stagger children animation utility ──────────────────────────
// Pass index to get staggered animation-delay styles

export function stagger(i, base = 40) {
  return {
    animation: `fadeUp 0.3s ease both`,
    animationDelay: `${i * base}ms`,
  };
}

// ─── Press animation style ────────────────────────────────────────
// Apply to any button: small scale-down on press

export function usePressStyle() {
  const [pressed, setPressed] = useState(false);

  const handlers = {
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
  };

  const style = pressed
    ? { transform: "scale(0.96)", transition: "transform 0.06s ease" }
    : { transform: "scale(1)", transition: "transform 0.12s ease" };

  return [style, handlers];
}
