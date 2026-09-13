import React from 'react';

/**
 * High-fidelity 3D Mathematical Open Book with Glowing Geometric Symbols
 */
export const ThreeDOpenBook: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Specular Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 via-teal-300/40 to-yellow-300/30 rounded-3xl blur-xl animate-pulse" />
      
      <svg
        viewBox="0 0 200 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_20px_rgba(4,120,87,0.45)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="bookCoverGrad" x1="10" y1="30" x2="190" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="50%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#115E59" />
          </linearGradient>

          <linearGradient id="leftPageGrad" x1="20" y1="40" x2="98" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F0FDFA" />
            <stop offset="100%" stopColor="#CCFBF1" />
          </linearGradient>

          <linearGradient id="rightPageGrad" x1="102" y1="40" x2="180" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#CCFBF1" />
            <stop offset="30%" stopColor="#F0FDFA" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <linearGradient id="goldRibbon" x1="90" y1="20" x2="110" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          <linearGradient id="citrusGemGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="60%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 3D Book Base Spine & Shadow */}
        <path
          d="M 15 142 Q 100 170 185 142 L 180 152 Q 100 180 20 152 Z"
          fill="#134E4A"
          opacity="0.8"
        />

        {/* Book Cover Extrusion */}
        <path
          d="M 16 136 Q 100 162 184 136 L 186 142 Q 100 168 14 142 Z"
          fill="url(#bookCoverGrad)"
        />

        {/* Thick Page Stacks (Left & Right 3D Volume) */}
        <path
          d="M 18 132 Q 98 156 100 156 L 100 148 Q 98 148 20 125 Z"
          fill="#99F6E4"
          opacity="0.9"
        />
        <path
          d="M 182 132 Q 102 156 100 156 L 100 148 Q 102 148 180 125 Z"
          fill="#5EEAD4"
          opacity="0.9"
        />

        {/* Main Left Page */}
        <path
          d="M 100 50 Q 55 38 20 54 Q 22 120 20 128 Q 60 114 100 146 Z"
          fill="url(#leftPageGrad)"
          stroke="#5EEAD4"
          strokeWidth="1.5"
        />

        {/* Main Right Page */}
        <path
          d="M 100 50 Q 145 38 180 54 Q 178 120 180 128 Q 140 114 100 146 Z"
          fill="url(#rightPageGrad)"
          stroke="#5EEAD4"
          strokeWidth="1.5"
        />

        {/* Page Inner Crease & Center Lighting */}
        <path d="M 100 50 L 100 146" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left Page Text Lines & Math Symbols */}
        <path d="M 36 68 Q 62 60 86 72" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 34 82 Q 60 74 86 86" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 36 96 Q 60 88 80 98" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        
        {/* Math Symbol Left: Σ (Sigma) */}
        <text x="44" y="118" fill="#0D9488" fontSize="20" fontWeight="900" fontFamily="serif" opacity="0.9">
          ∑
        </text>

        {/* Math Symbol Left: π (Pi) */}
        <text x="68" y="118" fill="#0D9488" fontSize="17" fontWeight="bold" fontFamily="serif" opacity="0.85">
          π
        </text>

        {/* Right Page Text Lines & Math Symbols */}
        <path d="M 114 72 Q 138 60 164 68" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 114 86 Q 140 74 166 82" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        
        {/* Math Symbol Right: √x & ∫ */}
        <text x="116" y="118" fill="#0D9488" fontSize="18" fontWeight="bold" fontFamily="serif" opacity="0.9">
          √x
        </text>
        <text x="148" y="118" fill="#0D9488" fontSize="20" fontWeight="bold" fontFamily="serif" opacity="0.85">
          ∫
        </text>

        {/* Golden Silk Bookmark Ribbon */}
        <path
          d="M 100 48 Q 106 80 110 160 L 102 154 L 94 160 Q 96 80 100 48 Z"
          fill="url(#goldRibbon)"
          filter="url(#glowGold)"
        />

        {/* Floating Citrus Yellow 3D Star/Diamond Specular Highlight */}
        <g transform="translate(145, 20)">
          <polygon
            points="12,0 15,9 24,12 15,15 12,24 9,15 0,12 9,9"
            fill="url(#citrusGemGrad)"
            className="animate-spin"
            style={{ transformOrigin: '12px 12px', animationDuration: '8s' }}
          />
        </g>
        <g transform="translate(25, 25)">
          <circle cx="6" cy="6" r="4" fill="#FACC15" opacity="0.85" />
          <circle cx="5" cy="5" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 3D Geometric Atomic / Gyroscope Asteroid Model
 */
export const ThreeDAtomicAsteroid: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Lavender / Teal Backlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 via-cyan-400/30 to-yellow-400/20 rounded-full blur-lg animate-pulse" />

      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(147,51,234,0.35)]"
      >
        <defs>
          <linearGradient id="nucleusGrad" x1="40" y1="40" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="orbitTeal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>

          <linearGradient id="orbitPurple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>

          <linearGradient id="orbitYellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        {/* Orbit Ring 1 (Teal) */}
        <ellipse
          cx="60"
          cy="60"
          rx="48"
          ry="18"
          transform="rotate(-30 60 60)"
          stroke="url(#orbitTeal)"
          strokeWidth="3"
          strokeDasharray="140 10"
          opacity="0.9"
        />

        {/* Orbit Ring 2 (Purple) */}
        <ellipse
          cx="60"
          cy="60"
          rx="48"
          ry="18"
          transform="rotate(45 60 60)"
          stroke="url(#orbitPurple)"
          strokeWidth="3"
          opacity="0.85"
        />

        {/* Orbit Ring 3 (Citrus Yellow) */}
        <ellipse
          cx="60"
          cy="60"
          rx="48"
          ry="18"
          transform="rotate(105 60 60)"
          stroke="url(#orbitYellow)"
          strokeWidth="2.5"
          opacity="0.8"
        />

        {/* Central 3D Glowing Nucleus Sphere */}
        <circle cx="60" cy="60" r="16" fill="url(#nucleusGrad)" />
        <circle cx="55" cy="54" r="5" fill="#FFFFFF" opacity="0.75" />
        <circle cx="53" cy="52" r="2" fill="#FFFFFF" />

        {/* Orbiting 3D Electrons / Micro Beads */}
        {/* Electron 1 */}
        <circle cx="98" cy="42" r="5" fill="#2DD4BF" />
        <circle cx="96" cy="40" r="1.5" fill="#FFFFFF" />

        {/* Electron 2 */}
        <circle cx="28" cy="85" r="5" fill="#C084FC" />
        <circle cx="26" cy="83" r="1.5" fill="#FFFFFF" />

        {/* Electron 3 */}
        <circle cx="68" cy="106" r="4.5" fill="#FACC15" />
        <circle cx="66.5" cy="104.5" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

/**
 * 3D Floating Geometry Background Ambient Elements & Cosmic Canvas
 * (Cube, Cone, Sphere, Torus, Prism, Eduverse Cosmic Mesh)
 */
export const EduverseCosmicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Deep Cosmic Base Gradient */}
      <div className="absolute inset-0 bg-[#0B0F19]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(147,51,234,0.12),rgba(11,15,25,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(6,182,212,0.12),rgba(11,15,25,0))]" />
      
      {/* 2. Slow Ambient Cosmic Glow Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute -top-20 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* 3. Subtle Matrix Geometric Coordinate Grid */}
      <div className="absolute inset-0 eduverse-grid-bg opacity-70" />

      {/* 4. Soft Floating 3D Geometric Objects (GPU-accelerated) */}
      {/* Floating 3D Cube (Top Left) */}
      <div className="absolute top-16 left-6 w-24 h-24 opacity-30 transform -rotate-12">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_8px_16px_rgba(56,189,248,0.25)]">
          <polygon points="50,15 85,32 50,50 15,32" fill="#38BDF8" opacity="0.8" />
          <polygon points="15,32 50,50 50,85 15,67" fill="#0284C7" opacity="0.9" />
          <polygon points="85,32 50,50 50,85 85,67" fill="#0EA5E9" opacity="0.85" />
          <line x1="50" y1="15" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* Floating 3D Torus (Bottom Right) */}
      <div className="absolute bottom-12 right-8 w-36 h-36 opacity-25 transform rotate-45">
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-[0_12px_24px_rgba(168,85,247,0.3)]">
          <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#C084FC" strokeWidth="8" strokeOpacity="0.7" />
          <ellipse cx="60" cy="58" rx="44" ry="22" fill="none" stroke="#E879F9" strokeWidth="2" strokeOpacity="0.9" />
        </svg>
      </div>

      {/* Floating Math Symbol: Golden Ratio / Phi (Top Right) */}
      <div className="absolute top-28 right-20 text-cyan-400/20 font-mono text-5xl font-extrabold select-none">
        ∑
      </div>
      <div className="absolute bottom-40 left-16 text-purple-400/20 font-mono text-4xl font-extrabold select-none">
        π
      </div>
      <div className="absolute top-1/2 right-12 text-indigo-400/20 font-mono text-4xl font-extrabold select-none">
        ∞
      </div>
    </div>
  );
};

export const ThreeDBackgroundElements: React.FC = () => {
  return <EduverseCosmicBackground />;
};
