import OverlayRecommendedBox from "../Box";
import * as S from "./style";
import React, { useCallback, useRef, useState } from "react";

export default function HoverTracker({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [originId, setOriginId] = useState<string | undefined>(undefined);
  const [targetPosition, setTargetPosition] = useState({
    top: 0,
    left: 0,
  });

  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const originId = target.attributes.getNamedItem("originid")?.value;

    if (originId && containerRef.current) {
      console.log("Hovered element originId:", originId);
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop; // Get container scroll position

      const rect = {
        top: targetRect.top - containerRect.top + scrollTop, // Add scrollTop to the calculation
        left: targetRect.left - containerRect.left,
      };

      setTargetPosition({
        top: rect.top,
        left: rect.left,
      });
    } else {
      // Reset position or handle case where originId is not found
      // setTargetPosition({ top: 0, left: 0 }); // Optional: Reset if needed
    }

    setOriginId(originId);

  }, []);

  return (
    <div ref={containerRef} onMouseOver={handleMouseOver} style={{ position: 'relative', overflow: 'auto' /* Ensure container is scrollable if needed */ }}>
      <S.Overlay>
        <OverlayRecommendedBox
          left={targetPosition.left}
          top={targetPosition.top}
          originId={originId}
        />
      </S.Overlay>
      {children}
    </div>
  );
}
