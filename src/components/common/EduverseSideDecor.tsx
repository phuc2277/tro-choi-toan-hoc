import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SideDecorProps {
  className?: string;
}

export const EduverseSideDecor: React.FC<SideDecorProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-40 p-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition cursor-pointer"
        title="Hiện khung câu đối trang trí Tiên Học Lễ - Hậu Học Văn"
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline text-[11px] font-semibold">Hiện câu đối</span>
      </button>
    );
  }

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      {/* TOGGLE VISIBILITY BUTTON */}
      <button
        onClick={() => setIsVisible(false)}
        className="pointer-events-auto fixed bottom-3 left-3 z-40 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1 shadow-md backdrop-blur-md transition cursor-pointer"
        title="Thu nhỏ câu đối trang trí"
      >
        <EyeOff className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Ẩn câu đối</span>
      </button>

      {/* ======================================================== */}
      {/* CỘT BÊN TRÁI: TIÊN - HỌC - LỄ                             */}
      {/* ======================================================== */}
      <aside
        id="side-decor-left"
        aria-label="Khung trang trí Tiên Học Lễ"
        className="hidden 2xl:flex fixed left-3 top-24 z-20 flex-col items-center pointer-events-auto transition-all duration-300 opacity-90 hover:opacity-100"
      >
        {/* TOP: CHIM BỒ CÂU HÒA BÌNH / TRI THỨC */}
        <div className="relative mb-2 flex flex-col items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-[2px] shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
            <div className="w-full h-full rounded-full bg-[#1A0B0B] flex items-center justify-center border border-amber-300/40">
              {/* Dove SVG icon */}
              <svg
                viewBox="0 0 48 48"
                className="w-7 h-7 sm:w-8 sm:h-8 text-amber-200 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <path d="M41.8 11.2c-2.4-.2-4.9.4-7.1 1.7-1.4.8-2.6 1.9-3.6 3.1-2.6-1.7-5.7-2.6-8.8-2.5-1.9.1-3.8.6-5.5 1.5l1.6 3.6c1.3-.7 2.7-1.1 4.1-1.2 2.3 0 4.6.8 6.4 2.1-3.6 2.4-6.4 5.9-8.1 10-1.8 4.3-2.3 9.1-1.4 13.7l3.8-.8c-.8-3.9-.3-8 1.2-11.6 1.4-3.5 3.8-6.5 6.9-8.6 1.4 1.3 3.1 2.3 5 2.9 2.1.7 4.3.9 6.5.6l-.5-3.9c-1.8.2-3.6 0-5.3-.6-1.5-.5-2.8-1.4-3.8-2.5 1.1-1.3 2.4-2.3 3.9-3 1.9-1 4-.1 6-.1l-.8-4.2c-.7.1-1.4.1-2 .1z" />
                <path d="M15.4 17.5c-3.1 1.2-5.7 3.3-7.5 6.1-1.8 2.8-2.7 6.1-2.5 9.4.2 3.3 1.5 6.4 3.7 8.8l2.9-2.7c-1.7-1.9-2.7-4.4-2.9-6.9-.2-2.6.5-5.1 1.9-7.3 1.4-2.2 3.4-3.8 5.8-4.8l-1.4-2.6z" />
                <circle cx="34" cy="18" r="1.5" fill="#FEF08A" />
              </svg>
            </div>
          </div>
          {/* Kim quang đỉnh / tia sáng nhỏ */}
          <div className="w-1 h-3 bg-gradient-to-b from-amber-400 to-transparent" />
        </div>

        {/* DÂY TREO KẾT HOA */}
        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-400 via-rose-500 to-amber-400 shadow-[0_0_6px_#f59e0b]" />

        {/* 3 KHỐI HÌNH THOI DỌC: TIÊN - HỌC - LỄ */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 my-1">
          {['Tiên', 'Học', 'Lễ'].map((word, idx) => (
            <div key={idx} className="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
              {/* Outer Golden Glow */}
              <div className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-rose-600 opacity-80 blur-[6px] group-hover:opacity-100 transition-opacity" />

              {/* Diamond Frame */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rotate-45 rounded-xl bg-gradient-to-br from-amber-300 via-red-600 to-rose-950 p-[2.5px] shadow-[0_4px_15px_rgba(0,0,0,0.6)] border border-amber-200/50">
                <div className="w-full h-full rounded-[9px] bg-gradient-to-br from-red-950 via-[#450a0a] to-[#1a0505] flex items-center justify-center border border-amber-400/30">
                  {/* Chữ đứng thẳng (xoay ngược -45deg) */}
                  <span className="-rotate-45 font-serif font-black text-sm sm:text-base tracking-widest text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">
                    {word}
                  </span>
                </div>
              </div>

              {/* Dấu nối giữa các hình thoi */}
              {idx < 2 && (
                <div className="w-0.5 h-2.5 mx-auto bg-amber-400/80 shadow-[0_0_4px_#f59e0b]" />
              )}
            </div>
          ))}
        </div>

        {/* DÂY NỐI XUỐNG DẢI HOA */}
        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-400 via-rose-500 to-amber-400 shadow-[0_0_6px_#f59e0b]" />

        {/* DẢI LỤA & CHÙM HOA HỒNG TRANG TRÍ DƯỚI CÙNG */}
        <div className="relative flex flex-col items-center mt-1">
          {/* Biểu tượng đóa hoa hồng truyền thống */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
            {/* Vòng hào quang đỏ hồng */}
            <div className="absolute inset-0 rounded-full bg-rose-600/40 blur-[4px]" />
            {/* Hoa hồng SVG */}
            <svg viewBox="0 0 36 36" className="w-7 h-7 text-rose-500 fill-current drop-shadow-md">
              <path d="M18 6c-3.3 0-6 2.7-6 6 0 1.2.4 2.4 1 3.3C9.8 16.3 8 18.9 8 22c0 4.4 3.6 8 8 8s8-3.6 8-8c0-3.1-1.8-5.7-5-6.7.6-.9 1-2.1 1-3.3 0-3.3-2.7-6-6-6zm0 3c1.7 0 3 1.3 3 3 0 .8-.3 1.5-.8 2-1-.2-2-.3-3.2-.3-1.2 0-2.2.1-3.2.3-.5-.5-.8-1.2-.8-2 0-1.7 1.3-3 3-3zm-5 13c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z" />
              <circle cx="18" cy="22" r="2.5" fill="#FEF08A" />
            </svg>
          </div>

          {/* Dải tua rua / lụa gấm rủ màu đỏ viền vàng */}
          <div className="flex gap-1 mt-1">
            <div className="w-1.5 h-10 sm:h-12 bg-gradient-to-b from-rose-600 via-red-700 to-amber-400 rounded-b-full shadow-md animate-pulse" />
            <div className="w-1.5 h-14 sm:h-16 bg-gradient-to-b from-amber-400 via-rose-600 to-amber-300 rounded-b-full shadow-lg" />
            <div className="w-1.5 h-10 sm:h-12 bg-gradient-to-b from-rose-600 via-red-700 to-amber-400 rounded-b-full shadow-md animate-pulse" />
          </div>

          {/* Hạt châu ngọc vàng đáy tua rua */}
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-500 shadow-[0_0_8px_#f59e0b] -mt-1" />
        </div>
      </aside>

      {/* ======================================================== */}
      {/* CỘT BÊN PHẢI: HẬU - HỌC - VĂN                             */}
      {/* ======================================================== */}
      <aside
        id="side-decor-right"
        aria-label="Khung trang trí Hậu Học Văn"
        className="hidden 2xl:flex fixed right-3 top-24 z-20 flex-col items-center pointer-events-auto transition-all duration-300 opacity-90 hover:opacity-100"
      >
        {/* TOP: CHIM BỒ CÂU HÒA BÌNH / TRI THỨC */}
        <div className="relative mb-2 flex flex-col items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-[2px] shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
            <div className="w-full h-full rounded-full bg-[#1A0B0B] flex items-center justify-center border border-amber-300/40">
              {/* Dove SVG icon (flipped symmetrically) */}
              <svg
                viewBox="0 0 48 48"
                className="w-7 h-7 sm:w-8 sm:h-8 text-amber-200 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transform -scale-x-100"
              >
                <path d="M41.8 11.2c-2.4-.2-4.9.4-7.1 1.7-1.4.8-2.6 1.9-3.6 3.1-2.6-1.7-5.7-2.6-8.8-2.5-1.9.1-3.8.6-5.5 1.5l1.6 3.6c1.3-.7 2.7-1.1 4.1-1.2 2.3 0 4.6.8 6.4 2.1-3.6 2.4-6.4 5.9-8.1 10-1.8 4.3-2.3 9.1-1.4 13.7l3.8-.8c-.8-3.9-.3-8 1.2-11.6 1.4-3.5 3.8-6.5 6.9-8.6 1.4 1.3 3.1 2.3 5 2.9 2.1.7 4.3.9 6.5.6l-.5-3.9c-1.8.2-3.6 0-5.3-.6-1.5-.5-2.8-1.4-3.8-2.5 1.1-1.3 2.4-2.3 3.9-3 1.9-1 4-.1 6-.1l-.8-4.2c-.7.1-1.4.1-2 .1z" />
                <path d="M15.4 17.5c-3.1 1.2-5.7 3.3-7.5 6.1-1.8 2.8-2.7 6.1-2.5 9.4.2 3.3 1.5 6.4 3.7 8.8l2.9-2.7c-1.7-1.9-2.7-4.4-2.9-6.9-.2-2.6.5-5.1 1.9-7.3 1.4-2.2 3.4-3.8 5.8-4.8l-1.4-2.6z" />
                <circle cx="34" cy="18" r="1.5" fill="#FEF08A" />
              </svg>
            </div>
          </div>
          {/* Kim quang đỉnh / tia sáng nhỏ */}
          <div className="w-1 h-3 bg-gradient-to-b from-amber-400 to-transparent" />
        </div>

        {/* DÂY TREO KẾT HOA */}
        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-400 via-rose-500 to-amber-400 shadow-[0_0_6px_#f59e0b]" />

        {/* 3 KHỐI HÌNH THOI DỌC: HẬU - HỌC - VĂN */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 my-1">
          {['Hậu', 'Học', 'Văn'].map((word, idx) => (
            <div key={idx} className="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
              {/* Outer Golden Glow */}
              <div className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-rose-600 opacity-80 blur-[6px] group-hover:opacity-100 transition-opacity" />

              {/* Diamond Frame */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rotate-45 rounded-xl bg-gradient-to-br from-amber-300 via-red-600 to-rose-950 p-[2.5px] shadow-[0_4px_15px_rgba(0,0,0,0.6)] border border-amber-200/50">
                <div className="w-full h-full rounded-[9px] bg-gradient-to-br from-red-950 via-[#450a0a] to-[#1a0505] flex items-center justify-center border border-amber-400/30">
                  {/* Chữ đứng thẳng (xoay ngược -45deg) */}
                  <span className="-rotate-45 font-serif font-black text-sm sm:text-base tracking-widest text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">
                    {word}
                  </span>
                </div>
              </div>

              {/* Dấu nối giữa các hình thoi */}
              {idx < 2 && (
                <div className="w-0.5 h-2.5 mx-auto bg-amber-400/80 shadow-[0_0_4px_#f59e0b]" />
              )}
            </div>
          ))}
        </div>

        {/* DÂY NỐI XUỐNG DẢI HOA */}
        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-400 via-rose-500 to-amber-400 shadow-[0_0_6px_#f59e0b]" />

        {/* DẢI LỤA & CHÙM HOA HỒNG TRANG TRÍ DƯỚI CÙNG */}
        <div className="relative flex flex-col items-center mt-1">
          {/* Biểu tượng đóa hoa hồng truyền thống */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
            {/* Vòng hào quang đỏ hồng */}
            <div className="absolute inset-0 rounded-full bg-rose-600/40 blur-[4px]" />
            {/* Hoa hồng SVG */}
            <svg viewBox="0 0 36 36" className="w-7 h-7 text-rose-500 fill-current drop-shadow-md">
              <path d="M18 6c-3.3 0-6 2.7-6 6 0 1.2.4 2.4 1 3.3C9.8 16.3 8 18.9 8 22c0 4.4 3.6 8 8 8s8-3.6 8-8c0-3.1-1.8-5.7-5-6.7.6-.9 1-2.1 1-3.3 0-3.3-2.7-6-6-6zm0 3c1.7 0 3 1.3 3 3 0 .8-.3 1.5-.8 2-1-.2-2-.3-3.2-.3-1.2 0-2.2.1-3.2.3-.5-.5-.8-1.2-.8-2 0-1.7 1.3-3 3-3zm-5 13c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z" />
              <circle cx="18" cy="22" r="2.5" fill="#FEF08A" />
            </svg>
          </div>

          {/* Dải tua rua / lụa gấm rủ màu đỏ viền vàng */}
          <div className="flex gap-1 mt-1">
            <div className="w-1.5 h-10 sm:h-12 bg-gradient-to-b from-rose-600 via-red-700 to-amber-400 rounded-b-full shadow-md animate-pulse" />
            <div className="w-1.5 h-14 sm:h-16 bg-gradient-to-b from-amber-400 via-rose-600 to-amber-300 rounded-b-full shadow-lg" />
            <div className="w-1.5 h-10 sm:h-12 bg-gradient-to-b from-rose-600 via-red-700 to-amber-400 rounded-b-full shadow-md animate-pulse" />
          </div>

          {/* Hạt châu ngọc vàng đáy tua rua */}
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-500 shadow-[0_0_8px_#f59e0b] -mt-1" />
        </div>
      </aside>
    </div>
  );
};
