import React, { useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Table as TableIcon, ExternalLink, AlertCircle } from 'lucide-react';
import { SlideVisualAsset } from '../../../../types/presentationStructure';
import { MathRenderer } from '../../../../games/components/MathRenderer';

interface MediaAssetRendererProps {
  visuals?: SlideVisualAsset[];
}

export const MediaAssetRenderer: React.FC<MediaAssetRendererProps> = ({ visuals }) => {
  if (!visuals || visuals.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4 mt-3">
      {visuals.map((asset, idx) => (
        <SingleAssetItem key={idx} asset={asset} />
      ))}
    </div>
  );
};

const SingleAssetItem: React.FC<{ asset: SlideVisualAsset }> = ({ asset }) => {
  const [imageError, setImageError] = useState(false);

  // 1. Render Source Image / Diagram
  if (asset.type === 'source-image' || asset.type === 'math-diagram') {
    return (
      <div className="flex flex-col items-center bg-slate-900/60 p-3 rounded-2xl border border-white/10 overflow-hidden shadow-md">
        {asset.url && !imageError ? (
          <img
            src={asset.url}
            alt={asset.caption || 'Hình ảnh bài giảng'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="max-h-64 object-contain rounded-xl shadow border border-white/5"
          />
        ) : (
          <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-800/80 rounded-xl border border-dashed border-slate-600 text-slate-400 p-4">
            <ImageIcon className="w-8 h-8 mb-2 opacity-60 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">
              {asset.caption || 'Hình minh họa SGK / Sơ đồ bài giảng'}
            </span>
            {imageError && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> Không tải được ảnh từ liên kết gốc
              </span>
            )}
          </div>
        )}
        {asset.caption && (
          <span className="text-xs text-slate-300 font-medium mt-2 text-center italic">
            {asset.caption}
          </span>
        )}
      </div>
    );
  }

  // 2. Render Table
  if (asset.type === 'table' && asset.tableData) {
    const { headers, rows } = asset.tableData;
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900/70 shadow-lg p-3">
        {asset.caption && (
          <div className="flex items-center gap-2 mb-2 px-1 text-xs font-bold text-amber-300">
            <TableIcon className="w-3.5 h-3.5" />
            <span>{asset.caption}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-950/80 border-b border-indigo-700/50 text-indigo-200">
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider">
                    <MathRenderer content={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`hover:bg-white/5 transition ${
                    rIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                  }`}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3 text-slate-200 text-xs">
                      <MathRenderer content={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. Render Video
  if (asset.type === 'video-ref') {
    const isYouTube = asset.url?.includes('youtube.com') || asset.url?.includes('youtu.be');
    let embedUrl = asset.url || '';
    if (isYouTube) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = asset.url?.match(regExp);
      if (match && match[2].length === 11) {
        embedUrl = `https://www.youtube-nocookie.com/embed/${match[2]}`;
      }
    }

    return (
      <div className="w-full flex flex-col items-center bg-slate-900/80 p-3 rounded-2xl border border-white/15 shadow-lg">
        {isYouTube && embedUrl ? (
          <div className="w-full aspect-video max-h-64 rounded-xl overflow-hidden shadow">
            <iframe
              src={embedUrl}
              title={asset.caption || 'Video bài giảng'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full p-4 flex flex-col items-center justify-center bg-indigo-950/40 rounded-xl border border-indigo-800/40 text-center">
            <VideoIcon className="w-8 h-8 text-indigo-400 mb-2" />
            <p className="text-xs font-semibold text-slate-200 mb-2">
              {asset.caption || 'Tài liệu video / Hoạt ảnh bổ trợ'}
            </p>
            {asset.url && (
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow"
              >
                <span>Xem video nguồn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
        {asset.caption && (
          <span className="text-xs text-slate-300 font-medium mt-2 italic">{asset.caption}</span>
        )}
      </div>
    );
  }

  return null;
};
