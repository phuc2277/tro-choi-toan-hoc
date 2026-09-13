import React, { useState, useEffect } from 'react';
import { ComicScene, ComicFrame, CharacterProfile, SpeechBubble } from '../../types/comicLesson';
import { KatexRenderer } from '../common/KatexRenderer';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Camera,
  Layers,
  BookOpen,
  User,
  Palette,
} from 'lucide-react';

interface StoryboardFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: ComicScene;
  frame: ComicFrame | null; // null if adding new
  characters: CharacterProfile[];
  onSave: (sceneId: string, frame: ComicFrame) => void;
}

export const StoryboardFrameModal: React.FC<StoryboardFrameModalProps> = ({
  isOpen,
  onClose,
  scene,
  frame,
  characters,
  onSave,
}) => {
  const isEditing = !!frame;

  // Form State
  const [frameId, setFrameId] = useState('');
  const [title, setTitle] = useState('');
  const [visualAction, setVisualAction] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [latexFormula, setLatexFormula] = useState('');
  const [formulaLabel, setFormulaLabel] = useState('');
  const [illustrationType, setIllustrationType] = useState<ComicFrame['illustrationSceneType']>('schoolyard_tree');
  const [cameraAngle, setCameraAngle] = useState('Medium shot');
  const [lightingEmotion, setLightingEmotion] = useState('Warm daylight, curious expression');
  const [status, setStatus] = useState<ComicFrame['status']>('pending');
  const [activeTab, setActiveTab] = useState<'content' | 'dialogue' | 'pedagogy' | 'art'>('content');

  useEffect(() => {
    if (frame) {
      setFrameId(frame.frameId);
      setTitle(frame.title || `Khung ${frame.frameNumber}`);
      setVisualAction(frame.visualAction || '');
      setCaptionText(frame.captionText || '');
      setCharacterIds(frame.characterIds || []);
      setSpeechBubbles(frame.speechBubbles ? JSON.parse(JSON.stringify(frame.speechBubbles)) : []);
      setLatexFormula(frame.mathFormulaLayer?.latex || '');
      setFormulaLabel(frame.mathFormulaLayer?.label || '');
      setIllustrationType(frame.illustrationSceneType || 'schoolyard_tree');
      setCameraAngle(frame.promptDetails?.camera || 'Medium shot');
      setLightingEmotion(
        `${frame.promptDetails?.lighting || 'Warm daylight'}, ${frame.promptDetails?.emotion || 'Curious'}`
      );
      setStatus(frame.status || 'pending');
    } else {
      // Adding new frame
      const nextNum = scene.frames.length + 1;
      const newId = `${scene.sceneId}-F${nextNum < 10 ? `0${nextNum}` : nextNum}`;
      setFrameId(newId);
      setTitle(`Khung ${nextNum} - ${scene.sceneName}`);
      setVisualAction('');
      setCaptionText('');
      setCharacterIds(scene.characters.length > 0 ? [scene.characters[0]] : ['char-minh']);
      setSpeechBubbles([
        {
          id: `sb-${Date.now()}`,
          characterId: scene.characters[0] || 'char-minh',
          characterName: characters.find((c) => c.id === (scene.characters[0] || 'char-minh'))?.name || 'Học sinh',
          text: 'Các bạn hãy quan sát kĩ chi tiết này nhé!',
          position: { x: 50, y: 20 },
          type: 'speech',
        },
      ]);
      setLatexFormula('');
      setFormulaLabel('');
      setIllustrationType('schoolyard_measure');
      setCameraAngle('Medium shot');
      setLightingEmotion('Warm daylight, curious');
      setStatus('pending');
    }
  }, [frame, scene, characters]);

  if (!isOpen) return null;

  // Toggle character selection
  const handleToggleChar = (charId: string) => {
    setCharacterIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  // Add Speech Bubble
  const handleAddSpeechBubble = () => {
    const defaultCharId = characterIds[0] || characters[0]?.id || 'char-minh';
    const charName = characters.find((c) => c.id === defaultCharId)?.name || 'Nhân vật';
    const newBubble: SpeechBubble = {
      id: `sb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      characterId: defaultCharId,
      characterName: charName,
      text: '',
      position: { x: 30 + Math.floor(Math.random() * 40), y: 20 + Math.floor(Math.random() * 20) },
      type: 'speech',
    };
    setSpeechBubbles((prev) => [...prev, newBubble]);
  };

  // Update Speech Bubble
  const handleUpdateSpeechBubble = (id: string, field: keyof SpeechBubble, value: any) => {
    setSpeechBubbles((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (field === 'characterId') {
          const charName = characters.find((c) => c.id === value)?.name || value;
          return { ...b, characterId: value, characterName: charName };
        }
        return { ...b, [field]: value };
      })
    );
  };

  // Delete Speech Bubble
  const handleDeleteSpeechBubble = (id: string) => {
    setSpeechBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  // Save Frame
  const handleSave = () => {
    if (!visualAction.trim()) {
      alert('Vui lòng nhập mô tả hành động thị giác cho khung hình.');
      return;
    }

    const frameNumber = frame ? frame.frameNumber : scene.frames.length + 1;

    const updatedFrame: ComicFrame = {
      frameId: frameId.trim() || `${scene.sceneId}-F0${frameNumber}`,
      sceneId: scene.sceneId,
      frameNumber,
      title: title.trim() || `Khung ${frameNumber}`,
      characterIds: characterIds.length > 0 ? characterIds : ['char-minh'],
      backgroundId: scene.environmentId,
      backgroundName: scene.environmentName,
      visualAction: visualAction.trim(),
      captionText: captionText.trim(),
      speechBubbles: speechBubbles.filter((sb) => sb.text.trim().length > 0),
      mathFormulaLayer: latexFormula.trim()
        ? {
            latex: latexFormula.trim(),
            label: formulaLabel.trim() || undefined,
            position: { x: 50, y: 50 },
          }
        : undefined,
      promptDetails: {
        character: characterIds
          .map((id) => characters.find((c) => c.id === id)?.name || id)
          .join(', '),
        environment: scene.environmentName,
        action: visualAction,
        camera: cameraAngle,
        composition: 'Balanced 2D comic layout',
        lighting: lightingEmotion,
        emotion: lightingEmotion,
        educationalObject: scene.knowledgeAppeared || 'Toán học & Khoa học',
        artStyle: '2D modern educational comic',
        consistencyInfo: 'Preserve signature clothing and hair',
        fullPrompt: `2D educational comic illustration: ${visualAction} in ${scene.environmentName}, ${cameraAngle}, ${lightingEmotion}.`,
        videoPrompt: `Smooth 2D cinematic push in on characters, ${visualAction}.`,
      },
      illustrationSceneType: illustrationType,
      status,
      audioTracks: frame?.audioTracks || {
        narrationText: captionText || visualAction,
        dialogueLines: speechBubbles.map((sb) => ({
          characterId: sb.characterId,
          text: sb.text,
          durationSec: Math.max(2, Math.round(sb.text.length / 15)),
        })),
        durationSec: 6,
      },
    };

    onSave(scene.sceneId, updatedFrame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {frameId}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {scene.sceneId}: {scene.sceneName}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {isEditing ? 'Chỉnh Sửa Khung Hình Storyboard' : 'Thêm Mới Khung Hình Storyboard'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          {[
            { id: 'content', label: '1. Nội Dung & Hành Động', icon: BookOpen },
            { id: 'dialogue', label: '2. Lời Thoại & Nhân Vật', icon: MessageSquare },
            { id: 'pedagogy', label: '3. Công Thức & Kiến Thức', icon: Sparkles },
            { id: 'art', label: '4. Bối Cảnh & Đạo Diễn', icon: Camera },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* TAB 1: Content & Visual Action */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Mã Khung Hình (Frame ID)
                  </label>
                  <input
                    type="text"
                    value={frameId}
                    onChange={(e) => setFrameId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="VD: SC01-F02"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Tiêu Đề Khung Hình
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="VD: Khung 2 - Thảo luận phương án"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mô Tả Hành Động Thị Giác (Visual Action) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={visualAction}
                  onChange={(e) => setVisualAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:border-cyan-500 focus:outline-none"
                  placeholder="Mô tả cụ thể nhân vật đang làm gì, tương tác với vật thể gì, biểu cảm thế nào..."
                />
                <span className="text-[11px] text-slate-400">
                  Phần này hướng dẫn trực quan cho AI vẽ tranh và tạo hoạt họa video ở các bước tiếp theo.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Lời Dẫn Truyện (Caption / Narration Box)
                </label>
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 focus:border-cyan-500 focus:outline-none"
                  placeholder="VD: Sân trường rực rỡ ánh ban mai, nhiệm vụ mới bắt đầu..."
                />
              </div>

              {/* Status Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Trạng Thái Phê Duyệt Của Giáo Viên
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('approved')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                      status === 'approved'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã Duyệt (Approved)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                      status === 'pending'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Chờ Duyệt (Pending)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('regenerate')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                      status === 'regenerate'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-md shadow-rose-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Yêu Cầu Làm Lại</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dialogue & Characters */}
          {activeTab === 'dialogue' && (
            <div className="space-y-5">
              {/* Character selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Nhân Vật Xuất Hiện Trong Khung Hình
                </label>
                <div className="flex flex-wrap gap-2">
                  {characters.map((char) => {
                    const isSelected = characterIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => handleToggleChar(char.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-sm'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: char.signatureColor || '#0284c7' }}
                        />
                        <span>{char.name}</span>
                        <span className="text-[10px] text-slate-400">({char.role})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speech Bubbles List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Bong Bóng Lời Thoại (Speech Bubbles) ({speechBubbles.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Thêm lời nói hoặc dòng suy nghĩ của các nhân vật trong khung hình này.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSpeechBubble}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Thoại</span>
                  </button>
                </div>

                {speechBubbles.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                    Khung hình này chưa có lời thoại nào. Nhấn "+ Thêm Thoại" để tạo hội thoại sinh động.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {speechBubbles.map((bubble, idx) => (
                      <div
                        key={bubble.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-5">
                              #{idx + 1}
                            </span>
                            {/* Speaker select */}
                            <select
                              value={bubble.characterId}
                              onChange={(e) =>
                                handleUpdateSpeechBubble(bubble.id, 'characterId', e.target.value)
                              }
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none"
                            >
                              {characters.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>

                            {/* Bubble type */}
                            <select
                              value={bubble.type}
                              onChange={(e) =>
                                handleUpdateSpeechBubble(bubble.id, 'type', e.target.value)
                              }
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                            >
                              <option value="speech">Nói bình thường</option>
                              <option value="thought">Suy nghĩ (Bong bóng mây)</option>
                              <option value="shout">Hét lên / Bất ngờ</option>
                              <option value="whisper">Thì thầm</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSpeechBubble(bubble.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                            title="Xóa thoại"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={bubble.text}
                          onChange={(e) =>
                            handleUpdateSpeechBubble(bubble.id, 'text', e.target.value)
                          }
                          placeholder="Nhập nội dung lời thoại..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Pedagogy & Formula Layer */}
          {activeTab === 'pedagogy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Kiến Thức Cốt Lõi Của Cảnh: {scene.knowledgeAppeared}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Mục tiêu sư phạm: {scene.educationalGoal}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Công Thức Toán Học / Khoa Học (Mã LaTeX hiển thị trên tranh)
                </label>
                <input
                  type="text"
                  value={latexFormula}
                  onChange={(e) => setLatexFormula(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                  placeholder="VD: \frac{A'B'}{AB} = \frac{A'C'}{AC} hoặc h = h_{cọc} \times \frac{L_{bóng cây}}{L_{bóng cọc}}"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Ghi Chú Công Thức (Label)
                </label>
                <input
                  type="text"
                  value={formulaLabel}
                  onChange={(e) => setFormulaLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="VD: Định lý Thales trong tam giác"
                />
              </div>

              {latexFormula.trim() && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-cyan-400 block">
                    Xem Trước Hiển Thị KaTeX Trực Quan:
                  </span>
                  <div className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-center overflow-x-auto text-amber-300 font-bold">
                    <KatexRenderer math={latexFormula} block />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Art & Direction */}
          {activeTab === 'art' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Góc Máy Quay (Camera Angle)
                  </label>
                  <select
                    value={cameraAngle}
                    onChange={(e) => setCameraAngle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Wide shot">Toàn cảnh (Wide Shot)</option>
                    <option value="Medium shot">Trung cảnh (Medium Shot)</option>
                    <option value="Close-up">Cận cảnh biểu cảm (Close-up)</option>
                    <option value="Low angle">Góc thấp hướng lên (Low Angle)</option>
                    <option value="High angle">Góc cao nhìn xuống (High Angle)</option>
                    <option value="Over the shoulder">Qua vai nhân vật (Over-the-shoulder)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kiểu Phối Cảnh Minh Họa
                  </label>
                  <select
                    value={illustrationType}
                    onChange={(e) =>
                      setIllustrationType(e.target.value as ComicFrame['illustrationSceneType'])
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="schoolyard_tree">Sân trường & Cây phượng vĩ</option>
                    <option value="schoolyard_measure">Sân trường & Thao tác đo đạc cọc</option>
                    <option value="classroom_board">Lớp học & Bảng đen bài giảng</option>
                    <option value="library_study">Thư viện & Sách tham khảo</option>
                    <option value="lab_discovery">Phòng thí nghiệm STEM</option>
                    <option value="greenhouse_plant">Vườn ươm sinh học</option>
                    <option value="nature_field">Không gian tự nhiên ngoại khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Ánh Sáng & Cảm Xúc (Lighting & Atmosphere)
                </label>
                <input
                  type="text"
                  value={lightingEmotion}
                  onChange={(e) => setLightingEmotion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  placeholder="VD: Nắng ban mai ấm áp, không khí tươi vui, hào hứng khám phá..."
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block">Địa Điểm Bối Cảnh Hiện Tại:</span>
                <p>
                  {scene.environmentName} (Mã: {scene.environmentId})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditing ? 'Lưu Thay Đổi Khung Hình' : 'Tạo Khung Hình Mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
