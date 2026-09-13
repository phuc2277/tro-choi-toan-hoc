import React, { useState } from 'react';
import { ContentBlock, EditorSlide, TeachingActivity, AnimationEntranceType, AnimationExitType, AnimationTrigger, BlockAnimation } from '../../../types/contentBlock';
import {
  Settings,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layers,
  Sliders,
  Type,
  Maximize2,
  Clock,
  BookOpen,
  Layout,
  Palette,
  FileText,
  Plus,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  List,
  ListOrdered,
  Sparkles,
  Move,
  Maximize,
  PlayCircle,
  Play,
  RotateCcw,
  Timer,
  MousePointerClick,
  Check,
  Minus,
  Zap,
} from 'lucide-react';

export interface BlockPropertiesPanelProps {
  scope: 'activity' | 'slide' | 'block';
  onSelectScope: (scope: 'activity' | 'slide' | 'block') => void;
  currentActivity: TeachingActivity;
  currentSlide: EditorSlide;
  selectedBlock: ContentBlock | null;
  onUpdateActivity: (updates: Partial<TeachingActivity>) => void;
  onDeleteActivity: () => void;
  onDuplicateActivity: () => void;
  onMoveActivity: (direction: 'up' | 'down') => void;
  onUpdateSlide: (updates: Partial<EditorSlide>) => void;
  onDeleteSlide: () => void;
  onDuplicateSlide: () => void;
  onMoveSlide: (direction: 'up' | 'down') => void;
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveLayer: (blockId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onAddBlock?: () => void;
}

export const BlockPropertiesPanel: React.FC<BlockPropertiesPanelProps> = ({
  scope,
  onSelectScope,
  currentActivity,
  currentSlide,
  selectedBlock,
  onUpdateActivity,
  onDeleteActivity,
  onDuplicateActivity,
  onMoveActivity,
  onUpdateSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveLayer,
}) => {
  const [isTestingAnimation, setIsTestingAnimation] = useState(false);
  const [testAnimKey, setTestAnimKey] = useState(0);

  const triggerTestAnimation = () => {
    setIsTestingAnimation(true);
    setTestAnimKey((prev) => prev + 1);
    setTimeout(() => {
      setIsTestingAnimation(false);
    }, 2000);
  };
  return (
    <div className="w-full h-full flex flex-col bg-white text-slate-800 text-xs">
      {/* Properties Scope Switcher */}
      <div className="p-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl gap-0.5">
          <button
            type="button"
            onClick={() => onSelectScope('activity')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition text-center cursor-pointer ${
              scope === 'activity'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoạt động
          </button>
          <button
            type="button"
            onClick={() => onSelectScope('slide')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition text-center cursor-pointer ${
              scope === 'slide'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slide
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedBlock) onSelectScope('block');
            }}
            disabled={!selectedBlock}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition text-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              scope === 'block'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khối nội dung
          </button>
        </div>
      </div>

      {/* Scope 1: ACTIVITY PROPERTIES */}
      {scope === 'activity' && (
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Thuộc tính Hoạt động</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              #{currentActivity.order}
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Tên hoạt động sư phạm:
            </label>
            <input
              type="text"
              value={currentActivity.title}
              onChange={(e) => onUpdateActivity({ title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Thời lượng dự kiến (phút):</span>
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={currentActivity.timeMinutes || 5}
              onChange={(e) => onUpdateActivity({ timeMinutes: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Mục tiêu sư phạm / Mô tả:
            </label>
            <textarea
              rows={4}
              value={currentActivity.description || ''}
              onChange={(e) => onUpdateActivity({ description: e.target.value })}
              placeholder="Yêu cầu cần đạt, phương pháp tổ chức cho hoạt động này..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium leading-relaxed"
            />
          </div>

          {/* Quick Actions for Activity */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
              Thao tác với hoạt động:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onMoveActivity('up')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Chuyển lên</span>
              </button>
              <button
                type="button"
                onClick={() => onMoveActivity('down')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Chuyển xuống</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDuplicateActivity}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nhân bản</span>
              </button>
              <button
                type="button"
                onClick={onDeleteActivity}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 space-y-1 mt-auto">
            <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 text-indigo-700">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cấu trúc hoạt động:</span>
            </div>
            <div className="text-xs">
              Hiện có <span className="font-black text-indigo-600">{currentActivity.slides.length}</span> slide trong hoạt động này.
            </div>
          </div>
        </div>
      )}

      {/* Scope 2: SLIDE PROPERTIES */}
      {scope === 'slide' && (
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Thuộc tính Slide</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Slide #{currentSlide.order}
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Tiêu đề Slide:
            </label>
            <input
              type="text"
              value={currentSlide.title}
              onChange={(e) => onUpdateSlide({ title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-slate-900"
            />
          </div>

          {/* Slide Layout */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Layout className="w-3.5 h-3.5 text-indigo-500" />
              <span>Bố cục (Layout):</span>
            </label>
            <select
              value={currentSlide.layout || 'title-content'}
              onChange={(e) => onUpdateSlide({ layout: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-slate-800"
            >
              <option value="title-content">Tiêu đề & Nội dung chuẩn</option>
              <option value="blank">Slide trống (Tự do xếp block)</option>
              <option value="two-column">Hai cột song song</option>
              <option value="question-center">Câu hỏi trọng tâm (Căn giữa)</option>
              <option value="full-media">Toàn cảnh đa phương tiện</option>
            </select>
          </div>

          {/* Slide Background Color */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>Màu nền Slide:</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Trắng', color: '#ffffff' },
                { label: 'Xám sáng', color: '#f8fafc' },
                { label: 'Xanh dịu', color: '#f0fdf4' },
                { label: 'Phấn bảng', color: '#0f172a' },
              ].map((bg) => (
                <button
                  key={bg.color}
                  type="button"
                  onClick={() => onUpdateSlide({ background: bg.color })}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                    (currentSlide.background || '#ffffff') === bg.color
                      ? 'border-indigo-600 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-600 truncate">
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ghi chú Sư phạm (Teacher Notes):</span>
            </label>
            <textarea
              rows={4}
              value={currentSlide.notes || ''}
              onChange={(e) => onUpdateSlide({ notes: e.target.value })}
              placeholder="Lời dặn, thời gian dự kiến, mẹo giảng dạy cho slide này..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium leading-relaxed"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ghi chú hiển thị cho giáo viên hỗ trợ dẫn dắt bài giảng.
            </span>
          </div>

          {/* Quick Actions for Slide */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
              Thao tác với slide:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onMoveSlide('up')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Chuyển lên</span>
              </button>
              <button
                type="button"
                onClick={() => onMoveSlide('down')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Chuyển xuống</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDuplicateSlide}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nhân bản</span>
              </button>
              <button
                type="button"
                onClick={onDeleteSlide}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa slide</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 space-y-1 mt-auto">
            <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 text-indigo-700">
              <Layers className="w-3.5 h-3.5" />
              <span>Thành phần trên slide:</span>
            </div>
            <div className="text-xs">
              Tổng cộng: <span className="font-black text-indigo-600">{currentSlide.blocks.length}</span> khối nội dung.
            </div>
          </div>
        </div>
      )}

      {/* Scope 3: BLOCK PROPERTIES */}
      {scope === 'block' && (
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
          {!selectedBlock ? (
            <div className="text-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl">
              <Sliders className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-xs text-slate-600">Chưa chọn khối nào</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Hãy bấm chọn một khối bất kỳ trên slide để tùy chỉnh chi tiết.
              </p>
            </div>
          ) : (
            <>
              {/* Header with quick actions */}
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    {selectedBlock.locked && <Lock className="w-3 h-3 text-amber-600" />}
                    <span>{selectedBlock.type}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateBlock(selectedBlock.id, { locked: !selectedBlock.locked })}
                      title={selectedBlock.locked ? 'Mở khóa khối' : 'Khóa khối'}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        selectedBlock.locked ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {selectedBlock.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateBlock(selectedBlock.id, { visible: !selectedBlock.visible })}
                      title={selectedBlock.visible ? 'Ẩn trong trình chiếu' : 'Hiện trong trình chiếu'}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {selectedBlock.visible ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-amber-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateBlock(selectedBlock.id)}
                      title="Nhân bản khối"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBlock(selectedBlock.id)}
                      title="Xóa khối"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  ID: {selectedBlock.id}
                </div>
              </div>

              {/* Kích thước khối (Resize Block) */}
              <div>
                <label className="font-bold text-slate-600 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Độ rộng khối (Width):</span>
                  </span>
                  <span className="text-indigo-600 font-mono text-[11px]">
                    {selectedBlock.size?.width ? `${selectedBlock.size.width}%` : '100%'}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { label: '100%', val: 100 },
                    { label: '75%', val: 75 },
                    { label: '66%', val: 66 },
                    { label: '50%', val: 50 },
                    { label: '33%', val: 33 },
                  ].map((w) => {
                    const currentW = selectedBlock.size?.width ?? 100;
                    const isSelected = currentW === w.val;
                    return (
                      <button
                        key={w.val}
                        type="button"
                        onClick={() =>
                          onUpdateBlock(selectedBlock.id, {
                            size: { ...(selectedBlock.size || { height: 0 }), width: w.val },
                          })
                        }
                        className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layer / Thứ tự sắp xếp (4 chiều: Top, Up, Down, Bottom) */}
              <div>
                <label className="font-bold text-slate-600 block mb-1.5">
                  Thứ tự hiển thị / Lớp (Layer):
                </label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveLayer(selectedBlock.id, 'top')}
                    title="Đưa lên trên cùng"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-0.5 cursor-pointer text-[10px]"
                  >
                    <ChevronsUp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lên đầu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveLayer(selectedBlock.id, 'up')}
                    title="Lên 1 nấc"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-0.5 cursor-pointer text-[10px]"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Lên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveLayer(selectedBlock.id, 'down')}
                    title="Xuống 1 nấc"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-0.5 cursor-pointer text-[10px]"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Xuống</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveLayer(selectedBlock.id, 'bottom')}
                    title="Đưa xuống dưới cùng"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-0.5 cursor-pointer text-[10px]"
                  >
                    <ChevronsDown className="w-3.5 h-3.5 text-slate-600" />
                    <span>Xuống đáy</span>
                  </button>
                </div>
              </div>

              {/* Trình chiếu, Thứ tự xuất hiện & Hiệu ứng chữ/khối (Tránh xuất hiện ồ ạt) */}
              {(() => {
                const anim = selectedBlock.animation || {};
                const animOrder = anim.order ?? selectedBlock.revealOrder ?? selectedBlock.order ?? 1;
                const animEntrance: AnimationEntranceType = anim.entrance || selectedBlock.revealMode || anim.type || 'fade';
                const animExit: AnimationExitType = anim.exit || 'fade-out';
                const animTrigger: AnimationTrigger = anim.trigger || 'click';
                const delaySec = anim.delaySeconds ?? 1;
                const autoDisappear = anim.autoDisappear ?? false;
                const disappearDelaySec = anim.disappearDelaySeconds ?? 3;
                const disappearOnNext = anim.disappearOnNextStep ?? false;
                const revealByPara = anim.revealByParagraph ?? false;

                const updateAnim = (patch: Partial<BlockAnimation>) => {
                  const nextAnim = { ...anim, ...patch };
                  onUpdateBlock(selectedBlock.id, {
                    animation: nextAnim,
                    revealOrder: nextAnim.order ?? animOrder,
                    revealMode: nextAnim.entrance ?? animEntrance,
                  });
                };

                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100/90 shadow-2xs space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="font-black text-xs text-indigo-950 block">
                            Hiệu ứng xuất hiện & Thứ tự
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Tránh văn bản xuất hiện ồ ạt
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black shadow-2xs">
                          Bước #{animOrder}
                        </span>
                        <button
                          type="button"
                          onClick={triggerTestAnimation}
                          title="Chạy thử hiệu ứng khối này"
                          className="p-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-bold text-[10px] flex items-center gap-0.5 cursor-pointer transition active:scale-95"
                        >
                          <Play className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                          <span>Thử</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Box when testing */}
                    {isTestingAnimation && (
                      <div
                        key={testAnimKey}
                        className="p-2.5 rounded-xl bg-white border border-indigo-200 shadow-sm flex items-center justify-center text-center overflow-hidden"
                      >
                        <div
                          className={`px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs ${
                            animEntrance === 'fade'
                              ? 'anim-entrance-fade'
                              : animEntrance === 'slide-down'
                              ? 'anim-entrance-slide-down'
                              : animEntrance === 'slide-left'
                              ? 'anim-entrance-slide-left'
                              : animEntrance === 'slide-right'
                              ? 'anim-entrance-slide-right'
                              : animEntrance === 'zoom'
                              ? 'anim-entrance-zoom'
                              : animEntrance === 'bounce'
                              ? 'anim-entrance-bounce'
                              : animEntrance === 'glow'
                              ? 'anim-entrance-glow'
                              : 'anim-entrance-slide-up'
                          }`}
                        >
                          ✨ Mô phỏng: {animEntrance} (#{animOrder})
                        </div>
                      </div>
                    )}

                    {/* 1. Reveal Step Order with - / + buttons */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Thứ tự xuất hiện (Bước số):</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Bấm Space / Click để sang bước
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateAnim({ order: Math.max(1, animOrder - 1) })}
                          disabled={animOrder <= 1}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 font-black flex items-center justify-center text-slate-700 cursor-pointer shadow-2xs"
                          title="Giảm bước"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={animOrder}
                          onChange={(e) =>
                            updateAnim({ order: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          className="flex-1 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-black text-center text-indigo-900 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => updateAnim({ order: animOrder + 1 })}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-black flex items-center justify-center text-slate-700 cursor-pointer shadow-2xs"
                          title="Tăng bước"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Cách thức kích hoạt (Trigger) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kích hoạt xuất hiện:</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => updateAnim({ trigger: 'click' })}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition ${
                            animTrigger === 'click'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <MousePointerClick className="w-3.5 h-3.5" />
                          <span>Khi bấm chuột</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAnim({ trigger: 'auto' })}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition ${
                            animTrigger === 'auto'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Tự động sau</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAnim({ trigger: 'with-previous' })}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition ${
                            animTrigger === 'with-previous'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Cùng trước đó</span>
                        </button>
                      </div>

                      {animTrigger === 'auto' && (
                        <div className="flex items-center gap-1.5 mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[11px] font-medium">Tự hiện sau:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="30"
                            value={delaySec}
                            onChange={(e) =>
                              updateAnim({ delaySeconds: Math.max(0.5, parseFloat(e.target.value) || 1) })
                            }
                            className="w-14 px-1.5 py-0.5 bg-white border border-amber-300 rounded font-bold text-center text-xs text-amber-950"
                          />
                          <span className="text-[11px]">giây</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Hiệu ứng vào (Entrance Effect) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hiệu ứng xuất hiện:</span>
                      </label>
                      <select
                        value={animEntrance}
                        onChange={(e) => updateAnim({ entrance: e.target.value as AnimationEntranceType })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                      >
                        <option value="fade">Mờ dần vào (Fade In)</option>
                        <option value="slide-up">Trượt từ dưới lên (Slide Up)</option>
                        <option value="slide-down">Trượt từ trên xuống (Slide Down)</option>
                        <option value="slide-left">Trượt từ phải sang trái (Slide Left)</option>
                        <option value="slide-right">Trượt từ trái sang phải (Slide Right)</option>
                        <option value="zoom">Phóng to nảy nhẹ (Zoom In)</option>
                        <option value="bounce">Nảy sinh động (Bounce In)</option>
                        <option value="glow">Phát quang lóa sáng (Glow / Flash)</option>
                        <option value="none">Hiện tức thì (Không hiệu ứng)</option>
                      </select>
                    </div>

                    {/* 4. Text specific: Paragraph-by-paragraph reveal */}
                    {['text', 'heading', 'list'].includes(selectedBlock.type) && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-1">
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={revealByPara}
                            onChange={(e) => updateAnim({ revealByParagraph: e.target.checked })}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-800 block">
                              Xuất hiện lần lượt từng đoạn / dòng
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              Tránh hiện toàn bộ đoạn văn dài cùng một lúc, học sinh theo dõi từng ý
                            </span>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* 5. Tự động biến mất & Rời khỏi màn hình (Disappear & Exit) */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-[11px] text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Hiệu ứng Biến mất / Rời khỏi:</span>
                        </span>
                      </div>

                      {/* Auto Disappear checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={autoDisappear}
                          onChange={(e) => updateAnim({ autoDisappear: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-medium text-slate-700">
                          Tự động biến mất sau khi hiển thị
                        </span>
                      </label>

                      {autoDisappear && (
                        <div className="flex items-center gap-1.5 pl-5">
                          <span className="text-[11px] text-slate-600">Biến mất sau:</span>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={disappearDelaySec}
                            onChange={(e) =>
                              updateAnim({ disappearDelaySeconds: Math.max(1, parseInt(e.target.value) || 3) })
                            }
                            className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-center text-xs text-slate-800"
                          />
                          <span className="text-[11px] text-slate-600">giây</span>
                        </div>
                      )}

                      {/* Disappear on next step */}
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={disappearOnNext}
                          onChange={(e) => updateAnim({ disappearOnNextStep: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-medium text-slate-700">
                          Biến mất khi sang bước tiếp theo
                        </span>
                      </label>

                      {/* Exit effect choice */}
                      {(autoDisappear || disappearOnNext) && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-bold text-slate-500 block">
                            Hiệu ứng khi biến mất:
                          </label>
                          <select
                            value={animExit}
                            onChange={(e) => updateAnim({ exit: e.target.value as AnimationExitType })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                          >
                            <option value="fade-out">Mờ dần biến mất (Fade Out)</option>
                            <option value="slide-down">Trượt xuống biến mất (Slide Down)</option>
                            <option value="slide-up">Trượt lên biến mất (Slide Up)</option>
                            <option value="zoom-out">Thu nhỏ biến mất (Zoom Out)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Specific Properties based on Block Type */}
              {selectedBlock.type === 'text' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Định dạng văn bản:</span>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Cỡ chữ (px):</label>
                    <input
                      type="number"
                      min={12}
                      max={64}
                      value={(selectedBlock.content as any).fontSize || 18}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), fontSize: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Căn lề:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() =>
                            onUpdateBlock(selectedBlock.id, {
                              content: { ...(selectedBlock.content as any), textAlign: align },
                            })
                          }
                          className={`py-1.5 rounded-xl text-center capitalize font-bold cursor-pointer ${
                            (selectedBlock.content as any).textAlign === align
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Màu chữ:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(selectedBlock.content as any).color || '#1E293B'}
                        onChange={(e) =>
                          onUpdateBlock(selectedBlock.id, {
                            content: { ...(selectedBlock.content as any), color: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-xl cursor-pointer border border-slate-300"
                      />
                      <span className="font-mono text-[11px] text-slate-600">
                        {(selectedBlock.content as any).color || '#1E293B'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBlock.type === 'heading' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-slate-500 block mb-1">Cấp tiêu đề:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['h1', 'h2', 'h3'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            onUpdateBlock(selectedBlock.id, {
                              content: { ...(selectedBlock.content as any), level: lvl },
                            })
                          }
                          className={`py-1.5 rounded-xl text-center uppercase font-bold cursor-pointer ${
                            (selectedBlock.content as any).level === lvl
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Huy hiệu (Badge tag):</label>
                    <input
                      type="text"
                      value={(selectedBlock.content as any).badge || ''}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), badge: e.target.value },
                        })
                      }
                      placeholder="Ví dụ: Khởi động, Ghi nhớ..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === 'math' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-slate-500 block mb-1">Mã LaTeX:</label>
                    <textarea
                      rows={3}
                      value={(selectedBlock.content as any).latex || ''}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), latex: e.target.value },
                        })
                      }
                      className="w-full p-2 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Chú thích công thức:</label>
                    <input
                      type="text"
                      value={(selectedBlock.content as any).explanation || ''}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), explanation: e.target.value },
                        })
                      }
                      placeholder="Diễn giải ý nghĩa..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === 'image' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-slate-500 block mb-1">Đường dẫn ảnh (URL):</label>
                    <input
                      type="text"
                      value={(selectedBlock.content as any).url || ''}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), url: e.target.value },
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Chú thích dưới ảnh:</label>
                    <input
                      type="text"
                      value={(selectedBlock.content as any).caption || ''}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), caption: e.target.value },
                        })
                      }
                      placeholder="Hình 1.1..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === 'list' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <List className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Cấu hình danh sách:</span>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Kiểu danh sách:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateBlock(selectedBlock.id, {
                            content: { ...(selectedBlock.content as any), listType: 'bullet' },
                          })
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          (selectedBlock.content as any).listType === 'bullet' || !(selectedBlock.content as any).listType
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Dấu chấm (•)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateBlock(selectedBlock.id, {
                            content: { ...(selectedBlock.content as any), listType: 'numbered' },
                          })
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          (selectedBlock.content as any).listType === 'numbered'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span>Số thứ tự (1, 2)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Cỡ chữ (px):</label>
                    <input
                      type="number"
                      min={12}
                      max={40}
                      value={(selectedBlock.content as any).fontSize || 16}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), fontSize: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Màu chữ:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(selectedBlock.content as any).color || '#1E293B'}
                        onChange={(e) =>
                          onUpdateBlock(selectedBlock.id, {
                            content: { ...(selectedBlock.content as any), color: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-xl cursor-pointer border border-slate-300"
                      />
                      <span className="font-mono text-[11px] text-slate-600">
                        {(selectedBlock.content as any).color || '#1E293B'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBlock.type === 'table' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-slate-500 block mb-1">Tiêu đề bảng:</label>
                    <input
                      type="text"
                      value={(selectedBlock.content as any).title || ''}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), title: e.target.value },
                        })
                      }
                      placeholder="Bảng giá trị hàm số..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === 'question' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-slate-500 block mb-1">Độ khó:</label>
                    <select
                      value={(selectedBlock.content as any).difficulty || 'medium'}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          content: { ...(selectedBlock.content as any), difficulty: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                    >
                      <option value="easy">Nhận biết (Dễ)</option>
                      <option value="medium">Thông hiểu (Vừa)</option>
                      <option value="hard">Vận dụng (Khó)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Đáp án đúng:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {['A', 'B', 'C', 'D'].map((ans) => (
                        <button
                          key={ans}
                          type="button"
                          onClick={() =>
                            onUpdateBlock(selectedBlock.id, {
                              content: { ...(selectedBlock.content as any), correctAnswer: ans },
                            })
                          }
                          className={`py-1.5 rounded-xl text-center font-black cursor-pointer ${
                            (selectedBlock.content as any).correctAnswer === ans
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
