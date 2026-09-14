import React, { useState, useEffect } from 'react';
import { CharacterProfile, LessonKnowledgeProfile, StoryKernel } from '../../types/comicLesson';
import { DEFAULT_CHARACTERS } from '../../data/defaultComicLessons';
import { loadCloudCharacterBank, saveCharactersToCloudBank } from './comicCloudStore';
import {
  Users,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Palette,
  MessageCircle,
  Eye,
  Library,
  Save,
  RefreshCw,
  X,
  Cloud,
} from 'lucide-react';

interface Step3CharacterLibraryProps {
  characters: CharacterProfile[];
  onUpdateCharacters: (characters: CharacterProfile[]) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  knowledgeProfile?: LessonKnowledgeProfile;
  storyKernel?: StoryKernel;
  teacherUid?: string; // nếu có: Kho Nhân Vật Chung dùng Firestore (đồng bộ đám mây) thay vì chỉ localStorage
}

// Kho nhân vật dùng chung khi CHƯA đăng nhập — lưu cục bộ trình duyệt (không đồng bộ đa thiết bị)
const CHARACTER_BANK_KEY = 'comic_character_bank_v1';

const loadLocalCharacterBank = (): CharacterProfile[] => {
  try {
    const raw = localStorage.getItem(CHARACTER_BANK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToLocalCharacterBank = (chars: CharacterProfile[]) => {
  try {
    const existing = loadLocalCharacterBank();
    const merged = [...existing];
    chars.forEach((c) => {
      const idx = merged.findIndex((m) => m.id === c.id);
      if (idx >= 0) merged[idx] = c;
      else merged.push(c);
    });
    localStorage.setItem(CHARACTER_BANK_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return loadLocalCharacterBank();
  }
};

export const Step3CharacterLibrary: React.FC<Step3CharacterLibraryProps> = ({
  characters,
  onUpdateCharacters,
  onNextStep,
  onPrevStep,
  knowledgeProfile,
  storyKernel,
  teacherUid,
}) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    characters[0]?.id || 'char-minh'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankChars, setBankChars] = useState<CharacterProfile[]>(() => (teacherUid ? [] : loadLocalCharacterBank()));
  const [bankSavedMsg, setBankSavedMsg] = useState<string | null>(null);

  // Khi có teacherUid (đã đăng nhập), nạp kho nhân vật từ Firestore thay vì localStorage
  useEffect(() => {
    if (!teacherUid) return;
    loadCloudCharacterBank(teacherUid)
      .then(setBankChars)
      .catch(() => {
        // im lặng — kho trống nếu lỗi mạng, không chặn màn hình
      });
  }, [teacherUid]);

  const refreshBank = async () => {
    if (teacherUid) {
      try {
        setBankChars(await loadCloudCharacterBank(teacherUid));
      } catch {
        // giữ nguyên danh sách cũ nếu lỗi
      }
    } else {
      setBankChars(loadLocalCharacterBank());
    }
  };

  const persistToBank = async (chars: CharacterProfile[]) => {
    if (teacherUid) {
      await saveCharactersToCloudBank(teacherUid, chars);
      await refreshBank();
    } else {
      setBankChars(saveToLocalCharacterBank(chars));
    }
  };

  const selectedChar =
    characters.find((c) => c.id === selectedCharacterId) || characters[0];

  const handleUpdateCurrentChar = (partial: Partial<CharacterProfile>) => {
    onUpdateCharacters(
      characters.map((c) => (c.id === selectedCharacterId ? { ...c, ...partial } : c))
    );
  };

  const handleLoadGroupPreset = (presetName: string) => {
    if (presetName === 'lop8a') {
      onUpdateCharacters(DEFAULT_CHARACTERS.slice(0, 4));
    } else if (presetName === 'stem-explorers') {
      onUpdateCharacters([
        DEFAULT_CHARACTERS[0], // Minh
        DEFAULT_CHARACTERS[1], // Lan
        DEFAULT_CHARACTERS[4], // Mai
        DEFAULT_CHARACTERS[3], // Thầy Bình
      ]);
    }
  };

  const handleAddNewCharacter = () => {
    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: 'Nhân Vật Mới',
      age: 14,
      grade: 'Lớp 8',
      role: 'student',
      personality: 'Hăng hái, đam mê khám phá khoa học',
      appearance: 'Tóc ngắn năng động, phong thái vui tươi',
      outfit: 'Áo phông tím nhạt (#8B5CF6), quần jean xám',
      signatureColor: '#8B5CF6',
      speechStyle: 'Tự tin, hòa đồng, mạch lạc',
      educationalRole: 'Đưa ra góc nhìn sáng tạo mới trong bài học',
      gender: 'female',
    };
    onUpdateCharacters([...characters, newChar]);
    setSelectedCharacterId(newChar.id);
  };

  const handleDeleteCharacter = (charId: string) => {
    if (characters.length <= 2) {
      alert('Truyện tranh cần tối thiểu 2 nhân vật để tạo tương tác đối thoại.');
      return;
    }
    const filtered = characters.filter((c) => c.id !== charId);
    onUpdateCharacters(filtered);
    if (selectedCharacterId === charId) {
      setSelectedCharacterId(filtered[0]?.id);
    }
  };

  // AI Suggest a full cast of characters tailored to the current lesson + story kernel
  const handleAiSuggestCharacters = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/comic/generate-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeProfile,
          storyKernel,
          characterCount: 4,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.characters) && data.characters.length > 0) {
        onUpdateCharacters(data.characters);
        setSelectedCharacterId(data.characters[0].id);
      } else {
        setGenError(data.error || 'AI không thể gợi ý nhân vật lúc này. Vui lòng thử lại.');
      }
    } catch {
      setGenError('Lỗi kết nối tới máy chủ AI. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save current cast into the shared reusable character bank (persists across lessons)
  const handleSaveToBank = async () => {
    try {
      await persistToBank(characters);
      setBankSavedMsg(`Đã lưu ${characters.length} nhân vật vào Kho Chung${teacherUid ? ' (đám mây)' : ''}.`);
    } catch {
      setBankSavedMsg('Lỗi lưu vào Kho Chung. Vui lòng thử lại.');
    }
    setTimeout(() => setBankSavedMsg(null), 2500);
  };

  // Pull one character from the shared bank into the current project
  const handleAddFromBank = (char: CharacterProfile) => {
    if (characters.some((c) => c.id === char.id)) return;
    onUpdateCharacters([...characters, char]);
    setSelectedCharacterId(char.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-xs uppercase tracking-wider border border-blue-400/40">
              BƯỚC 3 — KHO NHÂN VẬT (CHARACTER LIBRARY)
            </span>
            <span className="text-xs text-slate-400 font-medium">Đảm Bảo Tính Nhất Quán 100%</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Xây Dựng Profile & Màu Sắc Nhận Diện Nhân Vật
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Mỗi nhân vật được gán cố định ngoại hình, trang phục, màu sắc nhận diện và vai trò giáo dục. Toàn bộ kịch bản và tranh vẽ về sau <strong>bắt buộc phải tuân thủ nghiêm ngặt Profile này</strong> để không bị biến đổi nhân vật.
          </p>
        </div>

        {/* Preset Group Buttons + AI + Bank */}
        <div className="flex flex-col gap-2 shrink-0 items-end">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chọn Nhóm Nhân Vật Sẵn Có:
          </span>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => handleLoadGroupPreset('lop8a')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400 text-blue-200 transition-all cursor-pointer"
            >
              👥 Nhóm Lớp 8A (Minh, Lan, Nam, Thầy Bình)
            </button>
            <button
              onClick={() => handleLoadGroupPreset('stem-explorers')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400 text-emerald-200 transition-all cursor-pointer"
            >
              🌿 CLB Khoa Học (Minh, Lan, Mai, Thầy Bình)
            </button>
            <button
              onClick={handleAiSuggestCharacters}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400 text-purple-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'AI Đang Thiết Kế...' : 'AI Gợi Ý Bộ Nhân Vật'}
            </button>
            <button
              onClick={() => {
                refreshBank();
                setIsBankOpen((v) => !v);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Library className="w-3.5 h-3.5" /> Kho Nhân Vật Chung
            </button>
          </div>
          {genError && (
            <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1 max-w-xs text-right">
              {genError}
            </p>
          )}
        </div>
      </div>

      {/* Shared Character Bank Panel — reuse characters across multiple lessons */}
      {isBankOpen && (
        <div className="eduverse-glass p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Library className="w-3.5 h-3.5 text-cyan-400" /> Kho Nhân Vật Dùng Chung ({bankChars.length})
              {teacherUid ? (
                <span className="normal-case font-medium text-emerald-400 flex items-center gap-1 text-[10px]">
                  <Cloud className="w-3 h-3" /> đồng bộ đám mây
                </span>
              ) : (
                <span className="normal-case font-medium text-amber-400 text-[10px]">
                  (chỉ trên máy này — đăng nhập để đồng bộ)
                </span>
              )}
            </h4>
            <button onClick={() => setIsBankOpen(false)} className="text-slate-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          {bankChars.length === 0 ? (
            <p className="text-xs text-slate-500">
              Kho chung đang trống. Bấm "Lưu Vào Kho Chung" ở nhân vật bên dưới để dùng lại nhân vật này cho các bài học khác.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bankChars.map((c) => {
                const alreadyIn = characters.some((ch) => ch.id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleAddFromBank(c)}
                    disabled={alreadyIn}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      alreadyIn
                        ? 'border-slate-800 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.signatureColor }} />
                    {c.name} {alreadyIn ? '(đã có)' : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Roster list, Right Detailed Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Character Cards List */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Danh Sách Nhân Vật ({characters.length})
            </span>
            <button
              onClick={handleAddNewCharacter}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-bold flex items-center gap-1 border border-blue-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Nhân Vật
            </button>
          </div>

          <div className="space-y-2.5">
            {characters.map((char) => {
              const isSelected = char.id === selectedCharacterId;
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacterId(char.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md"
                      style={{ backgroundColor: char.signatureColor }}
                    >
                      {char.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{char.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                          {char.role === 'teacher' ? 'Giáo viên' : char.grade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {char.educationalRole}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: char.signatureColor }}
                      title="Màu nhận diện"
                    />
                    {characters.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCharacter(char.id);
                        }}
                        className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Xóa nhân vật"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Consistency Guarantee Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-black uppercase text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Cam Kết Tính Nhất Quán:
            </div>
            <p className="text-[11px] text-emerald-300/90 leading-relaxed">
              Các chi tiết như áo phông xanh của Minh, áo len vàng và kính cận của Lan, nụ cười vui tính của Nam được giữ nguyên 100% qua tất cả 8 cảnh truyện.
            </p>
          </div>
        </div>

        {/* Right Column: Active Character Detail Editor */}
        {selectedChar && (
          <div className="lg:col-span-2 eduverse-glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg"
                  style={{ backgroundColor: selectedChar.signatureColor }}
                >
                  {selectedChar.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Hồ Sơ Nhân Vật: {selectedChar.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    ID: <code className="text-cyan-400">{selectedChar.id}</code>
                  </span>
                </div>
              </div>

              {/* Color Picker + Save to Bank */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <button
                    onClick={async () => {
                      try {
                        await persistToBank([selectedChar]);
                        setBankSavedMsg(`Đã lưu "${selectedChar.name}" vào Kho Chung${teacherUid ? ' (đám mây)' : ''}.`);
                      } catch {
                        setBankSavedMsg('Lỗi lưu vào Kho Chung. Vui lòng thử lại.');
                      }
                      setTimeout(() => setBankSavedMsg(null), 2500);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600/30 border border-slate-700 hover:border-cyan-400 text-[11px] font-bold text-slate-300 hover:text-cyan-200 transition-all flex items-center gap-1 cursor-pointer"
                    title="Lưu nhân vật này để dùng lại ở các bài học khác"
                  >
                    <Save className="w-3 h-3" /> Lưu Vào Kho Chung
                  </button>
                  {bankSavedMsg && <span className="text-[10px] text-emerald-400">{bankSavedMsg}</span>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block text-center mb-0.5">Màu</label>
                  <input
                    type="color"
                    value={selectedChar.signatureColor}
                    onChange={(e) => handleUpdateCurrentChar({ signatureColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tên Nhân Vật
                </label>
                <input
                  type="text"
                  value={selectedChar.name}
                  onChange={(e) => handleUpdateCurrentChar({ name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tuổi / Khối Lớp
                </label>
                <input
                  type="text"
                  value={selectedChar.grade}
                  onChange={(e) => handleUpdateCurrentChar({ grade: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Vai Trò Trong Truyện
                </label>
                <select
                  value={selectedChar.role}
                  onChange={(e) => handleUpdateCurrentChar({ role: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên / Thầy cô</option>
                  <option value="guide">Người hướng dẫn</option>
                  <option value="supporting">Nhân vật phụ</option>
                </select>
              </div>
            </div>

            {/* Educational Role */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Vai Trò Giáo Dục (Sư Phạm):
              </label>
              <input
                type="text"
                value={selectedChar.educationalRole}
                onChange={(e) => handleUpdateCurrentChar({ educationalRole: e.target.value })}
                placeholder="VD: Người khởi xướng câu hỏi, đưa ra giả thuyết sai để nhóm sửa..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Personality & Speech Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tính Cách
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.personality}
                  onChange={(e) => handleUpdateCurrentChar({ personality: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-cyan-400" /> Cách Nói & Khẩu Khí
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.speechStyle}
                  onChange={(e) => handleUpdateCurrentChar({ speechStyle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Appearance & Outfit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Ngoại Hình (Khuôn mặt, Tóc, Dáng người)
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.appearance}
                  onChange={(e) => handleUpdateCurrentChar({ appearance: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Trang Phục Nhất Quán (Outfit)
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.outfit}
                  onChange={(e) => handleUpdateCurrentChar({ outfit: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          ← Quay Lại Bước 2
        </button>

        <button
          onClick={onNextStep}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-blue-900/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Tiếp Tục Bước 4: Viết Kịch Bản 8 Cảnh</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};