import React from 'react';
import { SubjectItem, GradeItem } from '../../types/teacherLesson';
import { DEFAULT_SUBJECTS, DEFAULT_GRADES } from '../../data/teacherLessonData';
import { renderSubjectIcon } from './SubjectIconHelper';
import {
  BookOpen,
  Filter,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SubjectGradeSelectorProps {
  subjects?: SubjectItem[];
  grades?: GradeItem[];
  selectedSubjectId: string;
  selectedGradeLevel: number;
  onSelectSubject: (subjectId: string) => void;
  onSelectGrade: (gradeLevel: number) => void;
  onOpenAddSubject?: () => void;
  onOpenAddGrade?: () => void;
  onOpenManage?: () => void;
  onOpenDocLibrary?: () => void;
  sharedDocCount?: number;
}

export const SubjectGradeSelector: React.FC<SubjectGradeSelectorProps> = ({
  subjects = DEFAULT_SUBJECTS,
  grades = DEFAULT_GRADES,
  selectedSubjectId,
  selectedGradeLevel,
  onSelectSubject,
  onSelectGrade,
  onOpenAddSubject,
  onOpenAddGrade,
  onOpenManage,
  onOpenDocLibrary,
  sharedDocCount = 0,
}) => {
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const currentGrade = grades.find((g) => g.level === selectedGradeLevel) || grades[2];

  return (
    <div className="bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.5)] sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Quick Select Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 drop-shadow-xs">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                Môn:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
                {subjects.map((sub) => {
                  const isSelected = sub.id === selectedSubjectId;
                  return (
                    <button
                      key={sub.id}
                      id={`select-subject-${sub.id}`}
                      onClick={() => onSelectSubject(sub.id)}
                      title={sub.description}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                          : 'bg-slate-900/70 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {renderSubjectIcon(sub.iconName, 'w-4 h-4')}
                      <span>{sub.name}</span>
                    </button>
                  );
                })}

                {/* Button Thêm Môn */}
                {onOpenAddSubject && (
                  <button
                    id="btn-quick-add-subject"
                    onClick={onOpenAddSubject}
                    title="Thêm môn học mới vào hệ thống"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-dashed border-cyan-500/50 transition cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Thêm môn</span>
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden xl:block w-px h-6 bg-slate-800" />

            {/* Grade Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 drop-shadow-xs">
                <Filter className="w-3.5 h-3.5 text-purple-400" />
                Khối Lớp:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
                {grades.map((gr) => {
                  const isSelected = gr.level === selectedGradeLevel;
                  return (
                    <button
                      key={gr.id}
                      id={`select-grade-${gr.level}`}
                      onClick={() => onSelectGrade(gr.level)}
                      title={gr.name}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)] font-black'
                          : 'bg-slate-900/70 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {gr.shortName}
                    </button>
                  );
                })}

                {/* Button Thêm Lớp */}
                {onOpenAddGrade && (
                  <button
                    id="btn-quick-add-grade"
                    onClick={onOpenAddGrade}
                    title="Thêm khối lớp / lớp học mới vào hệ thống"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-dashed border-purple-500/50 transition cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Thêm lớp</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Breadcrumb, Kho tài liệu & Manage Settings Button */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
            {/* Quick Button: Kho tài liệu chung Môn/Lớp */}
            {onOpenDocLibrary && (
              <button
                id="btn-quick-open-doc-library"
                onClick={onOpenDocLibrary}
                title={`Mở Kho tài liệu chung của ${currentSubject?.name || 'Môn'} ${currentGrade?.shortName || 'Lớp'}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-blue-200" />
                <span>📚 Kho tài liệu ({sharedDocCount})</span>
              </button>
            )}

            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-800 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE] animate-pulse" />
              Đang chọn: <strong className="font-bold text-cyan-300">{currentSubject?.name || 'Môn học'} - {currentGrade?.shortName || 'Khối lớp'}</strong>
            </span>

            {/* Manage Button */}
            {onOpenManage && (
              <button
                id="btn-manage-subjects-grades"
                onClick={onOpenManage}
                title="Quản lý chi tiết danh mục Môn học & Khối lớp"
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

