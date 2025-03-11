import React, { useEffect } from "react";
import styled from "styled-components";
import { useFileStore } from "@/shared/stores/useDocument";
import { useNavigate } from "react-router-dom";

export default function IconSort() {
  const { files, fetchFiles } = useFileStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <IconSortBox>
      {files.slice(0, 8).map((file) => (
        <IconFile
          key={file.hashed_id}
          onClick={() => navigate(`/files/${file.hashed_id}`)}
        >
          <File />
          <FileNameDate>
            <FileName>{file.title}</FileName>
            <FileDate>
              {new Date(file.updated_at).toLocaleDateString()}
            </FileDate>
          </FileNameDate>
        </IconFile>
      ))}
    </IconSortBox>
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
  min-width: 9.1875rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  cursor: pointer;
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
