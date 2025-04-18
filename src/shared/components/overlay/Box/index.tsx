import * as S from "./style";

interface OverlayRecommendedBoxProps {
  originId: string;
  left: number;
  top: number;
}

const OverlayRecommendedBox = ({
  originId,
  left,
  top,
}: OverlayRecommendedBoxProps) => {
  return (
    <S.OverlayBox
      style={{ position: "relative", left: `${left}px`, top: `${top}px` }}
    >
      <S.OverlayText>이런 단어는 어때요?</S.OverlayText>
      <S.OverlayRefineWord>{"refineWord"}</S.OverlayRefineWord>
    </S.OverlayBox>
  );
};

export default OverlayRecommendedBox;
