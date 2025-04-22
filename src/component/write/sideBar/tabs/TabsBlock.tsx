import styled from "styled-components";

export default function TabsBlock() {
  return (
    <>
      <TabsBlockBox>
        <BlockBox>
          <Content>
            <Text>다듬을 단어</Text>
            <Value>
              <ValueText>14</ValueText>
            </Value>
          </Content>
        </BlockBox>
      </TabsBlockBox>
    </>
  );
}

const TabsBlockBox = styled.div`
  display: inline-flex;
  align-items: center;
`;

const BlockBox = styled.div`
  display: flex;
  padding: 10px 20px;
  align-items: center;
  gap: 5px;
  border: 1px solid #e2e2e2;
  background: #f3f6f3;
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  user-select: none;
`;
const Text = styled.span`
  color: #2b2b2b;
  font-family: Pretendard;
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 165%;
`;
const Value = styled.div`
  display: flex;
  padding: 2px 6px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 999px;
  background: #05a569;
  box-shadow: 0px 4px 41.2px 0px rgba(5, 165, 105, 0.05);
`;
const ValueText = styled.span`
  color: #fff;
  font-family: "Noto Sans KR";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 19.2px;
`;
