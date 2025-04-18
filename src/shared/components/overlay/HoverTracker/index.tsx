import React, { useCallback, useRef } from 'react';

export default function HoverTracker({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    console.log('Hovered element tag:', target.tagName);
  }, []);

  return (
    <div ref={containerRef} onMouseOver={handleMouseOver}>
      {children}
    </div>
  );
}
