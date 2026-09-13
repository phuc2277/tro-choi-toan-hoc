import React from 'react';
import { GeometryBlock } from '../../../types/contentBlock';
import { Shapes } from 'lucide-react';

interface GeometryBlockRendererProps {
  block: GeometryBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: GeometryBlock['content']) => void;
}

export const GeometryBlockRenderer: React.FC<GeometryBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;

  const renderShapeSvg = () => {
    switch (content.shapeType) {
      case 'triangle':
        return (
          <svg viewBox="0 0 200 160" className="w-48 h-40 drop-shadow-md">
            <polygon points="100,20 20,140 180,140" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" />
            <text x="100" y="15" textAnchor="middle" className="text-[12px] font-bold fill-sky-800">A</text>
            <text x="12" y="145" textAnchor="middle" className="text-[12px] font-bold fill-sky-800">B</text>
            <text x="190" y="145" textAnchor="middle" className="text-[12px] font-bold fill-sky-800">C</text>
            {/* Right angle or altitude */}
            <line x1="100" y1="20" x2="100" y2="140" stroke="#0284C7" strokeDasharray="4 3" strokeWidth="2" />
            <rect x="92" y="132" width="8" height="8" fill="none" stroke="#0284C7" strokeWidth="1.5" />
            <text x="105" y="155" textAnchor="middle" className="text-[10px] font-bold fill-sky-700">H</text>
          </svg>
        );
      case 'circle':
        return (
          <svg viewBox="0 0 180 180" className="w-44 h-44 drop-shadow-md">
            <circle cx="90" cy="90" r="70" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
            <circle cx="90" cy="90" r="4" fill="#B45309" />
            <line x1="90" y1="90" x2="150" y2="55" stroke="#B45309" strokeWidth="2" strokeDasharray="3 3" />
            <text x="90" y="105" textAnchor="middle" className="text-[12px] font-bold fill-amber-900">O</text>
            <text x="120" y="65" textAnchor="middle" className="text-[11px] font-bold fill-amber-800">R</text>
          </svg>
        );
      case 'coordinate':
        return (
          <svg viewBox="0 0 200 180" className="w-48 h-44 drop-shadow-md">
            {/* Grid */}
            <defs>
              <pattern id="coordGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="200" height="180" fill="url(#coordGrid)" />
            {/* Axes */}
            <line x1="10" y1="90" x2="190" y2="90" stroke="#334155" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <line x1="100" y1="170" x2="100" y2="10" stroke="#334155" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <text x="195" y="94" className="text-[12px] font-bold fill-slate-800">x</text>
            <text x="100" y="8" className="text-[12px] font-bold fill-slate-800">y</text>
            <text x="92" y="104" className="text-[11px] font-bold fill-slate-600">O</text>
            {/* Sample linear graph */}
            <line x1="20" y1="150" x2="180" y2="30" stroke="#DC2626" strokeWidth="2.5" />
            <text x="150" y="30" className="text-[10px] font-bold fill-rose-600">y = ax + b</text>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 180 140" className="w-44 h-36 drop-shadow-md">
            <rect x="20" y="20" width="140" height="100" rx="4" fill="#F0FDF4" stroke="#16A34A" strokeWidth="3" />
            <text x="15" y="15" className="text-[12px] font-bold fill-emerald-800">A</text>
            <text x="165" y="15" className="text-[12px] font-bold fill-emerald-800">B</text>
            <text x="165" y="130" className="text-[12px] font-bold fill-emerald-800">C</text>
            <text x="15" y="130" className="text-[12px] font-bold fill-emerald-800">D</text>
          </svg>
        );
    }
  };

  return (
    <div className="w-full h-full p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Shapes className="w-4 h-4 text-sky-600" />
          <span>{content.title || 'Mô hình Hình học trực quan'}</span>
        </div>
        {isEditor && (
          <select
            value={content.shapeType}
            onChange={(e) => onUpdate?.({ ...content, shapeType: e.target.value as any })}
            className="text-[11px] px-2 py-0.5 border border-slate-200 rounded-lg bg-slate-50 font-bold"
          >
            <option value="triangle">Tam giác & Đường cao</option>
            <option value="circle">Đường tròn & Bán kính</option>
            <option value="rectangle">Hình chữ nhật ABCD</option>
            <option value="coordinate">Hệ trục tọa độ Oxy</option>
          </select>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-2">
        {renderShapeSvg()}
      </div>

      <div className="text-[11px] text-slate-500 italic text-center">
        Hình học trực quan phục vụ bài giảng
      </div>
    </div>
  );
};
