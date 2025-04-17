import * as S from './style';

const OverlayRecommendedBox = ({ refineWord }: {refineWord: string;}) => {
  return (
    <S.OverlayBox>
      <S.OverlayText>이런 단어는 어때요?</S.OverlayText>
      <S.OverlayRefineWord>{refineWord}</S.OverlayRefineWord>
    </S.OverlayBox>
  );
};

export default OverlayRecommendedBox;