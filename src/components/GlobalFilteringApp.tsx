import { Tag } from '@mirohq/websdk-types';
import React, { useEffect, useState } from 'react';
import { appContainer, h3Style, inputContainer, inputStyle, labelStyle } from '../app';
const miro = window.miro;

type WidgetPositionStorage = {
	id: string;
	x: number;
	y: number;
};

const GlobalFilteringApp = () => {
	// https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
	const [tagWidgets, _setTagWidgets] = useState(true);
	const [currentSelectedTag, setCurrentSelectedTag] = useState('all');
	const tagWidgetsRef = React.useRef(tagWidgets);
	// const [widgetBackup, setWidgetBackup] = useState<Item[]>([]);
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const setTagWidgets = (data: boolean) => {
		tagWidgetsRef.current = data;
		_setTagWidgets(data);
	};

	const [widgetPositionStorage, setWidgetPositionStorage] = useState<WidgetPositionStorage[]>([]);
	const removedWidgetX = 9999;
	const removedWidgetY = 9999;

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const filterAfterSelection = (selectedTag: string) => {
		if (selectedTag === 'all') filterReset();
		else if (selectedTag === 'withTag') filterByTagExistence(true);
		else if (selectedTag === 'withoutTag') filterByTagExistence(false);
		else filterByTagName(selectedTag);

		// else {
		// 	allTags.every((tag) => {
		// 		if (tag.title === selectedTag) {
		// 			filterByTagName(tag.title);
		// 			return false;
		// 		}
		// 		return true;
		// 	});
		// }
	};

	// TODO: Add dynamical update of selection box
	const getAllTags = async () => {
		setAllTags(await miro.board.get({ type: 'tag' }));
	};

	useEffect(() => {
		console.log('app first init');
		// init();
		getAllTags();
		// setListener();
	}, []);

	// useEffect(() => {
	// 	init();
	// 	console.log('APP INITIATED');
	// 	miro.addListener('WIDGETS_CREATED', (widget) => {
	// 		// Stickers and card widgets can be tagged. These tags can be read and modified using the Miro SDK.
	// 		console.log(widget);
	// 		// miro.board.tags.create({ title: 'Red tag', color: '#F24726', widgetIds: [widget.data] });
	// 	});
	// }, []);

	// const setListener = () => {
	// 	window.miro.addListener('WIDGETS_CREATED', (widget) => {
	// 		// Stickers and card widgets can be tagged. These tags can be read and modified using the Miro SDK.
	// 		console.log('WIDGET CREATED LISTENER CALLED');
	// 		console.log(widget);
	// 		console.log(widget.data[0].id);
	// 		console.log('!!!', tagWidgets);
	// 		if (tagWidgetsRef.current === true) {
	// 			addTag(widget);
	// 		}
	// 	});
	// 	// miro.addListener('SELECTION_UPDATED', (widget) => {
	// 	// 	console.log('SELECTION UPDATED LISTENER CALLED');
	// 	// 	console.log(widget);
	// 	// 	updateCounter((counter) => counter + 1);
	// 	// 	console.log('selection updated triggered');
	// 	// 	console.log(counter);
	// 	// });
	// 	// miro.addListener('WIDGETS_DELETED', (widget) => {
	// 	// 	// Stickers and card widgets can be tagged. These tags can be read and modified using the Miro SDK.
	// 	// 	console.log('WIDGET DELETED LISTENER CALLED');
	// 	// 	console.log(widget);
	// 	// });
	// };

	// const stringToColour = (str: string) => {
	// 	var hash = 0;
	// 	for (var i = 0; i < str.length; i++) {
	// 		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	// 	}
	// 	var colour = '#';
	// 	for (var i = 0; i < 3; i++) {
	// 		var value = (hash >> (i * 8)) & 0xff;
	// 		colour += ('00' + value.toString(16)).substr(-2);
	// 	}
	// 	return colour;
	// };

	// const addTag = async (widget: any) => {
	// 	console.log('!!! ADD TAG CALLED');
	// 	miro;
	// 	const boardInfo = await miro.board.info.get();
	// 	const lastModifyingUser = boardInfo.lastModifyingUser;

	// 	// Automatically creates the wanted tag with users name,
	// 	// individuel mapped color and widgetIds of the widget which was created,
	// 	// to add it correctly in the new created widget inside "add tag" menu toolbar
	// 	miro.board.tags.create({
	// 		title: lastModifyingUser.name,
	// 		color: stringToColour(lastModifyingUser.id),
	// 		widgetIds: widget.data[0].id,
	// 	});

	// 	// Get the newest created tag
	// 	const userTag = await miro.board.tags.get({
	// 		title: lastModifyingUser.name,
	// 	});

	// 	// Add it to the new created widget
	// 	userTag[0].widgetIds.push(widget.data[0].id);

	// 	// Update tag to apply changes
	// 	miro.board.tags.update(userTag);
	// };

	// if widgetHasTagFilter === true, remove all widgets without tag and show only widgets with tag
	// if widgetHasTagFilter === false, remove all widgets with tag and show only widgets without tag
	const filterByTagExistence = async (widgetHasTagFilter: boolean) => {
		// Locally hide specific stickers according to provided filters
		const allWidgets = await miro.board.get({ type: 'sticky_note' || 'card' });
		let widgetHasTag: boolean = false;

		await filterReset();

		allWidgets.forEach((widget) => {
			// check if widget has any tags
			if (widget.tagIds.length === 0) widgetHasTag = false;
			else widgetHasTag = true;

			// check if widget tag existence does not match filter criteria
			// if so, hide this widget
			if (widgetHasTag !== widgetHasTagFilter) {
				if (widgetPositionStorage.find((widgetData) => widgetData.id === widget.id) === undefined) {
					setWidgetPositionStorage((previousState) => [...previousState, { id: widget.id, x: widget.x, y: widget.y }]);
				}

				// hide widget by moving it to position not visible for user
				widget.x = removedWidgetX;
				widget.y = removedWidgetY;
				widget.sync(); // update all widgets to make changes visible on miro board
			}
		});
	};

	console.log(widgetPositionStorage);

	const filterByTagName = async (filterByTagName: string) => {
		// Locally hide specific stickers according to provided filters
		const allWidgets = await miro.board.get({ type: 'sticky_note' || 'card' });
		const allTags = await miro.board.get({ type: 'tag' });

		await filterReset();

		allWidgets.forEach((widget) => {
			// reset array for every widget
			let widgetTagNameArray: Tag[] = [];

			// Create Array with all tags of widget
			widget.tagIds.forEach((iteratedWidgetTagId) => {
				const tag = allTags.find((tag) => tag.id === iteratedWidgetTagId);
				tag && widgetTagNameArray.push(tag);
			});

			// if filterByTagName string does not exist in widget tags, hide widget
			if (!widgetTagNameArray.some((widgetTag) => widgetTag.title === filterByTagName)) {
				if (widgetPositionStorage.find((widgetData) => widgetData.id === widget.id) === undefined) {
					setWidgetPositionStorage((previousState) => [...previousState, { id: widget.id, x: widget.x, y: widget.y }]);
				}

				// hide widget by moving it to position not visible for user
				widget.x = removedWidgetX;
				widget.y = removedWidgetY;
				widget.sync(); // update all widgets to make changes visible on miro board
			}
		});
	};

	const filterReset = async () => {
		// parallel -> faster then for (sequential)
		// map return promises
		// await Promise.all(
		// 	widgetPositionStorage.map(async (widgetPositionStorageData) => {
		// 		console.log('Filter Reset');
		// 		const widgetToRestore = await miro.board.getById(widgetPositionStorageData.id);
		// 		if ((widgetToRestore && widgetToRestore.type === 'sticky_note') || widgetToRestore.type === 'card') {
		// 			widgetToRestore.x = widgetPositionStorageData.x;
		// 			widgetToRestore.y = widgetPositionStorageData.y;
		// 			console.log(widgetToRestore.x, widgetToRestore.y);
		// 		}
		// 		widgetToRestore.sync();
		// 	})
		// );

		for await (const widgetPositionStorageData of widgetPositionStorage) {
			const widgetToRestore = await miro.board.getById(widgetPositionStorageData.id);
			if ((widgetToRestore && widgetToRestore.type === 'sticky_note') || widgetToRestore.type === 'card') {
				widgetToRestore.x = widgetPositionStorageData.x;
				widgetToRestore.y = widgetPositionStorageData.y;
			}
			widgetToRestore.sync();
		}

		// TODO: Find way to reset the array without buggy behavior
		// setWidgetPositionStorage([]);
	};

	return (
		<div style={appContainer}>
			<h3 style={h3Style}>FILTER FUNCTION</h3>
			<div style={inputContainer}>
				<label style={labelStyle}>Tag: </label>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						width: '100%',
						height: '35px',
					}}
				>
					<select
						style={inputStyle}
						onChange={(event) => setCurrentSelectedTag(event.target.value)}
						value={currentSelectedTag}
					>
						<option value='all'>All</option>
						<option value='withTag'>With Tag</option>
						<option value='withoutTag'>Without Tag</option>
						{allTags.map((tag) => {
							return isNumeric(tag.title) ? null : (
								<option key={tag.id} value={tag.title}>
									{tag.title}
								</option>
							);
						})}
					</select>
					<button
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							border: 'none',
							outline: '1px solid #459fd8',
							height: '100%',
							width: '36px',
							marginLeft: '8px',
							borderRadius: '3px',
							backgroundColor: '#459fd8',
						}}
						onClick={() => filterAfterSelection(currentSelectedTag)}
					>
						<svg width='32' height='32' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M31 28H29.41L28.86 27.45C30.82 25.18 32 22.23 32 19C32 11.82 26.18 6 19 6C11.82 6 6 11.82 6 19C6 26.18 11.82 32 19 32C22.23 32 25.18 30.82 27.45 28.87L28 29.42V31L38 40.98L40.98 38L31 28ZM19 28C14.03 28 10 23.97 10 19C10 14.03 14.03 10 19 10C23.97 10 28 14.03 28 19C28 23.97 23.97 28 19 28Z'
								fill='#fff'
							/>
						</svg>
					</button>
				</div>
			</div>
			{/* <div>
				<label style={labelStyle}>Tag Widgets with User Name</label>
				<input
					type='checkbox'
					id='tagWidgets'
					name='tagWidgets'
					checked={tagWidgets}
					onChange={() => setTagWidgets(!tagWidgets)}
				/>
			</div> */}
		</div>
	);
};

export default GlobalFilteringApp;
