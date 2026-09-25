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
  // thay cho tranh SVG vẽ tay cố định.
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
    switch (frame.illustrationSceneType) {
      case 'schoolyard_tree':
      case 'schoolyard_measure':
        return (
          <svg
            className="w-full h-full absolute inset-0 object-cover"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
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
              <filter id="comicShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Sky */}
            <rect width="1000" height="420" fill="url(#skyGrad)" />

            {/* Distant School Building */}
            <rect x="50" y="240" width="380" height="150" rx="4" fill="#cbd5e1" opacity="0.8" />
            <rect x="80" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
            <rect x="150" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
            <rect x="220" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
            <rect x="290" y="260" width="50" height="40" fill="#93c5fd" opacity="0.9" />
            <polygon points="40,240 240,190 440,240" fill="#dc2626" opacity="0.85" />
            {/* National flag on rooftop */}
            <line x1="240" y1="190" x2="240" y2="150" stroke="#475569" strokeWidth="3" />
            <rect x="240" y="150" width="36" height="24" fill="#dc2626" />
            <polygon points="258,158 261,166 254,161 262,161 255,166" fill="#facc15" />

            {/* Sun and Sunbeams (Angled at 40 degrees) */}
            <circle cx="850" cy="90" r="55" fill="#fbbf24" filter="url(#comicShadow)" />
            <circle cx="850" cy="90" r="75" fill="#fef08a" opacity="0.3" />
            <polygon points="850,90 200,600 60,600" fill="url(#sunRays)" />
            <polygon points="850,90 600,600 350,600" fill="url(#sunRays)" />

            {/* Ground / Schoolyard Pavement */}
            <rect x="0" y="380" width="1000" height="220" fill="url(#groundGrad)" />
            {/* Pavement grid lines */}
            <line x1="0" y1="440" x2="1000" y2="440" stroke="#475569" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.4" />
            <line x1="0" y1="510" x2="1000" y2="510" stroke="#475569" strokeWidth="2" strokeDasharray="12 8" opacity="0.4" />

            {/* Massive Phoenix Tree (Tree of Lesson) */}
            {/* Shadow of Tree cast onto pavement */}
            <ellipse cx="620" cy="480" rx="260" ry="38" fill="#1e293b" opacity="0.45" />
            {/* Tree Trunk */}
            <path
              d="M750 480 Q 770 300 740 180 Q 760 120 730 40 L 800 40 Q 820 180 810 320 Q 830 430 840 480 Z"
              fill="url(#treeTrunk)"
              filter="url(#comicShadow)"
            />
            {/* Tree Foliage / Canopy (Bright Green with Blooming Orange Phoenix Flowers) */}
            <circle cx="720" cy="90" r="110" fill="#15803d" />
            <circle cx="800" cy="80" r="100" fill="#16a34a" />
            <circle cx="760" cy="140" r="95" fill="#22c55e" />
            <circle cx="680" cy="130" r="85" fill="#15803d" />
            {/* Phoenix Flowers (Hoa phượng đỏ rực) */}
            <circle cx="710" cy="70" r="14" fill="#ef4444" />
            <circle cx="780" cy="65" r="16" fill="#f97316" />
            <circle cx="750" cy="110" r="15" fill="#dc2626" />
            <circle cx="820" cy="115" r="13" fill="#ef4444" />
            <circle cx="660" cy="110" r="14" fill="#f97316" />

            {/* If Measuring Scene: Measuring Tape on the Ground and Pole */}
            {frame.illustrationSceneType === 'schoolyard_measure' && (
              <g id="math-measure-elements">
                {/* 1-meter vertical pole */}
                <rect x="280" y="380" width="10" height="90" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                {/* Pole shadow */}
                <ellipse cx="230" cy="475" rx="55" ry="10" fill="#0f172a" opacity="0.5" />
                {/* Sun ray guideline (Dotted line connecting pole tip to shadow tip) */}
                <line x1="285" y1="380" x2="175" y2="475" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 4" />
                {/* Yellow Measuring Tape unrolled */}
                <path d="M 380 490 L 760 490" stroke="#eab308" strokeWidth="7" strokeLinecap="round" />
                <path d="M 380 490 L 760 490" stroke="#000000" strokeWidth="2" strokeDasharray="6 6" />
                {/* Chalk mark at tip of tree shadow */}
                <line x1="375" y1="485" x2="385" y2="495" stroke="#ffffff" strokeWidth="3" />
                <line x1="385" y1="485" x2="375" y2="495" stroke="#ffffff" strokeWidth="3" />
                <circle cx="380" cy="490" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                {/* Measurement Tag */}
                <rect x="520" y="498" width="80" height="24" rx="6" fill="#0f172a" opacity="0.9" />
                <text x="560" y="515" fill="#facc15" fontSize="13" fontWeight="bold" textAnchor="middle">
                  9.6 m
                </text>
              </g>
            )}

            {/* Character Renderings in SVG (Stylized 2D Anime/Comic proportion) */}
            {/* Minh: Blue T-shirt (#2563EB), black backpack */}
            <g id="character-minh" transform="translate(190, 310)" filter="url(#comicShadow)">
              {/* Shadow under feet */}
              <ellipse cx="35" cy="180" rx="35" ry="8" fill="#0f172a" opacity="0.4" />
              {/* Legs */}
              <rect x="20" y="115" width="13" height="65" rx="4" fill="#334155" />
              <rect x="37" y="115" width="13" height="65" rx="4" fill="#334155" />
              <ellipse cx="26" cy="180" rx="10" ry="5" fill="#0284c7" />
              <ellipse cx="43" cy="180" rx="10" ry="5" fill="#0284c7" />
              {/* Torso & Blue Shirt */}
              <rect x="15" y="55" width="40" height="62" rx="8" fill="#2563EB" />
              <rect x="22" y="70" width="26" height="4" rx="2" fill="#ffffff" opacity="0.7" />
              {/* Backpack strap */}
              <path d="M 18 55 Q 24 85 24 110" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
              {/* Head & Face */}
              <ellipse cx="35" cy="32" rx="18" ry="22" fill="#fed7aa" />
              {/* Hair (Short energetic black hair) */}
              <path d="M 16 30 Q 20 8 36 8 Q 54 8 54 30 Q 46 15 35 16 Q 22 17 16 30 Z" fill="#0f172a" />
              {/* Eyes & Smile */}
              <circle cx="29" cy="32" r="2.5" fill="#0f172a" />
              <circle cx="41" cy="32" r="2.5" fill="#0f172a" />
              <path d="M 31 42 Q 35 48 39 42" stroke="#dc2626" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Arm pointing forward or holding tape */}
              <line x1="48" y1="65" x2="72" y2="85" stroke="#fed7aa" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* Lan: Yellow Sweater (#EAB308), Glasses, Ponytail */}
            <g id="character-lan" transform="translate(290, 310)" filter="url(#comicShadow)">
              {/* Shadow */}
              <ellipse cx="32" cy="180" rx="30" ry="8" fill="#0f172a" opacity="0.4" />
              {/* Skirt & Legs */}
              <polygon points="18,110 46,110 52,145 12,145" fill="#475569" />
              <rect x="20" y="145" width="9" height="35" rx="3" fill="#fed7aa" />
              <rect x="35" y="145" width="9" height="35" rx="3" fill="#fed7aa" />
              <ellipse cx="24" cy="180" rx="8" ry="4" fill="#991b1b" />
              <ellipse cx="39" cy="180" rx="8" ry="4" fill="#991b1b" />
              {/* Yellow Sweater */}
              <rect x="16" y="55" width="32" height="58" rx="8" fill="#EAB308" />
              <path d="M 22 55 L 32 72 L 42 55" stroke="#ca8a04" strokeWidth="3" fill="none" />
              {/* Head */}
              <ellipse cx="32" cy="32" rx="16" ry="20" fill="#fcd34d" opacity="0.15" />
              <ellipse cx="32" cy="32" rx="16" ry="20" fill="#ffedd5" />
              {/* Ponytail Hair */}
              <path d="M 16 28 Q 18 10 32 10 Q 48 10 48 28 Q 42 16 32 16 Q 22 16 16 28 Z" fill="#451a03" />
              <path d="M 44 22 Q 62 25 58 50 Q 50 40 45 30 Z" fill="#451a03" />
              {/* Spectacles (Glasses) */}
              <rect x="22" y="27" width="8" height="7" rx="2" fill="none" stroke="#0284c7" strokeWidth="1.5" />
              <rect x="34" y="27" width="8" height="7" rx="2" fill="none" stroke="#0284c7" strokeWidth="1.5" />
              <line x1="30" y1="30" x2="34" y2="30" stroke="#0284c7" strokeWidth="1.5" />
              {/* Eyes & Smile */}
              <circle cx="26" cy="31" r="1.5" fill="#0f172a" />
              <circle cx="38" cy="31" r="1.5" fill="#0f172a" />
              <path d="M 29 42 Q 32 45 35 42" stroke="#e11d48" strokeWidth="1.5" fill="none" />
              {/* Holding Notebook in hand */}
              <rect x="36" y="85" width="22" height="28" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="40" y1="92" x2="54" y2="92" stroke="#64748b" strokeWidth="1" />
              <line x1="40" y1="98" x2="54" y2="98" stroke="#64748b" strokeWidth="1" />
              <line x1="40" y1="104" x2="50" y2="104" stroke="#64748b" strokeWidth="1" />
            </g>

            {/* Nam: Orange shirt (#F97316), cheerful gesture */}
            <g id="character-nam" transform="translate(100, 315)" filter="url(#comicShadow)">
              {/* Shadow */}
              <ellipse cx="35" cy="175" rx="32" ry="8" fill="#0f172a" opacity="0.4" />
              <rect x="20" y="112" width="13" height="63" rx="4" fill="#1e293b" />
              <rect x="37" y="112" width="13" height="63" rx="4" fill="#1e293b" />
              <ellipse cx="26" cy="175" rx="10" ry="5" fill="#ea580c" />
              <ellipse cx="43" cy="175" rx="10" ry="5" fill="#ea580c" />
              {/* Torso Orange Shirt */}
              <rect x="14" y="55" width="42" height="60" rx="8" fill="#F97316" />
              {/* Head */}
              <ellipse cx="35" cy="32" rx="19" ry="22" fill="#fed7aa" />
              {/* Curly hair */}
              <path d="M 15 28 Q 20 8 35 8 Q 52 8 54 28 Q 45 14 35 15 Q 22 16 15 28 Z" fill="#292524" />
              <circle cx="18" cy="18" r="4" fill="#292524" />
              <circle cx="35" cy="9" r="5" fill="#292524" />
              <circle cx="51" cy="18" r="4" fill="#292524" />
              {/* Broad cheerful smile */}
              <circle cx="28" cy="32" r="2.5" fill="#0f172a" />
              <circle cx="42" cy="32" r="2.5" fill="#0f172a" />
              <path d="M 28 40 Q 35 52 42 40 Z" fill="#dc2626" />
            </g>

            {/* Teacher Binh (If in scene) */}
            {frame.characterIds.includes('char-thay-binh') && (
              <g id="character-thay-binh" transform="translate(430, 275)" filter="url(#comicShadow)">
                <ellipse cx="35" cy="215" rx="35" ry="9" fill="#0f172a" opacity="0.4" />
                <rect x="20" y="135" width="13" height="80" rx="4" fill="#0f172a" />
                <rect x="37" y="135" width="13" height="80" rx="4" fill="#0f172a" />
                <ellipse cx="26" cy="215" rx="11" ry="5" fill="#334155" />
                <ellipse cx="43" cy="215" rx="11" ry="5" fill="#334155" />
                {/* White Shirt + Green Tie (#059669) */}
                <rect x="15" y="65" width="40" height="75" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="32,70 38,70 41,115 35,125 29,115" fill="#059669" />
                {/* Head */}
                <ellipse cx="35" cy="38" rx="18" ry="24" fill="#ffedd5" />
                <path d="M 17 32 Q 22 14 35 14 Q 52 14 53 32 Q 44 20 35 21 Q 25 22 17 32 Z" fill="#1e293b" />
                {/* Glasses */}
                <rect x="24" y="34" width="8" height="6" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="38" y="34" width="8" height="6" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="32" y1="37" x2="38" y2="37" stroke="#0f172a" strokeWidth="1.5" />
                {/* Friendly smile */}
                <path d="M 30 49 Q 35 54 40 49" stroke="#991b1b" strokeWidth="1.5" fill="none" />
              </g>
            )}
          </svg>
        );

         case 'classroom_board':
      default:
        return (
          <svg
            className="w-full h-full absolute inset-0 object-cover"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
            </defs>

            {/* Classroom Wall */}
            <rect width="1000" height="600" fill="url(#wallGrad)" />

            {/* Large School Chalkboard (để trống, trung tính cho mọi bài học) */}
            <rect x="60" y="50" width="880" height="420" rx="12" fill="#78350f" />
            <rect x="75" y="65" width="850" height="390" rx="8" fill="url(#boardGrad)" />

            {/* Banner Title trung tính, lấy đúng tên cảnh thay vì cố định "Thales" */}
            <rect x="250" y="80" width="500" height="42" rx="8" fill="#047857" opacity="0.6" />
            <text x="500" y="108" fill="#a7f3d0" fontSize="20" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">
              {(frame.title || 'BÀI HỌC').toUpperCase()}
            </text>

            {/* Wooden classroom table in foreground */}
            <rect x="0" y="520" width="1000" height="80" fill="#451a03" />
            <line x1="0" y1="520" x2="1000" y2="520" stroke="#78350f" strokeWidth="4" />
          </svg>
        );
    }
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