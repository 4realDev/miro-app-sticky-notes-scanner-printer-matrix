import { Item, Tag } from '@mirohq/websdk-types';
import React, { useEffect, useState } from 'react';
import styles from '../../index.module.scss';
const miro = window.miro;

const GlobalFilteringAppThroughForeground = () => {
	// https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
	const [tagWidgets, _setTagWidgets] = useState(true);
	const [currentSelectedTag, setCurrentSelectedTag] = useState('all');
	const tagWidgetsRef = React.useRef(tagWidgets);
	// const [widgetBackup, setWidgetBackup] = useState<Item[]>([]);
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [filteredWidgets, setFilteredWidgets] = useState<Item[]>([]);
	const setTagWidgets = (data: boolean) => {
		tagWidgetsRef.current = data;
		_setTagWidgets(data);
	};

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const filterAfterSelection = (selectedTag: string) => {
		if (selectedTag === 'all') filterReset();
		else if (selectedTag === 'withTag') filterByTagExistence(true);
		else if (selectedTag === 'withoutTag') filterByTagExistence(false);
		else filterByTagName(selectedTag);
	};

	// TODO: Add dynamical update of selection box
	const getAllTags = async () => {
		setAllTags(await miro.board.get({ type: 'tag' }));
	};

	useEffect(() => {
		console.log('app first init');
		getAllTags();
	}, []);

	// if widgetHasTagFilter === true, remove all widgets without tag and show only widgets with tag
	// if widgetHasTagFilter === false, remove all widgets with tag and show only widgets without tag
	const filterByTagExistence = async (widgetHasTagFilter: boolean) => {
		// Locally hide specific stickers according to provided filters
		const allWidgets = await miro.board.get({ type: ['sticky_note', 'card'] });
		let widgetHasTag: boolean = false;

		await filterReset();

		let filteredWidgets: Item[] = [];
		for await (const widget of allWidgets) {
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				// check if widget has any tags
				if (widget.tagIds.length === 0) widgetHasTag = false;
				else widgetHasTag = true;

				// check if widget tag existence does not match filter criteria
				// if so, hide this widget
				if (widgetHasTag !== widgetHasTagFilter) {
					await miro.board.sendToBack(widget);
					filteredWidgets.push(widget);
				}
			}
		}
		setFilteredWidgets(filteredWidgets);
	};

	const filterByTagName = async (filterByTagName: string) => {
		// Locally hide specific stickers according to provided filters
		const allWidgets = await miro.board.get({ type: ['sticky_note', 'card'] });
		const allTags = await miro.board.get({ type: 'tag' });

		await filterReset();

		let filteredWidgets: Item[] = [];
		for await (const widget of allWidgets) {
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				// reset array for every widget
				let widgetTagNameArray: Tag[] = [];

				// Create Array with all tags of widget
				widget.tagIds.forEach((iteratedWidgetTagId) => {
					const tag = allTags.find((tag) => tag.id === iteratedWidgetTagId);
					tag && widgetTagNameArray.push(tag);
				});

				// if filterByTagName string does not exist in widget tags, hide widget
				if (!widgetTagNameArray.some((widgetTag) => widgetTag.title === filterByTagName)) {
					await miro.board.sendToBack(widget);
					filteredWidgets.push(widget);
				}
			}
		}
		setFilteredWidgets(filteredWidgets);
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

		for await (const filteredWidget of filteredWidgets) {
			await miro.board.bringToFront(filteredWidget);
			filteredWidget.sync();
		}
	};

	return (
		<div className={styles.appContainer}>
			<h3 className={styles.h3Style}>FILTER FUNCTION</h3>
			<div className={styles.inputContainer}>
				<label className={styles.labelStyle}>Tag: </label>
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
						className={styles.inputStyle}
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
		</div>
	);
};

export default GlobalFilteringAppThroughForeground;
