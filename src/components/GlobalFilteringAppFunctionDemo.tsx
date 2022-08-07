import { StickyNote } from '@mirohq/websdk-types';
import React from 'react';
import { appContainer, h3Style } from '../app';

const GlobalFilteringAppFunctionDemo = () => {
	let searchedWidget: StickyNote | undefined = undefined;
	let deletedWidgetsStorage: StickyNote | undefined = undefined;
	const createElement = async () => {
		searchedWidget = await miro.board.createStickyNote({
			content: '<p>This is a sticky note.</p>',
			style: {
				fillColor: 'blue', // Default value: light yellow
				textAlign: 'left', // Default alignment: center
				textAlignVertical: 'bottom', // Default alignment: middle
			},
			x: 500,
			y: 500,
			width: 300,
		});
		miro.board.viewport.zoomTo(searchedWidget);
	};

	const deleteElement = async () => {
		// const widgets = await miro.board.get();
		// searchedWidget = widgets.find((widget) => widget.id === '1') as StickyNote;
		// if (searchedWidget) miro.board.remove(searchedWidget);
		if (searchedWidget) {
			deletedWidgetsStorage = { ...searchedWidget, y: searchedWidget.y, x: searchedWidget.x };
			console.log(deletedWidgetsStorage.x);
			console.log(deletedWidgetsStorage.y);
			searchedWidget.x = 9999;
			searchedWidget.y = 9999;
			searchedWidget.sync();
			miro.board.viewport.zoomTo(searchedWidget);
		}
	};

	const restoreElement = async () => {
		if (searchedWidget && deletedWidgetsStorage) {
			console.log(deletedWidgetsStorage.x);
			console.log(deletedWidgetsStorage.y);
			searchedWidget.x = deletedWidgetsStorage.x;
			searchedWidget.y = deletedWidgetsStorage.y;
			searchedWidget.sync();
			miro.board.viewport.zoomTo(searchedWidget);
		}
	};
	return (
		<div style={appContainer}>
			<div style={h3Style}>FILTERING RE-POSITIONING WORKAROUND DEMO</div>
			<button onClick={() => createElement()}>CREATE</button>
			<button onClick={() => deleteElement()}>DELETE</button>
			<button onClick={() => restoreElement()}>RESTORE</button>
		</div>
	);
};

export default GlobalFilteringAppFunctionDemo;
