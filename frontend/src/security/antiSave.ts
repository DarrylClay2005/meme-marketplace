// Lightweight client-side guards to deter casual image saving.
// Note: This does not provide real security against determined users.

(function installAntiSaveGuards() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Disable context menu on common media elements
  window.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('img, picture, video, canvas')) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // Prevent dragging media out of the page
  document.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('img, picture, video, canvas')) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // Block some common key combos used to view/save source
  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const block =
        (e.ctrlKey && (k === 's' || k === 'u' || k === 'p')) || // save, view-source, print
        (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) || // devtools shortcuts
        k === 'f12'; // devtools
      if (block) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true }
  );
})();
