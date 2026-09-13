import React, { useState } from 'react';
import { Lesson, SubjectItem, GradeItem } from '../../types/teacherLesson';
import {
  BookOpen,
  FolderOpen,
  Gamepad2,
  Sparkles,
  ArrowRight,
  Plus,
  Search,
  Layers,
  HelpCircle,
  Clock,
  Video,
  FileText,
  Presentation,
  CheckCircle2,
  Edit2,
  Trash2,
  Settings,
  MoreVertical,
  FolderEdit,
} from 'lucide-react';
import { EditLessonModal } from './EditLessonModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ManageChaptersModal } from './ManageChaptersModal';
import { ThreeDOpenBook, ThreeDAtomicAsteroid } from '../common/ThreeDVisuals';

interface LessonListViewProps {
  lessons: Lesson[];
  currentSubject: SubjectItem;
  currentGrade: GradeItem;
  onSelectLesson: (lessonId: string) => void;
  onCreateNewLesson?: (lessonData: Partial<Lesson>) => void;
  onEditLesson?: (lessonData: Partial<Lesson>) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onRenameChapter?: (oldName: string, newName: string) => void;
  onDeleteChapter?: (chapterName: string) => void;
  onOpenDocLibrary?: () => void;
}

export const LessonListView: React.FC<LessonListViewProps> = ({
  lessons,
  currentSubject,
  currentGrade,
  onSelectLesson,
  onCreateNewLesson,
  onEditLesson,
  onDeleteLesson,
  onRenameChapter,
  onDeleteChapter,
  onOpenDocLibrary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');

  // Reset selected chapter and search whenever subject or grade changes
  React.useEffect(() => {
    setSelectedChapter('all');
    setSearchQuery('');
  }, [currentSubject.id, currentGrade.level]);

  // Modal States
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  const [showManageChaptersModal, setShowManageChaptersModal] = useState(false);
  const [quickRenameChapter, setQuickRenameChapter] = useState<string | null>(null);
  const [quickDeleteChapter, setQuickDeleteChapter] = useState<string | null>(null);

  // Extract unique chapters for current subject and grade
  const availableChapters = React.useMemo(() => {
    const chapters = lessons
      .filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level)
      .map((l) => l.chapter);
    return Array.from(new Set(chapters));
  }, [lessons, currentSubject.id, currentGrade.level]);

  // Filter lessons based on subject, grade, chapter, and search term
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSubject = lesson.subjectId === currentSubject.id;
    const matchesGrade = lesson.grade === currentGrade.level;
    const matchesChapter = selectedChapter === 'all' || lesson.chapter === selectedChapter;
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesGrade && matchesChapter && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingLesson(null);
    setShowLessonModal(true);
  };

  const handleOpenEditLesson = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setEditingLesson(lesson);
    setShowLessonModal(true);
  };

  const handleOpenDeleteLesson = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setLessonToDelete(lesson);
  };

  const handleSaveLesson = (lessonData: Partial<Lesson>) => {
    if (editingLesson && onEditLesson) {
      onEditLesson(lessonData);
    } else if (onCreateNewLesson) {
      onCreateNewLesson(lessonData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* 3D Modern Hero Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-950 rounded-3xl p-6 sm:p-9 text-white shadow-[0_20px_45px_rgba(13,148,136,0.35)] mb-8 relative overflow-hidden border border-teal-500/40">
        {/* Glowing Ambient Backdrop Highlights */}
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 w-60 h-40 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: 3D Atomic Asteroid & Typography */}
          <div className="flex items-start gap-4 sm:gap-6 max-w-3xl">
            {/* Small Exquisite 3D Atomic Asteroid in the top-left corner */}
            <div className="shrink-0 pt-1">
              <ThreeDAtomicAsteroid className="w-14 h-14 sm:w-16 sm:h-16" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-400/20 backdrop-blur-md text-xs font-extrabold text-teal-200 border border-teal-300/30 mb-3 shadow-[0_0_12px_rgba(45,212,191,0.25)]">
                <span>{currentSubject.name}</span>
                <span>•</span>
                <span>{currentGrade.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                Hệ thống Bài học & Trò chơi {currentSubject.name} {currentGrade.shortName}
              </h1>
              <p className="text-sm text-teal-100/90 mt-2.5 leading-relaxed drop-shadow-xs max-w-2xl font-medium">
                Quản lý toàn diện chương trình giảng dạy: Thêm mới, chỉnh sửa, xóa bài học và các chương/chủ đề theo chuẩn SGK GDPT 2018.
              </p>
            </div>
          </div>

          {/* Right: 3D Open Book Display & Glossy Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 self-start lg:self-center shrink-0">
            {/* 3D Stylized Open Book with Math Symbols */}
            <div className="hidden xl:block">
              <ThreeDOpenBook className="w-24 h-24 transform hover:scale-108 hover:rotate-3 transition-transform duration-300" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Document Library Button - 3D Blue Glossy */}
              {onOpenDocLibrary && (
                <button
                  id="list-open-doc-library-btn"
                  onClick={onOpenDocLibrary}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title={`Mở Kho tài liệu chung của ${currentSubject.name} ${currentGrade.shortName}`}
                >
                  <BookOpen className="w-4 h-4 text-blue-200" />
                  <span>📚 Kho tài liệu ({currentSubject.name} {currentGrade.shortName})</span>
                </button>
              )}

              {/* Manage Chapters Button - 3D Glossy Citrus */}
              <button
                id="manage-chapters-btn"
                onClick={() => setShowManageChaptersModal(true)}
                className="btn-3d-citrus inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm cursor-pointer"
                title="Quản lý đổi tên hoặc xóa các chương"
              >
                <Layers className="w-4 h-4 text-amber-900" />
                <span>Quản lý chương ({availableChapters.length})</span>
              </button>

              {/* Add New Lesson Button - 3D Glossy Citrus */}
              <button
                id="add-new-lesson-btn"
                onClick={handleOpenCreateModal}
                className="btn-3d-citrus inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-900" />
                <span>Thêm bài học mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar with Eduverse Dark Glassmorphism */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none drop-shadow-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm bài học trong ${currentSubject.name} ${currentGrade.shortName}...`}
            className="w-full pl-11 pr-4 py-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 shadow-inner transition font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl text-xs font-bold text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition cursor-pointer max-w-xs truncate"
          >
            <option value="all">Tất cả chương / chủ đề ({lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level).length})</option>
            {availableChapters.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          <div className="text-xs font-bold text-slate-400 hidden sm:flex items-center gap-1.5 whitespace-nowrap">
            <span>Hiển thị:</span>
            <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              {filteredLessons.length} bài
            </span>
          </div>
        </div>
      </div>

      {/* Chapter Pills for quick filtering & management */}
      {availableChapters.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          <button
            onClick={() => setSelectedChapter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
              selectedChapter === 'all'
                ? 'btn-3d-teal btn-3d-pressed shadow-inner'
                : 'bg-white text-teal-900 hover:bg-teal-50 border-2 border-teal-200 shadow-sm'
            }`}
          >
            Tất cả chương ({lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level).length} bài)
          </button>

          {availableChapters.map((ch) => {
            const shortChName = ch.split(':')[0] || ch;
            const count = lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level && l.chapter === ch).length;
            const isSelected = selectedChapter === ch;

            return (
              <div
                key={ch}
                className={`inline-flex items-center rounded-2xl transition ${
                  isSelected
                    ? 'btn-3d-teal btn-3d-pressed'
                    : 'bg-white text-teal-900 border-2 border-teal-200 hover:border-teal-300 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setSelectedChapter(ch)}
                  title={ch}
                  className="px-3.5 py-2 text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                >
                  <span>{shortChName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-teal-100 text-teal-800'
                  }`}>
                    {count}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Manage chapter shortcut pill */}
          <button
            onClick={() => setShowManageChaptersModal(true)}
            className="px-3.5 py-2 rounded-2xl text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Quản lý chương</span>
          </button>
        </div>
      )}

      {/* Chapter Action Bar if a single chapter is selected */}
      {selectedChapter !== 'all' && availableChapters.includes(selectedChapter) && (
        <div className="mb-6 p-4.5 rounded-3xl bg-gradient-to-r from-teal-50 via-cyan-50 to-purple-50 border-2 border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_8px_20px_rgba(13,148,136,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-teal-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-teal-950">{selectedChapter}</div>
              <div className="text-[11px] text-teal-700 font-semibold">Đang chọn lọc {filteredLessons.length} bài học thuộc chương này</div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                setShowManageChaptersModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-800 border-2 border-amber-300 hover:bg-amber-50 text-xs font-extrabold transition cursor-pointer shadow-sm hover:shadow-md"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Sửa tên chương</span>
            </button>

            <button
              onClick={() => setQuickDeleteChapter(selectedChapter)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-rose-700 border-2 border-rose-300 hover:bg-rose-50 text-xs font-extrabold transition cursor-pointer shadow-sm hover:shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa chương</span>
            </button>
          </div>
        </div>
      )}

      {/* Lesson Cards Grid with Eduverse Glassmorphism */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredLessons.map((lesson, idx) => {
            const totalQuestions = lesson.questionSets.reduce(
              (acc, qs) => acc + (qs.questions?.length || 0),
              0
            );

            // Compute realistic progress for edutech gamification
            const progress = idx === 0 ? 85 : idx === 1 ? 50 : idx === 2 ? 20 : 0;
            const statusText = progress >= 80 ? 'Đã học' : progress > 0 ? 'Đang học' : 'Chưa học';
            const statusColor =
              progress >= 80
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : progress > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60';

            return (
              <div
                key={lesson.id}
                id={`lesson-card-${lesson.id}`}
                className="eduverse-glass rounded-3xl flex flex-col overflow-hidden group border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300"
              >
                {/* Card Header */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Chapter badge, Status & Quick Edit/Delete Buttons */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span 
                        title={lesson.chapter}
                        className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 truncate max-w-[130px]"
                      >
                        {lesson.chapter}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border whitespace-nowrap ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-500/30">
                        {lesson.code}
                      </span>

                      {/* Quick Edit Lesson Button */}
                      <button
                        id={`edit-lesson-btn-${lesson.id}`}
                        onClick={(e) => handleOpenEditLesson(e, lesson)}
                        title="Chỉnh sửa bài học"
                        className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-amber-900/40 text-amber-400 border border-slate-700 hover:border-amber-500/40 flex items-center justify-center transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Delete Lesson Button */}
                      <button
                        id={`delete-lesson-btn-${lesson.id}`}
                        onClick={(e) => handleOpenDeleteLesson(e, lesson)}
                        title="Xóa bài học"
                        className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-rose-400 border border-slate-700 hover:border-rose-500/40 flex items-center justify-center transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title with Glowing Hover Effect */}
                  <h3 
                    onClick={() => onSelectLesson(lesson.id)}
                    className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition mb-2 leading-snug line-clamp-2 cursor-pointer"
                  >
                    {lesson.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1 font-medium">
                    {lesson.description || 'Nội dung bài học chuẩn kiến thức kỹ năng GDPT 2018.'}
                  </p>

                  {/* Learning Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                      <span>Tiến độ học tập</span>
                      <span className="text-cyan-400 font-mono font-bold">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Content Stats Bar */}
                  <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 leading-tight font-medium">Kho tài liệu</div>
                        <div className="text-xs font-bold text-white">
                          SGK & Học liệu
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 leading-tight font-medium">Bộ đề câu hỏi</div>
                        <div className="text-xs font-bold text-white">
                          {lesson.questionSets.length} bộ ({totalQuestions} câu)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => handleOpenEditLesson(e, lesson)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa bài</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={(e) => handleOpenDeleteLesson(e, lesson)}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>

                  <button
                    id={`open-lesson-btn-${lesson.id}`}
                    onClick={() => onSelectLesson(lesson.id)}
                    className="eduverse-btn-cyan inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  >
                    <span>Vào bài học</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border-2 border-teal-200 p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border-2 border-teal-200 shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">
            {lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level).length === 0
              ? `Chưa có bài học cho ${currentSubject.name} ${currentGrade.shortName}`
              : `Không tìm thấy bài học phù hợp`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed font-medium">
            {lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level).length === 0
              ? `Môn ${currentSubject.name} (${currentGrade.shortName}) hiện chưa có bài học hoặc chương nào. Thầy/Cô hãy bắt đầu tạo bài học mới.`
              : `Không có bài học nào khớp với từ khóa tìm kiếm hoặc chương đã chọn. Thầy/Cô vui lòng thử lại.`}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="btn-3d-citrus inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-950" />
            <span>+ Tạo bài học mới cho {currentSubject.name}</span>
          </button>
        </div>
      )}

      {/* 1. Modal Create / Edit Lesson */}
      {showLessonModal && (
        <EditLessonModal
          isOpen={showLessonModal}
          onClose={() => setShowLessonModal(false)}
          lesson={editingLesson}
          currentSubject={currentSubject}
          currentGrade={currentGrade}
          availableChapters={availableChapters}
          onSaveLesson={handleSaveLesson}
        />
      )}

      {/* 2. Modal Delete Lesson Confirm */}
      {lessonToDelete && (
        <DeleteConfirmModal
          isOpen={!!lessonToDelete}
          onClose={() => setLessonToDelete(null)}
          onConfirm={() => {
            if (lessonToDelete && onDeleteLesson) {
              onDeleteLesson(lessonToDelete.id);
              setLessonToDelete(null);
            }
          }}
          title="Xác nhận xóa bài học"
          message={`Thầy/Cô có chắc chắn muốn xóa bài học "${lessonToDelete.title}"? Toàn bộ tài liệu học tập và bộ câu hỏi thuộc bài học này sẽ bị xóa khỏi hệ thống.`}
          confirmText="Xác nhận xóa bài học"
        />
      )}

      {/* 3. Modal Manage All Chapters */}
      {showManageChaptersModal && (
        <ManageChaptersModal
          isOpen={showManageChaptersModal}
          onClose={() => setShowManageChaptersModal(false)}
          chapters={availableChapters}
          lessons={lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level)}
          currentSubject={currentSubject}
          currentGrade={currentGrade}
          onRenameChapter={(oldName, newName) => {
            if (onRenameChapter) {
              onRenameChapter(oldName, newName);
            }
          }}
          onDeleteChapter={(chapterName) => {
            if (onDeleteChapter) {
              onDeleteChapter(chapterName);
            }
          }}
        />
      )}

      {/* 4. Quick Delete Single Chapter Confirm */}
      {quickDeleteChapter && (
        <DeleteConfirmModal
          isOpen={!!quickDeleteChapter}
          onClose={() => setQuickDeleteChapter(null)}
          onConfirm={() => {
            if (quickDeleteChapter && onDeleteChapter) {
              onDeleteChapter(quickDeleteChapter);
              setQuickDeleteChapter(null);
              setSelectedChapter('all');
            }
          }}
          title="Xác nhận xóa toàn bộ chương"
          message={`Thầy/Cô có chắc chắn muốn xóa "${quickDeleteChapter}"? Toàn bộ ${
            lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level && l.chapter === quickDeleteChapter).length
          } bài học thuộc chương này sẽ bị xóa hoàn toàn.`}
          confirmText="Xóa chương & toàn bộ bài học"
        />
      )}
    </div>
  );
};

