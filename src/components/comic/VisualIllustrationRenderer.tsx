import React from 'react';
import { ComicFrame, CharacterProfile } from '../../types/comicLesson';
import { KatexRenderer } from '../common/KatexRenderer';
import { Sparkles, MessageSquare, Lightbulb, Volume2 } from 'lucide-react';

interface VisualIllustrationRendererProps {
  frame: ComicFrame;
  characters: CharacterProfile[];
  zoomLevel?: number;
  showOverlayLayer?: boolean;
  isKenBurnsActive?: boolean;
  activeSpeechId?: string | null;
  onSelectSpeechBubble?: (speechId: string) => void;
  onSpeakText?: (text: string) => void;
}

// ============================================================================
// VẼ NHÂN VẬT TỔNG QUÁT (data-driven) — thay cho hình vẽ cứng theo tên cố định.
// Dùng signatureColor / gender / role của CHÍNH nhân vật đó (do AI Bước 3 sinh ra
// hoặc giáo viên tự tạo) để vẽ, nên vẽ được BẤT KỲ nhân vật nào, không chỉ
// Minh/Lan/Nam/Thầy Bình của 2 bài học mẫu gốc.
// ============================================================================
function renderCharacterFigure(char: CharacterProfile, cx: number, keyPrefix: string) {
  const color = char.signatureColor || '#2563EB';
  const isFemale = char.gender === 'female';
  const isAdult = char.role === 'teacher' || char.role === 'guide';
  const wearsGlasses = isAdult || /kính|glasses/i.test(char.appearance || '') || /kính|glasses/i.test(char.outfit || '');
  const skin = '#fed7aa';
  const hair = isAdult ? '#1e293b' : '#292524';
  const shoe = isFemale ? '#991b1b' : '#1e293b';
  const scale = isAdult ? 1.08 : 1;

  return (
    <g key={keyPrefix} transform={`translate(${cx}, 300) scale(${scale})`} filter="url(#comicShadow)">
      {/* Shadow */}
      <ellipse cx="35" cy="183" rx="33" ry="8" fill="#0f172a" opacity="0.4" />

      {/* Legs */}
      <rect x="20" y="116" width="13" height="64" rx="4" fill="#334155" />
      <rect x="37" y="116" width="13" height="64" rx="4" fill="#334155" />
      <ellipse cx="26" cy="181" rx="10" ry="5" fill={shoe} />
      <ellipse cx="43" cy="181" rx="10" ry="5" fill={shoe} />

      {/* Torso — áo/váy theo đúng màu signatureColor của nhân vật */}
      {isFemale && !isAdult ? (
        <>
          <polygon points="18,108 50,108 56,144 12,144" fill={color} />
          <path d="M 22 55 L 32 72 L 42 55" stroke={color} strokeWidth="3" fill="none" opacity="0.6" />
        </>
      ) : (
        <rect x="14" y="55" width="42" height="60" rx="8" fill={color} />
      )}
      {isAdult && (
        <polygon points="32,68 38,68 41,112 35,122 29,112" fill="#059669" />
      )}

      {/* Head */}
      <ellipse cx="35" cy="32" rx="18" ry="22" fill={skin} />

      {/* Tóc — kiểu khác nhau theo giới tính */}
      {isFemale ? (
        <>
          <path d="M 17 29 Q 20 8 35 8 Q 51 8 51 29 Q 44 15 35 16 Q 23 17 17 29 Z" fill={hair} />
          <path d="M 46 22 Q 63 26 59 50 Q 51 40 46 30 Z" fill={hair} />
        </>
      ) : (
        <path d="M 16 29 Q 20 8 35 8 Q 53 8 53 29 Q 45 15 35 16 Q 22 17 16 29 Z" fill={hair} />
      )}

      {/* Kính (nếu phù hợp vai trò/mô tả) */}
      {wearsGlasses ? (
        <>
          <rect x="22" y="27" width="9" height="7" rx="2" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          <rect x="35" y="27" width="9" height="7" rx="2" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          <line x1="31" y1="30" x2="35" y2="30" stroke="#0284c7" strokeWidth="1.5" />
        </>
      ) : null}

      {/* Mắt + nụ cười */}
      <circle cx="29" cy="32" r="2.3" fill="#0f172a" />
      <circle cx="41" cy="32" r="2.3" fill="#0f172a" />
      <path d="M 30 42 Q 35 47 40 42" stroke="#dc2626" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Thẻ tên nhân vật phía trên đầu, giúp nhận diện vì hình vẽ chỉ mang tính biểu tượng */}
      <rect x="-15" y="-24" width="100" height="19" rx="9" fill="#0f172a" opacity="0.85" />
      <text x="35" y="-10.5" fill={color} fontSize="11" fontWeight="bold" textAnchor="middle">
        {char.name}
      </text>
    </g>
  );
}

// Xếp các nhân vật của khung hình theo chiều ngang, căn giữa, không chồng lấn
function renderCharacterLayer(frame: ComicFrame, characters: CharacterProfile[]) {
  const ids = frame.characterIds && frame.characterIds.length > 0 ? frame.characterIds : [];
  const resolved = ids
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is CharacterProfile => !!c);

  if (resolved.length === 0) return null;

  const count = resolved.length;
  const spacing = count > 1 ? Math.min(230, 640 / (count - 1 || 1)) : 0;
  const totalWidth = spacing * (count - 1);
  const startX = 500 - totalWidth / 2 - 35;

  return (
    <>
      {resolved.map((char, idx) =>
        renderCharacterFigure(char, startX + idx * spacing, `char-layer-${char.id}-${idx}`)
      )}
    </>
  );
}

// Định nghĩa các gradient/filter dùng chung cho mọi nền cảnh
function renderSharedDefs() {
  return (
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#bae6fd" />
        <stop offset="100%" stopColor="#fef08a" />
      </linearGradient>
      <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="50%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="sunRays" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#064e3b" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>
      <linearGradient id="libraryWallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="greenhouseGlassGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#5eead4" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="labWallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
      <filter id="comicShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.35" />
      </filter>
    </defs>
  );
}

export const VisualIllustrationRenderer: React.FC<VisualIllustrationRendererProps> = ({
  frame,
  characters,
  zoomLevel = 1,
  showOverlayLayer = true,
  isKenBurnsActive = false,
  activeSpeechId = null,
  onSelectSpeechBubble,
  onSpeakText,
}) => {
  const getCharacter = (charId: string) => {
    return characters.find((c) => c.id === charId);
  };

  // Render the artistic SVG backdrop based on illustrationSceneType
  const renderArtisticBackdrop = () => {
    // Nếu đã có ảnh AI 3D được tạo riêng cho khung này, ưu tiên hiển thị ảnh đó
    // thay cho tranh SVG vẽ tay.
    if (frame.generatedImage) {
      return (
        <img
          src={frame.generatedImage.imageUrl}
          alt={frame.title || 'Minh họa AI'}
          crossOrigin="anonymous"
          className="w-full h-full absolute inset-0 object-cover"
        />
      );
    }

    const sceneType = frame.illustrationSceneType;

    if (sceneType === 'schoolyard_tree' || sceneType === 'schoolyard_measure') {
      return (
        <svg
          className="w-full h-full absolute inset-0 object-cover"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderSharedDefs()}

          {/* Sky */}
          <rect width="1000" height="420" fill="url(#skyGrad)" />

          {/* Distant School Building */}
          <rect x="50" y="240" width="380" height="150" rx="4" fill="#cbd5e1" opacity="0.8" />
          <rect x="80" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
          <rect x="150" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
          <rect x="220" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
          <rect x="290" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
          <polygon points="40,240 240,190 440,240" fill="#dc2626" opacity="0.85" />
          <line x1="240" y1="190" x2="240" y2="150" stroke="#475569" strokeWidth="3" />
          <rect x="240" y="150" width="36" height="24" fill="#dc2626" />
          <polygon points="258,158 261,166 254,161 262,161 255,166" fill="#facc15" />

          {/* Sun and Sunbeams */}
          <circle cx="850" cy="90" r="55" fill="#fbbf24" filter="url(#comicShadow)" />
          <circle cx="850" cy="90" r="75" fill="#fef08a" opacity="0.3" />
          <polygon points="850,90 200,600 60,600" fill="url(#sunRays)" />
          <polygon points="850,90 600,600 350,600" fill="url(#sunRays)" />

          {/* Ground / Schoolyard Pavement */}
          <rect x="0" y="380" width="1000" height="220" fill="url(#groundGrad)" />
          <line x1="0" y1="440" x2="1000" y2="440" stroke="#475569" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.4" />
          <line x1="0" y1="510" x2="1000" y2="510" stroke="#475569" strokeWidth="2" strokeDasharray="12 8" opacity="0.4" />

          {/* Phoenix Tree */}
          <ellipse cx="620" cy="480" rx="260" ry="38" fill="#1e293b" opacity="0.45" />
          <path
            d="M750 480 Q 770 300 740 180 Q 760 120 730 40 L 800 40 Q 820 180 810 320 Q 830 430 840 480 Z"
            fill="url(#treeTrunk)"
            filter="url(#comicShadow)"
          />
          <circle cx="720" cy="90" r="110" fill="#15803d" />
          <circle cx="800" cy="80" r="100" fill="#16a34a" />
          <circle cx="760" cy="140" r="95" fill="#22c55e" />
          <circle cx="680" cy="130" r="85" fill="#15803d" />
          <circle cx="710" cy="70" r="14" fill="#ef4444" />
          <circle cx="780" cy="65" r="16" fill="#f97316" />
          <circle cx="750" cy="110" r="15" fill="#dc2626" />
          <circle cx="820" cy="115" r="13" fill="#ef4444" />
          <circle cx="660" cy="110" r="14" fill="#f97316" />

          {sceneType === 'schoolyard_measure' && (
            <g id="math-measure-elements">
              <rect x="280" y="380" width="10" height="90" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
              <ellipse cx="230" cy="475" rx="55" ry="10" fill="#0f172a" opacity="0.5" />
              <line x1="285" y1="380" x2="175" y2="475" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 4" />
              <path d="M 380 490 L 760 490" stroke="#eab308" strokeWidth="7" strokeLinecap="round" />
              <path d="M 380 490 L 760 490" stroke="#000000" strokeWidth="2" strokeDasharray="6 6" />
              <line x1="375" y1="485" x2="385" y2="495" stroke="#ffffff" strokeWidth="3" />
              <line x1="385" y1="485" x2="375" y2="495" stroke="#ffffff" strokeWidth="3" />
              <circle cx="380" cy="490" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            </g>
          )}

          {renderCharacterLayer(frame, characters)}
        </svg>
      );
    }

    if (sceneType === 'library_study') {
      return (
        <svg
          className="w-full h-full absolute inset-0 object-cover"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderSharedDefs()}
          <rect width="1000" height="600" fill="url(#libraryWallGrad)" />
          {/* Kệ sách — nhiều hàng, mỗi hàng nhiều cuốn sách màu sắc khác nhau */}
          {[90, 200, 310].map((y) => (
            <g key={`shelf-${y}`}>
              <rect x="40" y={y} width="920" height="14" fill="#2b1608" />
              {Array.from({ length: 22 }).map((_, i) => (
                <rect
                  key={i}
                  x={55 + i * 41}
                  y={y - 62}
                  width="30"
                  height="62"
                  fill={['#b91c1c', '#1d4ed8', '#15803d', '#a16207', '#7e22ce', '#0f766e'][i % 6]}
                  opacity="0.9"
                />
              ))}
            </g>
          ))}
          {/* Sàn gỗ thư viện */}
          <rect x="0" y="420" width="1000" height="180" fill="#92400e" />
          <line x1="0" y1="420" x2="1000" y2="420" stroke="#451a03" strokeWidth="4" />
          {/* Bàn đọc sách gỗ */}
          <rect x="300" y="470" width="400" height="22" rx="4" fill="#78350f" />
          <rect x="320" y="492" width="16" height="70" fill="#5c2e0a" />
          <rect x="664" y="492" width="16" height="70" fill="#5c2e0a" />
          {/* Sách mở trên bàn + đèn bàn */}
          <path d="M 460 462 L 540 462 L 545 478 L 455 478 Z" fill="#f8fafc" stroke="#cbd5e1" />
          <line x1="500" y1="463" x2="500" y2="477" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="630" y="430" width="4" height="40" fill="#334155" />
          <ellipse cx="632" cy="425" rx="22" ry="12" fill="#fde047" opacity="0.85" />

          {renderCharacterLayer(frame, characters)}
        </svg>
      );
    }

    if (sceneType === 'greenhouse_plant') {
      return (
        <svg
          className="w-full h-full absolute inset-0 object-cover"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderSharedDefs()}
          <rect width="1000" height="420" fill="url(#skyGrad)" />
          {/* Khung nhà kính */}
          <polygon points="60,420 500,180 940,420" fill="url(#greenhouseGlassGrad)" stroke="#047857" strokeWidth="4" />
          <line x1="500" y1="180" x2="500" y2="420" stroke="#047857" strokeWidth="4" />
          <line x1="280" y1="300" x2="720" y2="300" stroke="#047857" strokeWidth="3" opacity="0.7" />
          <rect x="60" y="420" width="880" height="20" fill="#047857" />
          {/* Nền đất trồng cây */}
          <rect x="0" y="440" width="1000" height="160" fill="#78350f" />
          {/* Chậu cây & lá xanh rải rác */}
          {[150, 320, 560, 760, 880].map((x, i) => (
            <g key={`pot-${x}`}>
              <rect x={x - 25} y="470" width="50" height="40" rx="6" fill="#92400e" />
              <ellipse cx={x} cy="465" rx="38" ry="22" fill={['#16a34a', '#15803d', '#22c55e'][i % 3]} />
              <ellipse cx={x - 18} cy="450" rx="22" ry="14" fill="#22c55e" opacity="0.85" />
              <ellipse cx={x + 18} cy="450" rx="22" ry="14" fill="#16a34a" opacity="0.85" />
            </g>
          ))}
          {/* Bình tưới nước */}
          <rect x="840" y="500" width="50" height="34" rx="6" fill="#0891b2" />
          <path d="M 890 510 L 920 495" stroke="#0891b2" strokeWidth="8" strokeLinecap="round" />

          {renderCharacterLayer(frame, characters)}
        </svg>
      );
    }

    if (sceneType === 'nature_field') {
      return (
        <svg
          className="w-full h-full absolute inset-0 object-cover"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderSharedDefs()}
          <rect width="1000" height="400" fill="url(#skyGrad)" />
          <circle cx="840" cy="100" r="50" fill="#fbbf24" filter="url(#comicShadow)" />
          {/* Mây */}
          <ellipse cx="180" cy="120" rx="60" ry="26" fill="#ffffff" opacity="0.85" />
          <ellipse cx="230" cy="110" rx="46" ry="22" fill="#ffffff" opacity="0.85" />
          <ellipse cx="420" cy="90" rx="50" ry="20" fill="#ffffff" opacity="0.75" />
          {/* Đồi xa */}
          <path d="M0 400 Q 250 330 520 400 Q 760 340 1000 400 L1000 600 L0 600 Z" fill="#4d7c0f" opacity="0.5" />
          {/* Đồng cỏ */}
          <rect x="0" y="400" width="1000" height="200" fill="#65a30d" />
          <path d="M0 400 Q 300 380 600 405 Q 820 420 1000 395 L1000 440 L0 440 Z" fill="#4d7c0f" />
          {/* Hoa dại rải rác */}
          {[120, 260, 420, 640, 820, 900].map((x, i) => (
            <circle key={`flower-${x}`} cx={x} cy={450 + (i % 2) * 40} r="7" fill={['#fde047', '#f472b6', '#f87171'][i % 3]} />
          ))}

          {renderCharacterLayer(frame, characters)}
        </svg>
      );
    }

    if (sceneType === 'lab_discovery') {
      return (
        <svg
          className="w-full h-full absolute inset-0 object-cover"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderSharedDefs()}
          <rect width="1000" height="600" fill="url(#labWallGrad)" />
          {/* Gạch ốp tường phòng lab */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={i} x1={i * 100} y1="0" x2={i * 100} y2="420" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.4" />
          ))}
          {/* Bàn thí nghiệm bằng thép */}
          <rect x="0" y="420" width="1000" height="180" fill="#475569" />
          <rect x="0" y="420" width="1000" height="16" fill="#1e293b" />
          {/* Dụng cụ thí nghiệm: bình tam giác, ống nghiệm */}
          <g transform="translate(140,330)">
            <path d="M10 0 L30 0 L36 60 Q20 75 4 60 Z" fill="#38bdf8" opacity="0.7" stroke="#0369a1" strokeWidth="2" />
            <rect x="6" y="-8" width="28" height="10" fill="#94a3b8" />
          </g>
          <g transform="translate(260,340)">
            <rect x="0" y="0" width="14" height="70" rx="6" fill="#4ade80" opacity="0.7" stroke="#15803d" strokeWidth="2" />
          </g>
          <g transform="translate(300,340)">
            <rect x="0" y="0" width="14" height="70" rx="6" fill="#f472b6" opacity="0.7" stroke="#be185d" strokeWidth="2" />
          </g>
          <g transform="translate(780,310)">
            <circle cx="20" cy="60" r="34" fill="#fbbf24" opacity="0.7" stroke="#b45309" strokeWidth="2" />
            <rect x="12" y="0" width="16" height="35" fill="#94a3b8" />
          </g>
          {/* Bảng công thức nhỏ trên tường */}
          <rect x="650" y="60" width="260" height="140" rx="8" fill="#022c22" opacity="0.9" />
          <text x="780" y="140" fill="#a7f3d0" fontSize="24" fontWeight="bold" textAnchor="middle">
            E = mc²
          </text>

          {renderCharacterLayer(frame, characters)}
        </svg>
      );
    }

    // classroom_board (và mặc định nếu gặp loại chưa xác định) — bảng đen trung tính,
    // phù hợp mọi bài học, có vẽ nhân vật (trước đây nhánh này KHÔNG vẽ nhân vật).
    return (
      <svg
        className="w-full h-full absolute inset-0 object-cover"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderSharedDefs()}
        <rect width="1000" height="600" fill="url(#wallGrad)" />
        <rect x="60" y="50" width="880" height="330" rx="12" fill="#78350f" />
        <rect x="75" y="65" width="850" height="300" rx="8" fill="url(#boardGrad)" />
        <rect x="250" y="80" width="500" height="42" rx="8" fill="#047857" opacity="0.6" />
        <text x="500" y="108" fill="#a7f3d0" fontSize="20" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">
          {(frame.title || 'BÀI HỌC').toUpperCase()}
        </text>
        <rect x="0" y="470" width="1000" height="130" fill="#451a03" />
        <line x1="0" y1="470" x2="1000" y2="470" stroke="#78350f" strokeWidth="4" />

        {renderCharacterLayer(frame, characters)}
      </svg>
    );
  };

  return (
    <div
      className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 select-none transition-transform duration-700 ${
        isKenBurnsActive ? 'scale-105 transition-all duration-[6000ms] ease-out' : ''
      }`}
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center center',
      }}
    >
      {/* 1. Artistic Base SVG Layer */}
      {renderArtisticBackdrop()}

      {/* 2. Cinematic Lighting & Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />

      {/* 3. High-Quality Web Overlay Layer (LaTeX, Speech Bubbles, Captions) */}
      {showOverlayLayer && (
        <div className="absolute inset-0 pointer-events-auto p-4 flex flex-col justify-between">
          {/* Top Status Bar: Frame ID, Scene Name, Art Style Badge */}
          <div className="flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-black tracking-wider shadow-lg">
                {frame.frameId}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-300 text-xs font-medium">
                {frame.title || 'Khung tranh giáo dục'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> GDPT 2018
              </span>
            </div>
          </div>

          {/* Interactive Speech Bubbles (Web-rendered Layer) */}
          <div className="absolute inset-0 pointer-events-none">
            {frame.speechBubbles.map((bubble) => {
              const char = getCharacter(bubble.characterId);
              const isSelected = activeSpeechId === bubble.id;

              return (
                <div
                  key={bubble.id}
                  style={{
                    left: `${bubble.position.x}%`,
                    top: `${bubble.position.y}%`,
                  }}
                  onClick={() => onSelectSpeechBubble && onSelectSpeechBubble(bubble.id)}
                  className={`absolute pointer-events-auto max-w-[280px] sm:max-w-[340px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'scale-110 z-30 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)]'
                      : 'hover:scale-105 z-20'
                  }`}
                >
                  {/* Bubble Container */}
                  <div
                    className="relative bg-white/95 backdrop-blur-md text-slate-900 p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 transition-all"
                    style={{
                      borderColor: char?.signatureColor || '#0284c7',
                    }}
                  >
                    {/* Character Tag */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: char?.signatureColor || '#0284c7' }}
                        />
                        <span
                          className="text-xs font-black tracking-wide"
                          style={{ color: char?.signatureColor || '#0284c7' }}
                        >
                          {bubble.characterName || char?.name || 'Nhân vật'}
                        </span>
                      </div>

                      {/* Text to Speech Button */}
                      {onSpeakText && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSpeakText(bubble.text);
                          }}
                          className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors"
                          title="Phát giọng đọc nhân vật"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dialogue Text */}
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                      “{bubble.text}”
                    </p>

                    {/* Comic speech bubble triangle tail */}
                    <div
                      className="absolute -bottom-2.5 left-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white drop-shadow-sm"
                    />
                  </div>
                </div>
              );
            })}

            {/* LaTeX Math Formula Card Layer (If exists in frame) */}
            {frame.mathFormulaLayer && (
              <div
                style={{
                  left: `${frame.mathFormulaLayer.position.x}%`,
                  top: `${frame.mathFormulaLayer.position.y}%`,
                }}
                className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 z-25 max-w-[90%] sm:max-w-[420px]"
              >
                <div className="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-amber-400/60 shadow-[0_10px_30px_rgba(245,158,11,0.25)] text-amber-200">
                  {frame.mathFormulaLayer.label && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{frame.mathFormulaLayer.label}</span>
                    </div>
                  )}
                  <div className="text-sm sm:text-base font-bold text-white bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 flex justify-center overflow-x-auto">
                    <KatexRenderer math={frame.mathFormulaLayer.latex} block />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Caption Bar */}
          {frame.captionText && (
            <div className="mt-auto z-20">
              <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800/90 text-center max-w-2xl mx-auto shadow-2xl flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-semibold text-slate-200 tracking-wide flex-1 text-center">
                  {frame.captionText}
                </p>
                {onSpeakText && (
                  <button
                    type="button"
                    onClick={() => onSpeakText(frame.captionText || '')}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition-colors shrink-0"
                    title="Phát lời dẫn"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};