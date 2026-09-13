import confetti from 'canvas-confetti';

/**
 * Trigger a rich, multi-stage celebratory confetti effect
 * with side cannons, center starbursts, and vibrant colors.
 */
export function fireCelebrationConfetti() {
  try {
    // 1. Initial vibrant center blast
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { x: 0.5, y: 0.45 },
      colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      disableForReducedMotion: true,
    });

    // 2. Left side cannon
    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 75,
        origin: { x: 0.05, y: 0.65 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#fbbf24'],
        disableForReducedMotion: true,
      });
    }, 200);

    // 3. Right side cannon
    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 75,
        origin: { x: 0.95, y: 0.65 },
        colors: ['#ec4899', '#8b5cf6', '#f59e0b', '#a855f7'],
        disableForReducedMotion: true,
      });
    }, 400);

    // 4. Grand finale with stars & circles
    setTimeout(() => {
      confetti({
        particleCount: 110,
        spread: 120,
        origin: { x: 0.5, y: 0.35 },
        shapes: ['star', 'circle'],
        colors: ['#ffd700', '#ff69b4', '#00ffff', '#7fff00', '#ff4500'],
        scalar: 1.2,
        disableForReducedMotion: true,
      });
    }, 700);

    // 5. Final gentle falling sparkles
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 160,
        origin: { x: 0.5, y: 0.1 },
        colors: ['#38bdf8', '#fbbf24', '#f472b6', '#34d399'],
        ticks: 200,
        gravity: 0.8,
        scalar: 0.9,
        disableForReducedMotion: true,
      });
    }, 1000);
  } catch (error) {
    console.warn('Could not fire celebration confetti:', error);
  }
}
