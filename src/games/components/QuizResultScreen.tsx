import React from 'react';
import { GestureQuizConfig, PlayerStats, TeamStats } from '../types/GestureQuiz';
import { Trophy, RotateCcw, FileText, LogOut, Award, Sparkles, Clock, Zap } from 'lucide-react';

interface QuizResultScreenProps {
  config: GestureQuizConfig;
  individualLeaderboard: PlayerStats[];
  teamLeaderboard: TeamStats[];
  totalQuestions: number;
  onReplay: () => void;
  onViewReview: () => void;
  onExit: () => void;
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  config,
  individualLeaderboard,
  teamLeaderboard,
  totalQuestions,
  onReplay,
  onViewReview,
  onExit,
}) => {
  const isIndividual = config.competitionMode === 'individual';

  return (
    <div className="w-full mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Trophy Bento Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-2xl text-center space-y-6">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500" />

        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <Trophy className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs sm:text-sm font-black px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
              {config.subject} • {config.purpose === 'warm-up' ? '🚀 KHỞI ĐỘNG' : '🎯 LUYỆN TẬP'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight pt-1">
            TỔNG KẾT & XẾP HẠNG
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto font-medium">
            Chúc mừng tất cả các em học sinh đã hoàn thành {totalQuestions} câu hỏi trắc nghiệm cử chỉ AI!
          </p>
        </div>

        {/* Podium for Top 3 */}
        <div className="pt-6 pb-2 grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto items-end">
          {/* Silver #2 */}
          <div className="flex flex-col items-center">
            {isIndividual && individualLeaderboard[1] ? (
              <div className="w-full text-center space-y-1">
                <span className="text-2xl">🥈</span>
                <div className="font-bold text-xs text-gray-200 truncate px-1">
                  {individualLeaderboard[1].name}
                </div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {individualLeaderboard[1].score}/{totalQuestions}đ ({individualLeaderboard[1].accuracyRate}%)
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{individualLeaderboard[1].totalTimeSeconds}s</span>
                </div>
                <div className="h-16 rounded-t-xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-gray-400 text-sm">
                  Hạng 2
                </div>
              </div>
            ) : !isIndividual && teamLeaderboard[1] ? (
              <div className="w-full text-center space-y-1">
                <span className="text-2xl">🥈</span>
                <div className="font-bold text-xs text-gray-200 truncate px-1">
                  {teamLeaderboard[1].name}
                </div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {teamLeaderboard[1].score}/{totalQuestions}đ ({teamLeaderboard[1].accuracyRate}%)
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{teamLeaderboard[1].totalTimeSeconds}s</span>
                </div>
                <div className="h-16 rounded-t-xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-gray-400 text-sm">
                  Hạng 2
                </div>
              </div>
            ) : (
              <div className="h-16 w-full rounded-t-xl bg-[#21262D]/40 border-t border-x border-[#30363D]" />
            )}
          </div>

          {/* Gold #1 */}
          <div className="flex flex-col items-center">
            {isIndividual && individualLeaderboard[0] ? (
              <div className="w-full text-center space-y-1">
                <span className="text-3xl animate-bounce">👑 🥇</span>
                <div className="font-extrabold text-sm text-amber-300 truncate px-1">
                  {individualLeaderboard[0].name}
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {individualLeaderboard[0].score}/{totalQuestions}đ ({individualLeaderboard[0].accuracyRate}%)
                </div>
                <div className="text-[11px] font-mono text-amber-300 font-bold flex items-center justify-center gap-1 bg-amber-500/20 py-0.5 px-2 rounded-full border border-amber-500/30">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{individualLeaderboard[0].totalTimeSeconds}s</span>
                </div>
                <div className="h-24 rounded-t-xl bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 flex items-center justify-center font-black text-base shadow-lg shadow-amber-500/20">
                  Hạng 1
                </div>
              </div>
            ) : !isIndividual && teamLeaderboard[0] ? (
              <div className="w-full text-center space-y-1">
                <span className="text-3xl animate-bounce">👑 🥇</span>
                <div className="font-extrabold text-sm text-amber-300 truncate px-1">
                  {teamLeaderboard[0].name}
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {teamLeaderboard[0].score}/{totalQuestions}đ ({teamLeaderboard[0].accuracyRate}%)
                </div>
                <div className="text-[11px] font-mono text-amber-300 font-bold flex items-center justify-center gap-1 bg-amber-500/20 py-0.5 px-2 rounded-full border border-amber-500/30">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{teamLeaderboard[0].totalTimeSeconds}s</span>
                </div>
                <div className="h-24 rounded-t-xl bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 flex items-center justify-center font-black text-base shadow-lg shadow-amber-500/20">
                  Hạng 1
                </div>
              </div>
            ) : null}
          </div>

          {/* Bronze #3 */}
          <div className="flex flex-col items-center">
            {isIndividual && individualLeaderboard[2] ? (
              <div className="w-full text-center space-y-1">
                <span className="text-2xl">🥉</span>
                <div className="font-bold text-xs text-gray-200 truncate px-1">
                  {individualLeaderboard[2].name}
                </div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {individualLeaderboard[2].score}/{totalQuestions}đ ({individualLeaderboard[2].accuracyRate}%)
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{individualLeaderboard[2].totalTimeSeconds}s</span>
                </div>
                <div className="h-12 rounded-t-xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-amber-500/80 text-xs">
                  Hạng 3
                </div>
              </div>
            ) : !isIndividual && teamLeaderboard[2] ? (
              <div className="w-full text-center space-y-1">
                <span className="text-2xl">🥉</span>
                <div className="font-bold text-xs text-gray-200 truncate px-1">
                  {teamLeaderboard[2].name}
                </div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {teamLeaderboard[2].score}/{totalQuestions}đ ({teamLeaderboard[2].accuracyRate}%)
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{teamLeaderboard[2].totalTimeSeconds}s</span>
                </div>
                <div className="h-12 rounded-t-xl bg-[#21262D] border-t border-x border-[#30363D] flex items-center justify-center font-bold text-amber-500/80 text-xs">
                  Hạng 3
                </div>
              </div>
            ) : (
              <div className="h-12 w-full rounded-t-xl bg-[#21262D]/40 border-t border-x border-[#30363D]" />
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Table Bento Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <span>Bảng Xếp Hạng & Xếp Loại Trò Chơi</span>
          </h3>
          <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Bằng điểm: Ưu tiên người làm bài nhanh hơn</span>
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#30363D] bg-[#0A0E17]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#161B22] border-b border-[#30363D] font-bold text-gray-300">
              <tr>
                <th className="p-3 text-center w-16">Hạng</th>
                <th className="p-3">{isIndividual ? 'Học sinh' : 'Tên Đội & Thành viên'}</th>
                <th className="p-3 text-center">Số câu đúng</th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tổng thời gian</span>
                  </div>
                </th>
                <th className="p-3 text-center">Tỷ lệ</th>
                <th className="p-3 text-right">Xếp loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {isIndividual
                ? individualLeaderboard.map((player, idx) => (
                    <tr
                      key={player.id}
                      className={idx === 0 ? 'bg-amber-500/10 font-bold' : 'hover:bg-[#161B22]/50'}
                    >
                      <td className="p-3 text-center font-mono font-bold text-gray-300">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                      </td>
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{player.name}</span>
                          {idx === 0 && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                              Quán Quân
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-gray-200">
                        {player.correctCount} / {totalQuestions}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {player.totalTimeSeconds} giây
                      </td>
                      <td className="p-3 text-center font-mono font-medium text-gray-400">
                        {player.accuracyRate}%
                      </td>
                      <td className="p-3 text-right">
                        <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-300">
                          {player.ratingLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                : teamLeaderboard.map((team, idx) => (
                    <tr
                      key={team.id}
                      className={idx === 0 ? 'bg-amber-500/10 font-bold' : 'hover:bg-[#161B22]/50'}
                    >
                      <td className="p-3 text-center font-mono font-bold text-gray-300">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                      </td>
                      <td className="p-3">
                        <div className="font-bold" style={{ color: team.color }}>
                          {team.name}
                        </div>
                        <div className="text-xs text-gray-400 font-normal">
                          {team.memberNames.join(', ')}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-gray-200">
                        {team.score} / {totalQuestions}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {team.totalTimeSeconds} giây
                      </td>
                      <td className="p-3 text-center font-mono font-medium text-gray-400">
                        {team.accuracyRate}%
                      </td>
                      <td className="p-3 text-right">
                        <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
                          {team.ratingLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pedagogical and Ranking Criteria Note */}
        <div className="space-y-1 pt-1">
          <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Tiêu chí xếp hạng:</strong> Ưu tiên số câu trả lời đúng. Khi hai bạn/đội bằng điểm nhau, hệ thống tự động xét tổng thời gian làm bài (học sinh có tổng thời gian trả lời nhanh hơn sẽ xếp trên).
            </span>
          </p>
          <p className="text-[11px] text-gray-500 italic">
            * Ghi chú: Xếp loại trong trò chơi dùng để động viên, khích lệ tinh thần học tập của học sinh, không dùng làm điểm đánh giá học tập chính thức.
          </p>
        </div>
      </div>

      {/* 3 Action Bento Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Chơi Lại */}
        <button
          onClick={onReplay}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 p-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>🔄 Chơi Lại (Ưu Tiên Câu Mới)</span>
        </button>

        {/* 2. Xem Kết Quả Chi Tiết */}
        <button
          onClick={onViewReview}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#161B22] border border-[#30363D] p-4 text-sm font-bold text-gray-200 hover:border-gray-500 hover:bg-[#21262D] hover:text-white transition cursor-pointer"
        >
          <FileText className="w-5 h-5 text-blue-400" />
          <span>📊 Xem Chi Tiết Đáp Án</span>
        </button>

        {/* 3. Thoát */}
        <button
          onClick={onExit}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#0A0E17] border border-[#30363D] p-4 text-sm font-bold text-gray-400 hover:border-rose-500/40 hover:text-rose-400 hover:bg-[#161B22] transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>✕ Thoát Về Màn Hình Chính</span>
        </button>
      </div>
    </div>
  );
};

