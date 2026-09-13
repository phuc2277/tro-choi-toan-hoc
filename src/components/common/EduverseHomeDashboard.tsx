import React from 'react';
import {
  Sparkles,
  GraduationCap,
  Gamepad2,
  BookOpen,
  FolderOpen,
  Brain,
  Trophy,
  Flame,
  Star,
  ArrowRight,
  Target,
  Zap,
  CheckCircle2,
  Compass,
  Play,
} from 'lucide-react';
import { Lesson } from '../../types/teacherLesson';

interface EduverseHomeDashboardProps {
  onStartLearning: () => void;
  onPlayGames: () => void;
  onOpenQuestionBank: () => void;
  onOpenAchievements: () => void;
  onOpenComicLesson?: () => void;
  currentLesson?: Lesson | null;
  totalLessonsCount: number;
  totalQuestionsCount: number;
}

export const EduverseHomeDashboard: React.FC<EduverseHomeDashboardProps> = ({
  onStartLearning,
  onPlayGames,
  onOpenQuestionBank,
  onOpenAchievements,
  onOpenComicLesson,
  currentLesson,
  totalLessonsCount = 12,
  totalQuestionsCount = 85,
}) => {
  const badges = [
    { id: 'math-master', title: 'Nhà toán học', icon: Trophy, color: 'from-amber-400 to-yellow-500', unlocked: true, desc: 'Hoàn thành 10 bài toán nâng cao' },
    { id: 'knowledge-warrior', title: 'Chiến binh kiến thức', icon: Flame, color: 'from-orange-500 to-red-600', unlocked: true, desc: 'Chuỗi học tập 7 ngày liên tục' },
    { id: 'light-speed', title: 'Tốc độ ánh sáng', icon: Zap, color: 'from-cyan-400 to-blue-600', unlocked: true, desc: 'Trả lời đúng 5 câu trắc nghiệm < 10s' },
    { id: 'mind-master', title: 'Bậc thầy tư duy', icon: Brain, color: 'from-purple-400 to-indigo-600', unlocked: true, desc: 'Đạt điểm tuyệt đối vòng thi đấu' },
    { id: 'absolute-accuracy', title: 'Chính xác tuyệt đối', icon: Target, color: 'from-emerald-400 to-teal-600', unlocked: false, desc: 'Chuỗi 20 câu trả lời không sai' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 relative z-10">
      {/* ======================================================== */}
      {/* 1. HERO SECTION (EDUVERSE WELCOME)                      */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden eduverse-glass-elevated border border-cyan-500/30">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Subtitle tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>KHÔNG GIAN HỌC TẬP TƯƠNG TÁC THẾ HỆ MỚI</span>
          </div>

          {/* Big Hero Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Chào mừng đến{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-200 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(34,211,238,0.4)]">
              EDUVERSE
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 mt-4 font-medium leading-relaxed">
            Học tập – Khám phá – Tương tác – Chinh phục
          </p>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Không gian trải nghiệm kho tài liệu số, ngân hàng câu hỏi phân cấp và 9 trò chơi học tập tương tác AI trực quan.
          </p>

          {/* Two Big Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button
              id="hero-btn-start-learning"
              onClick={onStartLearning}
              className="eduverse-btn-cyan px-6 sm:px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 cursor-pointer shadow-[0_8px_25px_rgba(6,182,212,0.4)] hover:scale-105 transition-all"
            >
              <GraduationCap className="w-5 h-5" />
              <span>🎓 Bắt đầu học</span>
            </button>

            {onOpenComicLesson && (
              <button
                id="hero-btn-comic-lesson"
                onClick={onOpenComicLesson}
                className="px-6 sm:px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 cursor-pointer bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:scale-105 transition-all border border-amber-300/40"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>✨ AI Truyện Tranh (GDPT 2018)</span>
              </button>
            )}

            <button
              id="hero-btn-play-now"
              onClick={onPlayGames}
              className="eduverse-btn-purple px-6 sm:px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 cursor-pointer shadow-[0_8px_25px_rgba(168,85,247,0.4)] hover:scale-105 transition-all"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>🎮 Chơi ngay (9 Trò chơi)</span>
            </button>
          </div>
        </div>

        {/* Quick Lesson Peek Card (Right Side on Desktop) */}
        {currentLesson && (
          <div className="hidden lg:flex flex-col justify-between absolute right-8 top-1/2 -translate-y-1/2 w-80 p-5 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-cyan-400">Đang tiếp tục</span>
                <span className="font-mono">Toán {currentLesson.grade}</span>
              </div>
              <h4 className="text-white font-bold text-sm line-clamp-2">{currentLesson.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{currentLesson.chapter}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Tiến độ bài học</span>
                <span className="text-cyan-400">80%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-4/5 rounded-full" />
              </div>
              <button
                onClick={onStartLearning}
                className="mt-3 w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mở kho tài liệu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. DISCOVERY PORTALS (4 BIG INTERACTIVE CARDS)           */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-cyan-400" />
              Cánh Cổng Khám Phá EDUVERSE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Chọn một cánh cổng để bắt đầu hành trình chinh phục tri thức
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PORTAL 1: KHO TÀI LIỆU */}
          <div
            onClick={onStartLearning}
            className="group relative eduverse-glass-interactive p-5 cursor-pointer border border-cyan-500/20 hover:border-cyan-400/60 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/15 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all duration-300" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(6,182,212,0.35)] group-hover:scale-110 transition-transform duration-300 mb-3">
                <FolderOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase">
                {totalLessonsCount} Bài học tích hợp
              </span>
              <h3 className="text-base font-black text-white mt-1 group-hover:text-cyan-300 transition-colors">
                KHO TÀI LIỆU
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                Khám phá kho giáo án chuẩn CV 5512, tài liệu học tập, sách giáo khoa GDPT 2018 và tài nguyên số.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Xem tài liệu</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* PORTAL 2: AI TRUYỆN TRANH BÀI HỌC (NEW) */}
          <div
            onClick={onOpenComicLesson || onStartLearning}
            className="group relative eduverse-glass-interactive p-5 cursor-pointer border border-amber-500/30 hover:border-amber-400/70 overflow-hidden flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/35 transition-all duration-300" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(245,158,11,0.35)] group-hover:scale-110 transition-transform duration-300 mb-3">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                  8 Bước Chuẩn GDPT
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/30 text-amber-200 border border-amber-500/40">
                  MỚI
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1 group-hover:text-amber-300 transition-colors">
                AI TRUYỆN TRANH
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                Biến tài liệu SGK thành truyện tranh và video bài học tương tác với nhân vật nhất quán và công thức KaTeX.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Sáng tạo truyện</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* PORTAL 3: NGÂN HÀNG CÂU HỎI */}
          <div
            onClick={onOpenQuestionBank}
            className="group relative eduverse-glass-interactive p-5 cursor-pointer border border-indigo-500/20 hover:border-indigo-400/60 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-300" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(99,102,241,0.35)] group-hover:scale-110 transition-transform duration-300 mb-3">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
                {totalQuestionsCount} Câu hỏi phân loại
              </span>
              <h3 className="text-base font-black text-white mt-1 group-hover:text-indigo-300 transition-colors">
                NGÂN HÀNG CÂU HỎI
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                Luyện tập và củng cố kiến thức theo 4 mức độ nhận thức: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* PORTAL 4: TRÒ CHƠI (GAME HUB) */}
          <div
            onClick={onPlayGames}
            className="group relative eduverse-glass-interactive p-5 cursor-pointer border border-fuchsia-500/20 hover:border-fuchsia-400/60 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-fuchsia-500/15 rounded-full blur-2xl group-hover:bg-fuchsia-500/30 transition-all duration-300" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(217,70,239,0.35)] group-hover:scale-110 transition-transform duration-300 mb-3">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold tracking-widest text-fuchsia-400 uppercase">
                9 Đấu trường trò chơi
              </span>
              <h3 className="text-base font-black text-white mt-1 group-hover:text-fuchsia-300 transition-colors">
                TRÒ CHƠI
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                Học thông qua các thử thách và trò chơi: Cử chỉ AI, Chiếc nón, Đua xe Toán học, Rung chuông vàng.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-fuchsia-400 group-hover:translate-x-1 transition-transform">
              <span>Chơi ngay</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. GAMIFICATION & ACHIEVEMENTS SECTION                  */}
      {/* ======================================================== */}
      <div className="eduverse-glass p-6 sm:p-8 border border-purple-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Hệ Thống Huy Hiệu & Danh Hiệu Chinh Phục
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Thực hiện nhiệm vụ học tập, thi đấu trò chơi để nâng cấp huy hiệu danh giá
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>1.250 XP Tích lũy</span>
            </div>
            <button
              onClick={onOpenAchievements}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả (12)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                  badge.unlocked
                    ? 'bg-slate-900/70 border-slate-700/80 hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-50 grayscale'
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr ${badge.color} flex items-center justify-center text-white shadow-lg mb-3`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-black text-white truncate">{badge.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">{badge.desc}</p>
                <div className="mt-2.5">
                  {badge.unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Đã mở khóa
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">🔒 Chưa đạt</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
