import React, { useState } from 'react';
import { SubjectItem, GradeItem, Lesson } from '../../types/teacherLesson';
import { Layers, Edit2, Trash2, Check, X, Plus, AlertCircle } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ManageChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: SubjectItem;
  currentGrade: GradeItem;
  lessons: Lesson[];
  chapters?: string[];
  onRenameChapter: (oldName: string, newName: string) => void;
  onDeleteChapter: (chapterName: string) => void;
}

export const ManageChaptersModal: React.FC<ManageChaptersModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
  currentGrade,
  lessons,
  onRenameChapter,
  onDeleteChapter,
}) => {
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  // Chapter statistics for current subject & grade
  const chaptersData = React.useMemo(() => {
    const relevantLessons = lessons.filter(
      (l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level
    );
    const map = new Map<string, { count: number; lessons: Lesson[] }>();

    relevantLessons.forEach((l) => {
      const existing = map.get(l.chapter) || { count: 0, lessons: [] };
      existing.count += 1;
      existing.lessons.push(l);
      map.set(l.chapter, existing);
    });

    return Array.from(map.entries()).map(([chapterName, info]) => ({
      name: chapterName,
      lessonCount: info.count,
      lessons: info.lessons,
    }));
  }, [lessons, currentSubject.id, currentGrade.level]);

  if (!isOpen) return null;

  const handleStartEdit = (name: string) => {
    setEditingChapter(name);
    setEditedName(name);
  };

  const handleSaveEdit = (oldName: string) => {
    if (!editedName.trim() || editedName.trim() === oldName) {
      setEditingChapter(null);
      return;
    }
    onRenameChapter(oldName, editedName.trim());
    setEditingChapter(null);
    setEditedName('');
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setEditedName('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Quản lý Chương & Chủ đề
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {currentSubject.name} • {currentGrade.name} ({chaptersData.length} chương)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Chapters */}
          <div className="py-4 overflow-y-auto space-y-3 flex-1 pr-1">
            {chaptersData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có chương nào trong môn học này.
              </div>
            ) : (
              chaptersData.map((chap, idx) => {
                const isEditing = editingChapter === chap.name;

                return (
                  <div
                    key={chap.name}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    {/* Left info or input */}
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-indigo-400 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(chap.name);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(chap.name)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                            title="Lưu tên chương mới"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                            title="Hủy bỏ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {chap.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 pl-7">
                            Gồm <strong className="text-indigo-600">{chap.lessonCount} bài học</strong> trong chương này
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleStartEdit(chap.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                          title="Đổi tên chương này"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sửa tên</span>
                        </button>

                        <button
                          onClick={() => setChapterToDelete(chap.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                          title="Xóa toàn bộ chương này"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xóa chương</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              💡 Thầy/Cô có thể đổi tên chương để cập nhật đồng bộ cho tất cả bài học trong chương đó.
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>

      {/* Delete Chapter Confirm Dialog */}
      {chapterToDelete && (
        <DeleteConfirmModal
          isOpen={!!chapterToDelete}
          onClose={() => setChapterToDelete(null)}
          onConfirm={() => {
            if (chapterToDelete) {
              onDeleteChapter(chapterToDelete);
              setChapterToDelete(null);
            }
          }}
          title="Xác nhận xóa chương"
          itemName={chapterToDelete}
          itemType="chapter"
          detailsCount={{
            lessonsCount: chaptersData.find((c) => c.name === chapterToDelete)?.lessonCount || 0,
          }}
        />
      )}
    </>
  );
};
