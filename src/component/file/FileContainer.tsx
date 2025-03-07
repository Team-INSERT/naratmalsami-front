import React, { useState } from "react";
import styled from "styled-components";
import IconSortImage from "/public/images/icon/icon-sort.svg";
import ListSortImage from "/public/images/icon/list-sort.svg";
import IconSort from "./sort/IconSort";
import ListSort from "./sort/ListSort";

export default function FileContainer() {
  const [isIconSort, setIsIconSort] = useState(true);

  return (
    <>
      <LatestSortBox>
        <Latest>최근</Latest>
        <ListOrIcon>
          <img
            src={ListSortImage}
            alt="list"
            onClick={() => setIsIconSort(false)}
            style={{ cursor: "pointer" }}
          />
          <img
            src={IconSortImage}
            alt="icon"
            onClick={() => setIsIconSort(true)}
            style={{ cursor: "pointer" }}
          />
        </ListOrIcon>
      </LatestSortBox>
      {isIconSort ? <IconSort /> : <ListSort />}
    </>
  );
}

const LatestSortBox = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

const Latest = styled.span`
  color: #000;
  font-family: Pretendard;
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;

const ListOrIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;
