import React, { useEffect } from "react";
import styled from "styled-components";
import naraFile from "/public/images/icon/naraFile.svg";
import { useFileStore } from "@/shared/stores/useDocument";
import { useNavigate } from "react-router-dom";

export default function ListSort() {
  const { files, fetchFiles } = useFileStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <ListSortBox>
      {files.slice(0, 8).map((file) => (
        <ListFile
          key={file.hashed_id}
          onClick={() => navigate(`/files/${file.hashed_id}`)}
        >
          <FileIcon src={naraFile} alt="naraFile" width={37} height={60} />
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
  padding: 4px 0;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: -1px;
`;

const ListFile = styled.div`
  display: flex;
  padding: 4px 0;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-top: 1px solid #e2e2e2;
  border-bottom: 1px solid #e2e2e2;
  cursor: pointer;
`;

const FileIcon = styled.img`
  user-select: none;
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
  font-weight: 400;
`;

const FileDate = styled.span`
  color: #afb1c3;
  font-family: Pretendard;
  font-size: 14px;
  font-weight: 400;
`;
