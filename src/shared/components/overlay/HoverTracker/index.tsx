import OverlayRecommendedBox from "../Box";
import * as S from "./style";
import React, { useCallback, useRef, useState } from "react";

export default function HoverTracker({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [originId, setOriginId] = useState<string | null>(null);
  const [targetPosition, setTargetPosition] = useState({
    top: 0,
    left: 0,
  });
  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const originId = target.attributes.getNamedItem("originid")?.value;

    if (originId) {
      console.log("Hovered element originId:", originId);
      const containerRect = containerRef.current?.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      let rect = { top: 0, left: 0 };

      if (containerRect) {
        rect = {
          top: targetRect.top - containerRect.top,
          left: targetRect.left - containerRect.left,
        };
      }
      setTargetPosition({ top: rect.top, left: rect.left });
      setOriginId(originId);
    } else {
      setTargetPosition({ top: 0, left: 0 });
      setOriginId(null);
    }
  }, []);

  return (
    <div ref={containerRef} onMouseOver={handleMouseOver}>
      <S.Overlay>
        {!!originId && (
          <OverlayRecommendedBox
            left={targetPosition.left}
            top={targetPosition.top}
            originId={originId}
          />
        )}
      </S.Overlay>
      {children}
    </div>
  );
}
