"use client";

import { useEffect, useRef, useState } from "react";

interface DeferUntilVisibleProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  /** Expand viewport so charts start loading slightly before they appear. */
  rootMargin?: string;
}

/** Mount heavy client widgets only when near the viewport (cuts Home/Kinerja JS). */
export function DeferUntilVisible({
  children,
  fallback,
  rootMargin = "240px 0px",
}: DeferUntilVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}
