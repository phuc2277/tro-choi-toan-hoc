import React, { useState, useMemo, useEffect } from 'react';
import {
  Lesson,
  SubjectItem,
  GradeItem,
  TeacherUser,
  QuestionSetItem,
  GameSession,
} from '../../types/teacherLesson';
import {
  CURRENT_TEACHER,
  DEFAULT_SUBJECTS,
  DEFAULT_GRADES,
  INITIAL_LESSONS,
  getLessonQuestionBank,
} from '../../data/teacherLessonData';
import { TeacherAuthBar } from '../auth/TeacherAuthBar';
import { EduverseHeader, EduverseNavSection } from '../common/EduverseHeader';
import { EduverseHomeDashboard } from '../common/EduverseHomeDashboard';
import { EduverseAchievementsModal } from '../common/EduverseAchievementsModal';
import { EduverseSideDecor } from '../common/EduverseSideDecor';
import { SubjectGradeSelector } from '../navigation/SubjectGradeSelector';
import { LessonListView } from './LessonListView';
import { CreateExamTab } from '../quiz-creator/CreateExamTab';
import { QuestionBankTab } from '../quiz-creator/QuestionBankTab';
import { GamesHubTab } from '../games/GamesHubTab';
import { EditLessonModal } from './EditLessonModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ManageChaptersModal } from './ManageChaptersModal';
import { convertTeacherLessonToLessonUnit } from '../../games/adapters/LessonGameAdapter';
import { GameFactory } from '../../games/factories/GameFactory';
import { GameRegistry } from '../../games/registry/GameRegistry';
import { ThreeDBackgroundElements } from '../common/ThreeDVisuals';
import { AddSubjectModal } from '../navigation/AddSubjectModal';
import { AddGradeModal } from '../navigation/AddGradeModal';
import { ManageSubjectsGradesModal } from '../navigation/ManageSubjectsGradesModal';
import { SharedDocumentLibraryModal } from '../documents/SharedDocumentLibraryModal';
import { LessonDocumentSection } from '../documents/LessonDocumentSection';
import { documentStorageService } from '../../services/documentStorageService';
import { QuizTopProgressBar } from './QuizTopProgressBar';
import { PracticeQuizModal } from './PracticeQuizModal';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { QuestionItem } from '../../games/types/GestureQuiz';
import { ComicLessonStudio } from '../comic/ComicLessonStudio';
import {
  BookOpen,
  Gamepad2,
  ChevronLeft,
  Sparkles,
  Layers,
  ArrowLeft,
  School,
  FileQuestion,
  Play,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle,
  Plus,
  Database,
  PenTool,
  Maximize,
  Minimize,
  FolderOpen,
} from 'lucide-react';

type PageViewMode = 'home' | 'list' | 'detail' | 'game' | 'comicLesson';
type LessonTabType = 'documents' | 'questionBank' | 'createExam' | 'games';

export const LessonPage: React.FC = () => {
  // 1. Authentication State
  const [currentTeacher, setCurrentTeacher] = useState<TeacherUser>(() => {
    try {
      const cached = localStorage.getItem('cached_teacher_profile');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Fallback
    }
    return CURRENT_TEACHER;
  });

  // 2. Dynamic Subjects & Grades List State
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    try {
      const cached = localStorage.getItem('cached_teacher_subjects');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SUBJECTS;
  });

  const [grades, setGrades] = useState<GradeItem[]>(() => {
    try {
      const cached = localStorage.getItem('cached_teacher_grades');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_GRADES;
  });

  // 3. Navigation Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number>(8);

  // 4. Lessons Database State (Persisted in localStorage with fallback to INITIAL_LESSONS)
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    try {
      const cached = localStorage.getItem('cached_teacher_lessons');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge in any initial curriculum lessons that may be missing in outdated localStorage
          const existingIds = new Set(parsed.map((l: Lesson) => l.id));
          const missingLessons = INITIAL_LESSONS.filter((l) => !existingIds.has(l.id));
          const combined = missingLessons.length > 0 ? [...parsed, ...missingLessons] : parsed;

          // Purge default/pre-loaded initial presentations (e.g. pres-m8-b1-ai, pres-m9-b1-ai, pres-m7-b1-ai, pres-m6-b1-ai)
          // and specific presentations requested for deletion (Chương 1. Bài 1. Đơn thức.pptx, Phương trình bậc nhất hai ẩn)
          const defaultPresIds = new Set([
            'pres-m8-b1-ai',
            'pres-m9-b1-ai',
            'pres-m7-b1-ai',
            'pres-m6-b1-ai',
            'dummy-pres-1',
            'default-pres',
            'sample-pres',
          ]);
          const cleaned = combined.map((l: Lesson) => {
            const isTargetLesson = l.id === 'lesson-math8-b1' || l.id === 'lesson-math9-b1';
            if (!l.presentations || l.presentations.length === 0) {
              return isTargetLesson ? { ...l, presentations: [], presentationPackage: undefined } : l;
            }

            const remaining = l.presentations.filter((p) => {
              if (defaultPresIds.has(p.id)) return false;
              if (p.id.startsWith('pres-m') || p.id.startsWith('default-') || p.id.startsWith('dummy-')) return false;

              const titleLower = (p.title || '').toLowerCase();
              const fileNameLower = (('fileName' in p && (p as any).fileName) || '').toLowerCase();
              if (titleLower.includes('đơn thức') || fileNameLower.includes('đơn thức')) return false;
              if (titleLower.includes('phương trình bậc nhất hai ẩn') || fileNameLower.includes('phương trình')) return false;
              if (titleLower.includes('hệ hai phương trình') || titleLower.includes('khái niệm phương trình')) return false;

              // If this is lesson-math8-b1 or lesson-math9-b1, purge any legacy presentations to ensure fresh start
              if (isTargetLesson) return false;

              return true;
            });

            return {
              ...l,
              presentations: remaining,
              presentationPackage: isTargetLesson || remaining.length === 0 ? undefined : l.presentationPackage,
            };
          });

          try {
            localStorage.setItem('cached_teacher_lessons', JSON.stringify(cleaned));
          } catch {
            // ignore
          }

          return cleaned;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_LESSONS;
  });

  // Save lessons to localStorage on change
  useEffect(() => {
    try {
      if (lessons && lessons.length > 0) {
        localStorage.setItem('cached_teacher_lessons', JSON.stringify(lessons));
      }
    } catch (e) {
      console.error('Error saving lessons to localStorage:', e);
    }
  }, [lessons]);

  // 5. View Mode & Active Lesson Selection
  const [viewMode, setViewMode] = useState<PageViewMode>('detail');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-math8-b1');
  const [activeTab, setActiveTab] = useState<LessonTabType>('documents');
  const [activeSection, setActiveSection] = useState<EduverseNavSection>('documents');
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectSection = (section: EduverseNavSection) => {
    setActiveSection(section);
    if (section === 'home') {
      setViewMode('home');
    } else if (section === 'comicLesson') {
      setViewMode('comicLesson');
    } else if (section === 'documents') {
      setViewMode('detail');
      setActiveTab('documents');
    } else if (section === 'questionBank') {
      setViewMode('detail');
      setActiveTab('questionBank');
    } else if (section === 'createExam') {
      setViewMode('detail');
      setActiveTab('createExam');
    } else if (section === 'games') {
      setViewMode('detail');
      setActiveTab('games');
    } else if (section === 'achievements') {
      setShowAchievementsModal(true);
    }
  };

  // 6. Active Game State
  const [activeGameCode, setActiveGameCode] = useState<string | null>(null);
  const [activeGameSet, setActiveGameSet] = useState<QuestionSetItem | null>(null);
  const [activeGameSession, setActiveGameSession] = useState<GameSession | null>(null);

  // 7. Modal States for Lesson and Chapter Management
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [showDeleteLessonModal, setShowDeleteLessonModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [showManageChaptersModal, setShowManageChaptersModal] = useState(false);

  // 8. Modal States for Subject & Grade Management
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [gradeToEdit, setGradeToEdit] = useState<GradeItem | null>(null);
  const [showManageSubjectsGradesModal, setShowManageSubjectsGradesModal] = useState(false);

  // 9. Modal State for Shared Document Library (Kho tài liệu chung)
  const [showSharedDocLibraryModal, setShowSharedDocLibraryModal] = useState(false);
  const [sharedDocCount, setSharedDocCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    documentStorageService.getSharedDocuments(selectedSubjectId, selectedGradeLevel).then((docs) => {
      if (isMounted) {
        setSharedDocCount(docs.length);
      }
    }).catch(console.error);
    return () => {
      isMounted = false;
    };
  }, [selectedSubjectId, selectedGradeLevel, showSharedDocLibraryModal]);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 10. Quiz Progress State (shows question number out of total at the top of LessonPage)
  const [quizProgress, setQuizProgress] = useState<{
    current: number;
    total: number;
    isFinished: boolean;
    quizTitle?: string;
  } | null>(null);

  // 11. Practice Quiz Modal State
  const [practiceQuizData, setPracticeQuizData] = useState<{
    isOpen: boolean;
    questions: QuestionItem[];
    title: string;
  } | null>(null);

  // Synchronize quiz progress and celebratory confetti from any game/quiz event
  useEffect(() => {
    const handleProgressUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        current: number;
        total: number;
        isFinished?: boolean;
        quizTitle?: string;
      }>;
      if (customEvent.detail) {
        const { current, total, isFinished, quizTitle } = customEvent.detail;
        setQuizProgress((prev) => ({
          current: Math.min(current, total || 1),
          total: total || prev?.total || 1,
          isFinished: !!isFinished,
          quizTitle: quizTitle || prev?.quizTitle,
        }));

        if (isFinished) {
          fireCelebrationConfetti();
        }
      }
    };

    const handleQuizFinished = (e: Event) => {
      const customEvent = e as CustomEvent<{ total?: number }>;
      setQuizProgress((prev) => {
        const total = customEvent.detail?.total || prev?.total || 1;
        return {
          current: total,
          total,
          isFinished: true,
          quizTitle: prev?.quizTitle,
        };
      });
      fireCelebrationConfetti();
    };

    window.addEventListener('quiz-progress-update', handleProgressUpdate);
    window.addEventListener('quiz-finished', handleQuizFinished);

    return () => {
      window.removeEventListener('quiz-progress-update', handleProgressUpdate);
      window.removeEventListener('quiz-finished', handleQuizFinished);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Computed Current Subject & Grade Objects
  const currentSubject: SubjectItem = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || DEFAULT_SUBJECTS[0];
  }, [subjects, selectedSubjectId]);

  const currentGrade: GradeItem = useMemo(() => {
    return grades.find((g) => g.level === selectedGradeLevel) || grades[0] || DEFAULT_GRADES[0];
  }, [grades, selectedGradeLevel]);

  // Subject Management Handlers
  const handleSaveSubject = (savedSubject: SubjectItem) => {
    const isExisting = subjects.some((s) => s.id === savedSubject.id);
    let updatedSubjects: SubjectItem[];
    if (isExisting) {
      updatedSubjects = subjects.map((s) => (s.id === savedSubject.id ? savedSubject : s));
      // Update any lessons that used this subject
      setLessons((prev) =>
        prev.map((l) => (l.subjectId === savedSubject.id ? { ...l, subject: savedSubject.name } : l))
      );
      showToast(`Đã cập nhật môn "${savedSubject.name}" thành công!`);
    } else {
      updatedSubjects = [...subjects, savedSubject];
      setSelectedSubjectId(savedSubject.id);
      showToast(`Đã thêm môn "${savedSubject.name}" (${savedSubject.code}) thành công!`);
    }
    setSubjects(updatedSubjects);
    try {
      localStorage.setItem('cached_teacher_subjects', JSON.stringify(updatedSubjects));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubject = (subjectIdToDelete: string) => {
    const subToDelete = subjects.find((s) => s.id === subjectIdToDelete);
    const updatedSubjects = subjects.filter((s) => s.id !== subjectIdToDelete);
    setSubjects(updatedSubjects);
    try {
      localStorage.setItem('cached_teacher_subjects', JSON.stringify(updatedSubjects));
    } catch (e) {
      console.error(e);
    }

    // Remove all lessons for this subject
    setLessons((prev) => prev.filter((l) => l.subjectId !== subjectIdToDelete));

    // Fallback selected subject if deleted
    if (selectedSubjectId === subjectIdToDelete) {
      const fallback = updatedSubjects[0];
      if (fallback) {
        setSelectedSubjectId(fallback.id);
      }
    }
    showToast(`Đã xóa môn "${subToDelete?.name || subjectIdToDelete}" khỏi hệ thống.`);
  };

  // Grade Management Handlers
  const handleSaveGrade = (savedGrade: GradeItem, applyToSubjectIds: string[]) => {
    const isExisting = grades.some((g) => g.id === savedGrade.id || g.level === savedGrade.level);
    let updatedGrades: GradeItem[];
    if (isExisting) {
      updatedGrades = grades.map((g) => (g.id === savedGrade.id || g.level === savedGrade.level ? savedGrade : g));
      showToast(`Đã cập nhật ${savedGrade.name} thành công!`);
    } else {
      updatedGrades = [...grades, savedGrade].sort((a, b) => a.level - b.level);
      setSelectedGradeLevel(savedGrade.level);
      showToast(`Đã thêm ${savedGrade.name} (${savedGrade.shortName}) thành công!`);
    }
    setGrades(updatedGrades);
    try {
      localStorage.setItem('cached_teacher_grades', JSON.stringify(updatedGrades));
    } catch (e) {
      console.error(e);
    }

    // Update subject associations
    const updatedSubjects = subjects.map((sub) => {
      const shouldInclude = applyToSubjectIds.includes(sub.id);
      const currentlyHas = sub.grades.includes(savedGrade.level);
      if (shouldInclude && !currentlyHas) {
        return { ...sub, grades: [...sub.grades, savedGrade.level].sort((a, b) => a - b) };
      } else if (!shouldInclude && currentlyHas) {
        return { ...sub, grades: sub.grades.filter((lvl) => lvl !== savedGrade.level) };
      }
      return sub;
    });
    setSubjects(updatedSubjects);
    try {
      localStorage.setItem('cached_teacher_subjects', JSON.stringify(updatedSubjects));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGrade = (gradeLevelToDelete: number) => {
    const grToDelete = grades.find((g) => g.level === gradeLevelToDelete);
    const updatedGrades = grades.filter((g) => g.level !== gradeLevelToDelete);
    setGrades(updatedGrades);
    try {
      localStorage.setItem('cached_teacher_grades', JSON.stringify(updatedGrades));
    } catch (e) {
      console.error(e);
    }

    // Remove grade from subjects
    const updatedSubjects = subjects.map((sub) => ({
      ...sub,
      grades: sub.grades.filter((lvl) => lvl !== gradeLevelToDelete),
    }));
    setSubjects(updatedSubjects);
    try {
      localStorage.setItem('cached_teacher_subjects', JSON.stringify(updatedSubjects));
    } catch (e) {
      console.error(e);
    }

    // Remove lessons for this grade
    setLessons((prev) => prev.filter((l) => l.grade !== gradeLevelToDelete));

    // Fallback selected grade
    if (selectedGradeLevel === gradeLevelToDelete) {
      const fallback = updatedGrades[0];
      if (fallback) {
        setSelectedGradeLevel(fallback.level);
      }
    }
    showToast(`Đã xóa ${grToDelete?.name || `Lớp ${gradeLevelToDelete}`} khỏi hệ thống.`);
  };

  const handleResetDefaults = () => {
    setSubjects(DEFAULT_SUBJECTS);
    setGrades(DEFAULT_GRADES);
    try {
      localStorage.removeItem('cached_teacher_subjects');
      localStorage.removeItem('cached_teacher_grades');
    } catch (e) {
      console.error(e);
    }
    setSelectedSubjectId('math');
    setSelectedGradeLevel(9);
    showToast('Đã khôi phục danh mục môn học và khối lớp về mặc định!');
  };

  // Extract unique chapters for current subject and grade
  const availableChapters = useMemo(() => {
    const chapters = lessons
      .filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level)
      .map((l) => l.chapter);
    return Array.from(new Set(chapters));
  }, [lessons, currentSubject.id, currentGrade.level]);

  // Computed Current Lesson Object (Strictly isolated to current subject & grade)
  const currentLesson: Lesson | undefined = useMemo(() => {
    if (selectedLessonId) {
      const found = lessons.find(
        (l) =>
          l.id === selectedLessonId &&
          l.subjectId === currentSubject.id &&
          l.grade === currentGrade.level
      );
      if (found) return found;
    }
    // Fallback: first lesson matching CURRENT subject & grade ONLY
    const match = lessons.find(
      (l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level
    );
    return match; // Return undefined if no lessons exist for this subject/grade (never leak math lessons)
  }, [lessons, selectedLessonId, currentSubject, currentGrade]);

  // Keep selectedLessonId synchronized with currentLesson
  useEffect(() => {
    if (currentLesson && selectedLessonId !== currentLesson.id) {
      setSelectedLessonId(currentLesson.id);
    }
  }, [currentLesson, selectedLessonId]);

  // Handlers for Lesson Updates
  const handleUpdateLesson = (updatedLesson: Lesson) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    );
  };

  // Create New Lesson
  const handleCreateNewLesson = (newLessonData: Partial<Lesson>) => {
    const newLesson = newLessonData as Lesson;
    setLessons((prev) => [newLesson, ...prev]);
    setSelectedLessonId(newLesson.id);
    setViewMode('detail');
    showToast(`Đã tạo bài học "${newLesson.title}" thành công!`);
  };

  // Edit Lesson Handler
  const handleSaveEditedLesson = (lessonData: Partial<Lesson>) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === lessonData.id) {
          return { ...l, ...lessonData } as Lesson;
        }
        return l;
      })
    );
    if (lessonData.id) {
      setSelectedLessonId(lessonData.id);
    }
    showToast(`Đã cập nhật thông tin bài học "${lessonData.title}" thành công!`);
  };

  // Delete Lesson Handler
  const handleDeleteLesson = (lessonId: string) => {
    const lessonFound = lessons.find((l) => l.id === lessonId);
    const lessonTitle = lessonFound?.title || 'bài học';

    setLessons((prev) => {
      const remaining = prev.filter((l) => l.id !== lessonId);
      // If we deleted the current lesson, update selectedLessonId
      if (selectedLessonId === lessonId) {
        const nextInSameGroup = remaining.find(
          (l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level
        );
        if (nextInSameGroup) {
          setSelectedLessonId(nextInSameGroup.id);
        } else {
          setSelectedLessonId('');
          setViewMode('list');
        }
      }
      return remaining;
    });

    showToast(`Đã xóa bài học "${lessonTitle}"!`);
  };

  // Rename Chapter Handler
  const handleRenameChapter = (oldName: string, newName: string) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (
          l.subjectId === currentSubject.id &&
          l.grade === currentGrade.level &&
          l.chapter === oldName
        ) {
          return { ...l, chapter: newName };
        }
        return l;
      })
    );
    showToast(`Đã đổi tên chương thành "${newName}"!`);
  };

  // Delete Chapter Handler (Deletes all lessons inside this chapter)
  const handleDeleteChapter = (chapterName: string) => {
    const lessonsInChapter = lessons.filter(
      (l) =>
        l.subjectId === currentSubject.id &&
        l.grade === currentGrade.level &&
        l.chapter === chapterName
    );

    setLessons((prev) => {
      const remaining = prev.filter(
        (l) =>
          !(
            l.subjectId === currentSubject.id &&
            l.grade === currentGrade.level &&
            l.chapter === chapterName
          )
      );

      // If current selected lesson was in the deleted chapter, pick a fallback
      if (lessonsInChapter.some((l) => l.id === selectedLessonId)) {
        const nextInSameGroup = remaining.find(
          (l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level
        );
        if (nextInSameGroup) {
          setSelectedLessonId(nextInSameGroup.id);
        } else if (remaining.length > 0) {
          setSelectedLessonId(remaining[0].id);
        } else {
          setViewMode('list');
        }
      }

      return remaining;
    });

    showToast(`Đã xóa chương "${chapterName}" và ${lessonsInChapter.length} bài học liên quan!`);
  };

  // Launch Game Handler
  const handleLaunchGame = (
    gameCode: string,
    questionSet: QuestionSetItem,
    _customConfig?: Record<string, any>,
    session?: GameSession
  ) => {
    setActiveGameCode(gameCode);
    setActiveGameSet(questionSet);
    if (session) {
      setActiveGameSession(session);
    }
    const totalQ = questionSet?.questions?.length || 10;
    setQuizProgress({
      current: 1,
      total: totalQ,
      isFinished: false,
      quizTitle: questionSet?.title || currentLesson?.title,
    });
    setViewMode('game');
  };

  // Exit Game Handler
  const handleExitGame = () => {
    setActiveGameCode(null);
    setActiveGameSet(null);
    setActiveGameSession(null);
    setQuizProgress(null);
    setViewMode('detail');
  };

  // Start Direct Practice Quiz Handler
  const handleStartPracticeQuiz = (questionSet: QuestionSetItem) => {
    if (!currentLesson) return;
    const unit = convertTeacherLessonToLessonUnit(currentLesson, questionSet);
    const questions = unit.questionBank;
    if (questions.length === 0) {
      showToast('Bộ đề chưa có câu hỏi nào để làm bài thi!');
      return;
    }
    setQuizProgress({
      current: 1,
      total: questions.length,
      isFinished: false,
      quizTitle: questionSet.title || currentLesson.title,
    });
    setPracticeQuizData({
      isOpen: true,
      questions,
      title: questionSet.title || `Luyện tập: ${currentLesson.title}`,
    });
  };

  // Total stats for header info
  const totalQuestionSets = currentLesson?.questionSets?.length || 0;
  const totalQuestions = (currentLesson?.questionSets || []).reduce(
    (acc, qs) => acc + (qs.questions?.length || 0),
    0
  );

  // Total unique questions stored in the lesson's question bank
  const totalBankQuestions = useMemo(() => {
    if (!currentLesson) return 0;
    return getLessonQuestionBank(currentLesson).length;
  }, [currentLesson]);

  return (
<div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased relative">
    <ThreeDBackgroundElements />

      {/* Symmetric Side Decor: Tiên Học Lễ (Left) & Hậu Học Văn (Right) with doves and roses */}
      <EduverseSideDecor />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-cyan-500/40 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. EDUVERSE UNIFIED HEADER & GAMIFICATION BAR */}
      <EduverseHeader
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        currentTeacher={currentTeacher}
        onTeacherChange={(teacher) => {
          setCurrentTeacher(teacher);
          try {
            localStorage.setItem('cached_teacher_profile', JSON.stringify(teacher));
          } catch {
            // Ignore local storage write error
          }
          showToast(`Đã chuyển đổi giáo viên: ${teacher.name}`);
          // Set to teacher's primary subject and grade if matching
          const matchedSubject = DEFAULT_SUBJECTS.find((s) => s.name.includes(teacher.subject.split(' ')[0]));
          if (matchedSubject) setSelectedSubjectId(matchedSubject.id);
          if (teacher.gradesTeaching.length > 0) {
            setSelectedGradeLevel(teacher.gradesTeaching[0]);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* TOP QUIZ PROGRESS BAR (Shows current question number out of total & celebratory effects) */}
      {quizProgress && (
        <QuizTopProgressBar
          currentQuestion={quizProgress.current}
          totalQuestions={quizProgress.total}
          isFinished={quizProgress.isFinished}
          quizTitle={quizProgress.quizTitle || currentLesson?.title}
          onExit={viewMode === 'game' ? handleExitGame : () => setQuizProgress(null)}
        />
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      {viewMode === 'game' && activeGameCode && currentLesson ? (
        /* ======================================================== */
        /* RUNNING GAME VIEW (GAME ENGINE EMBED)                    */
        /* ======================================================== */
        <div className="flex-1 flex flex-col bg-slate-950 min-h-[calc(100vh-64px)]">
          {/* Game Top Navigation Exit Bar */}
          <div className="h-14 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-30">
            <div className="flex items-center gap-3">
              <button
                id="btn-exit-game"
                onClick={handleExitGame}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>← Trở về Bài học</span>
              </button>

              <div className="hidden sm:block border-l border-slate-700 pl-3">
                <span className="text-xs font-bold text-indigo-400">
                  {currentLesson.title}
                </span>
                <span className="text-slate-500 text-xs mx-2">•</span>
                <span className="text-xs text-slate-300">
                  Bộ đề: {activeGameSet?.title || 'Chuẩn'} ({activeGameSet?.questions.length || 0} câu)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                🎮 {GameRegistry.getGameByCode(activeGameCode)?.name || activeGameCode}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (!document.fullscreenElement) {
                      await document.documentElement.requestFullscreen();
                    } else {
                      await document.exitFullscreen();
                    }
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Bật/Tắt chế độ Toàn màn hình khi chơi trò chơi lớp học (F11)"
              >
                <Maximize className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </button>
            </div>
          </div>

          {/* Render Game via GameFactory (reusing existing Game Engine) */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {GameFactory.createGameComponent(
              activeGameCode,
              [
                convertTeacherLessonToLessonUnit(
                  currentLesson,
                  activeGameSet || undefined,
                  activeGameSession?.questionIds,
                  activeGameSession?.settings?.questionsToPlay,
                  activeGameSession || undefined
                ),
              ],
              handleExitGame,
              (current, total, isFinished) => {
                setQuizProgress({
                  current,
                  total,
                  isFinished,
                  quizTitle: activeGameSet?.title || currentLesson.title,
                });
              }
            )}
          </div>
        </div>
      ) : viewMode === 'comicLesson' ? (
        /* ======================================================== */
        /* AI TRUYỆN TRANH BÀI HỌC (8-STEP GDPT 2018 STUDIO)      */
        /* ======================================================== */
        <div className="flex-1 flex flex-col">
          <ComicLessonStudio
            onBackToMain={() => {
              setViewMode('detail');
              setActiveSection('documents');
            }}
          />
        </div>
      ) : viewMode === 'home' ? (
        /* ======================================================== */
        /* EDUVERSE HOME DASHBOARD (HERO & 4 FEATURE PORTALS)      */
        /* ======================================================== */
        <div className="flex-1 flex flex-col">
          <EduverseHomeDashboard
            onStartLearning={() => {
              setViewMode('detail');
              setActiveTab('documents');
              setActiveSection('documents');
            }}
            onOpenComicLesson={() => {
              setViewMode('comicLesson');
              setActiveSection('comicLesson');
            }}
            onPlayGames={() => {
              setViewMode('detail');
              setActiveTab('games');
              setActiveSection('games');
            }}
            onOpenQuestionBank={() => {
              setViewMode('detail');
              setActiveTab('questionBank');
              setActiveSection('questionBank');
            }}
            onOpenAchievements={() => {
              setShowAchievementsModal(true);
            }}
            currentLesson={currentLesson}
            totalLessonsCount={lessons.length}
            totalQuestionsCount={totalBankQuestions}
          />
        </div>
      ) : (
        /* ======================================================== */
        /* STANDARD TEACHER HUB (SUBJECT/GRADE & LESSONS)          */
        /* ======================================================== */
        <div className="flex-1 flex flex-col">
          {/* SUBJECT & GRADE SELECTOR BAR */}
          <SubjectGradeSelector
            subjects={subjects}
            grades={grades}
            selectedSubjectId={selectedSubjectId}
            selectedGradeLevel={selectedGradeLevel}
            onSelectSubject={(subId) => {
              setSelectedSubjectId(subId);
              // Switch to first lesson in this subject if found, otherwise reset to list view
              const match = lessons.find(
                (l) => l.subjectId === subId && l.grade === currentGrade.level
              );
              if (match) {
                setSelectedLessonId(match.id);
              } else {
                setSelectedLessonId('');
                setViewMode('list');
              }
            }}
            onSelectGrade={(grLevel) => {
              setSelectedGradeLevel(grLevel);
              const match = lessons.find(
                (l) => l.subjectId === currentSubject.id && l.grade === grLevel
              );
              if (match) {
                setSelectedLessonId(match.id);
              } else {
                setSelectedLessonId('');
                setViewMode('list');
              }
            }}
            onOpenAddSubject={() => {
              setSubjectToEdit(null);
              setShowAddSubjectModal(true);
            }}
            onOpenAddGrade={() => {
              setGradeToEdit(null);
              setShowAddGradeModal(true);
            }}
            onOpenManage={() => setShowManageSubjectsGradesModal(true)}
            onOpenDocLibrary={() => setShowSharedDocLibraryModal(true)}
            sharedDocCount={sharedDocCount}
          />

          {/* VIEW TOGGLE & BREADCRUMBS */}
          <div className="bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto">
                <span className="font-semibold text-slate-300">{currentSubject.name}</span>
                <span>/</span>
                <span className="font-semibold text-slate-300">{currentGrade.name}</span>
                <span>/</span>
                {viewMode === 'detail' && currentLesson ? (
                  <span className="font-bold text-cyan-400 truncate max-w-xs">
                    {currentLesson.title}
                  </span>
                ) : (
                  <span className="font-bold text-slate-200">Danh sách bài học</span>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="toggle-view-list"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  ☰ Danh sách bài ({lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level).length})
                </button>

                <button
                  id="toggle-view-detail"
                  onClick={() => setViewMode('detail')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    viewMode === 'detail'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  📖 Chi tiết Bài học
                </button>
              </div>
            </div>
          </div>

          {/* VIEW RENDERER */}
          {viewMode === 'list' ? (
            /* 1. LESSON LIST VIEW */
            <LessonListView
              lessons={lessons}
              currentSubject={currentSubject}
              currentGrade={currentGrade}
              onSelectLesson={(lessonId) => {
                setSelectedLessonId(lessonId);
                setViewMode('detail');
              }}
              onCreateNewLesson={handleCreateNewLesson}
              onEditLesson={handleSaveEditedLesson}
              onDeleteLesson={handleDeleteLesson}
              onRenameChapter={handleRenameChapter}
              onDeleteChapter={handleDeleteChapter}
              onOpenDocLibrary={() => setShowSharedDocLibraryModal(true)}
            />
          ) : currentLesson ? (
            /* 2. LESSON DETAIL HUB (LECTURE & GAME) */
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-24 w-full space-y-6">
              {/* Lesson Hero Banner */}
              <div className="eduverse-glass rounded-3xl border border-slate-800/80 p-6 sm:p-7 shadow-2xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-cyan-950/50 text-cyan-300 border border-cyan-500/40">
                      {currentLesson.chapter}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/50 text-purple-300 border border-purple-500/40">
                      {currentLesson.code}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentLesson.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-4xl leading-relaxed">
                    {currentLesson.description || 'Mỗi bài học là một trung tâm dữ liệu tích hợp: Quản lý kho tài liệu học tập, ngân hàng câu hỏi, tạo đề thi và tổ chức trò chơi tương tác.'}
                  </p>

                  {/* Lesson Actions Toolbar: Sửa bài, Xóa bài, Quản lý chương, Kho tài liệu */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                    <button
                      id="btn-edit-current-lesson"
                      onClick={() => {
                        setLessonToEdit(currentLesson);
                        setShowEditLessonModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sửa thông tin bài</span>
                    </button>

                    <button
                      id="btn-delete-current-lesson"
                      onClick={() => {
                        setLessonToDelete(currentLesson);
                        setShowDeleteLessonModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-rose-400 border border-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Xóa bài học</span>
                    </button>

                    <button
                      onClick={() => setShowSharedDocLibraryModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>📚 Kho tài liệu ({sharedDocCount})</span>
                    </button>

                    <button
                      onClick={() => setShowManageChaptersModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-purple-300 text-xs font-semibold transition cursor-pointer border border-slate-800"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Quản lý chương</span>
                    </button>

                    <button
                      id="btn-quick-practice-quiz"
                      onClick={() => {
                        const set = currentLesson.questionSets[0];
                        if (set) {
                          handleStartPracticeQuiz(set);
                        } else {
                          showToast('Bài học chưa có bộ đề nào để luyện tập!');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                      title="Làm bài kiểm tra / Luyện tập trắc nghiệm trực tiếp"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Luyện tập trắc nghiệm</span>
                    </button>

                    <button
                      id="btn-open-comic-lesson-studio"
                      onClick={() => {
                        setViewMode('comicLesson');
                        setActiveSection('comicLesson');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-black transition shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                      title="Mở studio AI Truyện Tranh Bài Học 8 bước chuẩn GDPT 2018"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>✨ AI Truyện Tranh Bài Học</span>
                    </button>

                    <button
                      onClick={() => setViewMode('list')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer border border-slate-800"
                    >
                      <span>← Về danh sách ({lessons.filter((l) => l.subjectId === currentSubject.id && l.grade === currentGrade.level).length} bài)</span>
                    </button>
                  </div>
                </div>

                {/* Main 5 Tabs Bar: 1. KHO TÀI LIỆU, 2. NGÂN HÀNG CÂU HỎI, 3. TẠO ĐỀ, 4. TRÒ CHƠI, 5. AI TRUYỆN TRANH */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-5 border-t border-slate-800">
                  <button
                    id="tab-documents-btn"
                    onClick={() => { setActiveTab('documents'); setActiveSection('documents'); }}
                    className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                      activeTab === 'documents'
                        ? 'bg-teal-500/20 border-teal-400/60 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span className="truncate">1. KHO TÀI LIỆU</span>
                  </button>

                  <button
                    id="tab-question-bank-btn"
                    onClick={() => { setActiveTab('questionBank'); setActiveSection('questionBank'); }}
                    className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                      activeTab === 'questionBank'
                        ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    <span className="truncate">2. NGÂN HÀNG ({totalBankQuestions})</span>
                  </button>

                  <button
                    id="tab-create-exam-btn"
                    onClick={() => { setActiveTab('createExam'); setActiveSection('createExam'); }}
                    className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                      activeTab === 'createExam'
                        ? 'bg-blue-500/20 border-blue-400/60 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <PenTool className="w-4 h-4 shrink-0" />
                    <span className="truncate">3. TẠO ĐỀ ({totalQuestionSets})</span>
                  </button>

                  <button
                    id="tab-games-btn"
                    onClick={() => { setActiveTab('games'); setActiveSection('games'); }}
                    className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                      activeTab === 'games'
                        ? 'bg-purple-500/25 border-purple-400/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">4. TRÒ CHƠI</span>
                  </button>

                  <button
                    id="tab-comic-lesson-btn"
                    onClick={() => {
                      setViewMode('comicLesson');
                      setActiveSection('comicLesson');
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/60 text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                  >
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                    <span className="truncate">5. AI TRUYỆN TRANH</span>
                  </button>
                </div>
              </div>

              {/* Active Tab Body */}

              {activeTab === 'createExam' && (
                <CreateExamTab
                  key={currentLesson.id}
                  lesson={currentLesson}
                  onUpdateLesson={handleUpdateLesson}
                  onNavigateToGames={() => setActiveTab('games')}
                  onNavigateToQuestionBank={() => setActiveTab('questionBank')}
                  onLaunchGameDirectly={(qs) => {
                    handleLaunchGame('GESTURE_QUIZ_AI', qs);
                  }}
                  onStartPracticeQuiz={handleStartPracticeQuiz}
                />
              )}

              {activeTab === 'questionBank' && (
                <QuestionBankTab
                  key={currentLesson.id}
                  lesson={currentLesson}
                  onUpdateLesson={handleUpdateLesson}
                  onNavigateToCreateExam={() => setActiveTab('createExam')}
                  onNavigateToGames={() => setActiveTab('games')}
                />
              )}

              {activeTab === 'games' && (
                <GamesHubTab
                  key={currentLesson.id}
                  lesson={currentLesson}
                  onLaunchGame={handleLaunchGame}
                  onNavigateToQuestionBank={() => setActiveTab('createExam')}
                />
              )}

              {activeTab === 'documents' && (
                <div className="eduverse-glass rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
                  <LessonDocumentSection
                    subjectId={currentSubject.id}
                    subjectName={currentSubject.name}
                    gradeLevel={currentGrade.level}
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    teacherName={currentTeacher.name}
                    onOpenSharedLibrary={() => setShowSharedDocLibraryModal(true)}
                    onNavigateToPhase4={() => {
                      setActiveTab('questionBank');
                      setActiveSection('questionBank');
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-lg mx-auto py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-2xs">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                Chưa có bài học nào trong {currentSubject.name} {currentGrade.shortName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                Môn {currentSubject.name} ({currentGrade.shortName}) hiện chưa có bài học hoặc chương nào. Thầy/Cô vui lòng quay lại danh sách hoặc tạo bài học mới.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ← Về danh sách bài học
                </button>
                <button
                  onClick={() => {
                    setLessonToEdit(null);
                    setShowEditLessonModal(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition cursor-pointer"
                >
                  + Tạo bài học mới
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Modal Edit Lesson */}
      {showEditLessonModal && (
        <EditLessonModal
          isOpen={showEditLessonModal}
          onClose={() => {
            setShowEditLessonModal(false);
            setLessonToEdit(null);
          }}
          lesson={lessonToEdit}
          currentSubject={currentSubject}
          currentGrade={currentGrade}
          availableChapters={availableChapters}
          onSaveLesson={handleSaveEditedLesson}
        />
      )}

      {/* 2. Modal Delete Lesson Confirm */}
      {showDeleteLessonModal && lessonToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteLessonModal}
          onClose={() => {
            setShowDeleteLessonModal(false);
            setLessonToDelete(null);
          }}
          onConfirm={() => {
            if (lessonToDelete) {
              handleDeleteLesson(lessonToDelete.id);
              setShowDeleteLessonModal(false);
              setLessonToDelete(null);
            }
          }}
          title="Xác nhận xóa bài học"
          itemName={lessonToDelete.title}
          itemType="lesson"
          detailsCount={{
            presentationsCount: lessonToDelete.presentations?.length || 0,
            questionSetsCount: lessonToDelete.questionSets?.length || 0,
          }}
        />
      )}

      {/* 3. Modal Manage Chapters */}
      {showManageChaptersModal && (
        <ManageChaptersModal
          isOpen={showManageChaptersModal}
          onClose={() => setShowManageChaptersModal(false)}
          currentSubject={currentSubject}
          currentGrade={currentGrade}
          lessons={lessons}
          onRenameChapter={handleRenameChapter}
          onDeleteChapter={handleDeleteChapter}
        />
      )}

      {/* 4. Modal Add / Edit Subject */}
      {showAddSubjectModal && (
        <AddSubjectModal
          isOpen={showAddSubjectModal}
          onClose={() => {
            setShowAddSubjectModal(false);
            setSubjectToEdit(null);
          }}
          grades={grades}
          subjectToEdit={subjectToEdit}
          existingSubjects={subjects}
          onSaveSubject={handleSaveSubject}
        />
      )}

      {/* 5. Modal Add / Edit Grade */}
      {showAddGradeModal && (
        <AddGradeModal
          isOpen={showAddGradeModal}
          onClose={() => {
            setShowAddGradeModal(false);
            setGradeToEdit(null);
          }}
          gradeToEdit={gradeToEdit}
          existingGrades={grades}
          existingSubjects={subjects}
          onSaveGrade={handleSaveGrade}
        />
      )}

      {/* 6. Modal Manage Subjects & Grades */}
      {showManageSubjectsGradesModal && (
        <ManageSubjectsGradesModal
          isOpen={showManageSubjectsGradesModal}
          onClose={() => setShowManageSubjectsGradesModal(false)}
          subjects={subjects}
          grades={grades}
          lessons={lessons}
          onOpenAddSubject={() => {
            setSubjectToEdit(null);
            setShowAddSubjectModal(true);
          }}
          onOpenEditSubject={(sub) => {
            setSubjectToEdit(sub);
            setShowAddSubjectModal(true);
          }}
          onDeleteSubject={handleDeleteSubject}
          onOpenAddGrade={() => {
            setGradeToEdit(null);
            setShowAddGradeModal(true);
          }}
          onOpenEditGrade={(gr) => {
            setGradeToEdit(gr);
            setShowAddGradeModal(true);
          }}
          onDeleteGrade={handleDeleteGrade}
          onResetDefaults={handleResetDefaults}
        />
      )}

      {/* 7. Modal Kho Tài Liệu Chung (Shared Document Library) */}
      {showSharedDocLibraryModal && (
        <SharedDocumentLibraryModal
          isOpen={showSharedDocLibraryModal}
          onClose={() => setShowSharedDocLibraryModal(false)}
          subjectId={currentSubject.id}
          subjectName={currentSubject.name}
          gradeLevel={currentGrade.level}
          teacherName={currentTeacher.name}
          onDocumentCountChange={(cnt) => setSharedDocCount(cnt)}
        />
      )}

      {/* 8. Eduverse Gamification & Achievements Modal */}
      <EduverseAchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
      />

      {/* 9. Direct Practice Quiz Modal */}
      {practiceQuizData && (
        <PracticeQuizModal
          isOpen={practiceQuizData.isOpen}
          onClose={() => {
            setPracticeQuizData(null);
            setQuizProgress(null);
          }}
          questions={practiceQuizData.questions}
          title={practiceQuizData.title}
          subject={currentLesson?.subject}
          grade={currentLesson?.grade}
        />
      )}
    </div>
  );
};
