import React, { useState } from 'react';
import { QuestionItem } from '../types/GestureQuiz';
import { MathRenderer } from './MathRenderer';
import { MathDiagramView } from './MathDiagramView';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  X,
  Search,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Check,
  RefreshCw,
  Lightbulb,
  FileQuestion,
  ChevronRight,
  Globe,
} from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGeneratedQuestions?: (questions: QuestionItem[], topicName: string) => void;
}

type TabType = 'chat' | 'question-generator' | 'search-grounding' | 'math-solver';

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onAddGeneratedQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'user' | 'model'; text: string; sources?: Array<{ title: string; url: string }> }>
  >([
    {
      role: 'model',
      text: 'Xin chào Thầy Cô và các bạn học sinh! Tôi là **Trợ lý AI Giáo viên Toán THCS** được hỗ trợ bởi Gemini & Google Search. Tôi có thể hỗ trợ giải toán, tra cứu kiến thức, gợi ý phương pháp giải và soạn đề kiểm tra trắc nghiệm.',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);

  // Question Generator State
  const [genTopic, setGenTopic] = useState('Phương trình bậc nhất một ẩn và Bất đẳng thức lớp 8');
  const [genGrade, setGenGrade] = useState('8');
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState('Vận dụng');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [hasAddedToBank, setHasAddedToBank] = useState(false);

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('Lịch sử số Pi và ứng dụng thực tế trong hình học THCS');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<Array<{ title: string; url: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Math Solver State
  const [solverQuestion, setSolverQuestion] = useState('Giải phương trình bậc hai: $x^2 - 5x + 6 = 0$');
  const [solverExplanation, setSolverExplanation] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  if (!isOpen) return null;

  // Handle Send Chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory.map((h) => ({ role: h.role, content: h.text })),
          useSearch: useSearchGrounding,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi kết nối Gemini AI');

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply,
          sources: data.sources || [],
        },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ Đã xảy ra lỗi: ${err.message || 'Không thể kết nối với máy chủ AI.'}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Generate Questions
  const handleGenerateQuestions = async () => {
    if (!genTopic.trim() || isGeneratingQuestions) return;

    setIsGeneratingQuestions(true);
    setHasAddedToBank(false);

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          grade: genGrade,
          count: genCount,
          difficulty: genDifficulty,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tạo câu hỏi');

      const formattedQuestions: QuestionItem[] = (data.questions || []).map((q: any, idx: number) => ({
        id: `ai-gen-${Date.now()}-${idx + 1}`,
        content: q.content,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || '',
        points: q.points || 10,
        difficulty: q.difficulty || genDifficulty,
        diagram: q.diagram,
        tableData: q.tableData,
      }));

      setGeneratedQuestions(formattedQuestions);
    } catch (err: any) {
      console.error('Question generation error:', err);
      alert(`Lỗi tạo câu hỏi AI: ${err.message}`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Handle Add Generated Questions to Bank
  const handleAddToBank = () => {
    if (generatedQuestions.length === 0) return;
    if (onAddGeneratedQuestions) {
      onAddGeneratedQuestions(generatedQuestions, genTopic);
      setHasAddedToBank(true);
    }
  };

  // Handle Search Grounding
  const handleSearchGrounding = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResult(null);
    setSearchSources([]);

    try {
      const response = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tra cứu thất bại');

      setSearchResult(data.result);
      setSearchSources(data.sources || []);
    } catch (err: any) {
      console.error('Search grounding error:', err);
      setSearchResult(`⚠️ Lỗi tra cứu: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Math Solver
  const handleSolveMath = async () => {
    if (!solverQuestion.trim() || isSolving) return;

    setIsSolving(true);
    setSolverExplanation(null);

    try {
      const response = await fetch('/api/ai/explain-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: solverQuestion,
          answer: 'Đáp án chi tiết',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi giải toán');

      setSolverExplanation(data.explanation);
    } catch (err: any) {
      console.error('Math solver error:', err);
      setSolverExplanation(`⚠️ Lỗi: ${err.message}`);
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161B22] border-2 border-blue-500/40 w-full max-w-4xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0D1117] border-b border-[#30363D] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Trung Tâm Tính Năng AI Toán THCS
                </h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  Gemini 3.7 & Search
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Chatbot sư phạm • Google Search Grounding • Sinh đề thi chuẩn công thức
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-[#0A0E17] border-b border-[#30363D] overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#161B22] text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot AI Giáo Viên</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('question-generator')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'question-generator'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-[#161B22] text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Soạn Đề Thi Tự Động</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search-grounding')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'search-grounding'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[#161B22] text-gray-400 hover:text-gray-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google Search Grounding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('math-solver')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'math-solver'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-[#161B22] text-gray-400 hover:text-gray-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Giải Toán & Công Thức</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: CHATBOT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full space-y-4">
              {/* Grounding Toggle */}
              <div className="flex items-center justify-between bg-[#0A0E17] px-4 py-2.5 rounded-2xl border border-[#30363D] text-xs shrink-0">
                <div className="flex items-center gap-2 text-gray-300">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Google Search Grounding (Dữ liệu thời gian thực):</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                  className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                    useSearchGrounding
                      ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                      : 'bg-[#21262D] border border-[#30363D] text-gray-400'
                  }`}
                >
                  {useSearchGrounding ? '✓ Đang Bật' : '✕ Tắt'}
                </button>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 min-h-0">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-lg'
                          : 'bg-[#21262D] border border-[#30363D] text-gray-100 rounded-bl-none shadow-xl'
                      }`}
                    >
                      <MathRenderer text={msg.text} />

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/60 space-y-1">
                          <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Nguồn từ Google Search:
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.sources.map((s, sIdx) => (
                              <a
                                key={sIdx}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] bg-[#0A0E17] hover:bg-blue-950 px-2 py-1 rounded-lg border border-[#30363D] text-blue-300 flex items-center gap-1 transition"
                              >
                                <span>{s.title || s.url}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>AI đang phân tích và tìm kiếm dữ liệu...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#30363D] shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Hỏi AI về bài toán, công thức, cách giải hay tra cứu kiến thức..."
                  className="flex-1 bg-[#0A0E17] border-2 border-[#30363D] focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                />
                <button
                  type="button"
                  disabled={isChatLoading || !chatInput.trim()}
                  onClick={handleSendChat}
                  className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTION GENERATOR */}
          {activeTab === 'question-generator' && (
            <div className="space-y-5">
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Cấu Hình Soạn Đề Toán Bằng AI
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">Khối lớp:</label>
                    <select
                      value={genGrade}
                      onChange={(e) => setGenGrade(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#30363D] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="6">Toán Lớp 6</option>
                      <option value="7">Toán Lớp 7</option>
                      <option value="8">Toán Lớp 8</option>
                      <option value="9">Toán Lớp 9</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">Mức độ tư duy:</label>
                    <select
                      value={genDifficulty}
                      onChange={(e) => setGenDifficulty(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#30363D] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="Nhận biết">Nhận biết</option>
                      <option value="Thông hiểu">Thông hiểu</option>
                      <option value="Vận dụng">Vận dụng</option>
                      <option value="Vận dụng cao">Vận dụng cao</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">Số lượng câu:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="w-full bg-[#161B22] border border-[#30363D] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isGeneratingQuestions}
                      onClick={handleGenerateQuestions}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang Soạn...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Tạo Đề Thi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold">Chủ đề chi tiết:</label>
                  <input
                    type="text"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="Ví dụ: Định lý Thalès, Hình lăng trụ đứng, Căn thức bậc hai..."
                    className="w-full bg-[#161B22] border border-[#30363D] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Generated Questions List */}
              {generatedQuestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileQuestion className="w-4 h-4 text-purple-400" />
                      <span>Kết Quả: {generatedQuestions.length} câu hỏi được tạo</span>
                    </h4>
                    <button
                      type="button"
                      disabled={hasAddedToBank}
                      onClick={handleAddToBank}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        hasAddedToBank
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer'
                      }`}
                    >
                      {hasAddedToBank ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã Thêm Vào Ngân Hàng</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          <span>Nạp Vào Ngân Hàng Trò Chơi</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                          <span className="font-bold">CÂU {idx + 1}</span>
                          <span className="bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                            {(q as any).difficulty || 'Chuẩn'} • Đáp án: {q.correctAnswer}
                          </span>
                        </div>
                        <div className="text-base font-bold text-white leading-relaxed">
                          <MathRenderer text={q.content} />
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                                opt.key === q.correctAnswer
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-bold'
                                  : 'bg-[#161B22] border-[#30363D] text-gray-300'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-[#0A0E17] border border-[#30363D] font-mono font-black flex items-center justify-center text-xs">
                                {opt.key}
                              </span>
                              <span>
                                <MathRenderer text={opt.text} />
                              </span>
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <div className="bg-[#161B22] p-3 rounded-xl border border-[#30363D] text-xs text-gray-400 space-y-1">
                            <span className="font-bold text-amber-400 block">Lời giải chi tiết:</span>
                            <MathRenderer text={q.explanation} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEARCH GROUNDING */}
          {activeTab === 'search-grounding' && (
            <div className="space-y-4">
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Tra Cứu Kiến Thức Toán Học (Google Search Grounding)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                    placeholder="Nhập nội dung cần tra cứu (ví dụ: tiểu sử Py-ta-go, công thức Heron...)"
                    className="flex-1 bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isSearching}
                    onClick={handleSearchGrounding}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Tìm Kiếm</span>
                  </button>
                </div>
              </div>

              {searchResult && (
                <div className="bg-[#0A0E17] border border-[#30363D] rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Kết quả tra cứu chính thức:
                  </h4>
                  <div className="text-sm text-gray-200 leading-relaxed space-y-2">
                    <MathRenderer text={searchResult} />
                  </div>

                  {searchSources.length > 0 && (
                    <div className="pt-4 border-t border-[#30363D] space-y-2">
                      <span className="text-xs font-bold text-gray-400">Các nguồn tham khảo:</span>
                      <div className="flex flex-wrap gap-2">
                        {searchSources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-[#161B22] hover:bg-[#21262D] px-3 py-1.5 rounded-xl border border-[#30363D] text-blue-300 flex items-center gap-1.5 transition"
                          >
                            <span>{s.title}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MATH SOLVER */}
          {activeTab === 'math-solver' && (
            <div className="space-y-4">
              <div className="bg-[#0A0E17] border border-[#30363D] rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Hướng Dẫn Giải Toán & Công Thức Từng Bước
                </h3>
                <textarea
                  rows={3}
                  value={solverQuestion}
                  onChange={(e) => setSolverQuestion(e.target.value)}
                  placeholder="Dán đề bài hoặc biểu thức toán học tại đây..."
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-3.5 text-sm text-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isSolving}
                  onClick={handleSolveMath}
                  className="py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  <span>Giải Chi Tiết & Giải Thích Bản Chất</span>
                </button>
              </div>

              {solverExplanation && (
                <div className="bg-[#0A0E17] border border-[#30363D] rounded-3xl p-6 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Lời giải sư phạm chi tiết:
                  </h4>
                  <div className="text-sm text-gray-200 leading-relaxed">
                    <MathRenderer text={solverExplanation} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
