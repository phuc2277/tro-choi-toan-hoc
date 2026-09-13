import React, { useState, useEffect } from 'react';
import { ComicScene, CharacterProfile } from '../../types/comicLesson';
import {
  X,
  Film,
  Sparkles,
  BookOpen,
  Compass,
  CheckCircle2,
  Layers,
  MapPin,
} from 'lucide-react';

interface StoryboardSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: ComicScene | null; // null if adding new
  existingSceneCount: number;
  characters: CharacterProfile[];
  onSave: (scene: ComicScene) => void;
}

export const StoryboardSceneModal: React.FC<StoryboardSceneModalProps> = ({
  isOpen,
  onClose,
  scene,
  existingSceneCount,
  characters,
  onSave,
}) => {
  const isEditing = !!scene;

  const [sceneId, setSceneId] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [sceneType, setSceneType] = useState<ComicScene['sceneType']>('opening');
  const [educationalGoal, setEducationalGoal] = useState('');
  const [environmentName, setEnvironmentName] = useState('');
  const [knowledgeAppeared, setKnowledgeAppeared] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [estimatedDurationSec, setEstimatedDurationSec] = useState<number>(30);

  useEffect(() => {
    if (scene) {
      setSceneId(scene.sceneId);
      setSceneName(scene.sceneName);
      setSceneType(scene.sceneType);
      setEducationalGoal(scene.educationalGoal);
      setEnvironmentName(scene.environmentName);
      setKnowledgeAppeared(scene.knowledgeAppeared);
      setActionDescription(scene.actionDescription);
      setSelectedCharacters(scene.characters || []);
      setEstimatedDurationSec(scene.estimatedDurationSec || 30);
    } else {
      const nextNum = existingSceneCount + 1;
      const newId = `SC${nextNum < 10 ? `0${nextNum}` : nextNum}`;
      setSceneId(newId);
      setSceneName(`Cảnh ${nextNum}: Hoạt động khám phá`);
      setSceneType('discovery');
      setEducationalGoal('Học sinh hình thành năng lực quan sát và phân tích dữ liệu thực tế.');
      setEnvironmentName('Sân trường THCS');
      setKnowledgeAppeared('Định lý Thales và tỉ lệ thức trong thực tiễn');
      setActionDescription('Các bạn học sinh cùng nhau triển khai phương án đo bóng.');
      setSelectedCharacters(characters.slice(0, 3).map((c) => c.id));
      setEstimatedDurationSec(35);
    }
  }, [scene, existingSceneCount, characters]);

  if (!isOpen) return null;

  const handleToggleChar = (charId: string) => {
    setSelectedCharacters((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const handleSave = () => {
    if (!sceneName.trim()) {
      alert('Vui lòng nhập tên cảnh.');
      return;
    }

    const sceneNum = scene ? scene.sceneNumber : existingSceneCount + 1;
    const finalSceneId = sceneId.trim() || `SC0${sceneNum}`;

    let finalFrames = scene?.frames || [];
    // If brand new scene without frames, generate the first default frame
    if (finalFrames.length === 0) {
      finalFrames = [
        {
          frameId: `${finalSceneId}-F01`,
          sceneId: finalSceneId,
          frameNumber: 1,
          title: `Khung 1 - ${sceneName}`,
          characterIds: selectedCharacters.length > 0 ? selectedCharacters : ['char-minh'],
          backgroundId: 'env-schoolyard',
          backgroundName: environmentName || 'Sân trường THCS',
          visualAction: actionDescription || 'Nhóm học sinh quan sát và thảo luận sôi nổi.',
          captionText: `Bắt đầu cảnh ${sceneNum}: ${sceneName}`,
          speechBubbles: [
            {
              id: `sb-${Date.now()}`,
              characterId: selectedCharacters[0] || 'char-minh',
              characterName: characters.find((c) => c.id === selectedCharacters[0])?.name || 'Minh',
              text: 'Chúng ta hãy cùng kiểm tra bước này nhé!',
              position: { x: 40, y: 20 },
              type: 'speech',
            },
          ],
          promptDetails: {
            character: 'Students in signature uniform',
            environment: environmentName || 'Sân trường',
            action: actionDescription || 'Observing and discussing',
            camera: 'Medium shot',
            composition: 'Balanced characters',
            lighting: 'Warm daylight',
            emotion: 'Curious',
            educationalObject: knowledgeAppeared,
            artStyle: '2D modern educational comic',
            consistencyInfo: 'Consistent characters',
            fullPrompt: `2D modern educational comic, students in ${environmentName}, ${actionDescription}.`,
            videoPrompt: 'Cinematic camera movement showing students in action.',
          },
          illustrationSceneType: 'schoolyard_tree',
          status: 'pending',
          audioTracks: {
            narrationText: actionDescription,
            dialogueLines: [],
            durationSec: 6,
          },
        },
      ];
    }

    const updatedScene: ComicScene = {
      sceneId: finalSceneId,
      sceneNumber: sceneNum,
      sceneType,
      sceneName: sceneName.trim(),
      educationalGoal: educationalGoal.trim(),
      environmentId: scene?.environmentId || 'env-schoolyard',
      environmentName: environmentName.trim() || 'Sân trường THCS',
      characters: selectedCharacters.length > 0 ? selectedCharacters : ['char-minh'],
      actionDescription: actionDescription.trim(),
      dialogue: scene?.dialogue || [],
      narration: scene?.narration || actionDescription.trim(),
      knowledgeAppeared: knowledgeAppeared.trim(),
      emotion: scene?.emotion || 'Hào hứng, tập trung',
      props: scene?.props || ['Thước cuộn', 'Cọc tiêu'],
      visualDescription: scene?.visualDescription || actionDescription.trim(),
      videoMotion: scene?.videoMotion || 'Camera di chuyển mượt mà',
      estimatedDurationSec: estimatedDurationSec || 30,
      frames: finalFrames,
    };

    onSave(updatedScene);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {sceneId}
                </span>
                <span className="text-xs text-slate-400 font-medium">Phân Đoạn Sư Phạm</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {isEditing ? 'Chỉnh Sửa Thông Tin Cảnh (Scene)' : 'Thêm Cảnh Mới Vào Kịch Bản'}
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

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Mã Cảnh (Scene ID)
              </label>
              <input
                type="text"
                value={sceneId}
                onChange={(e) => setSceneId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                placeholder="VD: SC01"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tên Cảnh (Tiêu đề sư phạm) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                placeholder="VD: Khởi động - Nhận nhiệm vụ đo chiều cao"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Loại Cảnh (Theo tiến trình 8 bước sư phạm)
              </label>
              <select
                value={sceneType}
                onChange={(e) => setSceneType(e.target.value as ComicScene['sceneType'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="opening">1. Mở đầu / Bối cảnh xuất phát</option>
                <option value="problem">2. Tình huống vấn đề / Thách thức</option>
                <option value="questioning">3. Đặt câu hỏi / Suy nghĩ băn khoăn</option>
                <option value="hypothesis">4. Đề xuất giả thuyết / Thử nghiệm</option>
                <option value="discovery">5. Khám phá quy luật / Tia sáng tri thức</option>
                <option value="application">6. Vận dụng / Giải quyết vấn đề</option>
                <option value="result">7. Kết quả / Niềm vui thành công</option>
                <option value="summary">8. Tổng kết bài học & Mở rộng</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Bối Cảnh / Không Gian (Environment)
              </label>
              <input
                type="text"
                value={environmentName}
                onChange={(e) => setEnvironmentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                placeholder="VD: Sân trường THCS, Lớp học, Phòng STEM..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Mục Tiêu Sư Phạm Của Cảnh (Pedagogical Goal)
            </label>
            <textarea
              rows={2}
              value={educationalGoal}
              onChange={(e) => setEducationalGoal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:border-amber-500 focus:outline-none"
              placeholder="VD: Giúp học sinh nhận diện sự xuất hiện của bóng mặt trời và sự tỉ lệ tương ứng..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Kiến Thức Cốt Lõi Xuất Hiện (Knowledge Highlight)
            </label>
            <input
              type="text"
              value={knowledgeAppeared}
              onChange={(e) => setKnowledgeAppeared(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-semibold focus:border-amber-500 focus:outline-none"
              placeholder="VD: Đoạn thẳng tỉ lệ; Định lý Thales trong tam giác"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Mô Tả Tổng Quan Hành Động Của Cảnh
            </label>
            <textarea
              rows={2}
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:border-amber-500 focus:outline-none"
              placeholder="Tóm tắt những diễn biến chính của cảnh này..."
            />
          </div>

          {/* Characters selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Nhân Vật Tham Gia Cảnh
            </label>
            <div className="flex flex-wrap gap-2">
              {characters.map((char) => {
                const isSelected = selectedCharacters.includes(char.id);
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleToggleChar(char.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: char.signatureColor || '#f59e0b' }}
                    />
                    <span>{char.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-xs shadow-lg shadow-amber-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditing ? 'Lưu Thông Tin Cảnh' : 'Thêm Cảnh Mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
