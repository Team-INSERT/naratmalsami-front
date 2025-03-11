import React from "react";
import styled from "styled-components";
import word from "/public/images/icon/word.svg";
import { useFileStore } from "@/shared/stores/useDocument";

export default function ListSort() {
  const files = useFileStore((state) => state.files);

  return (
    <ListSortBox>
      {Array.isArray(files) &&
        files.map((file) => (
          <ListFile key={file.hashed_id}>
            <img src={word} alt="word" width={37} height={60} />
            <FileNameDate>
              <FileName>{file.title}</FileName>
              <FileDate>
                {new Date(file.updated_at).toLocaleDateString()}
              </FileDate>
            </FileNameDate>
          </ListFile>
        ))}
    </ListSortBox>
  );
}

const ListSortBox = styled.div`
  display: flex;
  width: 100%;
  padding: 4px 0px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: -1px;
`;

const ListFile = styled.div`
  display: flex;
  padding: 4px 0px;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-top: 1px solid #e2e2e2;
  border-bottom: 1px solid #e2e2e2;
`;

const FileNameDate = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
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
