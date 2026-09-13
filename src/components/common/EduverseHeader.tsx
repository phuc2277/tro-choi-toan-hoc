import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  FolderOpen,
  Brain,
  FileSignature,
  Gamepad2,
  Trophy,
  Search,
  Bell,
  User,
  Flame,
  Star,
  Maximize,
  Minimize,
  Sparkles,
  ChevronDown,
  X,
  Award,
  CheckCircle,
  Camera,
  UserCheck,
  School,
} from 'lucide-react';
import { TeacherUser } from '../../types/teacherLesson';
import { TeacherAvatarModal } from '../auth/TeacherAvatarModal';

export type EduverseNavSection =
  | 'home'
  | 'documents'
  | 'comicLesson'
  | 'questionBank'
  | 'createExam'
  | 'games'
  | 'achievements';

interface EduverseHeaderProps {
  activeSection: EduverseNavSection;
  onSelectSection: (section: EduverseNavSection) => void;
  currentTeacher: TeacherUser;
  onTeacherChange?: (teacher: TeacherUser) => void;
  onOpenTeacherProfile?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  userStats?: {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    streakDays: number;
    badgesCount: number;
  };
}

export const EduverseHeader: React.FC<EduverseHeaderProps> = ({
  activeSection,
  onSelectSection,
  currentTeacher,
  onTeacherChange,
  onOpenTeacherProfile,
  searchQuery = '',
  onSearchChange,
  userStats = {
    level: 8,
    currentXp: 1250,
    nextLevelXp: 1500,
    streakDays: 7,
    badgesCount: 12,
  },
}) => {
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSwitchTeacherModal, setShowSwitchTeacherModal] = useState(false);

  const sampleTeachers: TeacherUser[] = [
    {
      id: 'teacher-nguyen-van-a',
      name: 'Thầy Nguyễn Văn An',
      title: 'Tổ trưởng chuyên môn Toán',
      school: 'Trường THCS Thành Vinh 1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      subject: 'Toán học THCS (Lớp 6, 7, 8, 9)',
      gradesTeaching: [6, 7, 8, 9],
      email: 'an.nv@thcsthanhvinh1.edu.vn',
    },
    {
      id: 'teacher-tran-thi-mai',
      name: 'Cô Trần Thị Mai',
      title: 'Giáo viên Khoa học Tự nhiên',
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

  const notifications = [
    { id: 1, title: 'Chuỗi 7 ngày học tập!', desc: 'Bạn đã mở khóa huy hiệu Chiến binh kiến thức.', time: '10 phút trước', read: false },
    { id: 2, title: 'Bài kiểm tra Toán 8 mới', desc: 'Đề thi giữa kỳ I đã được tạo thành công.', time: '1 giờ trước', read: false },
    { id: 3, title: 'Điểm cao Đấu trường Toán', desc: 'Học sinh lớp 9A đạt 1.200 điểm.', time: 'Hôm qua', read: false },
  ];

  // Synchronize fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsAppFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'documents', label: 'Kho tài liệu', icon: FolderOpen },
    { id: 'comicLesson', label: 'AI Truyện Tranh', icon: Sparkles, badge: 'GDPT' },
    { id: 'questionBank', label: 'Ngân hàng câu hỏi', icon: Brain },
    { id: 'createExam', label: 'Tạo đề', icon: FileSignature },
    { id: 'games', label: 'Trò chơi', icon: Gamepad2 },
    { id: 'achievements', label: 'Thành tích', icon: Trophy },
  ];

  const progressPercent = Math.min(100, Math.round((userStats.currentXp / userStats.nextLevelXp) * 100));

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* 1. BRAND LOGO EDUVERSE */}
          <div
            onClick={() => onSelectSection('home')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-300">
                <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
                  EDUVERSE
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  HUB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Không gian học tập tương tác thế hệ mới
              </p>
            </div>
          </div>

          {/* 2. NAVIGATION BAR (7 ITEMS) */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onSelectSection(item.id as EduverseNavSection)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {(item as any).badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                      {(item as any).badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. GAMIFICATION STATS (DESKTOP) */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-2xl">
            {/* Level & XP */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                L{userStats.level}
              </div>
              <div className="w-20">
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                  <span>XP</span>
                  <span className="text-cyan-400">{userStats.currentXp}/{userStats.nextLevelXp}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            {/* Streak */}
            <div
              className="flex items-center gap-1 text-xs font-bold text-amber-400"
              title={`Chuỗi ${userStats.streakDays} ngày học liên tiếp`}
            >
              <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
              <span>{userStats.streakDays}d</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            {/* Badges */}
            <div
              onClick={() => onSelectSection('achievements')}
              className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-purple-200 cursor-pointer"
              title={`${userStats.badgesCount} huy hiệu đạt được (Click để xem)`}
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>{userStats.badgesCount}</span>
            </div>
          </div>

          {/* 4. ACTIONS & PROFILE (RIGHT) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Button & Input */}
            <div className="relative">
              {showSearchInput ? (
                <div className="flex items-center bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs text-white">
                  <Search className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Tìm bài học, game, đề thi..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-xs text-white w-32 sm:w-44 placeholder:text-slate-500"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSearchInput(false)}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-header-search"
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
                  title="Tìm kiếm trong Eduverse"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                id="btn-header-notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setUnreadNotifications(0);
                }}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
                title="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Thông báo mới</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 transition text-xs"
                      >
                        <p className="font-semibold text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                          {n.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Classroom Button */}
            <button
              id="btn-header-fullscreen"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer hidden sm:block"
              title={isAppFullscreen ? 'Thu nhỏ' : 'Toàn màn hình giảng dạy (F11)'}
            >
              {isAppFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Profile Avatar / Teacher Card with Dropdown */}
            <div className="relative">
              <button
                id="btn-header-profile"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] transition cursor-pointer group"
              >
                <img
                  src={currentTeacher.avatarUrl}
                  alt={currentTeacher.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-cyan-400 shadow-sm"
                />
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition block truncate max-w-[110px]">
                    {currentTeacher.name}
                  </span>
                  <span className="text-[10px] text-cyan-400/80 block font-medium">
                    {currentTeacher.title.split('&')[0]}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-700/80">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        Tài khoản giáo viên
                      </p>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setShowAvatarModal(true);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
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
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowAvatarModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>Thay đổi ảnh đại diện</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowSwitchTeacherModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>Chuyển đổi giáo viên / Môn học</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. MOBILE & TABLET SUBMENU BAR */}
        <div className="xl:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id as EduverseNavSection)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <TeacherAvatarModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentTeacher={currentTeacher}
          onSaveTeacher={(updated) => {
            if (onTeacherChange) onTeacherChange(updated);
          }}
        />
      )}

      {/* Switch Teacher Modal */}
      {showSwitchTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Chọn tài khoản giáo viên</h3>
              </div>
              <button
                onClick={() => setShowSwitchTeacherModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded cursor-pointer"
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
                    setShowSwitchTeacherModal(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                    t.id === currentTeacher.id
                      ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
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
                    <p className="text-xs text-cyan-300 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400">{t.school}</p>
                  </div>
                  {t.id === currentTeacher.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold">
                      Đang dùng
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSwitchTeacherModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
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
