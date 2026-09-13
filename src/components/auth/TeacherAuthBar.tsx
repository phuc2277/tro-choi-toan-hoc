import React, { useState, useEffect } from 'react';
import { TeacherUser } from '../../types/teacherLesson';
import { CURRENT_TEACHER } from '../../data/teacherLessonData';
import { TeacherAvatarModal } from './TeacherAvatarModal';
import {
  GraduationCap,
  School,
  BookOpen,
  UserCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  Award,
  Camera,
  Image as ImageIcon,
  Maximize,
  Minimize,
  Tv,
} from 'lucide-react';

interface TeacherAuthBarProps {
  currentTeacher?: TeacherUser;
  onTeacherChange?: (teacher: TeacherUser) => void;
}

export const TeacherAuthBar: React.FC<TeacherAuthBarProps> = ({
  currentTeacher = CURRENT_TEACHER,
  onTeacherChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);

  // Synchronize fullscreen state with browser events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsAppFullscreen(
        Boolean(
          document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Keyboard shortcut F11 or 'F' (when not inside inputs)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput && (e.key === 'F11' || (e.key === 'f' && e.altKey))) {
        e.preventDefault();
        toggleAppFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleAppFullscreen = async () => {
    try {
      if (
        !document.fullscreenElement &&
        !(document as any).webkitFullscreenElement &&
        !(document as any).mozFullScreenElement &&
        !(document as any).msFullscreenElement
      ) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed (likely due to iframe sandbox policy):', err);
    }
  };

  const sampleTeachers: TeacherUser[] = [
    CURRENT_TEACHER,
    {
      id: 'teacher-tran-mai',
      name: 'Cô Trần Thị Mai',
      title: 'Tổ trưởng Chuyên môn KHTN & Toán',
      school: 'Trường THCS Thành Vinh 1',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      subject: 'Khoa học tự nhiên & Sinh học',
      gradesTeaching: [6, 7, 8],
      email: 'mai.tt@thcsthanhvinh1.edu.vn',
    },
    {
      id: 'teacher-le-hoang',
      name: 'Thầy Lê Minh Hoàng',
      title: 'Giáo viên Tin học & Công nghệ',
      school: 'Trường THCS Thành Vinh 1',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      subject: 'Tin học THCS',
      gradesTeaching: [7, 8, 9],
      email: 'hoang.lm@thcsthanhvinh1.edu.vn',
    },
  ];

  return (
    <header className="bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 text-white border-b border-purple-500/30 sticky top-0 z-40 shadow-[0_10px_25px_rgba(15,23,42,0.6)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 via-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.5)] ring-2 ring-teal-300/40 transform hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-200 via-white to-purple-200 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">
                HỆ THỐNG BÀI HỌC GIÁO VIÊN
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/40 shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
                GDPT 2018 & Game Engine
              </span>
            </div>
            <p className="text-xs text-purple-200/70 hidden md:block">
              Trung tâm tích hợp Bài giảng điện tử & Đề trò chơi tương tác
            </p>
          </div>
        </div>

        {/* Right: Actions & Teacher Profile */}
        <div className="flex items-center gap-2.5">
          {/* Fullscreen Classroom/Projector Mode Button */}
          <button
            id="btn-toggle-app-fullscreen"
            type="button"
            onClick={toggleAppFullscreen}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition shadow-sm cursor-pointer ${
              isAppFullscreen
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40 ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/80 hover:bg-slate-800/90 text-teal-200 hover:text-white border-teal-500/40 hover:border-teal-400/70 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
            }`}
            title={isAppFullscreen ? 'Thu nhỏ cửa sổ (F11 / Esc)' : 'Bật chế độ Toàn màn hình giảng dạy (F11)'}
          >
            {isAppFullscreen ? (
              <>
                <Minimize className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Thu nhỏ (F11)</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-teal-300" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </button>

          {/* Teacher Profile */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                id="teacher-profile-dropdown-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-purple-500/40 shadow-[0_4px_12px_rgba(147,51,234,0.25)] transition text-left group cursor-pointer"
              >
              <div className="relative">
                <img
                  src={currentTeacher.avatarUrl}
                  alt={currentTeacher.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-teal-400 shadow-md"
                />
                <div
                  title="Thay đổi ảnh đại diện"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAvatarModal(true);
                  }}
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center shadow-md border border-slate-900 cursor-pointer"
                >
                  <Camera className="w-2.5 h-2.5" />
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-teal-300 transition drop-shadow-xs">
                    {currentTeacher.name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#FACC15] animate-pulse" />
                </div>
                <p className="text-[11px] text-purple-200/80 leading-tight truncate max-w-[150px]">
                  {currentTeacher.school}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-purple-300 group-hover:text-white transition" />
            </button>
          </div>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tài khoản giáo viên
                  </p>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowAvatarModal(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Đổi ảnh</span>
                  </button>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">{currentTeacher.name}</p>
                <p className="text-xs text-indigo-300 font-medium">{currentTeacher.title}</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                  <School className="w-3 h-3" />
                  <span>{currentTeacher.school}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <BookOpen className="w-3 h-3" />
                  <span>{currentTeacher.subject}</span>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  id="btn-toggle-fullscreen-dropdown"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    toggleAppFullscreen();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/70 rounded-lg transition cursor-pointer"
                >
                  {isAppFullscreen ? (
                    <Minimize className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Maximize className="w-4 h-4 text-teal-400" />
                  )}
                  <span>{isAppFullscreen ? 'Thu nhỏ cửa sổ ứng dụng (F11)' : 'Bật Toàn màn hình giảng dạy (F11)'}</span>
                </button>

                <button
                  id="btn-change-avatar-dropdown"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowAvatarModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/70 rounded-lg transition cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span>Thay đổi ảnh đại diện giáo viên</span>
                </button>

                <button
                  id="switch-teacher-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowSwitchModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/70 rounded-lg transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Chuyển đổi giáo viên / Môn giảng dạy</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Teacher Avatar Change Modal */}
      {showAvatarModal && (
        <TeacherAvatarModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentTeacher={currentTeacher}
          onSaveTeacher={(updated) => {
            if (onTeacherChange) {
              onTeacherChange(updated);
            }
          }}
        />
      )}

      {/* Switch Teacher Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Chọn tài khoản giáo viên</h3>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Chọn hồ sơ giáo viên để phân quyền môn học và giáo án tương ứng trong hệ thống.
            </p>

            <div className="space-y-2.5">
              {sampleTeachers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (onTeacherChange) onTeacherChange(t);
                    setShowSwitchModal(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    t.id === currentTeacher.id
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <img
                    src={t.avatarUrl}
                    alt={t.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                    <p className="text-xs text-indigo-300 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400">{t.school}</p>
                  </div>
                  {t.id === currentTeacher.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500 text-white font-medium">
                      Đang dùng
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
