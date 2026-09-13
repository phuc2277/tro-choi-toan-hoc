import React, { useState } from 'react';
import { AudioBlock } from '../../../types/contentBlock';
import { Volume2, Play, Pause, Music, Link } from 'lucide-react';

interface AudioBlockRendererProps {
  block: AudioBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: AudioBlock['content']) => void;
}

export const AudioBlockRenderer: React.FC<AudioBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(!content.url);
  const [tempUrl, setTempUrl] = useState(content.url);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  if (isEditor && (!content.url || isEditing)) {
    return (
      <div className="w-full h-full p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <Volume2 className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-slate-800">Thêm tệp âm thanh (MP3 / Audio URL)</div>
        <div className="w-full max-w-sm flex items-center gap-1.5">
          <input
            type="text"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="Dán link âm thanh..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={() => {
              onUpdate?.({ ...content, url: tempUrl });
              setIsEditing(false);
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Lưu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg relative group">
      <audio
        ref={audioRef}
        src={content.url}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
        </button>
        <div>
          <div className="text-sm font-black flex items-center gap-1.5">
            <Music className="w-4 h-4" />
            <span>{content.title || 'Bản ghi âm bài giảng'}</span>
          </div>
          <div className="text-xs text-amber-100 font-medium mt-0.5">
            {isPlaying ? 'Đang phát âm thanh...' : 'Bấm để nghe giảng'}
          </div>
        </div>
      </div>

      {isEditor && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-black/40 hover:bg-black/60 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
        >
          <Link className="w-3 h-3" />
          <span>Đổi file</span>
        </button>
      )}
    </div>
  );
};
