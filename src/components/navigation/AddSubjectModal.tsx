import React, { useState, useEffect } from 'react';
import { SubjectItem, GradeItem } from '../../types/teacherLesson';
import {
  AVAILABLE_SUBJECT_ICONS,
  AVAILABLE_GRADIENTS,
  renderSubjectIcon,
} from './SubjectIconHelper';
import {
  BookOpen,
  Plus,
  Edit3,
  X,
  Sparkles,
  Check,
  Layers,
  Palette,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  grades: GradeItem[];
  subjectToEdit?: SubjectItem | null;
  existingSubjects: SubjectItem[];
  onSaveSubject: (subject: SubjectItem) => void;
}

// Popular Preset Subjects in Vietnamese curriculum for 1-click autofill
const PRESET_SUBJECTS = [
  {
    name: 'Ngữ văn',
    code: 'VAN',
    iconName: 'BookOpen',
    color: 'from-amber-600 to-rose-600',
    description: 'Đọc hiểu văn bản, Thực hành tiếng Việt và Viết bài luận (GDPT 2018)',
  },
  {
    name: 'Giáo dục công dân (GDCD)',
    code: 'GDCD',
    iconName: 'Shield',
    color: 'from-teal-600 to-emerald-600',
    description: 'Đạo đức, Kỹ năng sống, Pháp luật và Trách nhiệm công dân (GDPT 2018)',
  },
  {
    name: 'Công nghệ',
    code: 'CN',
    iconName: 'Wrench',
    color: 'from-cyan-600 to-blue-600',
    description: 'Công nghệ nông nghiệp, Công nghiệp và Thiết kế kĩ thuật (GDPT 2018)',
  },
  {
    name: 'Hóa học',
    code: 'HOA',
    iconName: 'FlaskConical',
    color: 'from-purple-600 to-pink-600',
    description: 'Chất, Nguyên tử, Phản ứng hóa học và Hợp chất hữu cơ/vô cơ (GDPT 2018)',
  },
  {
    name: 'Vật lí',
    code: 'VAT_LY',
    iconName: 'Atom',
    color: 'from-blue-600 to-indigo-600',
    description: 'Cơ học, Nhiệt học, Quang học, Điện từ và Năng lượng (GDPT 2018)',
  },
  {
    name: 'Sinh học',
    code: 'SINH',
    iconName: 'Dna',
    color: 'from-emerald-600 to-teal-700',
    description: 'Tế bào, Di truyền, Tiến hóa và Sinh thái học (GDPT 2018)',
  },
  {
    name: 'Âm nhạc',
    code: 'AN',
    iconName: 'Music',
    color: 'from-rose-600 to-red-600',
    description: 'Hát, Nhạc cụ, Đọc nhạc, Lý thuyết âm nhạc và Thường thức âm nhạc',
  },
  {
    name: 'Mĩ thuật',
    code: 'MT',
    iconName: 'Palette',
    color: 'from-amber-600 to-orange-600',
    description: 'Hội họa, Điêu khắc, Thiết kế đồ họa và Mỹ thuật ứng dụng (GDPT 2018)',
  },
  {
    name: 'Hoạt động trải nghiệm',
    code: 'HDTN',
    iconName: 'Sparkles',
    color: 'from-violet-700 to-purple-800',
    description: 'Hoạt động hướng nghiệp, Kỹ năng thích ứng và Phát triển bản thân',
  },
  {
    name: 'Giáo dục thể chất',
    code: 'GDTC',
    iconName: 'Trophy',
    color: 'from-orange-600 to-amber-600',
    description: 'Vận động cơ bản, Thể dục nhịp điệu và Thể thao tự chọn',
  },
];

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  grades,
  subjectToEdit,
  existingSubjects,
  onSaveSubject,
}) => {
  const isEditMode = !!subjectToEdit;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [iconName, setIconName] = useState('BookOpen');
  const [color, setColor] = useState('from-teal-600 to-emerald-600');
  const [description, setDescription] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name || '');
      setCode(subjectToEdit.code || '');
      setIconName(subjectToEdit.iconName || 'BookOpen');
      setColor(subjectToEdit.color || 'from-teal-600 to-emerald-600');
      setDescription(subjectToEdit.description || '');
      setSelectedGrades(subjectToEdit.grades || grades.map((g) => g.level));
    } else {
      setName('');
      setCode('');
      setIconName('BookOpen');
      setColor('from-teal-600 to-emerald-600');
      setDescription('');
      setSelectedGrades(grades.map((g) => g.level));
    }
    setError(null);
  }, [subjectToEdit, isOpen, grades]);

  if (!isOpen) return null;

  // Auto-generate code from name if code is not customized
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!isEditMode && (!code || code === generateSubjectCode(name))) {
      setCode(generateSubjectCode(newName));
    }
  };

  const generateSubjectCode = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase()
      .slice(0, 10);
  };

  const handleApplyPreset = (preset: typeof PRESET_SUBJECTS[0]) => {
    setName(preset.name);
    setCode(preset.code);
    setIconName(preset.iconName);
    setColor(preset.color);
    setDescription(preset.description);
  };

  const toggleGrade = (gradeLevel: number) => {
    if (selectedGrades.includes(gradeLevel)) {
      if (selectedGrades.length === 1) {
        setError('Môn học cần áp dụng cho ít nhất 1 khối lớp.');
        return;
      }
      setSelectedGrades(selectedGrades.filter((g) => g !== gradeLevel));
    } else {
      setSelectedGrades([...selectedGrades, gradeLevel].sort((a, b) => a - b));
    }
    setError(null);
  };

  const handleSelectAllGrades = () => {
    setSelectedGrades(grades.map((g) => g.level));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên môn học.');
      return;
    }

    const cleanCode = code.trim().toUpperCase() || generateSubjectCode(name.trim());
    if (!cleanCode) {
      setError('Vui lòng nhập mã viết tắt của môn học.');
      return;
    }

    // Check duplicate code / name if new
    const isDuplicateCode = existingSubjects.some(
      (s) => s.code.toUpperCase() === cleanCode && s.id !== subjectToEdit?.id
    );
    if (isDuplicateCode) {
      setError(`Mã môn "${cleanCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác.`);
      return;
    }

    if (selectedGrades.length === 0) {
      setError('Vui lòng chọn ít nhất một khối lớp giảng dạy môn học này.');
      return;
    }

    const subjectId =
      subjectToEdit?.id ||
      `subj-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newSubject: SubjectItem = {
      id: subjectId,
      code: cleanCode,
      name: name.trim(),
      iconName: iconName,
      color: color,
      description: description.trim() || `Chương trình môn học ${name.trim()} chuẩn GDPT 2018.`,
      grades: selectedGrades,
    };

    onSaveSubject(newSubject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white border-2 border-teal-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(13,148,136,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                isEditMode
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-teal-500 to-emerald-600'
              }`}
            >
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isEditMode ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
              </h3>
              <p className="text-xs text-teal-800 font-medium">
                Mở rộng chương trình giảng dạy & tạo đề thi theo bộ môn
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Fast Presets (Only in Create Mode) */}
          {!isEditMode && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mẫu môn học gợi ý nhanh (1-Click)
                </span>
                <span className="text-[11px] text-slate-500">Nhấn để tự động điền</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {PRESET_SUBJECTS.map((preset) => {
                  const isExisting = existingSubjects.some(
                    (s) => s.code.toUpperCase() === preset.code.toUpperCase()
                  );
                  return (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        name === preset.name
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : isExisting
                          ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          : 'bg-teal-50/70 text-teal-900 border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                      }`}
                    >
                      {renderSubjectIcon(preset.iconName, 'w-3.5 h-3.5')}
                      <span>{preset.name}</span>
                      {isExisting && <span className="text-[10px] text-slate-400 font-normal">(đã có)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tên môn & Mã môn */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên môn học *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Ngữ văn, Hóa học, GDCD, Mỹ thuật..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-teal-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:ring-4 focus:ring-teal-400/20 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã viết tắt *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: VAN, HOA, GDCD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-teal-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-mono font-black focus:bg-white focus:ring-4 focus:ring-teal-400/20 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Chọn Biểu tượng (Icon Selector Grid) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Biểu tượng đại diện môn học
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50/80 border-2 border-teal-100 rounded-2xl">
              {AVAILABLE_SUBJECT_ICONS.map((iconOpt) => {
                const isSelected = iconName === iconOpt.name;
                return (
                  <button
                    key={iconOpt.name}
                    type="button"
                    title={iconOpt.label}
                    onClick={() => setIconName(iconOpt.name)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    {renderSubjectIcon(iconOpt.name, 'w-5 h-5 mb-1')}
                    <span className="text-[10px] truncate max-w-full text-center leading-tight">
                      {iconOpt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn Màu sắc / Gradient */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              Tông màu chủ đạo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_GRADIENTS.map((grad) => {
                const isSelected = color === grad.gradient;
                return (
                  <button
                    key={grad.id}
                    type="button"
                    onClick={() => setColor(grad.gradient)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-400 bg-teal-50 text-teal-950 font-extrabold'
                        : 'border-slate-200 hover:border-teal-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${grad.gradient} shrink-0 shadow-xs`} />
                    <span className="truncate text-[11px]">{grad.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn Khối lớp áp dụng */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Khối lớp áp dụng môn học *
              </label>
              <button
                type="button"
                onClick={handleSelectAllGrades}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                Chọn tất cả khối lớp
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {grades.map((gr) => {
                const isChecked = selectedGrades.includes(gr.level);
                return (
                  <button
                    key={gr.id}
                    type="button"
                    onClick={() => toggleGrade(gr.level)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isChecked
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-white text-purple-700 font-black' : 'border border-slate-300'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </span>
                    <span>{gr.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mô tả môn học */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả ngắn gọn
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Chương trình môn học bám sát chuẩn kiến thức kĩ năng GDPT 2018..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-teal-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-4 focus:ring-teal-400/20 focus:border-teal-500 transition resize-none"
            />
          </div>

          {/* Preview Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 via-cyan-50 to-purple-50 border-2 border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}
              >
                {renderSubjectIcon(iconName, 'w-5 h-5')}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span>{name || 'Tên môn học'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-200/60 text-teal-950">
                    {code || 'CODE'}
                  </span>
                </div>
                <div className="text-[11px] text-teal-800 font-medium">
                  Áp dụng: {selectedGrades.map((g) => `Lớp ${g}`).join(', ') || 'Chưa chọn lớp'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-teal-900 bg-white px-2.5 py-1 rounded-xl border border-teal-200">
              Xem trước
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-teal-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-3d-citrus px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer"
            >
              {isEditMode ? 'Cập nhật môn học' : 'Lưu & Thêm môn học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
