import React from 'react';
import { StructuredSlideItem } from '../../../types/presentationStructure';
import { SlideErrorBoundary } from './SlideErrorBoundary';
import { TitleSlideView } from './renderers/TitleSlideView';
import { ObjectiveWarmupSlideView } from './renderers/ObjectiveWarmupSlideView';
import { KnowledgeSlideView } from './renderers/KnowledgeSlideView';
import { ExampleSlideView } from './renderers/ExampleSlideView';
import { ActivitySlideView } from './renderers/ActivitySlideView';
import { PracticeSlideView } from './renderers/PracticeSlideView';
import { SummarySlideView } from './renderers/SummarySlideView';

interface SlideRendererProps {
  slide: StructuredSlideItem;
  subjectName?: string;
  gradeLevel?: number;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  subjectName,
  gradeLevel,
}) => {
  return (
    <SlideErrorBoundary slideId={slide.id} slideOrder={slide.order}>
      <div className="w-full h-full select-none">
        {(() => {
          switch (slide.type) {
            case 'title':
              return (
                <TitleSlideView
                  slide={slide}
                  subjectName={subjectName}
                  gradeLevel={gradeLevel}
                />
              );

            case 'objective':
            case 'warmup':
              return <ObjectiveWarmupSlideView slide={slide} />;

            case 'knowledge':
              return <KnowledgeSlideView slide={slide} />;

            case 'example':
              return <ExampleSlideView slide={slide} />;

            case 'activity':
              return <ActivitySlideView slide={slide} />;

            case 'practice':
            case 'application':
              return <PracticeSlideView slide={slide} />;

            case 'summary':
            case 'assignment':
              return <SummarySlideView slide={slide} />;

            case 'custom':
            default:
              return <KnowledgeSlideView slide={slide} />;
          }
        })()}
      </div>
    </SlideErrorBoundary>
  );
};
