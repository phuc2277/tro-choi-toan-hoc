import React, { useState, useEffect } from 'react';
import { Lesson, SubjectItem, GradeItem } from '../../types/teacherLesson';
import { Edit3, Plus, X, Layers, BookOpen, AlertCircle } from 'lucide-react';

interface EditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson?: Lesson | null; // If provided -> edit mode, if null -> create mode
  currentSubject: SubjectItem;
  currentGrade: GradeItem;
  availableChapters: string[];
  onSaveLesson: (lessonData: Partial<Lesson>) => void;
}

export const EditLessonModal: React.FC<EditLessonModalProps> = ({
  isOpen,
  onClose,
  lesson,
  currentSubject,
  currentGrade,
  availableChapters,
  onSaveLesson,
}) => {
  const isEditMode = !!lesson;

  const [title, setTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [code, setCode] = useState('');
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '');
      setShortTitle(lesson.shortTitle || '');
      setChapter(lesson.chapter || (availableChapters.length > 0 ? availableChapters[0] : 'Chương 1: Mở đầu'));
      setCode(lesson.code || '');
      setLessonNumber(lesson.lessonNumber || 1);
      setDescription(lesson.description || '');
      setIsCustomChapter(!availableChapters.includes(lesson.chapter));
    } else {
      setTitle('');
      setShortTitle('');
      setChapter(availableChapters.length > 0 ? availableChapters[0] : 'Chương 1: Mở đầu');
      setCode(`${currentSubject.code}${currentGrade.level}-B1`);
      setLessonNumber(1);
      setDescription('');
      setIsCustomChapter(availableChapters.length === 0);
    }
  }, [lesson, isOpen, availableChapters, currentSubject, currentGrade]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedChapter = chapter.trim() || 'Chương 1';
    const computedShortTitle = shortTitle.trim() || title.trim().replace(/^Bài \d+:\s*/i, '');

    const lessonData: Partial<Lesson> = {
      ...(lesson ? { id: lesson.id } : {
        id: `lesson-${currentSubject.id}${currentGrade.level}-custom-${Date.now()}`,
        presentations: [],
        questionSets: [],
      }),
      subjectId: currentSubject.id,
      gradeId: currentGrade.id,
      grade: currentGrade.level,
      subject: currentSubject.name,
      chapter: trimmedChapter,
      lessonNumber: Number(lessonNumber) || 1,
      code: code.trim() || `${currentSubject.code}${currentGrade.level}-B${lessonNumber}`,
      title: title.trim(),
      shortTitle: computedShortTitle,
      description: description.trim() || `Bài học môn ${currentSubject.name} lớp ${currentGrade.level}`,
    };

    onSaveLesson(lessonData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              isEditMode ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentSubject.name} • {currentGrade.name}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1">
          {/* Tên bài học */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên bài học đầy đủ *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Bài 1: Tập hợp các số hữu tỉ và các phép tính"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!shortTitle || !isEditMode) {
                  setShortTitle(e.target.value.replace(/^Bài \d+:\s*/i, ''));
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          {/* Tên rút gọn & Mã bài học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên ngắn / Tiêu đề phụ
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Số hữu tỉ"
                value={shortTitle}
                onChange={(e) => setShortTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã bài học (Code)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: TOAN7-B1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Thuộc Chương / Chủ đề */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chương / Chủ đề *
              </label>
              {availableChapters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomChapter(!isCustomChapter)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                >
                  {isCustomChapter ? 'Chọn từ danh sách có sẵn' : '+ Nhập tên chương mới'}
                </button>
              )}
            </div>

            {isCustomChapter || availableChapters.length === 0 ? (
              <input
                type="text"
                required
                placeholder="Nhập tên chương mới (Ví dụ: Chương 1: Mở đầu)..."
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-indigo-50/50 border border-indigo-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            ) : (
              <select
                value={chapter}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCustomChapter(true);
                    setChapter('');
                  } else {
                    setChapter(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition cursor-pointer"
              >
                {availableChapters.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
                <option value="__NEW__">+ Nhập chương mới...</option>
              </select>
            )}
          </div>

          {/* Số thứ tự bài học */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Số thứ tự bài (Thứ tự hiển thị)
            </label>
            <input
              type="number"
              step="0.1"
              value={lessonNumber}
              onChange={(e) => setLessonNumber(parseFloat(e.target.value) || 1)}
              className="w-full sm:w-1/3 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          {/* Mô tả bài học */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tóm tắt nội dung & Mục tiêu bài học
            </label>
            <textarea
              rows={3}
              placeholder="Tóm tắt yêu cầu cần đạt, định nghĩa, công thức trọng tâm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer flex items-center gap-2 ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {isEditMode ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEditMode ? 'Lưu thay đổi' : 'Tạo bài học'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
