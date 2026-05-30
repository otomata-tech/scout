// Touch swipe → prev/next navigation, shared by the detail "fiches".
// Horizontal-only (won't hijack vertical scroll), single-finger, and ignores
// gestures starting on interactive elements or anything marked [data-no-swipe].
export function useSwipeNav(opts: { onPrev: () => void; onNext: () => void; threshold?: number }) {
  const threshold = opts.threshold ?? 70;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      tracking = false;
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target?.closest("textarea, input, select, button, a, pre, [data-no-swipe]")) {
      tracking = false;
      return;
    }
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // Only a clearly horizontal swipe past the threshold counts.
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0) opts.onPrev();
    else opts.onNext();
  }

  return { onTouchStart, onTouchEnd };
}
