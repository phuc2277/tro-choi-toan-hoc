import React, { useState } from 'react';
import { VideoBlock } from '../../../types/contentBlock';
import { Video, Link } from 'lucide-react';

interface VideoBlockRendererProps {
  block: VideoBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: VideoBlock['content']) => void;
}

export const VideoBlockRenderer: React.FC<VideoBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;
  const [isEditingUrl, setIsEditingUrl] = useState(!content.url);
  const [tempUrl, setTempUrl] = useState(content.url);

  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    // YouTube support
    if (rawUrl.includes('youtube.com/watch?v=')) {
      const videoId = rawUrl.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (rawUrl.includes('youtu.be/')) {
      const videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return rawUrl;
  };

  const embedUrl = getEmbedUrl(content.url);

  if (isEditor && (!content.url || isEditingUrl)) {
    return (
      <div className="w-full h-full p-4 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/50 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <Video className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-slate-800">Nhúng Video bài học (YouTube / MP4)</div>
        <div className="w-full max-w-sm flex items-center gap-1.5">
          <input
            type="text"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="Dán link YouTube (https://www.youtube.com/watch?v=...)"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="button"
            onClick={() => {
              onUpdate?.({ ...content, url: tempUrl });
              setIsEditingUrl(false);
            }}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Lưu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-lg">
      {embedUrl.includes('youtube.com/embed') ? (
        <iframe
          src={embedUrl}
          title={content.title || 'Video bài giảng'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : (
        <video
          src={embedUrl}
          controls={content.controls !== false}
          autoPlay={false}
          className="w-full h-full object-contain"
        >
          Trình duyệt không hỗ trợ thẻ video.
        </video>
      )}

      {isEditor && (
        <button
          type="button"
          onClick={() => setIsEditingUrl(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
        >
          <Link className="w-3 h-3" />
          <span>Đổi link video</span>
        </button>
      )}
    </div>
  );
};
