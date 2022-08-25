import React, { useEffect, useState } from 'react';
import { SDK } from '../../typings/miro';
import { appContainer, h3Style, inputContainer, inputStyle } from '../../app';
const miro = window.miro;

const FilteringAppSDK1 = () => {
	// https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
	const [tagWidgets, _setTagWidgets] = useState(true);
	const [currentSelectedTag, setCurrentSelectedTag] = useState('all');
	const tagWidgetsRef = React.useRef(tagWidgets);
	const [widgetBackup, setWidgetBackup] = useState<SDK.IWidget[]>([]);
	const [allTags, setAllTags] = useState<SDK.ITag[]>([]);
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
		else {
			allTags.every((tag) => {
				if (tag.title === selectedTag) {
					filterByTagName(tag.title);
					return false;
				}
				return true;
			});
		}
	};

	// TODO: Add dynamical update of selection box
	const getAllTags = async () => {
		setAllTags(await miro.board.tags.get());
	};

	useEffect(() => {
		console.log('app first init');
		// init();
		getAllTags();
		setListener();
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

	const setListener = () => {
		window.miro.addListener('WIDGETS_CREATED', (widget) => {
			// Stickers and card widgets can be tagged. These tags can be read and modified using the Miro SDK.
			console.log('WIDGET CREATED LISTENER CALLED');
			console.log(widget);
			console.log(widget.data[0].id);
			console.log('!!!', tagWidgets);
			if (tagWidgetsRef.current === true) {
				addTag(widget);
			}
		});
		// miro.addListener('SELECTION_UPDATED', (widget) => {
		// 	console.log('SELECTION UPDATED LISTENER CALLED');
		// 	console.log(widget);
		// 	updateCounter((counter) => counter + 1);
		// 	console.log('selection updated triggered');
		// 	console.log(counter);
		// });
		// miro.addListener('WIDGETS_DELETED', (widget) => {
		// 	// Stickers and card widgets can be tagged. These tags can be read and modified using the Miro SDK.
		// 	console.log('WIDGET DELETED LISTENER CALLED');
		// 	console.log(widget);
		// });
	};

	const stringToColour = (str: string) => {
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		var colour = '#';
		for (var i = 0; i < 3; i++) {
			var value = (hash >> (i * 8)) & 0xff;
			colour += ('00' + value.toString(16)).substr(-2);
		}
		return colour;
	};

	const addTag = async (widget: any) => {
		console.log('!!! ADD TAG CALLED');
		const boardInfo = await miro.board.info.get();
		const lastModifyingUser = boardInfo.lastModifyingUser;

		// Automatically creates the wanted tag with users name,
		// individuel mapped color and widgetIds of the widget which was created,
		// to add it correctly in the new created widget inside "add tag" menu toolbar
		miro.board.tags.create({
			title: lastModifyingUser.name,
			color: stringToColour(lastModifyingUser.id),
			widgetIds: widget.data[0].id,
		});

		// Get the newest created tag
		const userTag = await miro.board.tags.get({
			title: lastModifyingUser.name,
		});

		// Add it to the new created widget
		userTag[0].widgetIds.push(widget.data[0].id);

		// Update tag to apply changes
		miro.board.tags.update(userTag);
	};

	// https://developers.miro.com/docs/web-plugins-features#control-the-visibility-of-widgets-for-the-current-user
	const filterByTagExistence = async (widgetHasTagFilter: boolean) => {
		// Locally hide specific stickers according to provided filters
		const allWidgets = await miro.board.widgets.get();
		const allTags = await miro.board.tags.get();
		let widgetHasTag: boolean = false;

		allWidgets.forEach((widget) => {
			// reset all widget visibilities before filtering
			// TODO: add here
			widget.clientVisible = true;

			miro.board.widgets.update(widgetBackup);

			allTags.every((tag) => {
				// if widgetHasTagFilter is set
				// check if tag exist on widget
				if (tag.widgetIds.includes(widget.id)) {
					widgetHasTag = true;
					// stop iteration once callback function return falsy value
					return false;
				}
				widgetHasTag = false;
				return true;
			});

			// check if widget tag existence does not match filter criteria
			// if so, locally hide this widget
			if (widgetHasTag !== widgetHasTagFilter) {
				// TODO: add here
				widget.clientVisible = false;
				// TODO: remove here
				// if (widgetBackup.includes(widget) === false) {
				// 	const newWidgetBackup = widgetBackup;
				// 	newWidgetBackup.push(widget);
				// 	setWidgetBackup(newWidgetBackup);
				// }
				// TODO: remove here
				// miro.board.widgets.deleteById(widget.id);
			}
		});

		// TODO: add here
		// update all widgets to make changes visible on miro board
		miro.board.widgets.update(allWidgets);
	};

	const filterByTagName = async (filterByTagName: string) => {
		// Locally hide specific stickers according to provided filters
		const allWidgets = await miro.board.widgets.get();
		const allTags = await miro.board.tags.get();
		let widgetTagNameArray: string[] = [];

		allWidgets.forEach((widget) => {
			// reset all widget visibilities before filtering
			widget.clientVisible = true;
			// reset array for every widget
			widgetTagNameArray = [];

			allTags.forEach((tag) => {
				// if iterated widget has this specific tag id
				// AND the tag title isn't already included in widgetTagNameArray
				// add the tag title to the widgetTagNameArray
				if (tag.widgetIds.includes(widget.id) && !widgetTagNameArray.includes(tag.title)) {
					widgetTagNameArray.push(tag.title);
				}
			});

			const widgetHasNotFilterTag: boolean = !widgetTagNameArray.includes(filterByTagName);

			console.log('allWidgets', allWidgets);
			console.log('filterByTagName', filterByTagName);
			console.log('widget.type', widget.type);
			console.log('widgetTagNameArray', widgetTagNameArray);
			console.log('widgetTagNameArray.length === 0', widgetTagNameArray.length === 0);
			console.log('widgetHasNotFilterTag', widgetHasNotFilterTag);

			// widget has no tag OR
			// tagName Property is provided and the provided tagName Property is not included in the widget tags
			if (widgetTagNameArray.length === 0 || widgetHasNotFilterTag) {
				widget.clientVisible = false;
			}
		});
		miro.board.widgets.update(allWidgets);
	};

	const filterReset = async () => {
		const allWidgets = await miro.board.widgets.get();
		console.log(allWidgets);
		allWidgets.forEach((widget) => {
			// reset all widget visibilities before filtering
			widget.clientVisible = true;
		});
		miro.board.widgets.update(allWidgets);
	};

	return (
		<div style={appContainer}>
			<h3 style={h3Style}>FILTER FUNCTION</h3>
			<div style={inputContainer}>
				<label>Tag: </label>
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
							return isNumeric(tag.title) ? null : <option value={tag.title}>{tag.title}</option>;
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
			<div>
				<input
					type='checkbox'
					id='tagWidgets'
					name='tagWidgets'
					checked={tagWidgets}
					onChange={() => setTagWidgets(!tagWidgets)}
				/>
				<label>Tag Widgets with User Name</label>
			</div>
		</div>
	);
	{
		/* <label>
        Pick your favorite flavor:
        <select value={this.state.value} onChange={this.handleChange}>
            {' '}
            <option value='grapefruit'>Grapefruit</option>
            <option value='lime'>Lime</option>
            <option value='coconut'>Coconut</option>
            <option value='mango'>Mango</option>
        </select>
    </label> */
	}
	{
		/* Show selection field with all possible tags and the option to type in the tag */
	}
	{
		/* Give possibility to reset all filtered tagged fields */
	}
};

export default FilteringAppSDK1;
