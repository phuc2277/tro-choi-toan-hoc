/**
 * Color Contrast and Text Accessibility Utilities
 * Ensures text never clashes or disappears into slide backgrounds
 */

/**
 * Normalizes text color to guarantee high contrast against dark or light background.
 * If textColor matches or is too close to the background, inverts to a crystal-clear accessible color.
 */
export const getAccessibleTextColor = (
  textColor?: string,
  isDarkBackground: boolean = true
): string => {
  if (!textColor || textColor === 'inherit') {
    return isDarkBackground ? '#F8FAFC' : '#0F172A';
  }

  const clean = textColor.trim().toLowerCase();

  // Known dark shades that blend into dark/navy slides (e.g. bg-slate-900, #0F172A)
  const darkTones = [
    '#000',
    '#000000',
    '#020617',
    '#09090b',
    '#0f172a',
    '#111827',
    '#18181b',
    '#1c1917',
    '#1e293b',
    '#27272a',
    '#334155',
    '#374151',
    '#475569',
    '#64748b',
    'black',
    'navy',
    'darkblue',
    'rgb(15, 23, 42)',
    'rgb(30, 41, 59)',
    'rgb(0, 0, 0)',
  ];

  // Known light shades that blend into light/white slides
  const lightTones = [
    '#fff',
    '#ffffff',
    '#f8fafc',
    '#f1f5f9',
    '#e2e8f0',
    '#e5e7eb',
    '#f3f4f6',
    'white',
    'rgb(255, 255, 255)',
    'rgb(248, 250, 252)',
  ];

  if (isDarkBackground) {
    if (darkTones.includes(clean)) {
      return '#F8FAFC';
    }
    // Check luminance for 6-digit or 3-digit hex
    if (clean.startsWith('#') && (clean.length === 7 || clean.length === 4)) {
      const r = clean.length === 7 ? parseInt(clean.substring(1, 3), 16) : parseInt(clean[1] + clean[1], 16);
      const g = clean.length === 7 ? parseInt(clean.substring(3, 5), 16) : parseInt(clean[2] + clean[2], 16);
      const b = clean.length === 7 ? parseInt(clean.substring(5, 7), 16) : parseInt(clean[3] + clean[3], 16);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // If luminance is below 150, it is too dim on dark navy/slate slides
      if (lum < 150) {
        return '#F8FAFC';
      }
    }
    // Parse rgb(r, g, b)
    if (clean.startsWith('rgb')) {
      const match = clean.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 150) {
          return '#F8FAFC';
        }
      }
    }
  } else {
    if (lightTones.includes(clean)) {
      return '#0F172A';
    }
    if (clean.startsWith('#') && (clean.length === 7 || clean.length === 4)) {
      const r = clean.length === 7 ? parseInt(clean.substring(1, 3), 16) : parseInt(clean[1] + clean[1], 16);
      const g = clean.length === 7 ? parseInt(clean.substring(3, 5), 16) : parseInt(clean[2] + clean[2], 16);
      const b = clean.length === 7 ? parseInt(clean.substring(5, 7), 16) : parseInt(clean[3] + clean[3], 16);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 180) {
        return '#0F172A';
      }
    }
  }

  return textColor;
};
