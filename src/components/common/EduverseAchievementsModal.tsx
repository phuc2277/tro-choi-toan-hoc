import React from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Brain,
  Target,
  Rocket,
  FileCheck,
  X,
  Star,
  CheckCircle2,
  Award,
  Calendar,
} from 'lucide-react';

interface EduverseAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats?: {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    streakDays: number;
    badgesCount: number;
  };
}

export const EduverseAchievementsModal: React.FC<EduverseAchievementsModalProps> = ({
  isOpen,
  onClose,
  userStats = {
    level: 8,
    currentXp: 1250,
    nextLevelXp: 1500,
    streakDays: 7,
    badgesCount: 12,
  },
}) => {
  if (!isOpen) return null;

  const badges = [
    { id: 'math-master', title: 'Nhà toán học', icon: Trophy, color: 'from-amber-400 to-yellow-500', unlocked: true, desc: 'Hoàn thành 10 bài toán nâng cao', date: '28/08/2026' },
    { id: 'knowledge-warrior', title: 'Chiến binh kiến thức', icon: Flame, color: 'from-orange-500 to-red-600', unlocked: true, desc: 'Chuỗi học tập 7 ngày liên tục', date: 'Hôm nay' },
    { id: 'light-speed', title: 'Tốc độ ánh sáng', icon: Zap, color: 'from-cyan-400 to-blue-600', unlocked: true, desc: 'Trả lời đúng 5 câu trắc nghiệm < 10s', date: '01/09/2026' },
    { id: 'mind-master', title: 'Bậc thầy tư duy', icon: Brain, color: 'from-purple-400 to-indigo-600', unlocked: true, desc: 'Đạt điểm tuyệt đối vòng thi đấu', date: '02/09/2026' },
    { id: 'universe-explorer', title: 'Khám phá Vũ trụ Eduverse', icon: Rocket, color: 'from-fuchsia-400 to-pink-600', unlocked: true, desc: 'Trải nghiệm toàn bộ 9 trò chơi học tập', date: '03/09/2026' },
    { id: 'master-exam', title: 'Chuyên gia khảo thí', icon: FileCheck, color: 'from-teal-400 to-emerald-600', unlocked: true, desc: 'Tạo ma trận và đề thi trắc nghiệm chuẩn', date: '04/09/2026' },
    { id: 'absolute-accuracy', title: 'Chính xác tuyệt đối', icon: Target, color: 'from-emerald-400 to-teal-600', unlocked: false, desc: 'Chuỗi 20 câu trả lời liên tiếp không sai', date: 'Chưa mở khóa' },
    { id: 'century-streak', title: 'Huyền thoại học tập', icon: Award, color: 'from-indigo-400 to-purple-600', unlocked: false, desc: 'Duy trì chuỗi học tập 30 ngày', date: 'Chưa mở khóa' },
  ];

  const dailyQuests = [
    { title: 'Hoàn thành 1 bài trắc nghiệm cử chỉ AI', xp: 50, done: true },
    { title: 'Khám phá và tải tài liệu từ Kho SGK GDPT', xp: 30, done: true },
    { title: 'Tạo 1 đề thi mới cho lớp 9', xp: 40, done: false },
  ];

  const progressPercent = Math.min(100, Math.round((userStats.currentXp / userStats.nextLevelXp) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl eduverse-glass-elevated border border-purple-500/30 p-6 sm:p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Bảng Vàng Danh Dự & Thành Tích
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Ghi nhận các mốc son học tập và huy hiệu cá nhân trong Eduverse
            </p>
          </div>
        </div>

        {/* Level Overview Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
              LV {userStats.level}
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-400">DANH HIỆU HIỆN TẠI</span>
              <h3 className="text-base font-black text-white">Bậc Thầy Nghiên Cứu Toán Học</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  Chuỗi {userStats.streakDays} ngày
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-300 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  {badges.filter((b) => b.unlocked).length} Huy hiệu đạt được
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Tiến độ cấp độ:</span>
              <span className="text-cyan-400 font-bold">{userStats.currentXp}/{userStats.nextLevelXp} XP</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Quests */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Nhiệm vụ hàng ngày (Nhận thêm XP)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dailyQuests.map((q, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                  q.done
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <p className="font-semibold leading-snug">{q.title}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                  <span className="font-mono text-cyan-400 font-bold">+{q.xp} XP</span>
                  {q.done ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">Đang thực hiện</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Tất cả huy hiệu chinh phục
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    b.unlocked
                      ? 'bg-slate-900/80 border-slate-700/80 hover:border-yellow-500/50'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-40 grayscale'
                  }`}
                >
                  <div
                    className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr ${b.color} flex items-center justify-center text-white shadow-md mb-2.5`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{b.title}</h5>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">{b.desc}</p>
                  <span className="text-[9px] font-mono text-slate-500 mt-2 block">{b.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
