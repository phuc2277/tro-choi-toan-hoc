import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layers, Rotate3d, Sliders, Play, RefreshCw, ZoomIn, ZoomOut, CheckCircle2, Sparkles, Box } from 'lucide-react';
import { MathRenderer } from '../../../games/components/MathRenderer';

interface InteractiveMath3DBlockProps {
  initialA?: number;
  initialB?: number;
  initialC?: number;
  initialA2?: number;
  initialB2?: number;
  initialC2?: number;
  mode?: 'linear-system' | 'spatial-3d';
  title?: string;
  className?: string;
}

export const InteractiveMath3DBlock: React.FC<InteractiveMath3DBlockProps> = ({
  initialA = 2,
  initialB = -1,
  initialC = 3,
  initialA2 = 1,
  initialB2 = 1,
  initialC2 = 3,
  mode = 'linear-system',
  title = 'Mô hình Tương tác Biểu diễn Nghiệm trên Mặt phẳng Oxy',
  className = '',
}) => {
  // Coefficients for Equation 1: a1*x + b1*y = c1
  const [a1, setA1] = useState<number>(initialA);
  const [b1, setB1] = useState<number>(initialB);
  const [c1, setC1] = useState<number>(initialC);

  // Coefficients for Equation 2: a2*x + b2*y = c2
  const [a2, setA2] = useState<number>(initialA2);
  const [b2, setB2] = useState<number>(initialB2);
  const [c2, setC2] = useState<number>(initialC2);

  // Spatial 3D Shape State (Pyramid / Prism / Cylinder)
  const [spatialShape, setSpatialShape] = useState<'pyramid' | 'prism' | 'cylinder'>('pyramid');
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute System Solution State
  const systemState = useMemo(() => {
    // Determinant D = a1*b2 - a2*b1
    const D = a1 * b2 - a2 * b1;
    const Dx = c1 * b2 - c2 * b1;
    const Dy = a1 * c2 - a2 * c1;

    if (Math.abs(D) > 0.0001) {
      const x = Dx / D;
      const y = Dy / D;
      return {
        type: 'unique' as const,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        message: `Hệ có nghiệm duy nhất: (x; y) = (${x.toFixed(2)}; ${y.toFixed(2)})`,
        geometryStatus: 'Hai đường thẳng (d1) và (d2) cắt nhau tại 1 điểm duy nhất',
      };
    } else {
      if (Math.abs(Dx) < 0.0001 && Math.abs(Dy) < 0.0001) {
        return {
          type: 'infinite' as const,
          message: 'Hệ có vô số nghiệm',
          geometryStatus: 'Hai đường thẳng (d1) và (d2) trùng nhau hoàn toàn',
        };
      } else {
        return {
          type: 'none' as const,
          message: 'Hệ phương trình vô nghiệm',
          geometryStatus: 'Hai đường thẳng (d1) và (d2) song song không có điểm chung',
        };
      }
    }
  }, [a1, b1, c1, a2, b2, c2]);

  // Coordinate Canvas dimensions
  const svgWidth = 460;
  const svgHeight = 320;
  const originX = svgWidth / 2;
  const originY = svgHeight / 2;
  const scale = 25; // 25px per unit

  // Helper: Convert math (x, y) to SVG (cx, cy)
  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;

  // Compute points for drawing line ax + by = c
  const getLinePoints = (a: number, b: number, c: number) => {
    const xMin = -8;
    const xMax = 8;
    const yMin = -6;
    const yMax = 6;

    if (Math.abs(b) > 0.0001) {
      // y = (c - a*x) / b
      const y1 = (c - a * xMin) / b;
      const y2 = (c - a * xMax) / b;
      return { x1: toSvgX(xMin), y1: toSvgY(y1), x2: toSvgX(xMax), y2: toSvgY(y2) };
    } else if (Math.abs(a) > 0.0001) {
      // x = c / a (vertical line)
      const xVal = c / a;
      return { x1: toSvgX(xVal), y1: toSvgY(yMin), x2: toSvgX(xVal), y2: toSvgY(yMax) };
    }
    return null;
  };

  const line1 = useMemo(() => getLinePoints(a1, b1, c1), [a1, b1, c1]);
  const line2 = useMemo(() => getLinePoints(a2, b2, c2), [a2, b2, c2]);

  // 3D drag rotation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setRotY((prev) => prev + deltaX * 0.8);
    setRotX((prev) => Math.max(-60, Math.min(60, prev - deltaY * 0.8)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={`rounded-2xl border border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Thí nghiệm Toán 3D & Oxy
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Trực quan hóa bản chất hình học của hệ phương trình và hình không gian GDPT 2018
            </p>
          </div>
        </div>

        {/* Preset switch */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => {
              setA1(2); setB1(-1); setC1(3);
              setA2(1); setB2(1); setC2(3);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
          >
            Cắt nhau (Nghiệm duy nhất)
          </button>
          <button
            onClick={() => {
              setA1(1); setB1(-2); setC1(4);
              setA2(1); setB2(-2); setC2(-2);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
          >
            Song song (Vô nghiệm)
          </button>
          <button
            onClick={() => {
              setA1(2); setB1(-4); setC1(6);
              setA2(1); setB2(-2); setC2(3);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
          >
            Trùng nhau (Vô số nghiệm)
          </button>
        </div>
      </div>

      {/* Main Interactive Grid: Left = Sliders, Right = SVG Coordinate Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5">
        {/* Sliders Control Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Equation 1 Controls (Cyan) */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_#22d3ee]" />
                Đường thẳng (d1): {a1}x + ({b1})y = {c1}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Hệ số a1 = {a1}</label>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="1"
                  value={a1}
                  onChange={(e) => setA1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Hệ số b1 = {b1}</label>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="1"
                  value={b1}
                  onChange={(e) => setB1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Hằng số c1 = {c1}</label>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={c1}
                  onChange={(e) => setC1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Equation 2 Controls (Rose/Orange) */}
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-[0_0_8px_#f43f5e]" />
                Đường thẳng (d2): {a2}x + ({b2})y = {c2}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Hệ số a2 = {a2}</label>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="1"
                  value={a2}
                  onChange={(e) => setA2(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Hệ số b2 = {b2}</label>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="1"
                  value={b2}
                  onChange={(e) => setB2(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Hằng số c2 = {c2}</label>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={c2}
                  onChange={(e) => setC2(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Real-time Math Deduction Status */}
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
              systemState.type === 'unique'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : systemState.type === 'none'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{systemState.message}</span>
            </div>
            <p className="text-[11px] opacity-90">{systemState.geometryStatus}</p>
          </div>
        </div>

        {/* Dynamic Oxy Coordinate Plane (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 p-2 relative overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-[300px] select-none"
          >
            <defs>
              <pattern id="grid-pattern" width={scale} height={scale} patternUnits="userSpaceOnUse">
                <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#grid-pattern)" />

            {/* X and Y Axes */}
            <line x1="0" y1={originY} x2={svgWidth} y2={originY} stroke="#475569" strokeWidth="1.5" />
            <line x1={originX} y1="0" x2={originX} y2={svgHeight} stroke="#475569" strokeWidth="1.5" />

            {/* Axis Arrows */}
            <polygon points={`${svgWidth - 2},${originY} ${svgWidth - 8},${originY - 4} ${svgWidth - 8},${originY + 4}`} fill="#475569" />
            <polygon points={`${originX},2 ${originX - 4},8 ${originX + 4},8`} fill="#475569" />

            {/* Axis Labels */}
            <text x={svgWidth - 14} y={originY - 8} fill="#94A3B8" fontSize="11" fontWeight="bold">x</text>
            <text x={originX + 8} y="14" fill="#94A3B8" fontSize="11" fontWeight="bold">y</text>
            <text x={originX - 12} y={originY + 14} fill="#64748B" fontSize="10">O</text>

            {/* Ticks on X and Y */}
            {[-6, -4, -2, 2, 4, 6].map((tick) => (
              <g key={`xtick-${tick}`}>
                <line x1={toSvgX(tick)} y1={originY - 3} x2={toSvgX(tick)} y2={originY + 3} stroke="#64748B" />
                <text x={toSvgX(tick)} y={originY + 12} fill="#64748B" fontSize="9" textAnchor="middle">{tick}</text>
              </g>
            ))}
            {[-4, -2, 2, 4].map((tick) => (
              <g key={`ytick-${tick}`}>
                <line x1={originX - 3} y1={toSvgY(tick)} x2={originX + 3} y2={toSvgY(tick)} stroke="#64748B" />
                <text x={originX - 10} y={toSvgY(tick) + 3} fill="#64748B" fontSize="9" textAnchor="end">{tick}</text>
              </g>
            ))}

            {/* Line 1 (Cyan) */}
            {line1 && (
              <line
                x1={line1.x1}
                y1={line1.y1}
                x2={line1.x2}
                y2={line1.y2}
                stroke="#22D3EE"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
              />
            )}

            {/* Line 2 (Rose) */}
            {line2 && (
              <line
                x1={line2.x1}
                y1={line2.y1}
                x2={line2.x2}
                y2={line2.y2}
                stroke="#FB7185"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]"
              />
            )}

            {/* Intersection Point (If Unique) */}
            {systemState.type === 'unique' && (
              <g className="animate-in fade-in zoom-in duration-200">
                <circle
                  cx={toSvgX(systemState.x)}
                  cy={toSvgY(systemState.y)}
                  r="6"
                  fill="#FACC15"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_8px_#FACC15]"
                />
                <text
                  x={toSvgX(systemState.x) + 10}
                  y={toSvgY(systemState.y) - 8}
                  fill="#FEF08A"
                  fontSize="11"
                  fontWeight="bold"
                  className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                >
                  M({systemState.x}; {systemState.y})
                </text>
              </g>
            )}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 mt-1">
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> (d1): {a1}x + ({b1})y = {c1}
            </span>
            <span className="flex items-center gap-1 text-rose-300">
              <span className="w-3 h-0.5 bg-rose-400 inline-block" /> (d2): {a2}x + ({b2})y = {c2}
            </span>
            {systemState.type === 'unique' && (
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Giao điểm M
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
