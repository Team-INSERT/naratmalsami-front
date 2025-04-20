import styled from 'styled-components';
import TabsBlock from './tabs/TabsBlock';
import ListItem from './list/ErrorListItem';
import OpenListItem from './list/OpenListItem';
import React, { useState } from 'react';
import { DocumentManager } from '@/shared/stores/DocumentManager';
import RefinedItem from './list/RefinedItem';
const error_description = ['', '불필요한 외래어 사용'];
export default function SideBar() {
	const HIGHLIGHT_DURATION = 2000;
	const EDITOR_CONTAINER_SELECTOR = '.editor-container__editor-wrapper';

	const documentManager = React.useMemo(() => new DocumentManager(), []);
	const [selectedErrorId, setSelectedErrorId] = useState('');
	const [errorParagraphs, setErrorParagraphs] = useState(documentManager.getErrorParagraphs());
	const [resolvedErrors, setResolvedErrors] = useState(documentManager.getResolvedErrors());

	React.useEffect(() => {
		console.log('subscription');
		const unsubscribe = documentManager.subscribe(() => {
			console.log('event');
			setErrorParagraphs(documentManager.getErrorParagraphs());
			setResolvedErrors(documentManager.getResolvedErrors());
		});
		return () => {
			console.log('unsubscribe');
			unsubscribe();
		};
	}, [documentManager]);

	React.useEffect(() => {
		console.log(`errorParagraphs Updated:`, errorParagraphs);
		console.log(`resolvedErrors Updated:`, resolvedErrors);
	}, [errorParagraphs, resolvedErrors]);

	React.useEffect(() => {
		if (!selectedErrorId) return;
		const container = document.querySelector<HTMLElement>(EDITOR_CONTAINER_SELECTOR);
		const target = document.querySelector<HTMLSpanElement>(`span[originid="${selectedErrorId}"]`);
		if (!container || !target) return;

		const targetOffset = target.offsetTop - container.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
		container.scrollTo({ top: targetOffset, behavior: 'smooth' });

		target.classList.add('flash-highlight');
		const timer = setTimeout(() => {
			target.classList.remove('flash-highlight');
		}, HIGHLIGHT_DURATION);

		return () => clearTimeout(timer);
	}, [selectedErrorId]);
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
										target_id={errorsInParagraph.target_id}
										description={error_description[error.code]}
										error_id={error.error_id}
										onClick={(e: React.MouseEvent<HTMLDivElement>) => {
											if ((e.target as HTMLElement).tagName === 'BUTTON') return;
											setSelectedErrorId('');
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
					{resolvedErrors.map((resolvedError) => {
						return <RefinedItem key={resolvedError.error_id} errorDetail={resolvedError} />;
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
