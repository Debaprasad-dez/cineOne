import { useEffect, useRef } from 'react';

// Global custom cursor: a dot that snaps to the pointer and a ring that
// trails with lerp lag and expands over interactive elements.
export default function CursorProvider() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch-only devices get the native (touch) experience. Hybrid laptops
    // report a coarse primary pointer, so check for ANY fine pointer instead.
    if (!window.matchMedia('(any-pointer: fine)').matches) return;

    // The native cursor is only hidden while this class is present, so the
    // custom cursor and the CSS that hides the real one can never disagree.
    document.documentElement.classList.add('custom-cursor');

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    let raf = 0;
    let shown = false;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!shown) {
        // keep dot and ring invisible until we know where the pointer is
        shown = true;
        ring.x = mouse.x;
        ring.y = mouse.y;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      }
      const el = e.target as Element | null;
      const interactive = el?.closest?.('a, button, [data-hoverable], input, [role="button"]');
      ringRef.current?.classList.toggle('hovering', !!interactive);
    };

    const loop = () => {
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove('custom-cursor');
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}
