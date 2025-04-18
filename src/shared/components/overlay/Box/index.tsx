import * as S from "./style";
import { DocumentManager } from "@/shared/stores/DocumentManager";

interface OverlayRecommendedBoxProps {
  originId: string | undefined;
  left: number;
  top: number;
}

const OverlayRecommendedBox = ({
  originId,
  left,
  top,
}: OverlayRecommendedBoxProps) => {
  const documentManager = new DocumentManager();

  if(!originId) return (<></>)
  const errorDetail = documentManager.getErrorByErrorId(originId);

  return (
    originId && (
      <S.OverlayBox
        style={{ position: "relative", left: `${left - 10}px`, top: `${top - 50}px` }}
      >
        <S.OverlayText>이런 단어는 어때요?</S.OverlayText>
        <S.OverlayRefineWord>{errorDetail?.refine_word.join(', ')}</S.OverlayRefineWord>
      </S.OverlayBox>
    )
  );
};

export default OverlayRecommendedBox;