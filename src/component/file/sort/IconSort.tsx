import React from "react";
import styled from "styled-components";

export default function IconSort() {
  return (
    <>
      <IconSortBox>
        {Array.from({ length: 10 }).map((_, index) => (
          <IconFile key={index}>
            <File />
            <FileNameDate>
              <FileName>FileNameFileName...</FileName>
              <FileDate>2025-01-01</FileDate>
            </FileNameDate>
          </IconFile>
        ))}
      </IconSortBox>
    </>
  );
}

const IconSortBox = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  align-content: center;
  gap: 24px 24.5px;
  flex-wrap: wrap;
`;

const IconFile = styled.div`
  display: flex;
  max-width: 9.1875rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const File = styled.div`
  height: 12.5rem;
  align-self: stretch;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0px 2px 20.6px 0px rgba(0, 0, 0, 0.02);
`;

const FileNameDate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const FileName = styled.span`
  color: #000;
  font-family: Pretendard;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;

const FileDate = styled.span`
  color: #afb1c3;
  font-family: Pretendard;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;
