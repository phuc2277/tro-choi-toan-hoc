import React from 'react';
import { MathDiagram, MathTableData } from '../types/GestureQuiz';
import { MathRenderer } from './MathRenderer';

interface MathDiagramViewProps {
  diagram?: MathDiagram;
  tableData?: MathTableData;
  imageUrl?: string;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const MathDiagramView: React.FC<MathDiagramViewProps> = ({
  diagram,
  tableData,
  imageUrl,
  className = '',
  theme = 'auto',
}) => {
  if (!diagram && !tableData && !imageUrl) return null;

  return (
    <div className={`space-y-4 my-3 ${className}`}>
      {/* 0. Optional Image URL */}
      {imageUrl && (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-3 shadow-lg max-w-lg mx-auto flex flex-col items-center">
          <img
            src={imageUrl}
            alt="Hình vẽ bài toán"
            className="max-h-64 object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 1. Precision Table Rendering with Math support */}
      {tableData && (
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3 sm:p-4 shadow-xl max-w-xl mx-auto overflow-hidden">
          {tableData.title && (
            <div className="text-center font-black text-xs sm:text-sm text-indigo-700 dark:text-amber-300 mb-2 font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>📊</span>
              <span><MathRenderer text={tableData.title} /></span>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-slate-800">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                  {tableData.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-3 text-xs sm:text-sm font-black font-mono border-r border-white/20 last:border-r-0 shadow-sm"
                    >
                      <MathRenderer text={header} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`border-b border-indigo-100 dark:border-slate-800 last:border-b-0 transition ${
                      rIdx % 2 === 0 ? 'bg-indigo-50/30 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'
                    } hover:bg-amber-50 dark:hover:bg-indigo-950/40`}
                  >
                    {row.map((cell, cIdx) => {
                      const isHighlighted =
                        tableData.highlightCell?.row === rIdx &&
                        tableData.highlightCell?.col === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 text-xs sm:text-sm font-bold border-r border-indigo-100 dark:border-slate-800 last:border-r-0 ${
                            isHighlighted
                              ? 'bg-amber-400/25 text-amber-900 dark:text-amber-300 font-black ring-2 ring-amber-400'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <MathRenderer text={String(cell)} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Precision Mathematical Geometric Vector SVG Diagrams */}
      {diagram && (
        <div className="bg-gradient-to-b from-white to-indigo-50/40 dark:from-slate-900 dark:to-slate-950 border-2 border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3 sm:p-5 shadow-xl max-w-lg mx-auto flex flex-col items-center">
          {diagram.title && (
            <div className="text-center font-black text-xs sm:text-sm text-indigo-700 dark:text-cyan-300 mb-2 font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>📐</span>
              <span><MathRenderer text={diagram.title} /></span>
            </div>
          )}

          <div className="w-full flex justify-center py-2">
            {/* Diagram 1: Parallel Lines Cut by Transversal (a // b, cut by c) */}
            {diagram.type === 'parallel-transversal' && (
              <svg
                viewBox="0 0 360 200"
                className="w-full max-w-[340px] h-auto drop-shadow-md"
              >
                {/* Line a */}
                <line x1="30" y1="60" x2="330" y2="60" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
                <text x="335" y="65" fill="#0284C7" fontSize="14" fontWeight="bold" fontFamily="monospace">a</text>

                {/* Line b */}
                <line x1="30" y1="140" x2="330" y2="140" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
                <text x="335" y="145" fill="#0284C7" fontSize="14" fontWeight="bold" fontFamily="monospace">b</text>

                {/* Transversal Line c */}
                <line x1="70" y1="20" x2="270" y2="180" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
                <text x="275" y="190" fill="#F59E0B" fontSize="14" fontWeight="bold" fontFamily="monospace">c</text>

                {/* Intersection Point A (120, 60) */}
                <circle cx="120" cy="60" r="5" fill="#4F46E5" />
                <text x="100" y="55" fill="#1E293B" className="dark:fill-white" fontSize="15" fontWeight="900">A</text>

                {/* Intersection Point B (220, 140) */}
                <circle cx="220" cy="140" r="5" fill="#4F46E5" />
                <text x="235" y="155" fill="#1E293B" className="dark:fill-white" fontSize="15" fontWeight="900">B</text>

                {/* Angle Arc A1 at (120, 60) */}
                <path d="M 140 60 A 20 20 0 0 1 133 70" fill="none" stroke="#10B981" strokeWidth="3" />
                <text x="145" y="80" fill="#059669" className="dark:fill-emerald-400" fontSize="12" fontWeight="bold">
                  {diagram.labels?.angleA1 ?? '60°'}
                </text>

                {/* Angle Arc B1 at (220, 140) */}
                <path d="M 200 140 A 20 20 0 0 1 207 130" fill="none" stroke="#F43F5E" strokeWidth="3" />
                <text x="180" y="130" fill="#E11D48" className="dark:fill-rose-400" fontSize="13" fontWeight="900">
                  {diagram.labels?.angleB1 ?? 'B₁ = ?'}
                </text>

                {/* Note badge */}
                <rect x="220" y="12" width="115" height="26" rx="8" fill="#EEF2FF" className="dark:fill-slate-800" stroke="#6366F1" strokeWidth="1.5" />
                <text x="277" y="29" fill="#4F46E5" className="dark:fill-indigo-300" fontSize="11" fontWeight="bold" textAnchor="middle">
                  a ∥ b (Song song)
                </text>
              </svg>
            )}

            {/* Diagram 2: Right Triangle ABC (Vuông tại A) */}
            {diagram.type === 'right-triangle' && (
              <svg
                viewBox="0 0 320 200"
                className="w-full max-w-[320px] h-auto drop-shadow-md"
              >
                {/* Triangle Polygon */}
                <polygon
                  points="60,150 60,40 260,150"
                  fill="rgba(99, 102, 241, 0.12)"
                  stroke="#4F46E5"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Right Angle Square at vertex A (60, 150) */}
                <path
                  d="M 60 132 L 78 132 L 78 150"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />

                {/* Vertices */}
                <text x="40" y="165" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900">A</text>
                <text x="50" y="30" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900">B</text>
                <text x="270" y="165" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900">C</text>

                {/* Side AB */}
                <text x="25" y="95" fill="#059669" className="dark:fill-emerald-400" fontSize="13" fontWeight="bold">
                  {diagram.labels?.sideAB ?? '3 cm'}
                </text>

                {/* Side AC */}
                <text x="150" y="175" fill="#059669" className="dark:fill-emerald-400" fontSize="13" fontWeight="bold" textAnchor="middle">
                  {diagram.labels?.sideAC ?? '4 cm'}
                </text>

                {/* Hypotenuse BC */}
                <text x="175" y="85" fill="#E11D48" className="dark:fill-rose-400" fontSize="14" fontWeight="900">
                  {diagram.labels?.sideBC ?? 'BC = ?'}
                </text>
              </svg>
            )}

            {/* Diagram 3: Triangle ABC with Angles */}
            {diagram.type === 'triangle-angles' && (
              <svg
                viewBox="0 0 320 200"
                className="w-full max-w-[320px] h-auto drop-shadow-md"
              >
                {/* Triangle ABC */}
                <polygon
                  points="140,30 40,160 280,160"
                  fill="rgba(168, 85, 247, 0.12)"
                  stroke="#9333EA"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Vertices */}
                <text x="140" y="20" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900" textAnchor="middle">A</text>
                <text x="25" y="175" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900">B</text>
                <text x="290" y="175" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900">C</text>

                {/* Angle at A */}
                <text x="140" y="60" fill="#D97706" className="dark:fill-amber-400" fontSize="13" fontWeight="bold" textAnchor="middle">
                  {diagram.labels?.angleA ?? '70°'}
                </text>

                {/* Angle at B */}
                <text x="65" y="150" fill="#059669" className="dark:fill-emerald-400" fontSize="13" fontWeight="bold">
                  {diagram.labels?.angleB ?? '50°'}
                </text>

                {/* Angle at C */}
                <text x="235" y="150" fill="#E11D48" className="dark:fill-rose-400" fontSize="14" fontWeight="900">
                  {diagram.labels?.angleC ?? 'C = ?'}
                </text>
              </svg>
            )}

            {/* Diagram 4: 3D Rectangular Box (Hình hộp chữ nhật) */}
            {diagram.type === 'rectangular-box' && (
              <svg
                viewBox="0 0 340 210"
                className="w-full max-w-[320px] h-auto drop-shadow-md"
              >
                {/* Back hidden edges (dashed) */}
                <line x1="50" y1="110" x2="110" y2="60" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="110" y1="60" x2="270" y2="60" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="110" y1="60" x2="110" y2="140" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5,5" />

                {/* Front face */}
                <polygon
                  points="50,110 210,110 210,190 50,190"
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#2563EB"
                  strokeWidth="3"
                />

                {/* Top face */}
                <polygon
                  points="50,110 110,60 270,60 210,110"
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="#2563EB"
                  strokeWidth="3"
                />

                {/* Right face */}
                <polygon
                  points="210,110 270,60 270,140 210,190"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#2563EB"
                  strokeWidth="3"
                />

                {/* Dimensions */}
                <text x="130" y="205" fill="#D97706" className="dark:fill-amber-400" fontSize="13" fontWeight="bold" textAnchor="middle">
                  {diagram.labels?.length ?? 'a = 5 cm'}
                </text>
                <text x="25" y="155" fill="#059669" className="dark:fill-emerald-400" fontSize="13" fontWeight="bold">
                  {diagram.labels?.height ?? 'h = 4 cm'}
                </text>
                <text x="255" y="100" fill="#E11D48" className="dark:fill-rose-400" fontSize="13" fontWeight="bold">
                  {diagram.labels?.width ?? 'b = 3 cm'}
                </text>
              </svg>
            )}

            {/* Diagram 5: Angle Bisector (Tia phân giác Oz của góc xOy) */}
            {diagram.type === 'angle-bisector' && (
              <svg
                viewBox="0 0 300 200"
                className="w-full max-w-[300px] h-auto drop-shadow-md"
              >
                {/* Vertex O */}
                <circle cx="60" cy="150" r="5" fill="#4F46E5" />
                <text x="40" y="165" fill="#1E293B" className="dark:fill-white" fontSize="16" fontWeight="900">O</text>

                {/* Ray Ox */}
                <line x1="60" y1="150" x2="260" y2="150" stroke="#0284C7" strokeWidth="3" />
                <text x="270" y="155" fill="#0284C7" fontSize="14" fontWeight="bold">x</text>

                {/* Ray Oy */}
                <line x1="60" y1="150" x2="160" y2="30" stroke="#0284C7" strokeWidth="3" />
                <text x="165" y="25" fill="#0284C7" fontSize="14" fontWeight="bold">y</text>

                {/* Ray Oz (Bisector) */}
                <line x1="60" y1="150" x2="230" y2="70" stroke="#F59E0B" strokeWidth="3.5" strokeDasharray="6,2" />
                <text x="240" y="75" fill="#D97706" className="dark:fill-amber-400" fontSize="14" fontWeight="900">z (phân giác)</text>

                {/* Angle arcs */}
                <path d="M 100 150 A 40 40 0 0 0 94 135" fill="none" stroke="#10B981" strokeWidth="2.5" />
                <path d="M 94 135 A 40 40 0 0 0 82 120" fill="none" stroke="#10B981" strokeWidth="2.5" />
                <text x="110" y="135" fill="#059669" className="dark:fill-emerald-400" fontSize="11" fontWeight="bold">
                  {diagram.labels?.angle1 ?? '35°'}
                </text>
              </svg>
            )}

            {/* Diagram 6: Number Line (Trục số) */}
            {diagram.type === 'number-line' && (
              <svg
                viewBox="0 0 360 120"
                className="w-full max-w-[340px] h-auto drop-shadow-md"
              >
                {/* Axis */}
                <line x1="20" y1="60" x2="330" y2="60" stroke="#475569" strokeWidth="3" />
                <polygon points="340,60 328,54 328,66" fill="#475569" />
                <text x="345" y="65" fill="#475569" fontSize="12" fontWeight="bold">x</text>

                {/* Tick marks */}
                {[-2, -1, 0, 1, 2, 3].map((val, idx) => {
                  const x = 50 + idx * 50;
                  const isZero = val === 0;
                  return (
                    <g key={idx}>
                      <line x1={x} y1="52" x2={x} y2="68" stroke={isZero ? '#4F46E5' : '#64748B'} strokeWidth={isZero ? 3 : 2} />
                      <text x={x} y="85" fill={isZero ? '#4F46E5' : '#1E293B'} className="dark:fill-slate-200" fontSize="13" fontWeight="bold" textAnchor="middle">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Highlight Point */}
                <circle cx="200" cy="60" r="6" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2" />
                <text x="200" y="40" fill="#E11D48" className="dark:fill-rose-400" fontSize="13" fontWeight="900" textAnchor="middle">
                  {diagram.labels?.point ?? 'A(1)'}
                </text>
              </svg>
            )}

            {/* Diagram 7: Circle with Center O and Radius R */}
            {diagram.type === 'circle-radius' && (
              <svg
                viewBox="0 0 300 200"
                className="w-full max-w-[300px] h-auto drop-shadow-md"
              >
                <circle cx="150" cy="100" r="75" fill="rgba(16, 185, 129, 0.1)" stroke="#10B981" strokeWidth="3" />
                <circle cx="150" cy="100" r="4.5" fill="#1E293B" className="dark:fill-white" />
                <text x="135" y="95" fill="#1E293B" className="dark:fill-white" fontSize="15" fontWeight="900">O</text>

                {/* Radius Line */}
                <line x1="150" y1="100" x2="225" y2="100" stroke="#F59E0B" strokeWidth="3" />
                <circle cx="225" cy="100" r="4.5" fill="#1E293B" className="dark:fill-white" />
                <text x="235" y="105" fill="#1E293B" className="dark:fill-white" fontSize="15" fontWeight="900">A</text>
                <text x="187" y="90" fill="#D97706" className="dark:fill-amber-400" fontSize="13" fontWeight="bold" textAnchor="middle">
                  {diagram.labels?.radius ?? 'R = 5 cm'}
                </text>
              </svg>
            )}

            {/* Diagram 8: Cartesian Coordinate Plane Oxy */}
            {diagram.type === 'coordinate-plane' && (
              <svg
                viewBox="0 0 300 200"
                className="w-full max-w-[300px] h-auto drop-shadow-md"
              >
                {/* Grid */}
                <defs>
                  <pattern id="grid-light" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="300" height="200" fill="url(#grid-light)" />

                {/* X Axis */}
                <line x1="20" y1="110" x2="280" y2="110" stroke="#475569" strokeWidth="2.5" />
                <polygon points="285,110 277,106 277,114" fill="#475569" />
                <text x="285" y="125" fill="#475569" fontSize="13" fontWeight="bold">x</text>

                {/* Y Axis */}
                <line x1="150" y1="185" x2="150" y2="20" stroke="#475569" strokeWidth="2.5" />
                <polygon points="150,15 146,23 154,23" fill="#475569" />
                <text x="135" y="25" fill="#475569" fontSize="13" fontWeight="bold">y</text>

                {/* Origin O */}
                <text x="137" y="125" fill="#475569" fontSize="12" fontWeight="bold">O</text>

                {/* Point M(2, 2) at (200, 60) */}
                <circle cx="200" cy="60" r="5" fill="#E11D48" />
                <text x="210" y="55" fill="#E11D48" className="dark:fill-rose-400" fontSize="13" fontWeight="900">
                  {diagram.labels?.pointM ?? 'M(2; 2)'}
                </text>

                {/* Projection lines */}
                <line x1="200" y1="60" x2="200" y2="110" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="200" y1="60" x2="150" y2="60" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="200" y="125" fill="#0284C7" fontSize="11" fontWeight="bold" textAnchor="middle">2</text>
                <text x="138" y="65" fill="#0284C7" fontSize="11" fontWeight="bold" textAnchor="end">2</text>
              </svg>
            )}

            {/* Diagram 9: Communicating Vessels */}
            {diagram.type === 'communicating-vessels' && (
              <svg
                viewBox="0 0 300 180"
                className="w-full max-w-[300px] h-auto drop-shadow-md"
              >
                <path
                  d="M 50 30 L 50 140 Q 50 160 70 160 L 230 160 Q 250 160 250 140 L 250 30 L 220 30 L 220 130 Q 220 135 215 135 L 85 135 Q 80 135 80 130 L 80 30 Z"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="3.5"
                />
                <path
                  d="M 50 75 L 80 75 L 80 130 Q 80 135 85 135 L 215 135 Q 220 135 220 130 L 220 75 L 250 75 L 250 140 Q 250 160 230 160 L 70 160 Q 50 160 50 140 Z"
                  fill="rgba(56, 189, 248, 0.4)"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
                <line x1="40" y1="75" x2="260" y2="75" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,4" />
                <text x="150" y="65" fill="#D97706" fontSize="12" fontWeight="bold" textAnchor="middle">
                  Mặt thoáng cùng độ cao
                </text>
                <text x="65" y="115" fill="#1E293B" className="dark:fill-white" fontSize="12" fontWeight="bold">Nhánh 1</text>
                <text x="205" y="115" fill="#1E293B" className="dark:fill-white" fontSize="12" fontWeight="bold">Nhánh 2</text>
              </svg>
            )}
          </div>

          {diagram.caption && (
            <p className="text-xs text-slate-600 dark:text-gray-300 font-medium text-center mt-2 italic bg-indigo-50/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">
              <MathRenderer text={diagram.caption} />
            </p>
          )}
        </div>
      )}
    </div>
  );
};
