import React, { useState, useRef } from 'react';
import { TeacherUser } from '../../types/teacherLesson';
import {
  Camera,
  UploadCloud,
  Link2,
  Check,
  RotateCcw,
  Sparkles,
  User,
  Image as ImageIcon,
  AlertCircle,
  X,
} from 'lucide-react';

interface TeacherAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher: TeacherUser;
  onSaveTeacher: (updatedTeacher: TeacherUser) => void;
}

// Curated preset avatars for teachers
const PRESET_AVATARS = [
  {
    id: 'preset-1',
    label: 'Thầy giáo thanh lịch',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-2',
    label: 'Thầy giáo trẻ năng động',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-3',
    label: 'Thầy giáo chững chạc',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-4',
    label: 'Thầy giáo Toán - STEM',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-5',
    label: 'Cô giáo tận tụy',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-6',
    label: 'Cô giáo thân thiện',
    url: 'https://images.unsplash.com/photo-1580894732479-79883d690a61?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-7',
    label: 'Avatar Minh họa 1',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherPhuc&backgroundColor=b6e3f4',
  },
  {
    id: 'preset-8',
    label: 'Avatar Minh họa 2',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherPhucMath&backgroundColor=ffdfbf',
  },
];

export const TeacherAvatarModal: React.FC<TeacherAvatarModalProps> = ({
  isOpen,
  onClose,
  currentTeacher,
  onSaveTeacher,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentTeacher.avatarUrl);
  const [urlInput, setUrlInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file upload & convert to Base64 Data URL
  const handleFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP, GIF).');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh không vượt quá 5MB để đảm bảo tốc độ tải.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Có lỗi xảy ra khi đọc tệp ảnh.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Vui lòng nhập đường dẫn liên kết ảnh.');
      return;
    }
    setErrorMessage(null);
    setPreviewUrl(urlInput.trim());
  };

  const handleSave = () => {
    const updated = {
      ...currentTeacher,
      avatarUrl: previewUrl,
    };
    onSaveTeacher(updated);
    try {
      localStorage.setItem('cached_teacher_profile', JSON.stringify(updated));
    } catch {
      // Ignore local storage error
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Thay đổi Ảnh đại diện Giáo viên
              </h3>
              <p className="text-xs text-slate-400">
                {currentTeacher.name} - {currentTeacher.school}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar Live Preview Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-5">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-indigo-500/50 shadow-lg bg-slate-950 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Xem trước ảnh giáo viên"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => {
                  setErrorMessage('Không thể tải ảnh từ liên kết này. Vui lòng kiểm tra lại URL.');
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-slate-900">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-0.5">
              Xem trước hiển thị
            </div>
            <div className="text-sm font-bold text-white truncate">{currentTeacher.name}</div>
            <div className="text-xs text-slate-400 truncate">{currentTeacher.title}</div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Ảnh sẽ hiển thị trên thanh tiêu đề, góc hồ sơ cá nhân và màn hình phát động trò chơi.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Tải ảnh từ máy</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bộ sưu tập mẫu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Đường link (URL)</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/40 border border-red-700/60 text-red-300 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Upload from Computer */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-900/20'
                  : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white mb-1">
                Kéo & thả tệp ảnh vào đây, hoặc <span className="text-indigo-400 underline">bấm để duyệt</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Hỗ trợ PNG, JPG, WebP, GIF (tối đa 5MB)
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Presets Collection */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-2">
              Nhấp vào một trong các hình đại diện chuẩn bên dưới:
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = previewUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(preset.url);
                      setErrorMessage(null);
                    }}
                    className={`relative p-1 rounded-2xl border transition group cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/30 ring-2 ring-indigo-500/50'
                        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square rounded-xl object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Link URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Dán đường dẫn ảnh đại diện
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Bạn có thể dùng link ảnh từ Google Drive (chế độ công khai), Unsplash hoặc trang mạng cá nhân.
              </p>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-800 mt-5">
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(currentTeacher.avatarUrl);
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục ảnh cũ</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              id="btn-save-teacher-avatar"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu ảnh đại diện</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
