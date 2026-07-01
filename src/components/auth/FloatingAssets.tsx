import React, { useEffect, useState, useMemo, useRef } from "react";
import asset24 from "../../assets/splashScreenAssests/24.webp";
import asset25 from "../../assets/splashScreenAssests/25.webp";
import asset26 from "../../assets/splashScreenAssests/26.webp";
import asset27 from "../../assets/splashScreenAssests/27.webp";
import asset28 from "../../assets/splashScreenAssests/28.webp";
import asset29 from "../../assets/splashScreenAssests/29.webp";
import asset30 from "../../assets/splashScreenAssests/30.webp";
import asset31 from "../../assets/splashScreenAssests/31.webp";
import asset32 from "../../assets/splashScreenAssests/32.webp";
import asset33 from "../../assets/splashScreenAssests/33.webp";
import asset34 from "../../assets/splashScreenAssests/34.webp";

interface AssetConfig {
  src: string;
  offsetX: string;
  offsetY: string;
  size: string;
  tilt: string;
  speed: "slow" | "medium" | "fast";
  delay: string;
  factor: number;
  mobileVisible?: boolean;
}

const ASSETS_LIST = [
  asset24,
  asset25,
  asset26,
  asset27,
  asset28,
  asset29,
  asset30,
  asset31,
  asset32,
  asset33,
  asset34,
];

export const FloatingAssets: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const x = e.clientX - window.innerWidth / 2;
        const y = e.clientY - window.innerHeight / 2;
        containerRef.current.style.setProperty("--mouse-x", `${x}px`);
        containerRef.current.style.setProperty("--mouse-y", `${y}px`);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const generatedAssets = useMemo(() => {
    const list: AssetConfig[] = [];
    const cols = 4;
    const rows = 4;
    const colStep = 96 / cols; // horizontal cell width in vw
    const rowStep = 92 / rows; // vertical cell height in vh

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const src = ASSETS_LIST[Math.floor(Math.random() * ASSETS_LIST.length)];

        // Compute grid cell center offsets relative to center (50%, 50%)
        const colCenter = -48 + c * colStep + colStep / 2;
        const rowCenter = -46 + r * rowStep + rowStep / 2;

        // Apply a random jitter within the cell to keep the layout natural and organic
        const jitterX = (Math.random() - 0.5) * (colStep * 0.75);
        const jitterY = (Math.random() - 0.5) * (rowStep * 0.75);

        const offsetX = `${(colCenter + jitterX).toFixed(1)}vw`;
        const offsetY = `${(rowCenter + jitterY).toFixed(1)}vh`;

        // Accent sizes: 32px to 54px
        const size = `${32 + Math.random() * 22}px`;

        // Tilted randomly to right or left: -25deg to +25deg
        const tilt = `${-25 + Math.random() * 50}deg`;

        const speeds: ("slow" | "medium" | "fast")[] = ["slow", "medium", "fast"];
        const speed = speeds[Math.floor(Math.random() * speeds.length)];

        const delay = `${(Math.random() * 3).toFixed(1)}s`;

        // Parallax factor
        const factor = (0.005 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);

        // Keep a subset visible on mobile (approx. 6 assets)
        const mobileVisible = (c + r) % 3 === 0;

        list.push({
          src,
          offsetX,
          offsetY,
          size,
          tilt,
          speed,
          delay,
          factor,
          mobileVisible,
        });
      }
    }
    return list;
  }, []);

  if (!isMounted) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        // Set default values for mouse position
        "--mouse-x": "0px",
        "--mouse-y": "0px",
      } as React.CSSProperties}
    >
      {generatedAssets.map((asset, i) => {
        const speedClass =
          asset.speed === "slow"
            ? "animate-float-slow"
            : asset.speed === "medium"
            ? "animate-float-medium"
            : "animate-float-fast";

        const classes = [
          "floating-asset",
          asset.mobileVisible ? "floating-asset-mobile-visible" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={i}
            className={classes}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: asset.size,
              transform: `translate3d(calc(-50% + ${asset.offsetX} + (var(--mouse-x, 0px) * ${asset.factor})), calc(-50% + ${asset.offsetY} + (var(--mouse-y, 0px) * ${asset.factor})), 0) rotate(${asset.tilt})`,
              transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              willChange: "transform",
            }}
          >
            <div className={speedClass} style={{ animationDelay: asset.delay }}>
              <img src={asset.src} alt="" loading="lazy" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
