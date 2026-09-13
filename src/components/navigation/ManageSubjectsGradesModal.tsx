import React, { useState } from 'react';
import { SubjectItem, GradeItem, Lesson } from '../../types/teacherLesson';
import { renderSubjectIcon } from './SubjectIconHelper';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  X,
  Settings,
  Layers,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { DeleteConfirmModal } from '../lesson/DeleteConfirmModal';

interface ManageSubjectsGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  grades: GradeItem[];
  lessons: Lesson[];
  onOpenAddSubject: () => void;
  onOpenEditSubject: (subject: SubjectItem) => void;
  onDeleteSubject: (subjectId: string) => void;
  onOpenAddGrade: () => void;
  onOpenEditGrade: (grade: GradeItem) => void;
  onDeleteGrade: (gradeLevel: number) => void;
  onResetDefaults?: () => void;
}

export const ManageSubjectsGradesModal: React.FC<ManageSubjectsGradesModalProps> = ({
  isOpen,
  onClose,
  subjects,
  grades,
  lessons,
  onOpenAddSubject,
  onOpenEditSubject,
  onDeleteSubject,
  onOpenAddGrade,
  onOpenEditGrade,
  onDeleteGrade,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'grades'>('subjects');

  // Deletion modals state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<GradeItem | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white border-2 border-teal-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(13,148,136,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Quản lý Môn học & Khối lớp
              </h3>
              <p className="text-xs text-teal-800 font-medium">
                Tùy biến danh mục giảng dạy, thêm bớt môn học & cấp học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition cursor-pointer border border-teal-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-3 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'subjects'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Danh sách Môn học ({subjects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('grades')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'grades'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Danh sách Khối lớp ({grades.length})</span>
            </button>
          </div>

          {activeTab === 'subjects' ? (
            <button
              onClick={() => {
                onClose();
                onOpenAddSubject();
              }}
              className="btn-3d-citrus inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-950" />
              <span>+ Thêm môn học</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenAddGrade();
              }}
              className="btn-3d-citrus inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-950" />
              <span>+ Thêm khối lớp</span>
            </button>
          )}
        </div>

        {/* Tab 1: Subjects List */}
        {activeTab === 'subjects' && (
          <div className="flex-1 overflow-y-auto pt-2 space-y-3 pr-1">
            {subjects.map((sub) => {
              const lessonCount = lessons.filter((l) => l.subjectId === sub.id).length;
              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-white border-2 border-teal-100 hover:border-teal-300 shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${sub.color} text-white flex items-center justify-center shadow-md shrink-0`}
                    >
                      {renderSubjectIcon(sub.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{sub.name}</span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {sub.code}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {lessonCount} bài học
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {sub.description || 'Chương trình môn học chuẩn GDPT 2018.'}
                      </p>
                      <div className="text-[11px] text-teal-800 font-semibold mt-1">
                        Áp dụng: {sub.grades.map((g) => `Lớp ${g}`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenEditSubject(sub);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => setSubjectToDelete(sub)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Grades List */}
        {activeTab === 'grades' && (
          <div className="flex-1 overflow-y-auto pt-2 space-y-3 pr-1">
            {grades.map((gr) => {
              const lessonCount = lessons.filter((l) => l.grade === gr.level).length;
              const subCount = subjects.filter((s) => s.grades.includes(gr.level)).length;
              return (
                <div
                  key={gr.id}
                  className="p-4 rounded-2xl bg-white border-2 border-purple-100 hover:border-purple-300 shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md font-black text-base shrink-0">
                      {gr.level}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{gr.name}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          Nút chọn: {gr.shortName}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {lessonCount} bài học
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-800 font-semibold mt-1">
                        Áp dụng cho {subCount} môn học
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenEditGrade(gr);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => setGradeToDelete(gr)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer with Reset Option */}
        <div className="flex items-center justify-between pt-4 border-t border-teal-100 mt-2 shrink-0">
          {onResetDefaults ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục danh mục mặc định</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm transition cursor-pointer shadow-md"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Delete Subject Confirm */}
      {subjectToDelete && (
        <DeleteConfirmModal
          isOpen={!!subjectToDelete}
          onClose={() => setSubjectToDelete(null)}
          onConfirm={() => {
            if (subjectToDelete) {
              onDeleteSubject(subjectToDelete.id);
              setSubjectToDelete(null);
            }
          }}
          title="Xác nhận xóa môn học"
          message={`Thầy/Cô có chắc chắn muốn xóa môn "${subjectToDelete.name}" (${subjectToDelete.code})? Tất cả ${
            lessons.filter((l) => l.subjectId === subjectToDelete.id).length
          } bài học thuộc môn này sẽ bị xóa khỏi hệ thống.`}
          confirmText="Xác nhận xóa môn học"
        />
      )}

      {/* Delete Grade Confirm */}
      {gradeToDelete && (
        <DeleteConfirmModal
          isOpen={!!gradeToDelete}
          onClose={() => setGradeToDelete(null)}
          onConfirm={() => {
            if (gradeToDelete) {
              onDeleteGrade(gradeToDelete.level);
              setGradeToDelete(null);
            }
          }}
          title="Xác nhận xóa khối lớp"
          message={`Thầy/Cô có chắc chắn muốn xóa "${gradeToDelete.name}"? Tất cả ${
            lessons.filter((l) => l.grade === gradeToDelete.level).length
          } bài học thuộc khối lớp này sẽ bị xóa khỏi hệ thống.`}
          confirmText="Xác nhận xóa khối lớp"
        />
      )}

      {/* Reset Defaults Confirm */}
      {showResetConfirm && (
        <DeleteConfirmModal
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={() => {
            if (onResetDefaults) onResetDefaults();
            setShowResetConfirm(false);
          }}
          title="Khôi phục danh mục ban đầu"
          message="Thao tác này sẽ đặt lại danh sách môn học và khối lớp về chuẩn GDPT 2018 mặc định. Thầy/Cô có chắc chắn muốn tiếp tục?"
          confirmText="Khôi phục về mặc định"
        />
      )}
    </div>
  );
};
