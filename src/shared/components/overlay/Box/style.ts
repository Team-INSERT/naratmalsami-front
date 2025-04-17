import styled from "styled-components";

export const OverlayBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  border-radius: 10px;
  border: 0.2px solid #a5e4cd;
  background: #fff;
  box-shadow: 2px 3px 8px 0px rgba(5, 165, 105, 0.1);
  width: fit-content;
  padding: 4px 8px;
`;

export const OverlayText = styled.span`
  color: #2b2b2b;
  font-size: 12px;
`

export const OverlayRefineWord = styled.mark`
  color: #05A569;
  font-size: 16px;
  font-weight: 400;
  line-height: 19.2px;
  background: rgba(5, 165, 105, 0.14);
`