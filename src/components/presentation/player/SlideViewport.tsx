import React from 'react';
import { StructuredSlideItem } from '../../../types/presentationStructure';
import { SlideRenderer } from './SlideRenderer';

interface SlideViewportProps {
  slide: StructuredSlideItem;
  subjectName?: string;
  gradeLevel?: number;
  transitionEffect?: 'fade' | 'slide' | 'none';
  slideDirection?: 'next' | 'prev';
}

export const SlideViewport: React.FC<SlideViewportProps> = ({
  slide,
  subjectName,
  gradeLevel,
  transitionEffect = 'fade',
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      {/* 16:9 Aspect Ratio Container - Uses aspect-video with contain sizing to prevent distortion */}
      <div className="w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video relative flex items-center justify-center shadow-2xl overflow-hidden bg-slate-950">
        <div
          key={slide.id}
          className={`w-full h-full relative ${
            transitionEffect === 'fade'
              ? 'animate-fadeIn transition-opacity duration-200'
              : transitionEffect === 'slide'
              ? 'transition-transform duration-200 ease-out'
              : ''
          }`}
        >
          <SlideRenderer
            slide={slide}
            subjectName={subjectName}
            gradeLevel={gradeLevel}
          />
        </div>
      </div>
    </div>
  );
};
