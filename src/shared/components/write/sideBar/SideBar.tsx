import styled from "styled-components";
import TabsBlock from "./tabs/TabsBlock";
import ListItem from "./list/ErrorListItem";
import OpenListItem from "./list/OpenListItem";
import RefinedItem from "./list/RefinedItem";
import { useDocument } from "@/shared/stores/useDocument";
import React from "react";
const error_description = ["", "불필요한 외래어 사용"];
export default function SideBar() {
  const { errors, setChoiceError, choiceError } = useDocument();

  return (
    <React.Fragment>
      <SideBarBox>
        <TabsBlock />
        <SideBarMain>
          {errors?.map((error) => (
            <div key={error.error_id}>
              {error.error_id === choiceError ? (
                <OpenListItem
                  key={error.error_id}
                  default={error.error[0].origin_word}
                  refine={error.error[0].refine_word[0]}
                  description={error_description[error.error[0].code]}
                  error_id={error.error_id}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    setChoiceError("");
                  }}
                />
              ) : (
                <ListItem
                  key={error.error_id}
                  default={error.error[0].origin_word}
                  description={error_description[error.error[0].code]}
                  onClick={() => setChoiceError(error.error_id)}
                />
              )}
              <Spacer />
            </div>
          ))}
        </SideBarMain>
      </SideBarBox>
    </React.Fragment>
  );
}

const SideBarBox = styled.div`
  width: 100%;
  max-width: 30dvw;
  max-height: 100%;
  border-left: 1px solid #e2e2e2;
  background: #fff;
`;

const SideBarMain = styled.main`
  border-top: 1px solid #e2e2e2;
  overflow-y: auto;
  height: 100%;
`;

const Spacer = styled.hr`
  border: 1px solid #e2e2e2;
  margin: 0px;
`;
