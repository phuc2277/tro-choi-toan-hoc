import React, { useState, useEffect, useRef } from 'react';
import { ContentBlock, AnimationEntranceType, AnimationExitType } from '../../../types/contentBlock';

interface AnimatedBlockWrapperProps {
  block: ContentBlock;
  currentStep: number;
  showAll?: boolean;
  isEditor?: boolean;
  onAutoAdvanceStep?: () => void;
  children: React.ReactNode;
}

export const AnimatedBlockWrapper: React.FC<AnimatedBlockWrapperProps> = ({
  block,
  currentStep,
  showAll = false,
  isEditor = false,
  onAutoAdvanceStep,
  children,
}) => {
  const anim = block.animation || {};
  const order = anim.order ?? block.revealOrder ?? (typeof block.order === 'number' && block.order > 0 ? block.order : 1);
  const entrance: AnimationEntranceType = anim.entrance || block.revealMode || anim.type || 'slide-up';
  const exit: AnimationExitType = anim.exit || 'fade-out';
  const trigger = anim.trigger || 'click';
  const delaySeconds = anim.delaySeconds ?? 1;
  const autoDisappear = anim.autoDisappear ?? false;
  const disappearDelaySeconds = anim.disappearDelaySeconds ?? 3;
  const disappearOnNextStep = anim.disappearOnNextStep ?? false;

  const [hasAppeared, setHasAppeared] = useState(false);
  const [isDisappeared, setIsDisappeared] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const disappearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Check if block should be visible based on step
  const isReached = showAll || isEditor || currentStep >= order;

  // 2. Handle Entrance & Auto-appear triggers
  useEffect(() => {
    if (isEditor || showAll) {
      setHasAppeared(true);
      setIsDisappeared(false);
      setIsExiting(false);
      return;
    }

    // Auto-advance trigger: if this block is next to appear and trigger is 'auto'
    if (trigger === 'auto' && currentStep === order - 1) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        onAutoAdvanceStep?.();
      }, Math.max(200, delaySeconds * 1000));
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentStep, order, trigger, delaySeconds, isEditor, showAll, onAutoAdvanceStep]);

  // 3. Handle Auto-disappear timer & Next-step disappear
  useEffect(() => {
    if (isEditor || showAll) return;

    if (isReached && !hasAppeared) {
      setHasAppeared(true);
      setIsDisappeared(false);
      setIsExiting(false);
    }

    // Check disappearOnNextStep: block was reached in an earlier step, now currentStep > order
    if (disappearOnNextStep && currentStep > order && hasAppeared && !isDisappeared) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        setIsDisappeared(true);
        setIsExiting(false);
      }, 400);
      return () => clearTimeout(exitTimer);
    }

    // Check autoDisappear timer after appearing
    if (isReached && autoDisappear && !isDisappeared && !isExiting) {
      disappearTimerRef.current = setTimeout(() => {
        setIsExiting(true);
        const exitTimer = setTimeout(() => {
          setIsDisappeared(true);
          setIsExiting(false);
        }, 400);
      }, Math.max(500, disappearDelaySeconds * 1000));
    }

    return () => {
      if (disappearTimerRef.current) {
        clearTimeout(disappearTimerRef.current);
      }
    };
  }, [isReached, hasAppeared, currentStep, order, disappearOnNextStep, autoDisappear, disappearDelaySeconds, isEditor, showAll, isDisappeared, isExiting]);

  // Reset when step goes back behind order
  useEffect(() => {
    if (currentStep < order && !showAll && !isEditor) {
      setHasAppeared(false);
      setIsDisappeared(false);
      setIsExiting(false);
    }
  }, [currentStep, order, showAll, isEditor]);

  // In editor mode, render normally with subtle indicator
  if (isEditor) {
    return <div className="w-full h-full">{children}</div>;
  }

  // If completely disappeared
  if (isDisappeared && !showAll) {
    return null;
  }

  // If not yet reached
  if (!isReached && !showAll) {
    return (
      <div
        className="w-full h-0 overflow-hidden opacity-0 pointer-events-none transition-all duration-300"
        aria-hidden="true"
      />
    );
  }

  // Map entrance class
  const getEntranceClass = (type: AnimationEntranceType) => {
    switch (type) {
      case 'fade':
        return 'anim-entrance-fade';
      case 'slide':
      case 'slide-up':
        return 'anim-entrance-slide-up';
      case 'slide-down':
        return 'anim-entrance-slide-down';
      case 'slide-left':
        return 'anim-entrance-slide-left';
      case 'slide-right':
        return 'anim-entrance-slide-right';
      case 'zoom':
        return 'anim-entrance-zoom';
      case 'bounce':
        return 'anim-entrance-bounce';
      case 'glow':
        return 'anim-entrance-glow';
      case 'appear':
      case 'none':
      default:
        return '';
    }
  };

  // Map exit class
  const getExitClass = (type: AnimationExitType) => {
    switch (type) {
      case 'fade-out':
        return 'anim-exit-fade';
      case 'slide-down':
        return 'anim-exit-slide-down';
      case 'slide-up':
        return 'anim-exit-slide-up';
      case 'zoom-out':
      case 'shrink':
        return 'anim-exit-zoom-out';
      case 'none':
      default:
        return 'anim-exit-fade';
    }
  };

  const animationClass = isExiting
    ? getExitClass(exit)
    : !showAll && hasAppeared
    ? getEntranceClass(entrance)
    : '';

  return (
    <div className={`w-full h-full transition-all duration-300 ${animationClass}`}>
      {children}
    </div>
  );
};
