import React, { useState, useEffect, useRef } from 'react';
import { Lesson } from '../../../types/teacherLesson';
import {
  LessonPresentationPackage,
  TeachingActivity,
} from '../../../types/contentBlock';
import {
  convertLegacyPresentationToPackage,
  createDefaultPresentationPackage,
} from '../../../utils/lectureStructureAdapter';
import { Step1LessonInfo } from './Step1LessonInfo';
import { Step2PedagogicalFlow } from './Step2PedagogicalFlow';
import { Step3CanvasWorkspace } from './Step3CanvasWorkspace';
import { SelectQuestionFromBankModal } from './SelectQuestionFromBankModal';
import { SelectGameFromLessonModal } from './SelectGameFromLessonModal';
import {
  X,
  Check,
  BookOpen,
  Layers,
  Layout,
  Save,
  ChevronRight,
  Eye,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface LectureEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  presentationPackage?: LessonPresentationPackage;
  onSavePackage: (pkg: LessonPresentationPackage) => void;
  onLaunchPresentation?: (pkg: LessonPresentationPackage) => void;
}

export const LectureEditorModal: React.FC<LectureEditorModalProps> = ({
  isOpen,
  onClose,
  lesson,
  presentationPackage,
  onSavePackage,
  onLaunchPresentation,
}) => {
  // Initialize package from existing lesson data or default
  const [packageData, setPackageData] = useState<LessonPresentationPackage>(() => {
    if (presentationPackage) {
      return presentationPackage;
    }
    if (lesson.presentationPackage) {
      return lesson.presentationPackage;
    }
    if (lesson.presentations && lesson.presentations.length > 0) {
      return convertLegacyPresentationToPackage(lesson, lesson.presentations[0]);
    }
    return createDefaultPresentationPackage(lesson);
  });

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(3);
  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Save status: 'saved' | 'saving' | 'unsaved' | 'error'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const isInitialMount = useRef(true);
  const autosaveTimerRef = useRef<any>(null);

  // Modals for Question Bank & Game picking
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [activeTargetBlockId, setActiveTargetBlockId] = useState<string | null>(null);

  // Debounced Autosave (1500ms)
  useEffect(() => {
    if (!isInitialMount.current) {
      setSaveStatus('unsaved');
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        try {
          setSaveStatus('saving');
          const updatedPkg: LessonPresentationPackage = {
            ...packageData,
            updatedAt: new Date().toISOString(),
          };
          onSavePackage(updatedPkg);
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }
      }, 1500);
    } else {
      isInitialMount.current = false;
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [packageData, onSavePackage]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      setSaveStatus('saving');
      const updatedPkg: LessonPresentationPackage = {
        ...packageData,
        updatedAt: new Date().toISOString(),
      };
      onSavePackage(updatedPkg);
      setTimeout(() => setSaveStatus('saved'), 300);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as any);
    } else {
      onClose();
    }
  };

  const handleSelectQuestionForBlock = (questionData: any) => {
    if (!activeTargetBlockId) return;
    const activities = [...packageData.activities];
    const act = { ...activities[currentActIdx] };
    const slds = [...act.slides];
    const sld = { ...slds[currentSlideIdx] };

    sld.blocks = sld.blocks.map((b) =>
      b.id === activeTargetBlockId
        ? {
            ...b,
            type: 'question' as const,
            content: {
              questionId: questionData.questionId,
              content: questionData.content,
              options: questionData.options,
              correctAnswer: questionData.correctAnswer,
              solution: questionData.solution,
              difficulty: questionData.difficulty,
            },
          }
        : b
    );

    slds[currentSlideIdx] = sld;
    act.slides = slds;
    activities[currentActIdx] = act;
    setPackageData({ ...packageData, activities });
  };

  const handleSelectGameForBlock = (gameData: any) => {
    if (!activeTargetBlockId) return;
    const activities = [...packageData.activities];
    const act = { ...activities[currentActIdx] };
    const slds = [...act.slides];
    const sld = { ...slds[currentSlideIdx] };

    sld.blocks = sld.blocks.map((b) =>
      b.id === activeTargetBlockId
        ? {
            ...b,
            type: 'game' as const,
            content: {
              gameType: gameData.gameType,
              gameTitle: gameData.gameTitle,
              questionSetId: gameData.questionSetId,
              questionCount: gameData.questionCount,
            },
          }
        : b
    );

    slds[currentSlideIdx] = sld;
    act.slides = slds;
    activities[currentActIdx] = act;
    setPackageData({ ...packageData, activities });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-3xl w-full max-w-7xl h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Top Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Studio Soạn Bài Giảng Điện Tử GDPT 2018
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {packageData.title} • {packageData.subject} Lớp {packageData.grade}
              </p>
            </div>
          </div>

          {/* Center: Save status badge & 3 Steps Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {/* Save Status Badge */}
            <div className="flex items-center">
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã lưu</span>
                </div>
              )}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              )}
              {saveStatus === 'unsaved' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Chưa lưu</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-red-700 font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Lỗi lưu</span>
                </div>
              )}
            </div>

            {/* 3 Steps Navigation Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep === 1
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. Thông tin</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep === 2
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Tiến trình (Hoạt động)</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep === 3
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>3. Soạn Slide</span>
              </button>
            </div>
          </div>

          {/* Right Actions: Present, Save, Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLaunchPresentation?.(packageData)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Trình chiếu</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu bài giảng</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentStep === 1 && (
            <Step1LessonInfo
              packageData={packageData}
              onUpdate={(updates) => setPackageData({ ...packageData, ...updates })}
            />
          )}

          {currentStep === 2 && (
            <Step2PedagogicalFlow
              activities={packageData.activities}
              onUpdateActivities={(activities) => setPackageData({ ...packageData, activities })}
              onSelectSlideToEdit={(actIdx, sldIdx) => {
                setCurrentActIdx(actIdx);
                setCurrentSlideIdx(sldIdx);
                setCurrentStep(3);
              }}
            />
          )}

          {currentStep === 3 && (
            <Step3CanvasWorkspace
              activities={packageData.activities}
              currentActivityIndex={currentActIdx}
              currentSlideIndex={currentSlideIdx}
              onSelectSlide={(actIdx, sldIdx) => {
                setCurrentActIdx(actIdx);
                setCurrentSlideIdx(sldIdx);
              }}
              onUpdateActivities={(activities) => setPackageData({ ...packageData, activities })}
              onOpenQuestionBankModal={(blockId) => {
                setActiveTargetBlockId(blockId);
                setIsQuestionBankModalOpen(true);
              }}
              onOpenGameSelectModal={(blockId) => {
                setActiveTargetBlockId(blockId);
                setIsGameModalOpen(true);
              }}
              onLaunchPreview={() => onLaunchPresentation?.(packageData)}
            />
          )}
        </div>
      </div>

      {/* Select Question from Bank Modal */}
      <SelectQuestionFromBankModal
        isOpen={isQuestionBankModalOpen}
        onClose={() => setIsQuestionBankModalOpen(false)}
        lesson={lesson}
        onSelectQuestion={handleSelectQuestionForBlock}
      />

      {/* Select Game from Lesson Modal */}
      <SelectGameFromLessonModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        lesson={lesson}
        onSelectGame={handleSelectGameForBlock}
      />
    </div>
  );
};
