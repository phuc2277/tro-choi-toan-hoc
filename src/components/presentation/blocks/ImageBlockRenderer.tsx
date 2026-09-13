import React, { useState } from 'react';
import { ImageBlock } from '../../../types/contentBlock';
import { Image, Link, AlertCircle } from 'lucide-react';

interface ImageBlockRendererProps {
  block: ImageBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: ImageBlock['content']) => void;
}

export const ImageBlockRenderer: React.FC<ImageBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;
  const [isEditingUrl, setIsEditingUrl] = useState(!content.url);
  const [tempUrl, setTempUrl] = useState(content.url);
  const [hasError, setHasError] = useState(false);

  const handleSave = () => {
    onUpdate?.({ ...content, url: tempUrl });
    setIsEditingUrl(false);
    setHasError(false);
  };

  if (isEditor && (!content.url || isEditingUrl)) {
    return (
      <div className="w-full h-full p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
          <Image className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-slate-700">Thêm hình ảnh vào Slide</div>
        <div className="w-full max-w-sm flex items-center gap-1.5">
          <input
            type="text"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="Dán link ảnh (https://...)"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Lưu
          </button>
        </div>
        {/* Sample math diagrams presets */}
        <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-500">
          <span>Gợi ý mẫu:</span>
          <button
            type="button"
            onClick={() => {
              const url = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80';
              setTempUrl(url);
              onUpdate?.({ ...content, url });
              setIsEditingUrl(false);
            }}
            className="text-indigo-600 hover:underline"
          >
            Toán học hình học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative group overflow-hidden">
      {hasError ? (
        <div className="w-full h-full p-4 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-500 mb-1" />
          <span>Không thể tải hình ảnh từ URL này</span>
          {isEditor && (
            <button
              onClick={() => setIsEditingUrl(true)}
              className="mt-2 text-indigo-600 underline font-bold"
            >
              Đổi liên kết ảnh
            </button>
          )}
        </div>
      ) : (
        <>
          <img
            src={content.url}
            alt={content.altText || content.caption || 'Hình minh họa'}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            style={{
              objectFit: content.fit || 'contain',
              borderRadius: `${content.borderRadius || 12}px`,
            }}
            className="max-w-full max-h-full transition shadow-sm"
          />
          {content.caption && (
            <div className="text-[11px] sm:text-xs text-slate-500 mt-1 text-center font-medium italic">
              {content.caption}
            </div>
          )}
          {isEditor && (
            <button
              type="button"
              onClick={() => setIsEditingUrl(true)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 bg-black/70 hover:bg-black text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow"
            >
              <Link className="w-3 h-3" />
              <span>Đổi ảnh</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
