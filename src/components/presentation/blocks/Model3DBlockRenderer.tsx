import React, { useState } from 'react';
import { Model3DBlock } from '../../../types/contentBlock';
import { Box, RotateCw } from 'lucide-react';
import { ThreeDAtomicAsteroid } from '../../common/ThreeDVisuals';

interface Model3DBlockRendererProps {
  block: Model3DBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: Model3DBlock['content']) => void;
}

export const Model3DBlockRenderer: React.FC<Model3DBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;
  const [rotationAngle, setRotationAngle] = useState(0);

  const rotate = () => {
    setRotationAngle((prev) => (prev + 45) % 360);
  };

  const render3DModel = () => {
    const model = content.modelType || 'cube';

    if (model === 'atom') {
      return (
        <div style={{ transform: `rotate(${rotationAngle}deg)` }} className="transition-transform duration-500">
          <ThreeDAtomicAsteroid className="w-36 h-36" />
        </div>
      );
    }

    if (model === 'cylinder') {
      return (
        <div style={{ transform: `rotateY(${rotationAngle}deg)` }} className="transition-transform duration-500">
          <svg viewBox="0 0 160 200" className="w-36 h-44 drop-shadow-xl">
            <defs>
              <linearGradient id="cylBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="50%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#0F766E" />
              </linearGradient>
            </defs>
            {/* Top base */}
            <ellipse cx="80" cy="40" rx="55" ry="22" fill="#99F6E4" stroke="#0F766E" strokeWidth="2.5" />
            {/* Body */}
            <path d="M 25 40 L 25 150 A 55 22 0 0 0 135 150 L 135 40 Z" fill="url(#cylBody)" opacity="0.9" />
            {/* Bottom base dashed back */}
            <path d="M 25 150 A 55 22 0 0 1 135 150" fill="none" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 4" />
            {/* Bottom base solid front */}
            <path d="M 25 150 A 55 22 0 0 0 135 150" fill="none" stroke="#0F766E" strokeWidth="2.5" />
            {/* Labels */}
            <text x="80" y="100" textAnchor="middle" className="text-[12px] font-bold fill-white">h</text>
            <line x1="80" y1="40" x2="135" y2="40" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="105" y="35" textAnchor="middle" className="text-[10px] font-bold fill-teal-900">R</text>
          </svg>
        </div>
      );
    }

    if (model === 'cone') {
      return (
        <div style={{ transform: `rotateY(${rotationAngle}deg)` }} className="transition-transform duration-500">
          <svg viewBox="0 0 160 200" className="w-36 h-44 drop-shadow-xl">
            <defs>
              <linearGradient id="coneGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="50%" stopColor="#FDBA74" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>
            </defs>
            <polygon points="80,25 25,160 135,160" fill="url(#coneGrad)" />
            {/* Bottom base */}
            <path d="M 25 160 A 55 20 0 0 1 135 160" fill="none" stroke="#9A3412" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 25 160 A 55 20 0 0 0 135 160" fill="#FED7AA" stroke="#9A3412" strokeWidth="2.5" />
            {/* Height line */}
            <line x1="80" y1="25" x2="80" y2="160" stroke="#9A3412" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="70" y="100" className="text-[11px] font-bold fill-white">h</text>
            <text x="80" y="20" textAnchor="middle" className="text-[12px] font-bold fill-amber-900">S</text>
          </svg>
        </div>
      );
    }

    if (model === 'sphere') {
      return (
        <div style={{ transform: `rotate(${rotationAngle}deg)` }} className="transition-transform duration-500">
          <svg viewBox="0 0 180 180" className="w-40 h-40 drop-shadow-xl">
            <defs>
              <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="60%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#4C1D95" />
              </radialGradient>
            </defs>
            <circle cx="90" cy="90" r="70" fill="url(#sphereGrad)" />
            {/* Equator */}
            <ellipse cx="90" cy="90" rx="70" ry="22" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M 20 90 A 70 22 0 0 0 160 90" fill="none" stroke="#DDD6FE" strokeWidth="2" />
            {/* Center */}
            <circle cx="90" cy="90" r="3" fill="#FFFFFF" />
            <line x1="90" y1="90" x2="160" y2="90" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="125" y="85" textAnchor="middle" className="text-[11px] font-bold fill-white">R</text>
          </svg>
        </div>
      );
    }

    // Default: 3D Isometric Cube / Rectangular Prism
    return (
      <div style={{ transform: `rotate(${rotationAngle}deg)` }} className="transition-transform duration-500">
        <svg viewBox="0 0 180 180" className="w-40 h-40 drop-shadow-xl">
          {/* Top Face */}
          <polygon points="90,20 150,55 90,90 30,55" fill="#67E8F9" stroke="#0E7490" strokeWidth="2.5" />
          {/* Left Face */}
          <polygon points="30,55 90,90 90,160 30,125" fill="#0891B2" stroke="#0E7490" strokeWidth="2.5" />
          {/* Right Face */}
          <polygon points="90,90 150,55 150,125 90,160" fill="#06B6D4" stroke="#0E7490" strokeWidth="2.5" />
          {/* Hidden Dashed Edges */}
          <line x1="30" y1="55" x2="90" y2="20" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
          {/* Dimension Labels */}
          <text x="50" y="145" className="text-[11px] font-bold fill-white">a</text>
          <text x="125" y="145" className="text-[11px] font-bold fill-white">b</text>
          <text x="95" y="125" className="text-[11px] font-bold fill-white">c</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-4 rounded-2xl bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/40 border border-teal-200/80 shadow-md flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between pb-2 border-b border-teal-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
          <Box className="w-4 h-4 text-teal-600" />
          <span>{content.title || 'Mô hình Không gian 3D'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isEditor && (
            <select
              value={content.modelType || 'cube'}
              onChange={(e) => onUpdate?.({ ...content, modelType: e.target.value as any })}
              className="text-[11px] px-2 py-0.5 border border-teal-200 rounded-lg bg-white font-bold"
            >
              <option value="cube">Hình hộp / Lập phương</option>
              <option value="cylinder">Hình trụ tròn xoay</option>
              <option value="cone">Hình nón</option>
              <option value="sphere">Hình cầu</option>
              <option value="atom">Mô hình Nguyên tử</option>
            </select>
          )}
          <button
            type="button"
            onClick={rotate}
            title="Xoay mô hình"
            className="p-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-2">
        {render3DModel()}
      </div>

      <div className="text-[11px] text-teal-700/80 font-medium text-center">
        Bấm nút xoay để quan sát các góc độ không gian
      </div>
    </div>
  );
};
