import styled from "styled-components";
import TabsBlock from "./tabs/TabsBlock";
import ListItem from "./list/ErrorListItem";
import OpenListItem from "./list/OpenListItem";
import React, { useState } from "react";
import { DocumentManager } from "@/shared/stores/DocumentManager";
const error_description = ["", "불필요한 외래어 사용"];
export default function SideBar() {
  const documentManager = React.useMemo(() => new DocumentManager(), []);
  const [selectedErrorId, setSelectedErrorId] = useState("");
  const [errorParagraphs, setErrorParagraphs] = useState(documentManager.getErrorParagraphs());

  React.useEffect(() => {
    console.log("subscription");
    const unsubscribe = documentManager.subscribe(() => {
      console.log("event");
      setErrorParagraphs(documentManager.getErrorParagraphs());
    });
    return () => {
      console.log("unsubscribe");
      unsubscribe();
    };
  }, [documentManager]);

  React.useEffect(() => {
    console.log(`${errorParagraphs}`);
  }, [errorParagraphs]);
  return (
    <React.Fragment>
      <SideBarBox>
        <TabsBlock />
        <SideBarMain>
          {errorParagraphs.map((errorsInParagraph) => {
            return errorsInParagraph.errors.map((error) => (
              <div key={error.error_id}>
                {error.error_id === selectedErrorId ? (
                  <OpenListItem
                    key={error.error_id}
                    errorDetail={error}
                    description={error_description[error.code]}
                    error_id={error.error_id}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      if ((e.target as HTMLElement).tagName === "BUTTON") return;
                      setSelectedErrorId("");
                    }}
                  />
                ) : (
                  <ListItem
                    key={error.error_id}
                    default={error.origin_word}
                    description={error_description[error.code]}
                    onClick={() => {
                      setSelectedErrorId(error.error_id);
                    }}
                  />
                )}
                <Spacer />
              </div>
            ));
          })}
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
