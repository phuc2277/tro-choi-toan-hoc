import React, { useState } from 'react';
import { TeachingActivity, EditorSlide } from '../../../types/contentBlock';
import { generateBlockId } from '../../../utils/lectureStructureAdapter';
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';

interface Step2PedagogicalFlowProps {
  activities: TeachingActivity[];
  onUpdateActivities: (activities: TeachingActivity[]) => void;
  onSelectSlideToEdit: (activityIndex: number, slideIndex: number) => void;
}

export const Step2PedagogicalFlow: React.FC<Step2PedagogicalFlowProps> = ({
  activities,
  onUpdateActivities,
  onSelectSlideToEdit,
}) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingSlideTitle, setEditingSlideTitle] = useState<string>('');

  const handleAddActivity = () => {
    const newAct: TeachingActivity = {
      id: generateBlockId('act'),
      title: `0${activities.length + 1}. HOẠT ĐỘNG MỚI`,
      order: activities.length + 1,
      timeMinutes: 5,
      description: 'Mô tả mục tiêu sư phạm của hoạt động này',
      slides: [
        {
          id: generateBlockId('sld'),
          title: 'Slide nội dung khởi tạo',
          order: 1,
          layout: 'title-content',
          blocks: [],
        },
      ],
    };
    onUpdateActivities([...activities, newAct]);
  };

  const handleDeleteActivity = (actId: string) => {
    if (activities.length <= 1) return;
    onUpdateActivities(activities.filter((a) => a.id !== actId));
  };

  const handleDuplicateActivity = (act: TeachingActivity) => {
    const dup: TeachingActivity = {
      ...act,
      id: generateBlockId('act'),
      title: `${act.title} (Bản sao)`,
      slides: act.slides.map((s) => ({
        ...s,
        id: generateBlockId('sld'),
        blocks: s.blocks.map((b) => ({ ...b, id: generateBlockId('blk') })),
      })),
    };
    onUpdateActivities([...activities, dup]);
  };

  const handleMoveActivity = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= activities.length) return;
    const newActivities = [...activities];
    const [moved] = newActivities.splice(fromIdx, 1);
    newActivities.splice(toIdx, 0, moved);
    // Update orders
    const updated = newActivities.map((act, idx) => ({ ...act, order: idx + 1 }));
    onUpdateActivities(updated);
  };

  const handleUpdateActivityTitle = (actId: string, title: string) => {
    onUpdateActivities(activities.map((a) => (a.id === actId ? { ...a, title } : a)));
  };

  const handleUpdateActivityDescription = (actId: string, description: string) => {
    onUpdateActivities(activities.map((a) => (a.id === actId ? { ...a, description } : a)));
  };

  const handleUpdateActivityTime = (actId: string, time: number) => {
    onUpdateActivities(activities.map((a) => (a.id === actId ? { ...a, timeMinutes: time } : a)));
  };

  const handleAddSlide = (actIndex: number, layout: EditorSlide['layout'] = 'title-content') => {
    const slideNumber = activities[actIndex].slides.length + 1;
    const newSlide: EditorSlide = {
      id: generateBlockId('sld'),
      title: `Slide ${slideNumber}: Nội dung`,
      order: slideNumber,
      layout,
      blocks: [],
    };
    const updated = [...activities];
    updated[actIndex] = {
      ...updated[actIndex],
      slides: [...updated[actIndex].slides, newSlide],
    };
    onUpdateActivities(updated);
  };

  const handleDeleteSlide = (actIndex: number, slideId: string) => {
    const updated = [...activities];
    if (updated[actIndex].slides.length <= 1) return;
    updated[actIndex] = {
      ...updated[actIndex],
      slides: updated[actIndex].slides.filter((s) => s.id !== slideId),
    };
    onUpdateActivities(updated);
  };

  const handleDuplicateSlide = (actIndex: number, slide: EditorSlide) => {
    const dupSlide: EditorSlide = {
      ...slide,
      id: generateBlockId('sld'),
      title: `${slide.title} (Bản sao)`,
      blocks: slide.blocks.map((b) => ({ ...b, id: generateBlockId('blk') })),
    };
    const updated = [...activities];
    updated[actIndex] = {
      ...updated[actIndex],
      slides: [...updated[actIndex].slides, dupSlide],
    };
    onUpdateActivities(updated);
  };

  const handleMoveSlide = (actIndex: number, fromIdx: number, toIdx: number) => {
    const slides = [...activities[actIndex].slides];
    if (toIdx < 0 || toIdx >= slides.length) return;
    const [moved] = slides.splice(fromIdx, 1);
    slides.splice(toIdx, 0, moved);
    const updated = [...activities];
    updated[actIndex] = {
      ...updated[actIndex],
      slides: slides.map((s, idx) => ({ ...s, order: idx + 1 })),
    };
    onUpdateActivities(updated);
  };

  const handleStartRenameSlide = (slide: EditorSlide) => {
    setEditingSlideId(slide.id);
    setEditingSlideTitle(slide.title);
  };

  const handleSaveRenameSlide = (actIndex: number, slideId: string) => {
    if (!editingSlideTitle.trim()) {
      setEditingSlideId(null);
      return;
    }
    const updated = [...activities];
    updated[actIndex] = {
      ...updated[actIndex],
      slides: updated[actIndex].slides.map((s) =>
        s.id === slideId ? { ...s, title: editingSlideTitle.trim() } : s
      ),
    };
    onUpdateActivities(updated);
    setEditingSlideId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Bước 2: Xây dựng Tiến trình Dạy học (Hoạt động & Slide)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Phân định rõ ràng giữa Hoạt động sư phạm và Slide trình chiếu. Tự do thêm, bớt, đổi tên và sắp xếp lại thứ tự.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddActivity}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Hoạt động mới</span>
        </button>
      </div>

      {/* Activities List */}
      <div className="space-y-5">
        {activities.map((act, actIdx) => (
          <div
            key={act.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden transition"
          >
            {/* Activity Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1">
                {/* Reorder Buttons */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={actIdx === 0}
                    onClick={() => handleMoveActivity(actIdx, actIdx - 1)}
                    title="Di chuyển hoạt động lên"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={actIdx === activities.length - 1}
                    onClick={() => handleMoveActivity(actIdx, actIdx + 1)}
                    title="Di chuyển hoạt động xuống"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {actIdx + 1}
                </span>

                <input
                  type="text"
                  value={act.title}
                  onChange={(e) => handleUpdateActivityTitle(act.id, e.target.value)}
                  className="font-black text-sm sm:text-base text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none flex-1"
                  placeholder="Tiêu đề hoạt động..."
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={act.timeMinutes || 5}
                    onChange={(e) => handleUpdateActivityTime(act.id, Number(e.target.value))}
                    className="w-8 text-center bg-transparent outline-none"
                  />
                  <span>phút</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDuplicateActivity(act)}
                  title="Nhân bản hoạt động"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {activities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteActivity(act.id)}
                    title="Xóa hoạt động"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Activity Description / Pedagogical Goal */}
            <div className="px-4 sm:px-5 pt-3">
              <input
                type="text"
                value={act.description || ''}
                onChange={(e) => handleUpdateActivityDescription(act.id, e.target.value)}
                placeholder="Mục tiêu sư phạm / Mô tả tóm tắt hoạt động này..."
                className="w-full text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
              />
            </div>

            {/* Slides within Activity */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <span>Danh sách Slide trong hoạt động ({act.slides.length} slide):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSlide(actIdx, 'title-content')}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Slide</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {act.slides.map((slide, sIdx) => {
                  const isRenaming = editingSlideId === slide.id;

                  return (
                    <div
                      key={slide.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        {/* Slide card top bar */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                              Slide {sIdx + 1}
                            </span>
                            {/* Slide move buttons */}
                            <button
                              type="button"
                              disabled={sIdx === 0}
                              onClick={() => handleMoveSlide(actIdx, sIdx, sIdx - 1)}
                              title="Chuyển slide lên trước"
                              className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={sIdx === act.slides.length - 1}
                              onClick={() => handleMoveSlide(actIdx, sIdx, sIdx + 1)}
                              title="Chuyển slide xuống sau"
                              className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateSlide(actIdx, slide)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Nhân bản slide"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {act.slides.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSlide(actIdx, slide.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Xóa slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Slide Title / Inline Rename */}
                        {isRenaming ? (
                          <div className="flex items-center gap-1 mb-1">
                            <input
                              type="text"
                              value={editingSlideTitle}
                              onChange={(e) => setEditingSlideTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRenameSlide(actIdx, slide.id);
                                if (e.key === 'Escape') setEditingSlideId(null);
                              }}
                              autoFocus
                              className="w-full text-xs font-bold text-slate-900 border border-indigo-400 rounded px-1.5 py-0.5 outline-none bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRenameSlide(actIdx, slide.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartRenameSlide(slide)}
                            title="Bấm để đổi tên slide"
                            className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 cursor-pointer flex items-center gap-1"
                          >
                            <span>{slide.title}</span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition" />
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{slide.blocks.length} khối nội dung</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {slide.layout || 'title-content'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectSlideToEdit(actIdx, sIdx)}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-98"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Soạn nội dung slide</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
