import React, { useState } from 'react';
import { ComicScene, ComicFrame, CharacterProfile } from '../../types/comicLesson';
import { StoryboardFrameModal } from './StoryboardFrameModal';
import { StoryboardSceneModal } from './StoryboardSceneModal';
import { VisualIllustrationRenderer } from './VisualIllustrationRenderer';
import { KatexRenderer } from '../common/KatexRenderer';
import {
  CheckSquare,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ChevronUp,
  ChevronDown,
  Film,
  Camera,
  Layers,
  Search,
  BookOpen,
  MessageSquare,
  Clock,
  Check,
} from 'lucide-react';

interface Step5StoryboardReviewProps {
  scenes: ComicScene[];
  characters: CharacterProfile[];
  onUpdateScenes: (scenes: ComicScene[]) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const Step5StoryboardReview: React.FC<Step5StoryboardReviewProps> = ({
  scenes,
  characters,
  onUpdateScenes,
  onNextStep,
  onPrevStep,
}) => {
  // View mode: 'grid' (visual cards) or 'table' (pedagogical checklist)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filtering & Search
  const [filterSceneId, setFilterSceneId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'regenerate'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collapsed scenes in grid view
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>({});

  // Modals state
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [targetSceneForFrame, setTargetSceneForFrame] = useState<ComicScene | null>(null);
  const [targetFrameForEdit, setTargetFrameForEdit] = useState<ComicFrame | null>(null);

  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [targetSceneForEdit, setTargetSceneForEdit] = useState<ComicScene | null>(null);

  // Stats calculation
  const allFrames: Array<{ scene: ComicScene; frame: ComicFrame }> = [];
  scenes.forEach((scene) => {
    scene.frames.forEach((frame) => {
      allFrames.push({ scene, frame });
    });
  });

  const totalFramesCount = allFrames.length;
  const approvedCount = allFrames.filter((r) => r.frame.status === 'approved').length;
  const pendingCount = allFrames.filter((r) => r.frame.status === 'pending').length;
  const regenerateCount = allFrames.filter((r) => r.frame.status === 'regenerate').length;
  const approvalPercent = totalFramesCount > 0 ? Math.round((approvedCount / totalFramesCount) * 100) : 0;

  const getCharacterName = (charId: string) => {
    return characters.find((c) => c.id === charId)?.name || charId;
  };

  // Toggle Collapse of a Scene
  const toggleSceneCollapse = (sceneId: string) => {
    setCollapsedScenes((prev) => ({ ...prev, [sceneId]: !prev[sceneId] }));
  };

  // --- SCENE OPERATIONS ---

  // Move Scene Up
  const handleMoveSceneUp = (index: number) => {
    if (index <= 0) return;
    const newScenes = [...scenes];
    const temp = newScenes[index - 1];
    newScenes[index - 1] = newScenes[index];
    newScenes[index] = temp;
    // re-index scene numbers
    newScenes.forEach((s, idx) => {
      s.sceneNumber = idx + 1;
    });
    onUpdateScenes(newScenes);
  };

  // Move Scene Down
  const handleMoveSceneDown = (index: number) => {
    if (index >= scenes.length - 1) return;
    const newScenes = [...scenes];
    const temp = newScenes[index + 1];
    newScenes[index + 1] = newScenes[index];
    newScenes[index] = temp;
    // re-index scene numbers
    newScenes.forEach((s, idx) => {
      s.sceneNumber = idx + 1;
    });
    onUpdateScenes(newScenes);
  };

  // Open Scene Modal to Add New
  const handleOpenAddScene = () => {
    setTargetSceneForEdit(null);
    setIsSceneModalOpen(true);
  };

  // Open Scene Modal to Edit
  const handleOpenEditScene = (scene: ComicScene) => {
    setTargetSceneForEdit(scene);
    setIsSceneModalOpen(true);
  };

  // Save Scene (New or Edit)
  const handleSaveScene = (savedScene: ComicScene) => {
    const exists = scenes.some((s) => s.sceneId === savedScene.sceneId);
    let updatedScenes: ComicScene[];
    if (exists) {
      updatedScenes = scenes.map((s) => (s.sceneId === savedScene.sceneId ? savedScene : s));
    } else {
      updatedScenes = [...scenes, savedScene];
    }
    // ensure sceneNumbers are 1-based
    updatedScenes.forEach((s, idx) => {
      s.sceneNumber = idx + 1;
    });
    onUpdateScenes(updatedScenes);
  };

  // Delete Scene
  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      alert('Kịch bản bài học cần có ít nhất một cảnh.');
      return;
    }
    if (window.confirm(`Thầy/cô có chắc muốn xóa Cảnh ${sceneId} cùng toàn bộ khung hình bên trong?`)) {
      const updated = scenes
        .filter((s) => s.sceneId !== sceneId)
        .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
      onUpdateScenes(updated);
    }
  };

  // Approve all frames in a specific scene
  const handleApproveSceneFrames = (sceneId: string) => {
    const updated = scenes.map((s) => {
      if (s.sceneId !== sceneId) return s;
      return {
        ...s,
        frames: s.frames.map((f) => ({ ...f, status: 'approved' as const })),
      };
    });
    onUpdateScenes(updated);
  };

  // --- FRAME OPERATIONS ---

  // Open Frame Modal to Add
  const handleOpenAddFrame = (scene: ComicScene) => {
    setTargetSceneForFrame(scene);
    setTargetFrameForEdit(null);
    setIsFrameModalOpen(true);
  };

  // Open Frame Modal to Edit
  const handleOpenEditFrame = (scene: ComicScene, frame: ComicFrame) => {
    setTargetSceneForFrame(scene);
    setTargetFrameForEdit(frame);
    setIsFrameModalOpen(true);
  };

  // Save Frame (New or Edit)
  const handleSaveFrame = (sceneId: string, savedFrame: ComicFrame) => {
    const updated = scenes.map((s) => {
      if (s.sceneId !== sceneId) return s;
      const frameExists = s.frames.some((f) => f.frameId === savedFrame.frameId);
      let updatedFrames: ComicFrame[];
      if (frameExists) {
        updatedFrames = s.frames.map((f) => (f.frameId === savedFrame.frameId ? savedFrame : f));
      } else {
        updatedFrames = [...s.frames, savedFrame];
      }
      // Re-number frames
      updatedFrames.forEach((f, idx) => {
        f.frameNumber = idx + 1;
      });
      return { ...s, frames: updatedFrames };
    });
    onUpdateScenes(updated);
  };

  // Delete Frame
  const handleDeleteFrame = (sceneId: string, frameId: string) => {
    const targetScene = scenes.find((s) => s.sceneId === sceneId);
    if (!targetScene) return;

    if (targetScene.frames.length <= 1) {
      alert('Mỗi cảnh cần có ít nhất 1 khung hình. Nếu muốn xóa cảnh này, vui lòng xóa cả Cảnh.');
      return;
    }

    if (window.confirm(`Thầy/cô có chắc muốn xóa khung hình ${frameId}?`)) {
      const updated = scenes.map((s) => {
        if (s.sceneId !== sceneId) return s;
        const newFrames = s.frames
          .filter((f) => f.frameId !== frameId)
          .map((f, idx) => ({ ...f, frameNumber: idx + 1 }));
        return { ...s, frames: newFrames };
      });
      onUpdateScenes(updated);
    }
  };

  // Move Frame Up within its Scene
  const handleMoveFrameUp = (sceneId: string, frameIndex: number) => {
    if (frameIndex <= 0) return;
    const updated = scenes.map((s) => {
      if (s.sceneId !== sceneId) return s;
      const newFrames = [...s.frames];
      const temp = newFrames[frameIndex - 1];
      newFrames[frameIndex - 1] = newFrames[frameIndex];
      newFrames[frameIndex] = temp;
      newFrames.forEach((f, idx) => {
        f.frameNumber = idx + 1;
      });
      return { ...s, frames: newFrames };
    });
    onUpdateScenes(updated);
  };

  // Move Frame Down within its Scene
  const handleMoveFrameDown = (sceneId: string, frameIndex: number) => {
    const targetScene = scenes.find((s) => s.sceneId === sceneId);
    if (!targetScene || frameIndex >= targetScene.frames.length - 1) return;
    const updated = scenes.map((s) => {
      if (s.sceneId !== sceneId) return s;
      const newFrames = [...s.frames];
      const temp = newFrames[frameIndex + 1];
      newFrames[frameIndex + 1] = newFrames[frameIndex];
      newFrames[frameIndex] = temp;
      newFrames.forEach((f, idx) => {
        f.frameNumber = idx + 1;
      });
      return { ...s, frames: newFrames };
    });
    onUpdateScenes(updated);
  };

  // Change Frame Approval Status
  const handleSetFrameStatus = (
    sceneId: string,
    frameId: string,
    newStatus: 'approved' | 'rejected' | 'pending' | 'regenerate'
  ) => {
    const updated = scenes.map((s) => {
      if (s.sceneId !== sceneId) return s;
      return {
        ...s,
        frames: s.frames.map((f) => (f.frameId === frameId ? { ...f, status: newStatus } : f)),
      };
    });
    onUpdateScenes(updated);
  };

  // Bulk Approve All Frames
  const handleApproveAll = () => {
    const updated = scenes.map((s) => ({
      ...s,
      frames: s.frames.map((f) => ({ ...f, status: 'approved' as const })),
    }));
    onUpdateScenes(updated);
  };

  // Filtered lists for Table and Grid view
  const matchesSearch = (frame: ComicFrame, scene: ComicScene) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchText = (
      frame.visualAction +
      ' ' +
      frame.title +
      ' ' +
      scene.sceneName +
      ' ' +
      scene.knowledgeAppeared +
      ' ' +
      frame.speechBubbles.map((sb) => sb.text).join(' ') +
      ' ' +
      (frame.mathFormulaLayer?.latex || '')
    ).toLowerCase();
    return matchText.includes(q);
  };

  const filteredScenes = scenes
    .filter((s) => filterSceneId === 'all' || s.sceneId === filterSceneId)
    .map((s) => {
      const frames = s.frames.filter((f) => {
        const statusMatch = filterStatus === 'all' || f.status === filterStatus;
        const searchMatch = matchesSearch(f, s);
        return statusMatch && searchMatch;
      });
      return { ...s, filteredFrames: frames };
    })
    .filter((s) => s.filteredFrames.length > 0 || (filterStatus === 'all' && !searchQuery.trim()));

  const filteredFlatRows = allFrames.filter(({ scene, frame }) => {
    const sceneMatch = filterSceneId === 'all' || scene.sceneId === filterSceneId;
    const statusMatch = filterStatus === 'all' || frame.status === filterStatus;
    const searchMatch = matchesSearch(frame, scene);
    return sceneMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-cyan-950/40 border border-amber-500/30 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs uppercase tracking-wider border border-amber-400/40">
              BƯỚC 5 — DUYỆT STORYBOARD
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Kiểm Duyệt Sư Phạm & Kịch Bản Thị Giác
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <span>Duyệt & Quản Lý Storyboard Cho Giáo Viên</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              {scenes.length} Cảnh • {totalFramesCount} Khung Hình
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Kiểm tra chi tiết từng cảnh, khung hình, lời thoại nhân vật và công thức toán học/khoa học do AI đề xuất. Thầy/cô có toàn quyền thêm mới, chỉnh sửa, xóa và thay đổi thứ tự kịch bản trước khi kết xuất bộ tranh!
          </p>
        </div>

        {/* Approval Stats & Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 px-3 min-w-[140px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-bold">Tiến độ duyệt:</span>
              <span className="font-black text-emerald-400">{approvalPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${approvalPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>{approvedCount} đã duyệt</span>
              <span>{pendingCount + regenerateCount} cần xem</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleOpenAddScene}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Cảnh (Scene)</span>
            </button>

            <button
              onClick={handleApproveAll}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Phê Duyệt Tất Cả ({totalFramesCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem dạng lưới thẻ trực quan (Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lưới Trực Quan</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem dạng bảng kiểm duyệt sư phạm (Table View)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng Kiểm Duyệt</span>
            </button>
          </div>

          {/* Filter Scene */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSceneId}
              onChange={(e) => setFilterSceneId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none"
            >
              <option value="all">Tất Cả Cảnh ({scenes.length})</option>
              {scenes.map((s) => (
                <option key={s.sceneId} value={s.sceneId}>
                  {s.sceneId}: {s.sceneName} ({s.frames.length} frames)
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'Tất cả', count: totalFramesCount },
              { id: 'approved', label: 'Đã duyệt', count: approvedCount, color: 'text-emerald-400' },
              { id: 'pending', label: 'Chờ duyệt', count: pendingCount, color: 'text-amber-400' },
              { id: 'regenerate', label: 'Cần sửa', count: regenerateCount, color: 'text-rose-400' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id as any)}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterStatus === st.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{st.label}</span>{' '}
                <span className={`text-[10px] ${st.color || 'text-slate-500'}`}>({st.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo nội dung, thoại, công thức..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ===================== VIEW MODE 1: GRID VIEW (CARD VIEW) ===================== */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {filteredScenes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              Không tìm thấy cảnh hoặc khung hình nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredScenes.map((scene, sceneIdx) => {
              const isCollapsed = collapsedScenes[scene.sceneId];
              const sceneApprovedCount = scene.frames.filter((f) => f.status === 'approved').length;
              const isSceneFullyApproved =
                scene.frames.length > 0 && sceneApprovedCount === scene.frames.length;

              return (
                <div
                  key={scene.sceneId}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl transition-all"
                >
                  {/* Scene Header */}
                  <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSceneCollapse(scene.sceneId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isCollapsed ? 'Mở rộng cảnh' : 'Thu gọn cảnh'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {scene.sceneId}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          Cảnh {scene.sceneNumber}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-white">{scene.sceneName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 text-emerald-300 font-medium">
                            <Sparkles className="w-3 h-3" />
                            {scene.knowledgeAppeared}
                          </span>
                          <span>•</span>
                          <span>{scene.environmentName}</span>
                          <span>•</span>
                          <span>{scene.frames.length} khung hình</span>
                        </div>
                      </div>
                    </div>

                    {/* Scene Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Reorder Scene Buttons */}
                      <button
                        onClick={() => handleMoveSceneUp(sceneIdx)}
                        disabled={sceneIdx === 0}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                        title="Di chuyển cảnh lên trên"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSceneDown(sceneIdx)}
                        disabled={sceneIdx === scenes.length - 1}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                        title="Di chuyển cảnh xuống dưới"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Approve all frames of this scene */}
                      {!isSceneFullyApproved && (
                        <button
                          onClick={() => handleApproveSceneFrames(scene.sceneId)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-800/60 flex items-center gap-1 transition-all cursor-pointer"
                          title="Duyệt tất cả khung hình của cảnh này"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt Cảnh</span>
                        </button>
                      )}

                      {/* Add Frame to Scene */}
                      <button
                        onClick={() => handleOpenAddFrame(scene)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800/60 flex items-center gap-1 transition-all cursor-pointer"
                        title="Thêm khung hình mới vào cảnh này"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Khung</span>
                      </button>

                      {/* Edit Scene */}
                      <button
                        onClick={() => handleOpenEditScene(scene)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin cảnh"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Scene */}
                      {scenes.length > 1 && (
                        <button
                          onClick={() => handleDeleteScene(scene.sceneId)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 transition-colors cursor-pointer"
                          title="Xóa cảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scene Frames Grid */}
                  {!isCollapsed && (
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {scene.filteredFrames.map((frame, frameIdx) => {
                          return (
                            <div
                              key={frame.frameId}
                              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-md group ${
                                frame.status === 'approved'
                                  ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400'
                                  : frame.status === 'regenerate'
                                  ? 'bg-slate-950/80 border-rose-500/40 hover:border-rose-400'
                                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {/* Top Thumbnail & Visual Preview */}
                              <div className="relative w-full aspect-video bg-slate-900 overflow-hidden border-b border-slate-800">
                                <VisualIllustrationRenderer
                                  frame={frame}
                                  characters={characters}
                                  showOverlayLayer={false}
                                />

                                {/* Badge Frame ID & Title */}
                                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/90 text-cyan-300 border border-cyan-800/80 backdrop-blur-sm">
                                    {frame.frameId}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 backdrop-blur-sm">
                                    {frame.promptDetails?.camera || 'Medium shot'}
                                  </span>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-2 right-2 z-10">
                                  {frame.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[10px] font-black backdrop-blur-sm">
                                      <CheckCircle2 className="w-3 h-3" /> Đã Duyệt
                                    </span>
                                  ) : frame.status === 'regenerate' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500 text-[10px] font-bold backdrop-blur-sm">
                                      <RefreshCw className="w-3 h-3" /> Cần Sửa
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500 text-[10px] font-bold backdrop-blur-sm">
                                      <AlertCircle className="w-3 h-3" /> Chờ Duyệt
                                    </span>
                                  )}
                                </div>

                                {/* Bottom caption overlay if exists */}
                                {frame.captionText && (
                                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 text-[10px] text-amber-200 line-clamp-1 border-t border-slate-800/60 z-10">
                                    <strong>Dẫn:</strong> {frame.captionText}
                                  </div>
                                )}
                              </div>

                              {/* Frame Details Body */}
                              <div className="p-4 space-y-3 flex-1">
                                <div>
                                  <h4 className="text-xs font-black text-white line-clamp-1">
                                    {frame.title || `Khung ${frame.frameNumber}`}
                                  </h4>
                                  <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                                    {frame.visualAction}
                                  </p>
                                </div>

                                {/* Characters in Frame */}
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-[10px] text-slate-500 font-bold mr-1">
                                    Nhân vật:
                                  </span>
                                  {frame.characterIds.map((cId) => {
                                    const char = characters.find((c) => c.id === cId);
                                    return (
                                      <span
                                        key={cId}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                                        style={{ backgroundColor: char?.signatureColor || '#0284c7' }}
                                      >
                                        {char?.name || cId}
                                      </span>
                                    );
                                  })}
                                </div>

                                {/* Speech Bubbles List */}
                                {frame.speechBubbles && frame.speechBubbles.length > 0 && (
                                  <div className="space-y-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-[11px]">
                                    {frame.speechBubbles.map((sb) => (
                                      <div key={sb.id} className="text-slate-300 line-clamp-1">
                                        <strong className="text-cyan-300">{sb.characterName}:</strong>{' '}
                                        <span>“{sb.text}”</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* KaTeX Formula Layer Preview */}
                                {frame.mathFormulaLayer && (
                                  <div className="p-2 rounded-xl bg-slate-900 border border-amber-500/20 text-center">
                                    <span className="text-[10px] text-amber-400 font-bold block mb-0.5">
                                      {frame.mathFormulaLayer.label || 'Công thức toán học'}:
                                    </span>
                                    <div className="overflow-x-auto text-amber-300 text-xs py-0.5">
                                      <KatexRenderer math={frame.mathFormulaLayer.latex} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Frame Footer & Actions */}
                              <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                {/* Order Frame Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMoveFrameUp(scene.sceneId, frameIdx)}
                                    disabled={frameIdx === 0}
                                    className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                                    title="Di chuyển khung lên trước"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveFrameDown(scene.sceneId, frameIdx)}
                                    disabled={frameIdx === scene.frames.length - 1}
                                    className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                                    title="Di chuyển khung xuống sau"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Status Quick Toggle */}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      handleSetFrameStatus(
                                        scene.sceneId,
                                        frame.frameId,
                                        frame.status === 'approved' ? 'pending' : 'approved'
                                      )
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                      frame.status === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                    title={frame.status === 'approved' ? 'Đã duyệt' : 'Bấm để duyệt'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{frame.status === 'approved' ? 'Đã Duyệt' : 'Duyệt'}</span>
                                  </button>

                                  {/* Edit Frame Button */}
                                  <button
                                    onClick={() => handleOpenEditFrame(scene, frame)}
                                    className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 hover:bg-cyan-600 hover:text-white transition-colors cursor-pointer"
                                    title="Chỉnh sửa chi tiết khung hình (lời thoại, góc máy, công thức)"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Frame Button */}
                                  {scene.frames.length > 1 && (
                                    <button
                                      onClick={() => handleDeleteFrame(scene.sceneId, frame.frameId)}
                                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                      title="Xóa khung hình này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== VIEW MODE 2: TABLE VIEW ===================== */}
      {viewMode === 'table' && (
        <div className="eduverse-glass rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Cảnh (Scene)</th>
                  <th className="py-3.5 px-3">Frame ID</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Nội Dung / Hành Động Trực Quan</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Kiến Thức & Công Thức</th>
                  <th className="py-3.5 px-4">Nhân Vật</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredFlatRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Không có khung hình nào khớp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredFlatRows.map(({ scene, frame }) => (
                    <tr
                      key={frame.frameId}
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* 1. Cảnh */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold text-cyan-400 block font-mono text-[11px]">
                          {scene.sceneId}
                        </span>
                        <span className="text-slate-300 font-semibold line-clamp-1">
                          {scene.sceneName}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {scene.environmentName}
                        </span>
                      </td>

                      {/* 2. Frame */}
                      <td className="py-3.5 px-3 align-top">
                        <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-[11px] block text-center">
                          {frame.frameId}
                        </span>
                        <span className="text-[10px] text-slate-400 block text-center mt-1">
                          {frame.promptDetails?.camera || 'Medium'}
                        </span>
                      </td>

                      {/* 3. Nội Dung / Hành Động */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="text-slate-200 font-medium leading-relaxed">
                          {frame.visualAction}
                        </p>
                        {frame.captionText && (
                          <div className="mt-1 text-[11px] text-amber-300/90 italic">
                            Dẫn: {frame.captionText}
                          </div>
                        )}
                        {frame.speechBubbles.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {frame.speechBubbles.map((sb) => (
                              <span
                                key={sb.id}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 flex items-center gap-1"
                              >
                                <strong className="text-cyan-300">{sb.characterName}:</strong> “
                                {sb.text.length > 32 ? `${sb.text.slice(0, 32)}...` : sb.text}”
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 4. Kiến Thức & KaTeX */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="text-emerald-300 font-medium leading-relaxed block">
                          {scene.knowledgeAppeared}
                        </span>
                        {frame.mathFormulaLayer && (
                          <div className="mt-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-amber-300">
                            <KatexRenderer math={frame.mathFormulaLayer.latex} />
                          </div>
                        )}
                      </td>

                      {/* 5. Nhân Vật */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {frame.characterIds.map((cId) => {
                            const char = characters.find((c) => c.id === cId);
                            return (
                              <span
                                key={cId}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: char?.signatureColor || '#0284c7' }}
                              >
                                {char?.name || cId}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. Trạng Thái */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {frame.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Duyệt
                          </span>
                        ) : frame.status === 'regenerate' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                            <RefreshCw className="w-3.5 h-3.5" /> Cần Sửa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold">
                            <AlertCircle className="w-3.5 h-3.5" /> Chờ Duyệt
                          </span>
                        )}
                      </td>

                      {/* 7. Thao Tác */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status */}
                          <button
                            onClick={() =>
                              handleSetFrameStatus(
                                scene.sceneId,
                                frame.frameId,
                                frame.status === 'approved' ? 'pending' : 'approved'
                              )
                            }
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              frame.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300'
                                : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300'
                            }`}
                            title={frame.status === 'approved' ? 'Hủy duyệt' : 'Phê duyệt'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Edit Frame in Modal */}
                          <button
                            onClick={() => handleOpenEditFrame(scene, frame)}
                            className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 hover:bg-cyan-600 hover:text-white transition-colors cursor-pointer"
                            title="Chỉnh sửa chi tiết"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Frame */}
                          {scene.frames.length > 1 && (
                            <button
                              onClick={() => handleDeleteFrame(scene.sceneId, frame.frameId)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Xóa frame"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frame Edit / Add Modal */}
      {targetSceneForFrame && (
        <StoryboardFrameModal
          isOpen={isFrameModalOpen}
          onClose={() => {
            setIsFrameModalOpen(false);
            setTargetFrameForEdit(null);
            setTargetSceneForFrame(null);
          }}
          scene={targetSceneForFrame}
          frame={targetFrameForEdit}
          characters={characters}
          onSave={handleSaveFrame}
        />
      )}

      {/* Scene Edit / Add Modal */}
      <StoryboardSceneModal
        isOpen={isSceneModalOpen}
        onClose={() => {
          setIsSceneModalOpen(false);
          setTargetSceneForEdit(null);
        }}
        scene={targetSceneForEdit}
        existingSceneCount={scenes.length}
        characters={characters}
        onSave={handleSaveScene}
      />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          ← Quay Lại Bước 4: Soạn Kịch Bản
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Đã duyệt {approvedCount}/{totalFramesCount} khung
          </span>
          <button
            onClick={onNextStep}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-black text-sm shadow-xl shadow-amber-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Tiến Hành Tạo Bộ Tranh & Visual Studio (Bước 6)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
