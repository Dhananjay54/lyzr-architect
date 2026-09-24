"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type Device = "desktop" | "tablet" | "mobile";
export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1040, tablet: 768, mobile: 390 };

/** Renders children at a logical device width and scales the frame to fit its container. */
export function DeviceFrame({ device, children, url = "localhost:3000", chrome = true }: { device: Device; children: ReactNode; url?: string; chrome?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const width = DEVICE_WIDTH[device];
  const pad = 28;
  const scale = Math.min(1, (box.w - pad) / width);
  const height = Math.max(320, (box.h - pad) / scale);
  return (
    <div className="device-canvas" ref={ref}>
      <motion.div
        className={`device device-${device}`}
        initial={false}
        animate={{ width, height, scale, x: "-50%" }}
        transition={{ type: "spring", stiffness: 220, damping: 30 }}
        style={{ transformOrigin: "top center" }}
      >
        {chrome && (
          <div className="device-bar">
            <i /><i /><i />
            <span className="device-url">{url}</span>
          </div>
        )}
        <div className="device-scroll">{children}</div>
      </motion.div>
    </div>
  );
}
