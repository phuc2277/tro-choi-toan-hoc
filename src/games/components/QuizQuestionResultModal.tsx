import React from 'react';
import {
  QuestionItem,
  GestureQuizConfig,
  RoundScoreItem,
  PlayerStats,
  TeamStats,
} from '../types/GestureQuiz';
import { CheckCircle, XCircle, ChevronRight, Award, Trophy, Users, Lightbulb, Clock } from 'lucide-react';
import { QuizAnswerUtils } from '../gesture-quiz/utils/quizAnswerUtils';

interface QuizQuestionResultModalProps {
  config: GestureQuizConfig;
  currentQuestion: QuestionItem;
  currentQuestionIndex: number;
  totalQuestions: number;
  lastRoundScore: RoundScoreItem | undefined;
  individualLeaderboard: PlayerStats[];
  teamLeaderboard: TeamStats[];
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export const QuizQuestionResultModal: React.FC<QuizQuestionResultModalProps> = ({
  config,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  lastRoundScore,
  individualLeaderboard,
  teamLeaderboard,
  onNextQuestion,
  isLastQuestion,
}) => {
  const isIndividual = config.competitionMode === 'individual';
  const playerAnswers = lastRoundScore?.playerAnswers || [];

  return (
    <div className="w-full mx-auto space-y-6 animate-fadeIn pb-6">
      {/* Top Bento Banner */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363D] pb-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-500/20 px-4 py-1.5 font-mono text-sm sm:text-base font-black text-blue-400 border border-blue-500/30 shadow-inner">
              KẾT QUẢ CÂU {currentQuestionIndex + 1} / {totalQuestions}
            </span>
            <span className="text-sm sm:text-base text-gray-300 font-bold px-3 py-1 bg-[#0A0E17] rounded-xl border border-[#30363D]">
              {currentQuestion.subject}
            </span>
          </div>

          <button
            onClick={onNextQuestion}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-base sm:text-lg font-black text-white shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <span>{isLastQuestion ? 'Xem Tổng Kết & Bảng Vàng 🏆' : 'Câu Tiếp Theo ➔'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Question Review & Correct Option Banner */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            {currentQuestion.content}
          </h2>

          <div className="rounded-3xl border-2 border-emerald-500/60 bg-emerald-950/40 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-4 text-emerald-400 font-black text-xl sm:text-2xl lg:text-3xl">
              <CheckCircle className="w-9 h-9 text-emerald-400 shrink-0" />
              <span>
                ĐÁP ÁN ĐÚNG:{' '}
                <span className="font-mono font-black text-3xl sm:text-4xl text-emerald-200 bg-[#0A0E17] px-4 py-1.5 rounded-2xl border-2 border-emerald-500/60 shadow-lg">
                  {currentQuestion.correctAnswer}
                </span>{' '}
                —{' '}
                <span className="text-white font-extrabold">
                  {
                    QuizAnswerUtils.getOptionByLetter(
                      currentQuestion.options,
                      currentQuestion.correctAnswer
                    )?.text
                  }
                </span>
              </span>
            </div>

            {currentQuestion.explanation && (
              <div className="flex items-start gap-3 text-base sm:text-lg text-emerald-100 bg-[#0A0E17]/80 p-5 rounded-2xl border border-emerald-500/30 leading-relaxed">
                <Lightbulb className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">Giải thích:</span> {currentQuestion.explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Answers breakdown of each student / team */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5 border-b border-[#30363D] pb-3">
            <Award className="w-5 h-5 text-blue-400" />
            <span>Chi Tiết Trả Lời Câu Này</span>
          </h3>

          <div className="space-y-3">
            {playerAnswers.map((ans) => {
              const isCorrect = ans.selectedOption === currentQuestion.correctAnswer;
              return (
                <div
                  key={ans.playerId}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 text-sm sm:text-base font-bold transition shadow-md ${
                    isCorrect
                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                      : 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                    <span className="font-extrabold text-white text-base sm:text-lg">{ans.playerName}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="rounded-xl bg-[#0A0E17] px-3 py-1 border border-[#30363D] text-gray-200 font-bold text-sm sm:text-base">
                      {ans.selectedOption ? `Đã chọn [ ${ans.selectedOption} ]` : 'Không trả lời'}
                    </span>
                    {ans.timeSpentSeconds !== undefined && (
                      <span className="rounded-xl bg-black/50 px-2.5 py-1 text-xs text-gray-300 border border-white/10 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {ans.timeSpentSeconds}s
                      </span>
                    )}
                    <span className={`font-black text-base ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCorrect ? '+1 Điểm' : '+0 Điểm'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team 1-point rule summary */}
          {!isIndividual && (
            <div className="mt-4 rounded-2xl bg-purple-950/40 p-4 border border-purple-500/40 text-sm text-purple-200 space-y-1">
              <div className="font-black flex items-center gap-2 text-purple-300">
                <Users className="w-5 h-5 text-purple-400" /> Quy Tắc Điểm Đồng Đội:
              </div>
              <p className="text-xs sm:text-sm text-purple-200">
                Chỉ khi tất cả thành viên trong đội đều trả lời đúng mới được +1 điểm cho đội.
              </p>
            </div>
          )}
        </div>

        {/* Live Leaderboard after this question */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5 border-b border-[#30363D] pb-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Bảng Điểm & Thời Gian Thực</span>
          </h3>

          {isIndividual ? (
            <div className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#0A0E17]">
              <table className="w-full text-left text-sm sm:text-base">
                <thead className="bg-[#161B22] border-b border-[#30363D] font-extrabold text-gray-300">
                  <tr>
                    <th className="p-3.5">Học Sinh</th>
                    <th className="p-3.5 text-center">Đúng</th>
                    <th className="p-3.5 text-center">Tổng thời gian</th>
                    <th className="p-3.5 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]">
                  {individualLeaderboard.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx === 0 ? 'bg-amber-500/15 font-bold' : 'hover:bg-[#161B22]/50'}
                    >
                      <td className="p-3.5 flex items-center gap-2 text-white font-bold">
                        <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}</span>
                        <span className="text-base sm:text-lg">{item.name}</span>
                      </td>
                      <td className="p-3.5 text-center text-gray-300 font-mono font-bold">
                        {item.correctCount} / {currentQuestionIndex + 1}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                        {item.totalTimeSeconds}s
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-lg text-blue-400">{item.score} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#0A0E17]">
              <table className="w-full text-left text-sm sm:text-base">
                <thead className="bg-[#161B22] border-b border-[#30363D] font-extrabold text-gray-300">
                  <tr>
                    <th className="p-3.5">Tên Đội</th>
                    <th className="p-3.5 text-center">Thành viên</th>
                    <th className="p-3.5 text-center">Tổng thời gian</th>
                    <th className="p-3.5 text-right">Điểm Đội</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]">
                  {teamLeaderboard.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={idx === 0 ? 'bg-amber-500/15 font-bold' : 'hover:bg-[#161B22]/50'}
                    >
                      <td className="p-3.5 flex items-center gap-2 font-black">
                        <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👥'}</span>
                        <span style={{ color: t.color }} className="text-base sm:text-lg">{t.name}</span>
                      </td>
                      <td className="p-3.5 text-center text-gray-300 text-xs sm:text-sm">
                        {t.memberNames.join(', ')}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                        {t.totalTimeSeconds}s
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-lg text-blue-400">{t.score} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
