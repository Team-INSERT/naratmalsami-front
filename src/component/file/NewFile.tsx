import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function NewFile() {
  const navigate = useNavigate();

  const handleNewFile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      const data = await response.json();
      console.log(data.hashed_id);
      navigate(`/write/${data.hashed_id}`);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <NewFileBox>
        <Hello>환영합니다</Hello>
        <FileButton>
          <NewFileButton onClick={() => handleNewFile()}>새 파일</NewFileButton>
          <OpenButton>열기</OpenButton>
        </FileButton>
      </NewFileBox>
    </>
  );
}

const NewFileBox = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

const Hello = styled.span`
  color: #037147;
  font-family: Pretendard;
  font-size: 64px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
`;

const FileButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
  width: 12.625rem;
`;

const ButtonBase = styled.button`
  display: flex;
  padding: 9px 27px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  font-family: Pretendard;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  border-radius: 34px;
`;

const NewFileButton = styled(ButtonBase)`
  color: #fff;
  background: #000;
`;

const OpenButton = styled(ButtonBase)`
  border: 1px solid #e2e2e2;
  color: #000;
  background: transparent;
`;
