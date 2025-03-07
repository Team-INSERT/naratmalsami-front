import React from "react";
import styled from "styled-components";
<<<<<<< HEAD:src/pages/file/index.tsx
import FileContainer from "@/shared/components/file/FileContainer";
import NewFile from "@/shared/components/file/NewFile";
=======
import FileContainer from "@/component/file/FileContainer";
import NewFile from "@/component/file/NewFile";
>>>>>>> aec616f (chore: file과 write 폴더 구조 변경):src/pages/write/file/index.tsx

export default function FilePage() {
  return (
    <>
      <Contailner>
        <FilePageBox>
          <NewFile />
          <FileContainer />
        </FilePageBox>
      </Contailner>
    </>
  );
}

const Contailner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: #f8f8f8;
`;
const FilePageBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 70px;
  width: 73.625rem;
`;
