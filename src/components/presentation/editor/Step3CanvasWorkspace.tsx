import React, { useState, useEffect, useRef } from 'react';
import {
  TeachingActivity,
  EditorSlide,
  ContentBlock,
  BlockType,
  AnimationEntranceType,
  AnimationTrigger,
} from '../../../types/contentBlock';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { BlockPropertiesPanel } from './BlockPropertiesPanel';
import {
  generateBlockId,
  generateSlideId,
  generateActivityId,
} from '../../../utils/lectureStructureAdapter';
import {
  Plus,
  Type,
  Heading,
  Sigma,
  Table,
  Image,
  Video,
  Volume2,
  Shapes,
  BarChart3,
  Box,
  FlaskConical,
  HelpCircle,
  Gamepad2,
  BookOpen,
  Eye,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Undo2,
  Redo2,
  Clock,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layout,
  Palette,
  GripVertical,
  List,
  ListOrdered,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  Maximize2,
  Clipboard,
} from 'lucide-react';

interface Step3CanvasWorkspaceProps {
  activities: TeachingActivity[];
  currentActivityIndex: number;
  currentSlideIndex: number;
  onSelectSlide: (actIdx: number, sldIdx: number) => void;
  onUpdateActivities: (activities: TeachingActivity[]) => void;
  onOpenQuestionBankModal: (blockId: string) => void;
  onOpenGameSelectModal: (blockId: string) => void;
  onLaunchPreview: () => void;
}

export const Step3CanvasWorkspace: React.FC<Step3CanvasWorkspaceProps> = ({
  activities,
  currentActivityIndex,
  currentSlideIndex,
  onSelectSlide,
  onUpdateActivities,
  onOpenQuestionBankModal,
  onOpenGameSelectModal,
  onLaunchPreview,
}) => {
  // Scope of properties panel: 'activity' | 'slide' | 'block'
  const [propertiesScope, setPropertiesScope] = useState<'activity' | 'slide' | 'block'>('slide');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [clipboardBlock, setClipboardBlock] = useState<ContentBlock | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  // Collapse state for activities in the left tree
  const [collapsedActivities, setCollapsedActivities] = useState<Record<string, boolean>>({});

  // History stack for Undo / Redo
  const [history, setHistory] = useState<TeachingActivity[][]>([activities]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  const currentActivity = activities[currentActivityIndex] || activities[0];
  const currentSlide =
    currentActivity?.slides[currentSlideIndex] || currentActivity?.slides[0];

  const selectedBlock =
    currentSlide?.blocks?.find((b) => b.id === selectedBlockId) || null;

  // Push to history on activities change (unless triggered by undo/redo)
  const commitActivities = (newActivities: TeachingActivity[]) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      onUpdateActivities(newActivities);
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newActivities);
    if (newHistory.length > 25) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onUpdateActivities(newActivities);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetActivities = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdateActivities(targetActivities);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetActivities = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onUpdateActivities(targetActivities);
    }
  };

  // Toggle activity collapse
  const toggleCollapseActivity = (actId: string) => {
    setCollapsedActivities((prev) => ({
      ...prev,
      [actId]: !prev[actId],
    }));
  };

  // Helper to update current slide's blocks
  const updateCurrentSlideBlocks = (newBlocks: ContentBlock[]) => {
    const updated = [...activities];
    const act = { ...updated[currentActivityIndex] };
    const slds = [...act.slides];
    slds[currentSlideIndex] = {
      ...slds[currentSlideIndex],
      blocks: newBlocks,
    };
    act.slides = slds;
    updated[currentActivityIndex] = act;
    commitActivities(updated);
  };

  // Helper to update slide metadata
  const updateCurrentSlideMeta = (updates: Partial<EditorSlide>) => {
    const updated = [...activities];
    const act = { ...updated[currentActivityIndex] };
    const slds = [...act.slides];
    slds[currentSlideIndex] = {
      ...slds[currentSlideIndex],
      ...updates,
    };
    act.slides = slds;
    updated[currentActivityIndex] = act;
    commitActivities(updated);
  };

  // Helper to update current activity
  const updateCurrentActivity = (updates: Partial<TeachingActivity>) => {
    const updated = [...activities];
    updated[currentActivityIndex] = {
      ...updated[currentActivityIndex],
      ...updates,
    };
    commitActivities(updated);
  };

  // Add a new slide to the current activity
  const handleAddNewSlide = () => {
    const act = activities[currentActivityIndex];
    if (!act) return;

    const newSlide: EditorSlide = {
      id: generateSlideId(),
      order: act.slides.length + 1,
      title: `Slide ${act.slides.length + 1}: Nội dung mới`,
      layout: 'title-content',
      background: '#ffffff',
      blocks: [
        {
          id: generateBlockId('blk'),
          type: 'heading',
          visible: true,
          content: {
            text: 'Tiêu đề nội dung trọng tâm',
            level: 'h2',
            badge: act.title,
            color: '#1E293B',
            textAlign: 'left',
          },
        },
      ],
    };

    const updatedActivities = activities.map((a, idx) =>
      idx === currentActivityIndex
        ? { ...a, slides: [...a.slides, newSlide] }
        : a
    );

    commitActivities(updatedActivities);
    onSelectSlide(currentActivityIndex, act.slides.length);
    setPropertiesScope('slide');
    setSelectedBlockId(null);
  };

  // Add a block to the slide
  const handleAddBlock = (type: BlockType, extraData?: any) => {
    let newBlock: ContentBlock;
    const blockId = generateBlockId('blk');

    switch (type) {
      case 'heading':
        newBlock = {
          id: blockId,
          type: 'heading',
          visible: true,
          content: {
            text: 'Tiêu đề nội dung trọng tâm',
            level: 'h2',
            badge: 'Kiến thức trọng tâm',
            color: '#1E293B',
            textAlign: 'left',
          },
        };
        break;
      case 'math':
        newBlock = {
          id: blockId,
          type: 'math',
          visible: true,
          content: {
            latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
            isLarge: true,
            explanation: 'Công thức nghiệm tổng quát',
          },
        };
        break;
      case 'image':
        newBlock = {
          id: blockId,
          type: 'image',
          visible: true,
          content: {
            url: '',
            caption: 'Hình minh họa bài giảng',
            fit: 'contain',
          },
        };
        break;
      case 'video':
        newBlock = {
          id: blockId,
          type: 'video',
          visible: true,
          content: {
            url: '',
            title: 'Video thực nghiệm',
            controls: true,
          },
        };
        break;
      case 'audio':
        newBlock = {
          id: blockId,
          type: 'audio',
          visible: true,
          content: {
            url: '',
            title: 'Bản ghi âm bài giảng',
          },
        };
        break;
      case 'table':
        newBlock = {
          id: blockId,
          type: 'table',
          visible: true,
          locked: false,
          size: { width: 100, height: 0 },
          order: (currentSlide?.blocks?.length || 0) + 1,
          revealOrder: (currentSlide?.blocks?.length || 0) + 1,
          revealMode: 'fade',
          content: {
            title: 'Bảng giá trị tương ứng',
            headers: ['x', '-2', '-1', '0', '1', '2'],
            rows: [
              ['y = 2x', '-4', '-2', '0', '2', '4'],
              ['y = x^2', '4', '1', '0', '1', '4'],
            ],
            highlightHeader: true,
          },
        };
        break;
      case 'list':
        newBlock = {
          id: blockId,
          type: 'list',
          visible: true,
          locked: false,
          size: { width: 100, height: 0 },
          order: (currentSlide?.blocks?.length || 0) + 1,
          revealOrder: (currentSlide?.blocks?.length || 0) + 1,
          revealMode: 'fade',
          content: {
            listType: 'bullet',
            items: [
              'Mục 1: Khái niệm và định nghĩa',
              'Mục 2: Công thức và hệ quả toán học',
              'Mục 3: Ví dụ áp dụng thực tế',
            ],
            fontSize: 16,
            color: '#1E293B',
            lineHeight: 1.6,
          },
        };
        break;
      case 'question':
        newBlock = {
          id: blockId,
          type: 'question',
          visible: true,
          content: {
            content: 'Giá trị của biểu thức $A = 3x^2 - 2x + 1$ tại $x = 2$ là:',
            options: [
              { id: 'opt_a', label: 'A', text: '9' },
              { id: 'opt_b', label: 'B', text: '8' },
              { id: 'opt_c', label: 'C', text: '10' },
              { id: 'opt_d', label: 'D', text: '11' },
            ],
            correctAnswer: 'A',
            solution: 'Thay $x = 2$ vào $A$: $3(2)^2 - 2(2) + 1 = 12 - 4 + 1 = 9$.',
            difficulty: 'easy',
          },
        };
        break;
      case 'geometry':
        newBlock = {
          id: blockId,
          type: 'geometry',
          visible: true,
          content: {
            title: 'Tam giác ABC và đường cao AH',
            shapeType: 'triangle',
          },
        };
        break;
      case 'chart':
        newBlock = {
          id: blockId,
          type: 'chart',
          visible: true,
          content: {
            title: 'Biểu đồ điểm kiểm tra giữa kì',
            chartType: 'bar',
            data: [
              { label: 'Điểm 7', value: 8 },
              { label: 'Điểm 8', value: 14 },
              { label: 'Điểm 9', value: 10 },
              { label: 'Điểm 10', value: 5 },
            ],
            xAxisLabel: 'Thang điểm',
            yAxisLabel: 'Số lượng học sinh',
          },
        };
        break;
      case 'model3d':
        newBlock = {
          id: blockId,
          type: 'model3d',
          visible: true,
          content: {
            title: 'Mô hình Hình hộp chữ nhật 3D',
            modelType: 'cube',
          },
        };
        break;
      case 'experiment':
        newBlock = {
          id: blockId,
          type: 'experiment',
          visible: true,
          content: {
            title: 'Thí nghiệm ảo biến thiên hàm số bậc hai',
            category: 'Hàm số & Đồ thị',
          },
        };
        break;
      case 'game':
        newBlock = {
          id: blockId,
          type: 'game',
          visible: true,
          content: {
            gameType: 'GESTURE_QUIZ_AI',
            gameTitle: 'Đấu trường Cử chỉ AI (AI Vision)',
            questionSetId: 'default_set',
            questionCount: 10,
          },
        };
        break;
      case 'text':
      default:
        newBlock = {
          id: blockId,
          type: 'text',
          visible: true,
          content: {
            text: 'Nhập nội dung giảng giải hoặc định lý tại đây...',
            fontSize: 18,
            color: '#1E293B',
            textAlign: 'left',
          },
        };
        break;
    }

    const currentBlocks = currentSlide?.blocks || [];
    updateCurrentSlideBlocks([...currentBlocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setPropertiesScope('block');
    setIsAddMenuOpen(false);

    if (extraData === 'openBank') {
      onOpenQuestionBankModal(newBlock.id);
    } else if (extraData === 'openGame') {
      onOpenGameSelectModal(newBlock.id);
    }
  };

  // Update single block
  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    const updated = (currentSlide?.blocks || []).map((b) =>
      b.id === blockId ? ({ ...b, ...updates } as ContentBlock) : b
    );
    updateCurrentSlideBlocks(updated);
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    const updated = (currentSlide?.blocks || []).filter((b) => b.id !== blockId);
    updated.forEach((b, idx) => {
      b.order = idx + 1;
    });
    updateCurrentSlideBlocks(updated);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setPropertiesScope('slide');
    }
  };

  // Duplicate block (Inserts right after the original with unique ID)
  const handleDuplicateBlock = (blockId: string) => {
    const blocks = currentSlide?.blocks || [];
    const blockIdx = blocks.findIndex((b) => b.id === blockId);
    if (blockIdx === -1) return;
    const blockToDup = blocks[blockIdx];

    const duplicated: ContentBlock = {
      ...JSON.parse(JSON.stringify(blockToDup)),
      id: generateBlockId(blockToDup.type || 'blk'),
      order: blockIdx + 2,
      revealOrder: (blockToDup.revealOrder ?? (blockIdx + 1)) + 1,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(blockIdx + 1, 0, duplicated);
    newBlocks.forEach((b, idx) => {
      b.order = idx + 1;
    });

    updateCurrentSlideBlocks(newBlocks);
    setSelectedBlockId(duplicated.id);
    setPropertiesScope('block');
  };

  // Copy block to internal clipboard
  const handleCopyBlock = (blockId: string) => {
    const blockToCopy = currentSlide?.blocks?.find((b) => b.id === blockId);
    if (blockToCopy) {
      setClipboardBlock(JSON.parse(JSON.stringify(blockToCopy)));
    }
  };

  // Paste block from internal clipboard
  const handlePasteBlock = () => {
    if (!clipboardBlock) return;
    const currentBlocks = currentSlide?.blocks || [];
    const pastedBlock: ContentBlock = {
      ...JSON.parse(JSON.stringify(clipboardBlock)),
      id: generateBlockId(clipboardBlock.type || 'blk'),
      order: currentBlocks.length + 1,
      revealOrder: currentBlocks.length + 1,
    };
    const updated = [...currentBlocks, pastedBlock];
    updateCurrentSlideBlocks(updated);
    setSelectedBlockId(pastedBlock.id);
    setPropertiesScope('block');
  };

  // Move layer (4 directions: up, down, top, bottom)
  const handleMoveLayer = (blockId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const blocks = [...(currentSlide?.blocks || [])];
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = blocks[index - 1];
      blocks[index - 1] = blocks[index];
      blocks[index] = temp;
    } else if (direction === 'down' && index < blocks.length - 1) {
      const temp = blocks[index + 1];
      blocks[index + 1] = blocks[index];
      blocks[index] = temp;
    } else if (direction === 'top' && index > 0) {
      const [moved] = blocks.splice(index, 1);
      blocks.unshift(moved);
    } else if (direction === 'bottom' && index < blocks.length - 1) {
      const [moved] = blocks.splice(index, 1);
      blocks.push(moved);
    }

    blocks.forEach((b, idx) => {
      b.order = idx + 1;
    });
    updateCurrentSlideBlocks(blocks);
  };

  // Auto-assign sequential reveal order to all blocks in current slide
  const handleAutoAssignRevealOrder = () => {
    if (!currentSlide || !currentSlide.blocks || currentSlide.blocks.length === 0) return;
    const updatedBlocks = currentSlide.blocks.map((block, idx) => ({
      ...block,
      revealOrder: idx + 1,
      animation: {
        ...(block.animation || {}),
        order: idx + 1,
        trigger: (block.animation?.trigger || (idx === 0 ? 'auto' : 'click')) as AnimationTrigger,
        entrance: (block.animation?.entrance || block.revealMode || 'slide-up') as AnimationEntranceType,
      },
    }));
    updateCurrentSlideBlocks(updatedBlocks);
  };

  // Drag-and-drop block reorder
  const handleBlockDrop = (targetBlockId: string) => {
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }
    const blocks = [...(currentSlide?.blocks || [])];
    const fromIdx = blocks.findIndex((b) => b.id === draggedBlockId);
    const toIdx = blocks.findIndex((b) => b.id === targetBlockId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    const [moved] = blocks.splice(fromIdx, 1);
    blocks.splice(toIdx, 0, moved);
    blocks.forEach((b, idx) => {
      b.order = idx + 1;
    });

    updateCurrentSlideBlocks(blocks);
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  // Keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+D, Delete, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewSlide();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'c' && selectedBlockId) {
        e.preventDefault();
        handleCopyBlock(selectedBlockId);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'v' && clipboardBlock) {
        e.preventDefault();
        handlePasteBlock();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'd' && selectedBlockId) {
        e.preventDefault();
        handleDuplicateBlock(selectedBlockId);
      } else if (e.key === 'Delete' && selectedBlockId) {
        const curBlock = currentSlide?.blocks?.find((b) => b.id === selectedBlockId);
        if (!curBlock?.locked) {
          e.preventDefault();
          handleDeleteBlock(selectedBlockId);
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        isCmdOrCtrl &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, clipboardBlock, currentSlide, historyIndex, history, activities, currentActivityIndex]);

  // Activity reorder & manipulations
  const handleMoveActivity = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentActivityIndex > 0) {
      const updated = [...activities];
      const temp = updated[currentActivityIndex - 1];
      updated[currentActivityIndex - 1] = updated[currentActivityIndex];
      updated[currentActivityIndex] = temp;
      // Re-index orders
      updated.forEach((a, i) => (a.order = i + 1));
      commitActivities(updated);
      onSelectSlide(currentActivityIndex - 1, 0);
    } else if (direction === 'down' && currentActivityIndex < activities.length - 1) {
      const updated = [...activities];
      const temp = updated[currentActivityIndex + 1];
      updated[currentActivityIndex + 1] = updated[currentActivityIndex];
      updated[currentActivityIndex] = temp;
      updated.forEach((a, i) => (a.order = i + 1));
      commitActivities(updated);
      onSelectSlide(currentActivityIndex + 1, 0);
    }
  };

  const handleDuplicateActivity = () => {
    const actToDup = activities[currentActivityIndex];
    if (!actToDup) return;
    const duplicated: TeachingActivity = {
      ...actToDup,
      id: generateActivityId(),
      title: `${actToDup.title} (Bản sao)`,
      order: activities.length + 1,
      slides: actToDup.slides.map((s, idx) => ({
        ...s,
        id: generateSlideId(),
        order: idx + 1,
        blocks: s.blocks.map((b) => ({ ...b, id: generateBlockId('blk') })),
      })),
    };
    const updated = [...activities, duplicated];
    commitActivities(updated);
    onSelectSlide(updated.length - 1, 0);
  };

  const handleDeleteActivity = () => {
    if (activities.length <= 1) {
      alert('Bài giảng phải có ít nhất 1 hoạt động sư phạm!');
      return;
    }
    const updated = activities.filter((_, idx) => idx !== currentActivityIndex);
    updated.forEach((a, i) => (a.order = i + 1));
    commitActivities(updated);
    onSelectSlide(Math.max(0, currentActivityIndex - 1), 0);
  };

  // Slide reorder & manipulations
  const handleMoveSlide = (direction: 'up' | 'down') => {
    const act = activities[currentActivityIndex];
    if (!act || act.slides.length <= 1) return;

    if (direction === 'up' && currentSlideIndex > 0) {
      const slds = [...act.slides];
      const temp = slds[currentSlideIndex - 1];
      slds[currentSlideIndex - 1] = slds[currentSlideIndex];
      slds[currentSlideIndex] = temp;
      slds.forEach((s, i) => (s.order = i + 1));

      const updated = [...activities];
      updated[currentActivityIndex] = { ...act, slides: slds };
      commitActivities(updated);
      onSelectSlide(currentActivityIndex, currentSlideIndex - 1);
    } else if (direction === 'down' && currentSlideIndex < act.slides.length - 1) {
      const slds = [...act.slides];
      const temp = slds[currentSlideIndex + 1];
      slds[currentSlideIndex + 1] = slds[currentSlideIndex];
      slds[currentSlideIndex] = temp;
      slds.forEach((s, i) => (s.order = i + 1));

      const updated = [...activities];
      updated[currentActivityIndex] = { ...act, slides: slds };
      commitActivities(updated);
      onSelectSlide(currentActivityIndex, currentSlideIndex + 1);
    }
  };

  const handleDuplicateSlide = () => {
    const act = activities[currentActivityIndex];
    if (!act || !currentSlide) return;

    const duplicated: EditorSlide = {
      ...currentSlide,
      id: generateSlideId(),
      title: `${currentSlide.title} (Bản sao)`,
      order: act.slides.length + 1,
      blocks: currentSlide.blocks.map((b) => ({
        ...b,
        id: generateBlockId('blk'),
      })),
    };

    const slds = [...act.slides, duplicated];
    const updated = [...activities];
    updated[currentActivityIndex] = { ...act, slides: slds };
    commitActivities(updated);
    onSelectSlide(currentActivityIndex, slds.length - 1);
  };

  const handleDeleteSlide = () => {
    const act = activities[currentActivityIndex];
    if (!act) return;
    if (act.slides.length <= 1) {
      alert('Hoạt động này chỉ còn 1 slide, không thể xóa tiếp!');
      return;
    }

    const slds = act.slides.filter((_, idx) => idx !== currentSlideIndex);
    slds.forEach((s, i) => (s.order = i + 1));
    const updated = [...activities];
    updated[currentActivityIndex] = { ...act, slides: slds };
    commitActivities(updated);
    onSelectSlide(currentActivityIndex, Math.max(0, currentSlideIndex - 1));
  };

  return (
    <div className="w-full h-[calc(86vh-56px)] flex flex-col bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
      {/* Top Action & Tool Bar */}
      <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Add Block Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm nội dung</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Menu Dropdown - Grouped in 4 pedagogical categories */}
            {isAddMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                {/* 1. NỘI DUNG VĂN BẢN */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    1. Văn bản & Bảng
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('text')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Type className="w-4 h-4 text-indigo-500" />
                      <span>Văn bản</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('heading')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Heading className="w-4 h-4 text-indigo-500" />
                      <span>Tiêu đề</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('list')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <List className="w-4 h-4 text-indigo-500" />
                      <span>Danh sách (List)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('table')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Table className="w-4 h-4 text-indigo-500" />
                      <span>Bảng dữ liệu</span>
                    </button>
                  </div>
                </div>

                {/* 2. PHƯƠNG TIỆN */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    2. Phương tiện đa phương tiện
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('image')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Image className="w-4 h-4 text-emerald-500" />
                      <span>Hình ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('video')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-rose-500" />
                      <span>Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('audio')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      <span>Âm thanh</span>
                    </button>
                  </div>
                </div>

                {/* 3. TOÁN HỌC TRỰC QUAN */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    3. Trực quan hóa Toán học
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('math')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Sigma className="w-4 h-4 text-indigo-500" />
                      <span>Công thức KaTeX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('geometry')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Shapes className="w-4 h-4 text-sky-500" />
                      <span>Hình học trực quan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('chart')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 text-teal-500" />
                      <span>Biểu đồ số liệu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('model3d')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <Box className="w-4 h-4 text-cyan-500" />
                      <span>Mô hình 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('experiment')}
                      className="col-span-2 p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <FlaskConical className="w-4 h-4 text-violet-500" />
                      <span>Thí nghiệm ảo tương tác</span>
                    </button>
                  </div>
                </div>

                {/* 4. TƯƠNG TÁC LỚP HỌC */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    4. Tương tác & Đấu trường học tập
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('question')}
                      className="w-full p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 text-left cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      <span>Câu hỏi trắc nghiệm (Tạo mới)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('question', 'openBank')}
                      className="w-full p-1.5 rounded-lg bg-amber-50/70 hover:bg-amber-100 text-amber-900 flex items-center gap-2 text-xs font-bold text-left cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>Lấy câu hỏi từ Ngân hàng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('game', 'openGame')}
                      className="w-full p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center gap-2 text-xs font-bold text-left cursor-pointer"
                    >
                      <Gamepad2 className="w-4 h-4 text-purple-600" />
                      <span>Nhúng Trò chơi học tập (9 games)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Slide Button */}
          <button
            type="button"
            onClick={handleAddNewSlide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            title="Thêm slide mới (Bấm phím Enter)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm slide</span>
            <kbd className="px-1 py-0.5 bg-white text-[10px] text-slate-500 rounded border border-slate-300 font-mono shadow-2xs">Enter</kbd>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              title="Hoàn tác (Undo)"
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              title="Làm lại (Redo)"
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Slide Quick Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            disabled={currentSlideIndex <= 0}
            onClick={() => onSelectSlide(currentActivityIndex, currentSlideIndex - 1)}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            title="Slide trước"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-bold text-slate-700">
            {currentActivity?.title} • Slide {currentSlideIndex + 1}/{currentActivity?.slides.length || 1}
          </span>
          <button
            type="button"
            disabled={currentSlideIndex >= (currentActivity?.slides.length || 1) - 1}
            onClick={() => onSelectSlide(currentActivityIndex, currentSlideIndex + 1)}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            title="Slide sau"
          >
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {currentSlide?.blocks && currentSlide.blocks.length > 1 && (
            <button
              type="button"
              onClick={handleAutoAssignRevealOrder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs transition cursor-pointer"
              title="Tự động gán thứ tự xuất hiện 1, 2, 3... cho các khối từ trên xuống để tránh hiện ồ ạt"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Tự động thứ tự chiếu</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLaunchPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>Trình chiếu</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Activity & Slide Tree */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto select-none">
          <div className="p-3 border-b border-slate-100 font-black text-xs text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Cấu trúc bài giảng</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {activities.length} hoạt động
            </span>
          </div>

          <div className="p-2 space-y-2">
            {activities.map((act, aIdx) => {
              const isCurrentAct = aIdx === currentActivityIndex;
              const isCollapsed = collapsedActivities[act.id] || false;

              return (
                <div
                  key={act.id}
                  className={`rounded-2xl border transition-all ${
                    isCurrentAct
                      ? 'border-indigo-200 bg-indigo-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Activity Header Item */}
                  <div
                    onClick={() => {
                      onSelectSlide(aIdx, 0);
                      setPropertiesScope('activity');
                      setSelectedBlockId(null);
                    }}
                    className={`p-2 rounded-t-2xl flex items-center justify-between gap-1.5 cursor-pointer ${
                      isCurrentAct && propertiesScope === 'activity'
                        ? 'bg-indigo-100/70 text-indigo-900 font-black'
                        : 'hover:bg-slate-50 text-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapseActivity(act.id);
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-xs truncate">
                        {act.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                      {act.slides.length}s
                    </span>
                  </div>

                  {/* Slides List in Activity */}
                  {!isCollapsed && (
                    <div className="p-1 space-y-1 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                      {act.slides.map((s, sIdx) => {
                        const isSelectedSlide =
                          isCurrentAct && sIdx === currentSlideIndex;

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onSelectSlide(aIdx, sIdx);
                              setPropertiesScope('slide');
                              setSelectedBlockId(null);
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-xl text-left text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                              isSelectedSlide
                                ? 'bg-indigo-600 text-white font-black shadow-xs'
                                : 'hover:bg-white text-slate-700 font-medium'
                            }`}
                          >
                            <span className="truncate flex-1">
                              {sIdx + 1}. {s.title}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                isSelectedSlide
                                  ? 'bg-indigo-700/80 text-white'
                                  : 'bg-slate-200/60 text-slate-500'
                              }`}
                            >
                              {s.blocks.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: 16:9 Canvas */}
        <div
          onClick={() => {
            // Clicking canvas background deselects block and selects slide properties
            setSelectedBlockId(null);
            setPropertiesScope('slide');
          }}
          className="flex-1 flex flex-col bg-slate-200/70 p-4 sm:p-6 overflow-y-auto items-center justify-center cursor-default"
        >
          {/* Slide 16:9 Container */}
          <div
            style={{ backgroundColor: currentSlide?.background || '#ffffff' }}
            className="w-full max-w-4xl aspect-[16/9] rounded-2xl shadow-2xl border border-slate-300/80 p-6 flex flex-col relative overflow-hidden group/canvas select-none"
          >
            {/* Slide Header Indicator */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100/80 text-xs text-slate-400 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-bold text-slate-700">{currentActivity?.title}</span>
              </span>
              <span>
                Slide {currentSlideIndex + 1} / {currentActivity?.slides.length || 1}
              </span>
            </div>

            {/* Blocks Container */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-1">
              {!currentSlide || currentSlide.blocks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Sparkles className="w-10 h-10 text-indigo-300 mb-2" />
                  <p className="font-bold text-sm text-slate-700">Slide này đang trống</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Bấm nút <span className="font-bold text-indigo-600">+ Thêm nội dung</span> ở thanh công cụ phía trên để chèn Tiêu đề, Công thức KaTeX, Hình ảnh, Câu hỏi hoặc Trò chơi.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddMenuOpen(true);
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    + Thêm nội dung ngay
                  </button>
                </div>
              ) : (
                currentSlide.blocks.map((block, bIdx) => {
                  const isSelected = block.id === selectedBlockId;
                  const isDragging = draggedBlockId === block.id;
                  const isDragOver = dragOverBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      draggable={!block.locked}
                      onDragStart={(e) => {
                        if (block.locked) return;
                        e.dataTransfer.setData('text/plain', block.id);
                        setDraggedBlockId(block.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedBlockId && draggedBlockId !== block.id) {
                          setDragOverBlockId(block.id);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverBlockId === block.id) setDragOverBlockId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleBlockDrop(block.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlockId(block.id);
                        setPropertiesScope('block');
                      }}
                      style={{ width: `${block.size?.width || 100}%` }}
                      className={`relative rounded-xl transition-all cursor-pointer group ${
                        isDragging ? 'opacity-30 scale-95 border-2 border-dashed border-indigo-400' : ''
                      } ${
                        isDragOver ? 'border-t-4 border-indigo-600' : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 shadow-md bg-indigo-50/20 p-1.5'
                          : 'hover:ring-1 hover:ring-indigo-300 p-1'
                      }`}
                    >
                      {/* Reveal Step Badge on top-left of each block */}
                      <div className="absolute -top-2.5 left-2 z-20 flex items-center gap-1">
                        <span
                          title={`Bước #${block.animation?.order || block.revealOrder || bIdx + 1}: ${block.animation?.entrance || block.revealMode || 'fade'} • ${block.animation?.trigger === 'auto' ? `Tự động sau ${block.animation?.delaySeconds || 1}s` : 'Bấm chuột'}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md shadow-xs font-black flex items-center gap-1 select-none"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>#{block.animation?.order || block.revealOrder || bIdx + 1}</span>
                          <span className="opacity-75 font-sans font-normal text-[8px] hidden sm:inline">
                            {block.animation?.entrance || block.revealMode || 'fade'}
                          </span>
                        </span>
                        {block.animation?.autoDisappear && (
                          <span
                            title={`Tự động biến mất sau ${block.animation?.disappearDelaySeconds || 3}s`}
                            className="bg-purple-600 text-white font-mono text-[9px] px-1 py-0.5 rounded-md shadow-xs flex items-center gap-0.5 font-bold"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{block.animation?.disappearDelaySeconds || 3}s</span>
                          </span>
                        )}
                        {block.locked && (
                          <span
                            title="Khối bị khóa vị trí và chỉnh sửa"
                            className="bg-amber-500 text-white p-0.5 rounded shadow-xs"
                          >
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Floating block control bar when selected */}
                      {isSelected && (
                        <div className="absolute -top-4 right-2 z-30 flex items-center gap-1 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg font-bold select-none">
                          {/* Drag Handle */}
                          {!block.locked && (
                            <span
                              title="Kéo thả sắp xếp vị trí"
                              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-white"
                            >
                              <GripVertical className="w-3 h-3" />
                            </span>
                          )}

                          {/* Block Type */}
                          <span className="uppercase tracking-wider text-[9px] font-black text-indigo-300">
                            {block.type}
                          </span>

                          <span className="opacity-30">|</span>

                          {/* Quick Resize Width Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentW = block.size?.width || 100;
                              const nextWidth =
                                currentW === 100 ? 50 : currentW === 50 ? 33 : 100;
                              handleUpdateBlock(block.id, {
                                size: { width: nextWidth, height: block.size?.height || 0 },
                              });
                            }}
                            className="hover:text-indigo-300 cursor-pointer flex items-center gap-0.5 text-[9px]"
                            title={`Độ rộng: ${block.size?.width || 100}%. Bấm để đổi (100% -> 50% -> 33%)`}
                          >
                            <Maximize2 className="w-2.5 h-2.5" />
                            <span>{block.size?.width || 100}%</span>
                          </button>

                          <span className="opacity-30">|</span>

                          {/* Layer Controls: Up & Down */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveLayer(block.id, 'up');
                            }}
                            className="hover:text-indigo-300 cursor-pointer p-0.5"
                            title="Lên trên (Up)"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveLayer(block.id, 'down');
                            }}
                            className="hover:text-indigo-300 cursor-pointer p-0.5"
                            title="Xuống dưới (Down)"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>

                          <span className="opacity-30">|</span>

                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyBlock(block.id);
                            }}
                            className="hover:text-indigo-300 cursor-pointer p-0.5"
                            title="Sao chép (Ctrl+C)"
                          >
                            <Clipboard className="w-3 h-3" />
                          </button>

                          {/* Duplicate Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateBlock(block.id);
                            }}
                            className="hover:text-indigo-300 cursor-pointer p-0.5"
                            title="Nhân bản (Ctrl+D)"
                          >
                            <Copy className="w-3 h-3" />
                          </button>

                          {/* Lock / Unlock Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateBlock(block.id, { locked: !block.locked });
                            }}
                            className={`cursor-pointer p-0.5 ${
                              block.locked ? 'text-amber-400' : 'hover:text-indigo-300 text-slate-400'
                            }`}
                            title={block.locked ? 'Mở khóa khối' : 'Khóa vị trí khối'}
                          >
                            {block.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          </button>

                          {/* Delete Button */}
                          {!block.locked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(block.id);
                              }}
                              className="hover:text-red-400 cursor-pointer p-0.5 text-slate-400"
                              title="Xóa khối (Delete)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      <BlockRenderer
                        block={block}
                        isEditor={true}
                        onUpdate={(updatedContent) =>
                          handleUpdateBlock(block.id, { content: updatedContent })
                        }
                        onOpenQuestionBankModal={() => onOpenQuestionBankModal(block.id)}
                        onOpenGameSelectModal={() => onOpenGameSelectModal(block.id)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Slide Navigation */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              disabled={currentSlideIndex <= 0}
              onClick={() => onSelectSlide(currentActivityIndex, currentSlideIndex - 1)}
              className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Slide trước</span>
            </button>
            <span className="text-xs font-bold text-slate-600">
              Slide {currentSlideIndex + 1} / {currentActivity?.slides.length || 1}
            </span>
            <button
              type="button"
              disabled={currentSlideIndex >= (currentActivity?.slides.length || 1) - 1}
              onClick={() => onSelectSlide(currentActivityIndex, currentSlideIndex + 1)}
              className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Slide sau</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Properties Panel */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
          {currentActivity && currentSlide && (
            <BlockPropertiesPanel
              scope={propertiesScope}
              onSelectScope={(scope) => setPropertiesScope(scope)}
              currentActivity={currentActivity}
              currentSlide={currentSlide}
              selectedBlock={selectedBlock}
              onUpdateActivity={updateCurrentActivity}
              onDeleteActivity={handleDeleteActivity}
              onDuplicateActivity={handleDuplicateActivity}
              onMoveActivity={handleMoveActivity}
              onUpdateSlide={updateCurrentSlideMeta}
              onDeleteSlide={handleDeleteSlide}
              onDuplicateSlide={handleDuplicateSlide}
              onMoveSlide={handleMoveSlide}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onMoveLayer={handleMoveLayer}
              onAddBlock={() => setIsAddMenuOpen(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
