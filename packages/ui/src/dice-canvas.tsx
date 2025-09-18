"use client";

import { useEffect, useRef } from "react";

interface DiceCanvasProps {
  role: "player" | "gm";
}

export function DiceCanvas({ role }: DiceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#1f2937";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#7c3aed";
    context.font = "20px sans-serif";
    context.fillText(`Dice Ansicht (${role})`, 20, 40);
  }, [role]);

  return (
    <div className="relative h-full w-full bg-slate-950">
      <canvas ref={canvasRef} className="h-full w-full" width={1024} height={768} />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-4 text-xs text-slate-500">
        Placeholder-Canvas – Three.js-Integration folgt
      </div>
    </div>
  );
}
