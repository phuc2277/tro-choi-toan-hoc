import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExtendedQuestionItem } from '../../types/teacherLesson';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';
import { QuestionPreviewApprovalModal } from './QuestionPreviewApprovalModal';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Image as ImageIcon,
  FileCode,
} from 'lucide-react';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  subject: string;
  grade: number;
  onImportQuestions: (questions: ExtendedQuestionItem[]) => void;
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  lessonTitle,
  subject,
  grade,
  onImportQuestions,
}) => {
  const [rawText, setRawText] = useState('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileMime, setFileMime] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Approval Modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [stagedQuestions, setStagedQuestions] = useState<ExtendedQuestionItem[]>([]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMime(file.type);
    setParseError(null);

    const isTextLike = file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv');

    if (isTextLike) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI-Powered & Intelligent Regex Parser
  const handleParseQuestions = async () => {
    setParseError(null);

    if (!rawText.trim() && !fileBase64) {
      setParseError('Vui lòng dán văn bản câu hỏi hoặc chọn tệp Word / PDF / Ảnh / Text.');
      return;
    }

    setIsParsing(true);

    try {
      // 1. If we have fileBase64 or rich document text, call server AI OCR / Parser
      const res = await fetch('/api/ai/parse-questions-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: rawText,
          fileBase64: fileBase64,
          mimeType: fileMime,
          originalName: fileName,
          lessonTitle,
          subject,
          grade,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const formatted: ExtendedQuestionItem[] = data.questions.map((q: any, idx: number) => ({
            id: `q-import-${Date.now()}-${idx + 1}`,
            subject,
            grade,
            lessonTitle,
            content: q.content,
            questionType: q.questionType || 'multiple-choice',
            cognitiveLevel: q.cognitiveLevel || 'Nhận biết',
            options: q.options || [
              { key: QuizOptionKeyEnum.A, text: 'A' },
              { key: QuizOptionKeyEnum.B, text: 'B' },
              { key: QuizOptionKeyEnum.C, text: 'C' },
              { key: QuizOptionKeyEnum.D, text: 'D' },
            ],
            correctAnswer: (q.correctAnswer as QuizOptionKeyEnum) || QuizOptionKeyEnum.A,
            shortAnswerKey: q.shortAnswerKey,
            explanation: q.explanation || '',
            usageCount: 0,
            createdAt: Date.now(),
          }));

          setStagedQuestions(formatted);
          setShowApprovalModal(true);
          return;
        }
      }

      // 2. Fallback to Local Regex Parsing if AI server was unavailable
      const blocks = rawText.split(/(?:Câu\s*\d+[:.]|Bài\s*\d+[:.]|\n(?=\d+[\.\)]\s+))/i);
      const results: ExtendedQuestionItem[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i].trim();
        if (!block || block.length < 10) continue;

        const optAMatch = block.match(/(?:^|\n|\s)[A][\.\):]\s*([^\n\r]+?)(?=(?:\s+[B][\.\):]|\n|$))/i);
        const optBMatch = block.match(/(?:^|\n|\s)[B][\.\):]\s*([^\n\r]+?)(?=(?:\s+[C][\.\):]|\n|$))/i);
        const optCMatch = block.match(/(?:^|\n|\s)[C][\.\):]\s*([^\n\r]+?)(?=(?:\s+[D][\.\):]|\n|$))/i);
        const optDMatch = block.match(/(?:^|\n|\s)[D][\.\):]\s*([^\n\r]+?)(?=(?:\n|\s+Đáp\s*án|$))/i);

        const ansMatch = block.match(/(?:Đáp\s*án|Key|Answer)[:\s]*([ABCD])/i);
        const explMatch = block.match(/(?:Giải\s*thích|Lời\s*giải|HD)[:\s]*([^\n\r]+)/i);

        let content = block.split(/(?:[A][\.\):]|\n\s*[A][\.\):])/)[0].trim();
        content = content.replace(/^(?:Câu\s*\d+[:.]|Bài\s*\d+[:.]|\d+[\.\)])\s*/i, '').trim();

        if (!content) continue;

        const options = [
          { key: QuizOptionKeyEnum.A, text: optAMatch ? optAMatch[1].trim() : 'Phương án A' },
          { key: QuizOptionKeyEnum.B, text: optBMatch ? optBMatch[1].trim() : 'Phương án B' },
          { key: QuizOptionKeyEnum.C, text: optCMatch ? optCMatch[1].trim() : 'Phương án C' },
          { key: QuizOptionKeyEnum.D, text: optDMatch ? optDMatch[1].trim() : 'Phương án D' },
        ];

        let corr = QuizOptionKeyEnum.A;
        if (ansMatch) {
          const k = ansMatch[1].toUpperCase();
          if (k === 'B') corr = QuizOptionKeyEnum.B;
          else if (k === 'C') corr = QuizOptionKeyEnum.C;
          else if (k === 'D') corr = QuizOptionKeyEnum.D;
        }

        results.push({
          id: `q-parsed-${Date.now()}-${i + 1}`,
          subject,
          grade,
          lessonTitle,
          content,
          questionType: 'multiple-choice',
          cognitiveLevel: 'Thông hiểu',
          options,
          correctAnswer: corr,
          explanation: explMatch ? explMatch[1].trim() : undefined,
          usageCount: 0,
          createdAt: Date.now(),
        });
      }

      if (results.length === 0) {
        throw new Error('Không phân tích được câu hỏi nào từ định dạng trên. Vui lòng kiểm tra lại cấu trúc văn bản.');
      }

      setStagedQuestions(results);
      setShowApprovalModal(true);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Lỗi phân tích cú pháp');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApproveQuestions = (approved: ExtendedQuestionItem[]) => {
    onImportQuestions(approved);
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Nhập câu hỏi từ Tệp (Word, PDF, Ảnh) hoặc Dán văn bản
                </h3>
                <p className="text-xs text-slate-500">
                  AI tự động nhận diện câu hỏi, cấp độ nhận thức, các đáp án và chuẩn hóa công thức LaTeX
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Dán nội dung câu hỏi hoặc Tải file lên:
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileName ? `File: ${fileName}` : 'Chọn Word (.docx) / PDF / Ảnh / Text'}</span>
                  <input
                    type="file"
                    accept=".txt,.json,.csv,.doc,.docx,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={8}
                placeholder={`Ví dụ định dạng dán vào:
Câu 1: Cho phương trình 2x + y = 5. Cặp số nào sau đây là nghiệm?
A. (1; 3)
B. (2; 2)
C. (0; 4)
D. (3; 1)
Đáp án: A
Lời giải: Thay x = 1, y = 3 vào ta được 2(1) + 3 = 5 (đúng).

Hoặc dán toàn bộ văn bản đề thi trắc nghiệm không định dạng, AI sẽ tự bóc tách và phân loại!`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono text-xs border border-slate-300 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isParsing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isParsing || (!rawText.trim() && !fileBase64)}
                onClick={handleParseQuestions}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition cursor-pointer ${
                  isParsing || (!rawText.trim() && !fileBase64)
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-95'
                }`}
              >
                {isParsing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI đang phân tích và bóc tách câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Phân tích & Chuyển sang Bước Phê duyệt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: PREVIEW & APPROVAL MODAL */}
      {showApprovalModal && stagedQuestions.length > 0 && (
        <QuestionPreviewApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApproveQuestions}
          initialQuestions={stagedQuestions}
          title={`Phê duyệt ${stagedQuestions.length} câu hỏi bóc tách từ tệp/văn bản`}
          sourceType={fileName ? `Tệp ${fileName}` : 'Nhập văn bản'}
        />
      )}
    </>,
    document.body
  );
};
