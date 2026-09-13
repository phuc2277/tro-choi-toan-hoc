import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  itemType?: 'lesson' | 'chapter' | 'subject' | 'grade' | string;
  message?: string;
  confirmText?: string;
  detailsCount?: {
    lessonsCount?: number;
    presentationsCount?: number;
    questionSetsCount?: number;
  };
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  message,
  confirmText,
  detailsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-rose-100 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-rose-600 font-semibold">Hành động này không thể hoàn tác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-3">
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 font-medium leading-relaxed">
                {message ? (
                  <div>{message}</div>
                ) : (
                  <>
                    Thầy/Cô có chắc chắn muốn xóa {itemType === 'chapter' ? 'chương' : 'mục'}:
                    {itemName && (
                      <div className="font-bold text-rose-950 text-sm mt-1 bg-white/60 p-2 rounded-xl border border-rose-200">
                        {itemName}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Details warning */}
          {itemType === 'chapter' && detailsCount?.lessonsCount !== undefined && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              ⚠️ Xóa chương này sẽ xóa đồng thời <strong className="text-rose-600">{detailsCount.lessonsCount} bài học</strong> thuộc chương.
            </div>
          )}

          {itemType === 'lesson' && (detailsCount?.presentationsCount || detailsCount?.questionSetsCount) ? (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-700">Dữ liệu liên quan sẽ bị xóa kèm:</div>
              <ul className="list-disc list-inside text-slate-500 pl-1 text-[11px]">
                {detailsCount.presentationsCount ? (
                  <li>{detailsCount.presentationsCount} tài liệu học tập / giáo án điện tử</li>
                ) : null}
                {detailsCount.questionSetsCount ? (
                  <li>{detailsCount.questionSetsCount} bộ đề câu hỏi trò chơi</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText || 'Xác nhận xóa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
