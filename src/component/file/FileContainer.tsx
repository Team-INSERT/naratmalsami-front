import React, { useState } from "react";
import styled from "styled-components";
import iconSortImage from "/public/images/icon/icon-sort.svg";
import listSortImage from "/public/images/icon/list-sort.svg";
import IconSort from "./sort/IconSort";
import ListSort from "./sort/ListSort";

export default function FileContainer() {
  const [isIconSort, setIsIconSort] = useState(true);

  return (
    <>
      <LatestSortBox>
        <Latest>최근</Latest>
        <ListOrIcon>
          <SortImage
            src={listSortImage}
            alt="list"
            onClick={() => setIsIconSort(false)}
            className={!isIconSort ? "inactive" : ""}
          />
          <SortImage
            src={iconSortImage}
            alt="icon"
            onClick={() => setIsIconSort(true)}
            className={isIconSort ? "inactive" : ""}
          />
        </ListOrIcon>
      </LatestSortBox>

      <ContentWrapper>
        {isIconSort ? <IconSort /> : <ListSort />}
      </ContentWrapper>
    </>
  );
}

const SortImage = styled.img`
  user-select: none;
  cursor: pointer;

  &.inactive {
    filter: brightness(0.7);
  }
`;

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
  font-weight: 400;
  line-height: normal;
  user-select: none;
`;

const ListOrIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px 24.5px;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  align-content: center;
`;
