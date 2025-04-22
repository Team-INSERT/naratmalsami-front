import loanword from "/public/images/icon/loanword.svg";
import styled from "styled-components";

interface ListItemProps {
  default: string;
  description: string;
  onClick?: () => void;
}

export default function ListItem({ default: def, description, onClick }: ListItemProps) {
  return (
    <ListItemBox onClick={onClick}>
      <ListContentBox>
        <Loanword src={loanword} alt="loanword" />
        <ContextBox>
          <Description>{description}</Description>
          <Text>{def}</Text>
        </ContextBox>
      </ListContentBox>
    </ListItemBox>
  );
}

export const ListItemBox = styled.div`
  width: 100%;
  padding: 10px 10px;
  background: #fff;
`;

export const ListContentBox = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
`;

export const ContextBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;

export const Description = styled.span`
  color: #afb1c3;
  font-family: "Noto Sans KR";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;

export const Text = styled.span`
  color: #2b2b2b;
  font-family: "Noto Sans KR";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;

export const Loanword = styled.img`
  width: 26px;
  height: 26px;
  user-select: none;
`;
