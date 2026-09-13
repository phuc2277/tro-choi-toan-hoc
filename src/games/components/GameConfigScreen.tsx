import React, { useState } from 'react';
import {
  GestureQuizConfig,
  GamePurpose,
  CompetitionMode,
  IndividualPlayerCount,
  IndividualInputMode,
  TeamCompetitionType,
  TeamCount,
  PlayersPerTeam,
  TeamInputMode,
  QuestionItem,
} from '../types/GestureQuiz';
import {
  User,
  Users,
  Camera,
  Mic,
  Clock,
  HelpCircle,
  AlertTriangle,
  Play,
  ArrowLeft,
  Settings2,
  CheckCircle2,
  Keyboard,
  MousePointer,
} from 'lucide-react';

interface GameConfigScreenProps {
  purpose: GamePurpose;
  subject: string;
  lessonTitle: string;
  allLessonQuestions: QuestionItem[];
  selectedPoolIds: string[];
  onOpenPoolModal: () => void;
  onBack: () => void;
  onStartGame: (config: GestureQuizConfig) => void;
}

export const GameConfigScreen: React.FC<GameConfigScreenProps> = ({
  purpose,
  subject,
  lessonTitle,
  allLessonQuestions,
  selectedPoolIds,
  onOpenPoolModal,
  onBack,
  onStartGame,
}) => {
  // Config state
  const [questionsPerRound, setQuestionsPerRound] = useState<number>(purpose === 'warm-up' ? 5 : 10);
  const [timeLimit, setTimeLimit] = useState<number>(15); // 10, 15, 20, 30
  const [competitionMode, setCompetitionMode] = useState<CompetitionMode>('individual');

  // Individual config
  const [individualPlayerCount, setIndividualPlayerCount] = useState<IndividualPlayerCount>(1);
  const [individualInputMode, setIndividualInputMode] = useState<IndividualInputMode>('camera');

  // Team config
  const [teamCompetitionType, setTeamCompetitionType] = useState<TeamCompetitionType>('simultaneous');
  const [teamCount, setTeamCount] = useState<TeamCount>(2);
  const [playersPerTeam, setPlayersPerTeam] = useState<PlayersPerTeam>(2);
  const [teamInputMode, setTeamInputMode] = useState<TeamInputMode>('camera');

  // Pool capacity validation (Spec Item 4)
  const poolCount = selectedPoolIds.length;
  const isPoolValid = poolCount >= questionsPerRound;

  const handleStart = () => {
    if (!isPoolValid) {
      alert(
        `Số câu trong Question Pool (${poolCount} câu) phải lớn hơn hoặc bằng số câu mỗi lượt (${questionsPerRound} câu)!`
      );
      return;
    }

    const config: GestureQuizConfig = {
      purpose,
      subject,
      lessonTitle,
      questionPoolIds: selectedPoolIds,
      questionsPerRound,
      timeLimitPerQuestion: timeLimit,
      competitionMode,
      individualConfig:
        competitionMode === 'individual'
          ? {
              playerCount: individualPlayerCount,
              inputMode: individualInputMode,
            }
          : undefined,
      teamConfig:
        competitionMode === 'team'
          ? {
              competitionType: teamCompetitionType,
              teamCount: teamCompetitionType === 'simultaneous' ? 2 : teamCount,
              playersPerTeam: teamCompetitionType === 'simultaneous' ? 2 : playersPerTeam,
              inputMode: teamInputMode,
            }
          : undefined,
    };

    onStartGame(config);
  };

  return (
    <div className="w-full mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363D] pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#161B22] px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-200 hover:bg-[#21262D] hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-blue-400" /> Đổi Bài học / Mục đích
        </button>

        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="rounded-xl bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-400">
              {purpose === 'warm-up' ? '🚀 Khởi Động' : '🎯 Luyện Tập'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white">{subject}</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{lessonTitle}</p>
        </div>
      </div>

      {/* Bento Section 1: Exam Set & Round Questions Setting */}
      <div className="bg-[#161B22] rounded-2xl p-6 border border-[#30363D] space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Settings2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white">1. Cấu Hình Câu Hỏi & Thời Gian</h2>
          </div>
          <button
            onClick={onOpenPoolModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 px-3.5 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/25 transition cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" /> Bạn chọn đề nào ({poolCount} / {allLessonQuestions.length} câu)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Questions Per Round */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 block">
              Số câu hỏi mỗi lượt chơi (Questions / Round):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 8, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionsPerRound(num)}
                  className={`rounded-xl py-2.5 text-xs font-bold transition border ${
                    questionsPerRound === num
                      ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'border-[#30363D] bg-[#21262D] text-gray-300 hover:border-gray-500 hover:bg-[#282e38]'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">
              {purpose === 'warm-up'
                ? '⚡ Đề xuất cho Khởi động: 5 câu nhanh.'
                : '🎯 Đề xuất cho Luyện tập: 10–15 câu rèn luyện kỹ năng.'}
            </p>
          </div>

          {/* Time Per Question */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 block flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              Thời gian trả lời mỗi câu (Giây):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimeLimit(sec)}
                  className={`rounded-xl py-2.5 text-xs font-bold transition border ${
                    timeLimit === sec
                      ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'border-[#30363D] bg-[#21262D] text-gray-300 hover:border-gray-500 hover:bg-[#282e38]'
                  }`}
                >
                  {sec} giây
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">Đếm ngược tự động theo GameConfig.</p>
          </div>
        </div>

        {/* Validation Alert */}
        {!isPoolValid ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-red-200">Không đủ câu hỏi trong Question Pool!</div>
              <div>
                Question Pool hiện tại có <strong className="text-white">{poolCount} câu</strong>, nhưng bạn cấu hình lượt chơi{' '}
                <strong className="text-white">{questionsPerRound} câu</strong>. Quy tắc bắt buộc: Pool phải lớn hơn hoặc bằng số câu mỗi lượt.
              </div>
              <button
                onClick={onOpenPoolModal}
                className="mt-2 inline-block rounded-lg bg-red-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-red-500"
              >
                + Chọn thêm câu hỏi vào Pool ngay
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              ✅ Hợp lệ: Question Pool có <strong className="text-white">{poolCount} câu</strong> (Lấy ngẫu nhiên{' '}
              <strong className="text-white">{questionsPerRound} câu/lượt</strong>, lượt sau ưu tiên câu chưa dùng).
            </span>
          </div>
        )}
      </div>

      {/* Bento Section 2: Màn Hình Chọn Hình Thức Thi */}
      <div className="bg-[#161B22] rounded-2xl p-6 border border-[#30363D] space-y-6 shadow-xl">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
            🎮 BẠN MUỐN CHƠI NHƯ THẾ NÀO?
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Chọn hình thức thi đấu cá nhân hoặc thi đấu đồng đội cho lớp học
          </p>
        </div>

        {/* Top 2 Big Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Individual Mode */}
          <div
            onClick={() => setCompetitionMode('individual')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition ${
              competitionMode === 'individual'
                ? 'border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/10 shadow-lg'
                : 'border-[#30363D] bg-[#21262D] hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">👤 THI CÁ NHÂN</h3>
                  <p className="text-xs text-gray-400">1 – 4 người cùng lúc</p>
                </div>
              </div>
              {competitionMode === 'individual' && (
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <p className="text-xs text-gray-300">
              Mỗi học sinh trả lời độc lập và tích lũy điểm số cá nhân trên bảng xếp hạng.
            </p>
          </div>

          {/* Team Mode */}
          <div
            onClick={() => setCompetitionMode('team')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition ${
              competitionMode === 'team'
                ? 'border-purple-500 bg-purple-500/10 ring-4 ring-purple-500/10 shadow-lg'
                : 'border-[#30363D] bg-[#21262D] hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">👥 THI ĐỒNG ĐỘI</h3>
                  <p className="text-xs text-gray-400">2 – 4 đội thi đấu</p>
                </div>
              </div>
              {competitionMode === 'team' && (
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
              )}
            </div>
            <p className="text-xs text-gray-300">
              Đòi hỏi tinh thần đồng đội: Cả đội chỉ ghi điểm khi <strong className="text-white">tất cả thành viên</strong> đều trả lời đúng!
            </p>
          </div>
        </div>

        {/* Detailed Configuration for Individual Mode */}
        {competitionMode === 'individual' && (
          <div className="rounded-xl border border-blue-500/20 bg-[#21262D] p-5 space-y-4">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Cấu hình Thi Cá Nhân (1 – 4 người)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Số người chơi:</label>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as IndividualPlayerCount[]).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setIndividualPlayerCount(num)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition border ${
                        individualPlayerCount === num
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {num} Người
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Phương thức chọn đáp án (Input Mode):
                </label>
                {individualPlayerCount === 1 ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setIndividualInputMode('camera')}
                      className={`rounded-xl p-3 text-xs font-bold transition border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        individualInputMode === 'camera'
                          ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Camera className="w-5 h-5 text-blue-400" />
                      <span>📷 Camera Cử Chỉ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIndividualInputMode('voice')}
                      className={`rounded-xl p-3 text-xs font-bold transition border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        individualInputMode === 'voice'
                          ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Mic className="w-5 h-5 text-purple-400" />
                      <span>🎤 Giọng Nói</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIndividualInputMode('keyboard_mouse')}
                      className={`rounded-xl p-3 text-xs font-bold transition border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        individualInputMode === 'keyboard_mouse'
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <MousePointer className="w-4 h-4 text-emerald-400" />
                        <Keyboard className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span>🖱️⌨️ Chuột / Phím</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIndividualInputMode('camera')}
                      className={`rounded-xl p-3 text-xs font-bold transition border flex items-center justify-center gap-2 cursor-pointer ${
                        individualInputMode === 'camera'
                          ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Camera className="w-4 h-4" /> 📷 Camera Vision AI ({individualPlayerCount} vùng)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIndividualInputMode('keyboard_mouse')}
                      className={`rounded-xl p-3 text-xs font-bold transition border flex items-center justify-center gap-2 cursor-pointer ${
                        individualInputMode === 'keyboard_mouse'
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Keyboard className="w-4 h-4" /> 🖱️⌨️ Chuột & Phím Riêng
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Rule & Control Guide */}
            {individualInputMode === 'camera' ? (
              <div className="rounded-xl bg-[#161B22] p-3.5 border border-[#30363D] text-xs text-gray-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="font-semibold text-blue-400">👉 1 ngón: Đáp án A</div>
                <div className="font-semibold text-emerald-400">✌️ 2 ngón: Đáp án B</div>
                <div className="font-semibold text-amber-400">🤟 3 ngón: Đáp án C</div>
                <div className="font-semibold text-purple-400">🖐 4 ngón: Đáp án D</div>
              </div>
            ) : individualInputMode === 'voice' ? (
              <div className="rounded-xl bg-purple-500/10 p-3.5 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
                <span>🎤 <strong>Hướng dẫn Giọng Nói:</strong> Học sinh phát âm rõ chữ cái <strong className="text-white">"A", "B", "C", "D"</strong> vào micro.</span>
                <span className="font-mono text-purple-300 text-[11px]">Web Speech API</span>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/30 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    🖱️ <strong>Chuột:</strong> Click trực tiếp vào thẻ đáp án A, B, C, D trên màn hình
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span>⌨️ Phím tắt:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-emerald-300">[1 / A]</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-emerald-300">[2 / B]</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-emerald-300">[3 / C]</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-emerald-300">[4 / D]</kbd>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Configuration for Team Mode */}
        {competitionMode === 'team' && (
          <div className="rounded-xl border border-purple-500/20 bg-[#21262D] p-5 space-y-5">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Cấu hình Thi Đồng Đội (2 – 4 Đội)
            </h4>

            {/* Team Input Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Phương thức chọn đáp án cho đội:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTeamInputMode('camera')}
                  className={`rounded-xl p-3 text-xs font-bold transition border flex items-center justify-center gap-2 cursor-pointer ${
                    teamInputMode === 'camera'
                      ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Camera className="w-4 h-4" /> 📷 Camera AI Cử Chỉ
                </button>
                <button
                  type="button"
                  onClick={() => setTeamInputMode('keyboard_mouse')}
                  className={`rounded-xl p-3 text-xs font-bold transition border flex items-center justify-center gap-2 cursor-pointer ${
                    teamInputMode === 'keyboard_mouse'
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Keyboard className="w-4 h-4" /> 🖱️⌨️ Chuột & Bàn Phím
                </button>
              </div>
            </div>

            {/* Competition Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Hình thức thi đấu:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setTeamCompetitionType('simultaneous')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition ${
                    teamCompetitionType === 'simultaneous'
                      ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/20'
                      : 'border-[#30363D] bg-[#161B22] hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold text-xs text-white">○ Thi Đồng Thời (Simultaneous)</div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Cố định <strong className="text-purple-300">2 đội × 2 người/đội</strong> (Tổng 4 người). Bên trái: Đội 1, Bên phải: Đội 2 cùng thi trực tiếp.
                  </p>
                </div>

                <div
                  onClick={() => setTeamCompetitionType('sequential')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition ${
                    teamCompetitionType === 'sequential'
                      ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/20'
                      : 'border-[#30363D] bg-[#161B22] hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold text-xs text-white">○ Thi Lần Lượt (Sequential)</div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Cho phép <strong className="text-purple-300">2–4 đội</strong>, mỗi đội <strong className="text-purple-300">2–4 người</strong>. Từng đội lần lượt thi đấu.
                  </p>
                </div>
              </div>
            </div>

            {/* Team options when Sequential */}
            {teamCompetitionType === 'sequential' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#30363D]">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">Số đội thi:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 3, 4] as TeamCount[]).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTeamCount(count)}
                        className={`rounded-xl py-2 text-xs font-bold transition border ${
                          teamCount === count
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {count} Đội
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">Số người mỗi đội:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 3, 4] as PlayersPerTeam[]).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPlayersPerTeam(count)}
                        className={`rounded-xl py-2 text-xs font-bold transition border ${
                          playersPerTeam === count
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-[#30363D] bg-[#161B22] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {count} Người/Đội
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scoring Rule Callout */}
            <div className="rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/20 text-xs text-amber-300">
              ⚖️ <strong>Luật Chấm Điểm Đồng Đội:</strong> Một đội chỉ được <strong className="text-white">+1 điểm</strong> nếu{' '}
              <strong className="text-amber-200">tất cả thành viên trong đội đều trả lời đúng</strong>. Nếu có 1 thành viên sai hoặc chưa chọn, đội nhận{' '}
              <strong className="text-red-300">+0 điểm</strong>.
            </div>
          </div>
        )}
      </div>

      {/* Start Button Bar */}
      <div className="flex items-center justify-between bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xl">
        <div>
          <div className="text-xs font-bold text-white">
            Sẵn sàng thi đấu: {questionsPerRound} câu • {timeLimit}s/câu
          </div>
          <div className="text-[11px] text-gray-400">
            {competitionMode === 'individual'
              ? `Cá nhân: ${individualPlayerCount} người (${
                  individualInputMode === 'camera'
                    ? 'Camera Cử chỉ'
                    : individualInputMode === 'voice'
                    ? 'Giọng nói AI'
                    : 'Chuột & Bàn phím'
                })`
              : `Đồng đội: ${
                  teamCompetitionType === 'simultaneous'
                    ? 'Đồng thời (2 đội x 2 người)'
                    : `Lần lượt (${teamCount} đội x ${playersPerTeam} người)`
                } • ${teamInputMode === 'camera' ? 'Camera Cử chỉ' : 'Chuột & Bàn phím'}`}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!isPoolValid}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>BẮT ĐẦU TRÒ CHƠI</span>
        </button>
      </div>
    </div>
  );
};
