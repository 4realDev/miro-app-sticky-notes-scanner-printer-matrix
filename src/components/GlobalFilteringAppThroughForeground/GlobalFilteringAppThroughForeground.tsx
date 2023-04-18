import { BoardNode, Card, Item, Shape, StickyNote, Tag } from '@mirohq/websdk-types';
import React, { useEffect, useRef, useState } from 'react';
import styles from './GlobalFilteringAppThroughForeground.module.scss';
import Button from '../ui/Button/Button';
import {
	FormControl,
	InputLabel,
	Select,
	OutlinedInput,
	Box,
	Chip,
	MenuItem,
	SelectChangeEvent,
	Checkbox,
	ListItemText,
	FormHelperText,
} from '@mui/material';
import { theme } from '../../theme';
const miro = window.miro;

const GlobalFilteringAppThroughForeground = () => {
	// https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
	const [tagWidgets, _setTagWidgets] = useState(true);
	const [currentSelectedTags, setCurrentSelectedTag] = useState<string[]>([]);
	const tagWidgetsRef = React.useRef(tagWidgets);
	// const [widgetBackup, setWidgetBackup] = useState<Item[]>([]);
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [filteredWidgets, setFilteredWidgets] = useState<Item[]>([]);
	// const [backgroundRectWidgets, setbackgroundRectWidgets] = useState<Shape[]>([]);
	const [backgroundFilteringRect, setBackgroundFilteringRect] = useState<Shape>();

	const setTagWidgets = (data: boolean) => {
		tagWidgetsRef.current = data;
		_setTagWidgets(data);
	};

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const filterAfterSelection = async (value: string | string[]) => {
		console.log(currentSelectedTags);
		if (currentSelectedTags.includes('all')) {
			setCurrentSelectedTag(['all']);
			await filterReset();
			return;
		}

		if (currentSelectedTags.includes('withTag')) {
			setCurrentSelectedTag(['withTag']);
			await filterByTagExistence(true);
			return;
		}

		if (currentSelectedTags.includes('withoutTag')) {
			setCurrentSelectedTag(['withoutTag']);
			await filterByTagExistence(false);
			return;
		}

		setCurrentSelectedTag(
			// On autofill we get a stringified value.
			typeof value === 'string' ? value.split(',') : value
		);

		// for (const selectedTag in currentSelectedTags) {
		// 	await filterByTagName(selectedTag);
		// }
	};

	// TODO: Add dynamical update of selection box
	const getAllTags = async () => {
		setAllTags(await miro.board.get({ type: 'tag' }));
	};

	console.log(backgroundFilteringRect);

	const drawBackground = async (selection: Array<StickyNote | Card>, filteringTagsSelected: boolean = true) => {
		if (!filteringTagsSelected) {
			if (backgroundFilteringRect) await miro.board.remove(backgroundFilteringRect as BoardNode);
			setBackgroundFilteringRect(undefined);
		}
		// const selection = await miro.board.getSelection();
		console.log(selection);
		const minX = Math.min(...selection.map((widget) => widget.x)); // prettier-ignore
		const maxX = Math.max(...selection.map((widget) => widget.x)); // prettier-ignore
		const minY = Math.min(...selection.map((widget) => widget.y)); // prettier-ignore
		const maxY = Math.max(...selection.map((widget) => widget.y)); // prettier-ignore
		const maxHeight = Math.max(...selection.map((widget) => widget.height)); // prettier-ignore
		const maxWidth = Math.max.apply(null,selection.map((widget) => widget.width)); // prettier-ignore

		console.log(minX);
		console.log(maxX);
		console.log(minY);
		console.log(maxY);
		console.log(maxHeight);
		console.log(maxWidth);

		// backgroundFilteringRect does not exist yet
		if (!backgroundFilteringRect) {
			const backgroundRect = await miro.board.createShape({
				shape: 'rectangle',
				x: minX + (maxX - minX) / 2,
				y: minY + (maxY - minY) / 2,
				height: maxY - minY + maxHeight,
				width: maxX - minX + maxWidth,
				style: {
					fillColor: '#ffffff',
				},
			});

			// setbackgroundRectWidgets((previousState) => [...previousState, backgroundRect]);
			setBackgroundFilteringRect(backgroundRect);
			miro.board.sendToBack(backgroundRect);
		}
		// backgroundFilteringRect already exist
		else {
			const backgroundRectAlreadyExistForSelection =
				backgroundFilteringRect.x === minX + (maxX - minX) / 2 ||
				backgroundFilteringRect.y === minY + (maxY - minY) / 2;

			// there is already a backgroundRect but for an older selection, which is not this one
			if (!backgroundRectAlreadyExistForSelection) {
				// remove old backgroundFilteringRect to create new one for the new selection
				// there is always only one backgroundFilteringRect at the time
				await miro.board.remove(backgroundFilteringRect as BoardNode);

				const backgroundRect = await miro.board.createShape({
					shape: 'rectangle',
					x: minX + (maxX - minX) / 2,
					y: minY + (maxY - minY) / 2,
					height: maxY - minY + maxHeight,
					width: maxX - minX + maxWidth,
					style: {
						fillColor: '#ffffff',
					},
				});

				// setbackgroundRectWidgets((previousState) => [...previousState, backgroundRect]);
				setBackgroundFilteringRect(backgroundRect);
				miro.board.sendToBack(backgroundRect);
			}

			// else case:
			// the background rect for this selection already exists and does not need to be redrawn
		}

		// const backgroundRectAlreadyExists = backgroundRectWidgets.some(
		// 	(backgroundRect) => backgroundRect.x === minX + (maxX - minX) / 2 || backgroundRect.y === minY + (maxY - minY) / 2
		// );

		// const backgroundMovedOrDeleted =
		// 	selection.some((widget) => backgroundFilteringRect.map((widgets) => widgets.id).indexOf(widget.id) >= 0) ===
		// 	false;

		// only remove the rect and redraw it, if it does not already exist
		// if (backgroundFilteringRect) {
		// 	const backgroundRect = await miro.board.createShape({
		// 		shape: 'rectangle',
		// 		x: minX + (maxX - minX) / 2,
		// 		y: minY + (maxY - minY) / 2,
		// 		height: maxY - minY + maxHeight,
		// 		width: maxX - minX + maxWidth,
		// 		style: {
		// 			fillColor: '#ffffff',
		// 		},
		// 	});

		// 	// setbackgroundRectWidgets((previousState) => [...previousState, backgroundRect]);
		// 	setBackgroundFilteringRect(backgroundRect);
		// 	miro.board.sendToBack(backgroundRect);
		// }
	};

	useEffect(() => {
		getAllTags();
	}, []);

	// if widgetHasTagFilter === true, remove all widgets without tag and show only widgets with tag
	// if widgetHasTagFilter === false, remove all widgets with tag and show only widgets without tag
	const filterByTagExistence = async (widgetHasTagFilter: boolean) => {
		// Locally hide specific stickers according to provided filters
		// const allWidgets = await miro.board.get({ type: ['sticky_note', 'card'] });
		const selection = await miro.board.getSelection();
		const filteredSelection = selection.filter(
			(selectedWidget) => selectedWidget.type === 'sticky_note' || selectedWidget.type === 'card'
		) as Array<StickyNote | Card>;

		if (filteredSelection.length > 0) {
			let widgetHasTag: boolean = false;

			await filterReset();
			await drawBackground(filteredSelection);

			let filteredWidgets: Array<StickyNote | Card> = [];
			for await (const widget of filteredSelection) {
				// check if widget has any tags
				if (widget.tagIds.length === 0) widgetHasTag = false;
				else widgetHasTag = true;

				// check if widget tag existence does not match filter criteria
				// if so, hide this widget
				if (widgetHasTag !== widgetHasTagFilter) {
					filteredWidgets.push(widget);
					await miro.board.sendToBack(widget);
				}
			}

			setFilteredWidgets(filteredWidgets);
		}
	};

	const filterByTagName = async (filterByTagName: string | string[]) => {
		// Locally hide specific stickers according to provided filters
		// const allWidgets = await miro.board.get({ type: ['sticky_note', 'card'] });
		const selection = await miro.board.getSelection();
		const filteredSelection = selection.filter(
			(selectedWidget) => selectedWidget.type === 'sticky_note' || selectedWidget.type === 'card'
		) as Array<StickyNote | Card>;

		if (filteredSelection.length > 0) {
			const allTags = await miro.board.get({ type: 'tag' });

			await filterReset();
			await drawBackground(filteredSelection, filterByTagName.length > 0);

			let filteredWidgets: Array<StickyNote | Card> = [];
			for await (const widget of filteredSelection) {
				// reset array for every widget
				let widgetTagNameArray: Tag[] = [];

				// Create Array with all tags of widget
				widget.tagIds.forEach((iteratedWidgetTagId) => {
					const tag = allTags.find((tag) => tag.id === iteratedWidgetTagId);
					tag && widgetTagNameArray.push(tag);
				});

				console.log(widgetTagNameArray);
				console.log(filterByTagName);
				console.log(!widgetTagNameArray.some((widgetTag) => widgetTag.title === filterByTagName));

				// if filterByTagName string does not exist in widget tags, hide widget
				if (!widgetTagNameArray.some((widgetTag) => filterByTagName.includes(widgetTag.title))) {
					await miro.board.sendToBack(widget);
					filteredWidgets.push(widget);
				}
			}

			setFilteredWidgets(filteredWidgets);
		}
	};

	const filterReset = async () => {
		// TODO: Check if it is faster and make some research
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
		}
	};

	// const [personName, setPersonName] = React.useState<string[]>([]);

	const handleChange = async (event: SelectChangeEvent<typeof currentSelectedTags>) => {
		// TODO: Maybe get selection / filteredSelection already here and pass it to the filtering methods

		const {
			target: { value },
		} = event;

		if (value instanceof Array) {
			console.log('value', value);
			console.log('value', value.slice(-1)[0]);

			console.log(currentSelectedTags);

			if (value.slice(-1)[0] === 'All Tags') {
				console.log('All Tags');
				setCurrentSelectedTag(['All Tags']);
				setOpen(false);
				await filterReset();
			} else if (value.slice(-1)[0] === 'Only with Tags') {
				console.log('Only with Tags');
				setCurrentSelectedTag(['Only with Tags']);
				setOpen(false);
				await filterByTagExistence(true);
			} else if (value.slice(-1)[0] === 'Only without Tags') {
				console.log('withoutTag');
				setCurrentSelectedTag(['Only without Tags']);
				setOpen(false);
				await filterByTagExistence(false);
			} else {
				console.log('multiple');
				const copyOfCurrentSelectedTags = value.filter((tag) => {
					return tag !== 'All Tags' && tag !== 'Only with Tags' && tag !== 'Only without Tags';
				});
				console.log(copyOfCurrentSelectedTags);
				setCurrentSelectedTag(
					// On autofill we get a stringified value.
					// typeof value === 'string' ? value.split(',') : value
					copyOfCurrentSelectedTags
				);

				copyOfCurrentSelectedTags.length === 0 && setBackgroundFilteringRect(undefined);
				await filterByTagName(copyOfCurrentSelectedTags);
			}
		}

		// if (value.includes('all') || value.includes('withTag') || value.includes('withoutTag')) {

		// await filterAfterSelection(value);
	};

	console.log(currentSelectedTags);

	const [open, setOpen] = React.useState(false);

	const handleClose = () => {
		setOpen(false);
	};

	const handleOpen = () => {
		setOpen(true);
	};

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Presentation Mode</h1>

			<p className={styles.descriptionText}>Select the tag of the widgets you want to see.</p>

			<div className={styles.inputContainer}>
				<FormControl sx={{ m: 1, width: 300 }}>
					{/* <InputLabel id='demo-multiple-chip-label'>Chip</InputLabel> */}
					<Select
						labelId='demo-multiple-chip-label'
						id='demo-multiple-chip'
						multiple
						value={currentSelectedTags}
						open={open}
						onClose={handleClose}
						onOpen={handleOpen}
						onChange={handleChange}
						input={<OutlinedInput id='select-multiple-chip' />}
						renderValue={(selected) => (
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
								{selected.map((value) => (
									<Chip key={value} label={value} />
								))}
							</Box>
						)}
						// MenuProps={MenuProps}
					>
						<MenuItem key='All Tags' value='All Tags'>
							<em>All Tags</em>
						</MenuItem>

						<MenuItem key='Only with Tags' value='Only with Tags'>
							<em>Only with Tags</em>
						</MenuItem>

						<MenuItem key='Only without Tags' value='Only without Tags'>
							<em>Only without Tags</em>
						</MenuItem>
						{allTags.map((tag) => (
							<MenuItem key={tag.id} value={tag.title}>
								<Checkbox checked={currentSelectedTags.indexOf(tag.title) > -1} />
								<ListItemText primary={tag.title} />
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{/* <label className={styles.descriptionText}>Show only widgets: </label>
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
						className={styles.inputField}
						onChange={(event) => setCurrentSelectedTag(event.target.value)}
						value={currentSelectedTags}
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
					</select> */}
				{/* <button
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
						onClick={() => filterAfterSelection(currentSelectedTags)}
					>
						<svg width='32' height='32' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M31 28H29.41L28.86 27.45C30.82 25.18 32 22.23 32 19C32 11.82 26.18 6 19 6C11.82 6 6 11.82 6 19C6 26.18 11.82 32 19 32C22.23 32 25.18 30.82 27.45 28.87L28 29.42V31L38 40.98L40.98 38L31 28ZM19 28C14.03 28 10 23.97 10 19C10 14.03 14.03 10 19 10C23.97 10 28 14.03 28 19C28 23.97 23.97 28 19 28Z'
								fill='#fff'
							/>
						</svg>
					</button> */}
				{/* <div style={{ flex: 1 }}>
						<Button
							buttonIcon={
								<svg width='32' height='32' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
									<path
										d='M31 28H29.41L28.86 27.45C30.82 25.18 32 22.23 32 19C32 11.82 26.18 6 19 6C11.82 6 6 11.82 6 19C6 26.18 11.82 32 19 32C22.23 32 25.18 30.82 27.45 28.87L28 29.42V31L38 40.98L40.98 38L31 28ZM19 28C14.03 28 10 23.97 10 19C10 14.03 14.03 10 19 10C23.97 10 28 14.03 28 19C28 23.97 23.97 28 19 28Z'
										fill='#fff'
									/>
								</svg>
							}
							onClickFunction={filterAfterSelection}
						/>
					</div> */}
				{/* </div> */}
			</div>
		</div>
	);
};

export default GlobalFilteringAppThroughForeground;
