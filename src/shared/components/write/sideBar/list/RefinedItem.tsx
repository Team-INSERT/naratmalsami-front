import styled from "styled-components";
import success from "/public/images/icon/success.svg";
import * as All from "./ErrorListItem";
import { ErrorDetail } from "@/shared/stores/error";

interface RefinedItemProps {
  errorDetail: ErrorDetail;
}

export default function RefinedItem({ errorDetail }: RefinedItemProps) {
  return (
    <>
      <RefinedItemBox>
        <ListContentBox>
          <Success src={success} alt="success" />
          <All.ContextBox>
            <All.Description>수정한 단어</All.Description>
            <All.Text>
              {errorDetail.origin_word} → <RefinedText>{errorDetail.refine_word[0]}</RefinedText>
            </All.Text>
          </All.ContextBox>
        </ListContentBox>
      </RefinedItemBox>
    </>
  );
}

const RefinedItemBox = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 6px 10px 10px;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
`;

const ListContentBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
`;

const RefinedText = styled(All.Text)`
  color: #05a569;
`;

const Success = styled.img`
  width: 26px;
  height: 26px;
  user-select: none;
`;
