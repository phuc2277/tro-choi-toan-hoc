import React, { useState, useEffect } from 'react';
import { GradeItem, SubjectItem } from '../../types/teacherLesson';
import {
  GraduationCap,
  Plus,
  Edit3,
  X,
  Sparkles,
  Layers,
  AlertCircle,
  Check,
} from 'lucide-react';

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeToEdit?: GradeItem | null;
  existingGrades: GradeItem[];
  existingSubjects: SubjectItem[];
  onSaveGrade: (grade: GradeItem, applyToSubjectIds: string[]) => void;
}

// Preset Popular Grades in Vietnamese School System
const PRESET_GRADES = [
  { level: 10, name: 'Khối Lớp 10', shortName: 'Lớp 10', category: 'THPT' },
  { level: 11, name: 'Khối Lớp 11', shortName: 'Lớp 11', category: 'THPT' },
  { level: 12, name: 'Khối Lớp 12', shortName: 'Lớp 12', category: 'THPT' },
  { level: 5, name: 'Khối Lớp 5', shortName: 'Lớp 5', category: 'Tiểu học' },
  { level: 4, name: 'Khối Lớp 4', shortName: 'Lớp 4', category: 'Tiểu học' },
  { level: 3, name: 'Khối Lớp 3', shortName: 'Lớp 3', category: 'Tiểu học' },
  { level: 2, name: 'Khối Lớp 2', shortName: 'Lớp 2', category: 'Tiểu học' },
  { level: 1, name: 'Khối Lớp 1', shortName: 'Lớp 1', category: 'Tiểu học' },
];

export const AddGradeModal: React.FC<AddGradeModalProps> = ({
  isOpen,
  onClose,
  gradeToEdit,
  existingGrades,
  existingSubjects,
  onSaveGrade,
}) => {
  const isEditMode = !!gradeToEdit;

  const [level, setLevel] = useState<number>(10);
  const [name, setName] = useState('Khối Lớp 10');
  const [shortName, setShortName] = useState('Lớp 10');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gradeToEdit) {
      setLevel(gradeToEdit.level);
      setName(gradeToEdit.name);
      setShortName(gradeToEdit.shortName);
      // find subjects containing this grade
      const relatedSubIds = existingSubjects
        .filter((s) => s.grades.includes(gradeToEdit.level))
        .map((s) => s.id);
      setSelectedSubjectIds(relatedSubIds);
    } else {
      // Default to next available grade level (e.g. 10 if 6-9 already exist)
      const existingLevels = existingGrades.map((g) => g.level);
      let nextLevel = 10;
      if (existingLevels.includes(10)) nextLevel = 11;
      if (existingLevels.includes(11)) nextLevel = 12;
      if (existingLevels.includes(12)) nextLevel = 5;

      setLevel(nextLevel);
      setName(`Khối Lớp ${nextLevel}`);
      setShortName(`Lớp ${nextLevel}`);
      setSelectedSubjectIds(existingSubjects.map((s) => s.id));
    }
    setError(null);
  }, [gradeToEdit, isOpen, existingGrades, existingSubjects]);

  if (!isOpen) return null;

  const handleLevelChange = (newLevelNum: number) => {
    setLevel(newLevelNum);
    if (!isEditMode) {
      setName(`Khối Lớp ${newLevelNum}`);
      setShortName(`Lớp ${newLevelNum}`);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_GRADES[0]) => {
    setLevel(preset.level);
    setName(preset.name);
    setShortName(preset.shortName);
  };

  const toggleSubject = (subId: string) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjectIds(existingSubjects.map((s) => s.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên đầy đủ của khối lớp.');
      return;
    }
    if (!shortName.trim()) {
      setError('Vui lòng nhập tên rút gọn hiển thị trên thanh chọn.');
      return;
    }

    const numLevel = Number(level);
    if (isNaN(numLevel) || numLevel < 1 || numLevel > 99) {
      setError('Cấp độ khối lớp phải là số nguyên từ 1 đến 99.');
      return;
    }

    // Check duplicate level if creating new
    const isDuplicate = existingGrades.some(
      (g) => g.level === numLevel && g.id !== gradeToEdit?.id
    );
    if (isDuplicate) {
      setError(`Khối Lớp ${numLevel} đã tồn tại trong danh sách. Vui lòng chọn cấp độ hoặc chỉnh sửa khối lớp đó.`);
      return;
    }

    const gradeId = gradeToEdit?.id || `grade-${numLevel}-${Date.now().toString().slice(-4)}`;

    const newGrade: GradeItem = {
      id: gradeId,
      level: numLevel,
      name: name.trim(),
      shortName: shortName.trim(),
    };

    onSaveGrade(newGrade, selectedSubjectIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white border-2 border-purple-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(147,51,234,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                isEditMode
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600'
              }`}
            >
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isEditMode ? 'Chỉnh sửa khối lớp' : 'Thêm khối lớp / lớp học mới'}
              </h3>
              <p className="text-xs text-purple-800 font-medium">
                Mở rộng cấp học từ Tiểu học, THCS đến THPT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition cursor-pointer border border-purple-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Presets */}
          {!isEditMode && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  Mẫu khối lớp gợi ý nhanh
                </span>
                <span className="text-[11px] text-slate-500">1-Click điền nhanh</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {PRESET_GRADES.map((preset) => {
                  const isExisting = existingGrades.some((g) => g.level === preset.level);
                  return (
                    <button
                      key={preset.level}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        level === preset.level
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : isExisting
                          ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <span>{preset.shortName}</span>
                      <span className="text-[10px] opacity-75">({preset.category})</span>
                      {isExisting && <span className="text-[10px] text-slate-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Level number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Cấp độ / Lớp số *
              </label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={level}
                onChange={(e) => handleLevelChange(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-purple-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-purple-400/20 focus:border-purple-500 transition text-center"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên hiển thị đầy đủ *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Khối Lớp 10, Khối Lớp 11..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-purple-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:ring-4 focus:ring-purple-400/20 focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Short Name on button */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên rút gọn (Hiển thị trên nút chọn nhanh) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Lớp 10, Lớp 11, 9A1..."
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-purple-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-purple-400/20 focus:border-purple-500 transition"
            />
          </div>

          {/* Liên kết với Môn học */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Áp dụng cho các môn học hiện có
              </label>
              <button
                type="button"
                onClick={handleSelectAllSubjects}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                Chọn tất cả môn
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50/80 border-2 border-purple-100 rounded-2xl">
              {existingSubjects.map((sub) => {
                const isChecked = selectedSubjectIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubject(sub.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isChecked
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-white text-teal-700 font-black' : 'border border-slate-300'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </span>
                    <span>{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50 to-teal-50 border-2 border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md font-black text-sm">
                {level}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">{name || 'Khối Lớp'}</div>
                <div className="text-[11px] text-purple-800 font-medium">
                  Nút chọn hiển thị: <span className="font-bold text-purple-950">{shortName || 'Lớp'}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-900 bg-white px-2.5 py-1 rounded-xl border border-purple-200">
              Xem trước
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-3d-lavender px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer"
            >
              {isEditMode ? 'Cập nhật khối lớp' : 'Lưu & Thêm khối lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
