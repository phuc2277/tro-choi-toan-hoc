import React from 'react';
import { LessonPresentationPackage } from '../../../types/contentBlock';
import { BookOpen, Calendar, Clock, GraduationCap, School, User, Bookmark, CheckCircle2, AlertCircle } from 'lucide-react';

interface Step1LessonInfoProps {
  packageData: LessonPresentationPackage;
  onUpdate: (updates: Partial<LessonPresentationPackage>) => void;
}

export const Step1LessonInfo: React.FC<Step1LessonInfoProps> = ({ packageData, onUpdate }) => {
  const isTitleValid = packageData.title && packageData.title.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Bước 1: Thông tin bài học chuẩn GDPT 2018</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Kê khai đầy đủ thông tin sư phạm để bài giảng đạt chuẩn hồ sơ dạy học điện tử.
          </p>
        </div>

        {/* Trạng thái bài giảng */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Trạng thái:</span>
          <select
            value={packageData.status || 'draft'}
            onChange={(e) => onUpdate({ status: e.target.value as 'draft' | 'completed' })}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${
              packageData.status === 'completed'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <option value="draft">Bản nháp (Đang soạn)</option>
            <option value="completed">Đã hoàn thiện</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tên bài */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>
              Tên bài học / Chuyên đề <span className="text-red-500">*</span>:
            </span>
            {!isTitleValid && (
              <span className="text-[11px] text-red-500 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3" />
                Vui lòng nhập tên bài
              </span>
            )}
          </label>
          <input
            type="text"
            value={packageData.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Ví dụ: Đơn thức và Đa thức nhiều biến"
            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${
              !isTitleValid ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
            }`}
          />
        </div>

        {/* Môn học */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Môn học <span className="text-red-500">*</span>:</span>
          </label>
          <input
            type="text"
            value={packageData.subject}
            onChange={(e) => onUpdate({ subject: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Khối lớp */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <School className="w-3.5 h-3.5 text-indigo-600" />
            <span>Khối lớp <span className="text-red-500">*</span>:</span>
          </label>
          <select
            value={packageData.grade}
            onChange={(e) => onUpdate({ grade: Number(e.target.value) })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {[6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
        </div>

        {/* Chương / Chủ đề */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chương / Chủ đề:</span>
          </label>
          <input
            type="text"
            value={packageData.chapter || ''}
            onChange={(e) => onUpdate({ chapter: e.target.value })}
            placeholder="Ví dụ: Chương 1: Biểu thức đại số"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Tiết PPCT */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tiết theo PPCT:</span>
          </label>
          <input
            type="text"
            value={packageData.period || ''}
            onChange={(e) => onUpdate({ period: e.target.value })}
            placeholder="Ví dụ: Tiết 1, 2"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Bộ sách */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Bộ sách giáo khoa:
          </label>
          <select
            value={packageData.bookSeries || 'Kết nối tri thức'}
            onChange={(e) => onUpdate({ bookSeries: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Kết nối tri thức">Kết nối tri thức với cuộc sống</option>
            <option value="Cánh diều">Cánh diều</option>
            <option value="Chương trình nâng cao">Chương trình bồi dưỡng / Nâng cao</option>
          </select>
        </div>

        {/* Thời lượng */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Thời lượng dự kiến:</span>
          </label>
          <input
            type="text"
            value={packageData.duration || '45 phút (1 tiết)'}
            onChange={(e) => onUpdate({ duration: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Giáo viên soạn */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span>Giáo viên biên soạn:</span>
          </label>
          <input
            type="text"
            value={packageData.teacherName || 'Giáo viên bộ môn'}
            onChange={(e) => onUpdate({ teacherName: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Năm học */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Năm học:</span>
          </label>
          <input
            type="text"
            value={packageData.schoolYear || '2025 - 2026'}
            onChange={(e) => onUpdate({ schoolYear: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Mục tiêu bài học */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Mục tiêu cần đạt (Yêu cầu cần đạt chuẩn GDPT 2018):
          </label>
          <textarea
            rows={3}
            value={(packageData.objectives || []).join('\n')}
            onChange={(e) =>
              onUpdate({
                objectives: e.target.value.split('\n').filter((line) => line.trim().length > 0),
              })
            }
            placeholder="Mỗi dòng là một mục tiêu kiến thức, năng lực hoặc phẩm chất..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
