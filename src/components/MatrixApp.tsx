import { Item, Shape, Tag, Text } from '@mirohq/websdk-types';
import React, { useEffect, useState } from 'react'; // react is needed for Miro
import { h3Style, inputContainer, inputStyle, buttonStyle, appContainer, labelStyle } from '../app';
const miro = window.miro;

type NumericTaggedWidget = {
	widget: Item;
	numericTag: number;
};

type MatrixQuarterData = {
	centerPoint: { x: number; y: number };
	width: number;
	height: number;
	content: string;
	contentColor: string;
};

type MatrixQuarterDataList = {
	topLeft: MatrixQuarterData;
	topRight: MatrixQuarterData;
	bottomLeft: MatrixQuarterData;
	bottomRight: MatrixQuarterData;
};

type MatrixCategoryListElement = {
	widgetPosX: number;
	widgetPosY: number;
	category: { color: string; prio: number };
	text: string;
};

const MATRIX_QUARTER_CATEGORIES = {
	TOP_LEFT: { color: '#E9F7FD', prio: 4 },
	TOP_RIGHT: { color: '#FCFFC6', prio: 2 },
	BOTTOM_LEFT: { color: '#E4F6DF', prio: 3 },
	BOTTOM_RIGHT: { color: '#FFDCE4', prio: 1 },
} as const;

const DEBUG_DOT = false;

const MatrixApp = () => {
	const [inputXAxis, setInputXAxis] = useState('Importance');
	const [inputYAxis, setInputYAxis] = useState('Difficulty');

	const [showCategorization, _setShowCategorization] = useState(false);
	const showCategorizationRef = React.useRef(showCategorization);
	const setShowCategorization = (data: boolean) => {
		showCategorizationRef.current = data;
		_setShowCategorization(data);
	};

	// let minWidgetPosX: number | undefined = undefined;
	// let minWidgetPosY: number | undefined = undefined;

	// let minCoorPosX: number | undefined = undefined;
	// let minCoorPosY: number | undefined = undefined;

	// let totalWidgetWidth: number = 0;
	// let totalWidgetHeight: number = 0;

	const [minWidgetPosX, setMinWidgetPosX] = useState<number | undefined>(undefined);
	const [minWidgetPosY, setMinWidgetPosY] = useState<number | undefined>(undefined);

	const [minCoorPosX, setMinCoorPosX] = useState<number | undefined>(undefined);
	const [minCoorPosY, setMinCoorPosY] = useState<number | undefined>(undefined);

	const [totalWidgetWidth, setTotalWidgetWidth] = useState(0);
	const [totalWidgetHeight, setTotalWidgetHeight] = useState(0);

	const paddingXBetweenWidgets: number = 48;
	const paddingYBetweenWidgets: number = 48;

	const [bottomLeftQuarter, setBottomLeftQuarter] = useState<Shape | undefined>(undefined);
	const [bottomRightQuarter, setBottomRightQuarter] = useState<Shape | undefined>(undefined);
	const [topLeftQuarter, setTopLeftQuarter] = useState<Shape | undefined>(undefined);
	const [topRightQuarter, setTopRightQuarter] = useState<Shape | undefined>(undefined);

	const [quarterDataList, setQuarterDataList] = useState<MatrixQuarterDataList | undefined>(undefined);

	const [matrixCategoryList, setMatrixCategoryList] = useState<MatrixCategoryListElement[] | undefined>(undefined);
	const [matrixCategoryListWidgets, setMatrixCategoryListWidgets] = useState<Text[] | undefined>(undefined);

	// let bottomLeftQuarter: Shape;
	// let bottomRightQuarter: Shape;
	// let topLeftQuarter: Shape;
	// let topRightQuarter: Shape;

	useEffect(() => {
		showCategorizationOfMatrix(showCategorization);
	}, [showCategorization]);

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const calculateMinPosYAndMinPosX = (allSelectedWidgets: Item[]) => {
		// set initial value for minPosX and minPosY
		let minPosX = allSelectedWidgets[0].x;
		let minPosY = allSelectedWidgets[0].y;

		// calculate most top y and most left x of all selected widgets
		allSelectedWidgets.forEach((widget) => {
			if (minPosX && minPosY) {
				if (widget.x < minPosX) minPosX = widget.x;
				if (widget.y < minPosY) minPosY = widget.y;
			}
		});

		return [minPosX, minPosY];
	};

	const calculateTotalWidgetWidthAndHeight = (widgets: Item[]) => {
		let totalWidgetWidth = 0;
		let totalWidgetHeight = 0;
		widgets.forEach((widget, index) => {
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				// last element should not have padding
				if (index === widgets.length - 1) {
					totalWidgetWidth = totalWidgetWidth + widget.width;
					totalWidgetHeight = totalWidgetHeight + widget.height;
				} else {
					totalWidgetWidth = totalWidgetWidth + widget.width + paddingXBetweenWidgets;
					totalWidgetHeight = totalWidgetHeight + widget.height + paddingYBetweenWidgets;
				}
			}
		});

		// for last element, which should not have padding, otherwise axis padding size larger then widgets with padding
		return [totalWidgetWidth, totalWidgetHeight];
	};

	const sortWidgetsOnXAxis = (allSelectedWidgets: Item[]) => {
		return allSelectedWidgets.sort((a, b) => {
			return a.x - b.x;
		});
	};

	// adjust x any y position of widgets to be perfectly horizontal and vertical aligned in a line by respecting the manually created order on x axis
	const alignWidgetsHorizontallyAndVerticallyInLine = (
		sortedSelectedWidgetsAfterXValue: Item[],
		minPosX: number,
		minPosY: number
	) => {
		// let widgetTagCount = -1;
		let updatedWidgetDistanceX = 0;
		sortedSelectedWidgetsAfterXValue.forEach(async (widget) => {
			// widgetTagCount = widgetTagCount + 1;
			// await miro.board.widgets.update({
			// 	...widget,
			// 	x: minPosX + widget.width * widgetTagCount,
			// 	y: minPosY,
			// });
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				// widget.x = minPosX + widget.width * widgetTagCount;
				widget.x = minPosX + updatedWidgetDistanceX;
				widget.y = minPosY;
				widget.sync();
				updatedWidgetDistanceX = updatedWidgetDistanceX + widget.width + paddingXBetweenWidgets;
			}
		});
	};

	// adjust x position of widgets to be perfectly horizontal aligned by respecting the manually created order on x axis
	const alignWidgetsHorizontally = async (sortedSelectedWidgetsAfterXValue: Item[], minCoorPosX: number) => {
		// let widgetTagCount = -1;
		let updatedWidgetDistanceX = 0;
		sortedSelectedWidgetsAfterXValue.forEach(async (widget) => {
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				// widgetTagCount = widgetTagCount + 1;
				// await miro.board.widgets.update({
				// 	...widget,
				// 	x: minCoorPosX + widget.width * widgetTagCount,
				// });
				// widget.x = minCoorPosX + widget.width * widgetTagCount;

				// TODO: Understand why I have to add widget.width / 2 to widget.x position
				widget.x = minCoorPosX + updatedWidgetDistanceX + widget.width / 2;
				widget.sync();
				updatedWidgetDistanceX = updatedWidgetDistanceX + widget.width + paddingXBetweenWidgets;
			}
		});
	};

	const addNumericTags = (allTags: Tag[], allSelectedWidgets: Item[]) => {
		let sortedSelectedWidgetsAfterYValueWithNumericTag: NumericTaggedWidget[] = [];
		// allTags.forEach((tag) => {
		// 	if (isNumeric(tag.title)) {
		// 		const widgetWithNumericTag = allSelectedWidgets.find((widget) => tag.widgetIds.includes(widget.id));
		// 		if (widgetWithNumericTag) {
		// 			sortedSelectedWidgetsAfterYValueWithNumericTag.push({
		// 				widget: widgetWithNumericTag,
		// 				numericTag: parseInt(tag.title),
		// 			});
		// 		}
		// 	}
		// });

		allSelectedWidgets.forEach((widget) => {
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				widget.tagIds.forEach((tagId) => {
					const widgetTag = allTags.find((tag) => tag.id === tagId && isNumeric(tag.title));
					if (widgetTag !== undefined) {
						sortedSelectedWidgetsAfterYValueWithNumericTag.push({
							widget: widget,
							numericTag: parseInt(widgetTag.title),
						});
					}
				});
			}
		});
		return sortedSelectedWidgetsAfterYValueWithNumericTag;
	};

	// sort widgets according to their numeric tag (lowest to highest)
	// remove their numeric tag after sorting to get array with only the sorted widgets in the correct order
	const sortWidgetsOnYAxisAfterNumericTag = (sortedSelectedWidgetsAfterYValueWithNumericTag: NumericTaggedWidget[]) => {
		return sortedSelectedWidgetsAfterYValueWithNumericTag
			.sort((a, b) => {
				return b.numericTag - a.numericTag;
			})
			.map((numericWidget) => numericWidget.widget);
	};

	// TODO: Find solution for elements which have same tag number to be on same height!
	// vertical alignment according to the sorting
	// update every widget in sorted array with new sorted y position and aligned x position
	const alignWidgetsVerticallyAfterNumericTag = async (
		sortedSelectedWidgetsAfterYValue: Item[],
		minCoorPosY: number
	) => {
		// let widgetTagCount = -1;
		let updatedWidgetDistanceY = 0;
		sortedSelectedWidgetsAfterYValue.forEach(async (widget) => {
			if (widget.type === 'sticky_note' || widget.type === 'card') {
				// widgetTagCount = widgetTagCount + 1;
				// await miro.board.widgets.update({
				// 	...widget,
				// 	x: widget.bounds.x,
				// 	y: minCoorPosY!! + widget.bounds.height * widgetTagCount + widget.bounds.height / 2,
				// });
				// widget.y = minCoorPosY!! + widget.height * widgetTagCount + widget.height / 2;

				widget.x = widget.x;
				widget.y = minCoorPosY!! + updatedWidgetDistanceY + widget.height / 2;
				widget.sync();

				updatedWidgetDistanceY = updatedWidgetDistanceY + widget.height + paddingYBetweenWidgets;
			}
		});
	};

	const createCoordinateSystem = async (
		minWidgetPosX: number,
		minWidgetPosY: number,
		inputXAxis: string,
		inputYAxis: string,
		widgetWidth: number,
		widgetHeight: number,
		totalWidgetWidth: number,
		totalWidgetHeight: number
	) => {
		// const totalWidgetWidth = widgets.length * widgetWidth;
		// const totalWidgetHeight = widgets.length * widgetHeight;
		const paddingToWidgets = widgetHeight * 2;
		const distanceTextToAxis = 50;

		// bottom left edge point of the coordinate system
		// TODO: Understand why I have to subtract "widgetWidth / 2 from coorOriginX"
		const coorOriginX = minWidgetPosX - widgetWidth / 2;
		const coorOriginY = minWidgetPosY - totalWidgetHeight - paddingToWidgets;

		/*** CREATE AXIS ***/
		// create Y-Axis
		// await miro.board.widgets.create({
		// 	type: 'LINE',
		// 	startPosition: {
		// 		x: coorOriginX,
		// 		y: coorOriginY,
		// 	},
		// 	endPosition: {
		// 		x: coorOriginX,
		// 		y: minWidgetPosY!! - paddingToWidgets,
		// 	},
		// 	style: {
		// 		lineColor: '#000000',
		// 		lineStyle: 2,
		// 		lineThickness: 2,
		// 		lineEndStyle: 8,
		// 		lineStartStyle: 0,
		// 		lineType: 0,
		// 	},
		// });

		await miro.board.createShape({
			// startPosition: {
			// 	x: coorOriginX,
			// 	y: coorOriginY,
			// },
			// endPosition: {
			// 	x: coorOriginX,
			// 	y: minWidgetPosY!! - paddingToWidgets,
			// },
			shape: 'rectangle',
			x: coorOriginX,
			y: coorOriginY + (minWidgetPosY - paddingToWidgets - coorOriginY) / 2,
			height: minWidgetPosY - paddingToWidgets - coorOriginY,
			width: 8,
			style: {
				fillColor: '#000000',
			},
		});

		// create X-Axis
		// await miro.board.widgets.create({
		// 	type: 'LINE',
		// 	startPosition: {
		// 		x: coorOriginX,
		// 		y: coorOriginY,
		// 	},
		// 	endPosition: {
		// 		x: coorOriginX + totalWidgetWidth,
		// 		y: coorOriginY,
		// 	},
		// 	style: {
		// 		lineColor: '#000000',
		// 		lineStyle: 2,
		// 		lineThickness: 2,
		// 		lineEndStyle: 8,
		// 		lineStartStyle: 0,
		// 		lineType: 0,
		// 	},
		// });

		await miro.board.createShape({
			shape: 'rectangle',
			x: coorOriginX + totalWidgetWidth / 2,
			y: coorOriginY + (minWidgetPosY - paddingToWidgets - coorOriginY),
			height: 8,
			width: totalWidgetWidth,
			style: {
				fillColor: '#000000',
			},
		});

		/*** CREATE LABELS ***/
		// Create X-Axis Label
		// https://developers.miro.com/reference/text
		// -20px is because of the positioning of the label underneith the x-axis
		await miro.board.createText({
			x: coorOriginX + totalWidgetWidth / 2,
			y: coorOriginY + (minWidgetPosY - paddingToWidgets - coorOriginY) + distanceTextToAxis,
			width: 350,
			content: inputXAxis,
			// scale: 1.2857142857142858,
			style: {
				// bold: 1,
				textAlign: 'center',
				fontSize: 64,
			},
		});

		// Create Y-Axis Label
		// -180px is because of the position changing caused by the rotation of the label
		await miro.board.createText({
			x: coorOriginX - distanceTextToAxis,
			y: coorOriginY + totalWidgetHeight / 2,
			width: 350,
			rotation: -90,
			content: inputYAxis,
			// scale: 1.2857142857142858,
			style: {
				// bold: 1,
				textAlign: 'center',
				fontSize: 64,
			},
		});

		miro.board.viewport.set({
			viewport: {
				x: coorOriginX,
				y: coorOriginY,
				width: totalWidgetWidth,
				height: totalWidgetHeight,
			},
			padding: { top: 100, bottom: 400, left: 550, right: 100 },
			animationDurationInMs: 200,
		});

		return [coorOriginX, coorOriginY];
	};

	const setupMatrixAndWidgets = async () => {
		const allSelectedWidgets = await miro.board.getSelection();

		// all selected widgets are suppost to have same height and width
		// therefore, just take height and width of first element
		const widgetHeight =
			allSelectedWidgets[0].type === 'sticky_note' || allSelectedWidgets[0].type === 'card'
				? allSelectedWidgets[0].height
				: 0;
		const widgetWidth =
			allSelectedWidgets[0].type === 'sticky_note' || allSelectedWidgets[0].type === 'card'
				? allSelectedWidgets[0].width
				: 0;

		const totalWigdetWidthHeightTemp = calculateTotalWidgetWidthAndHeight(allSelectedWidgets);
		const minWidgetPos = calculateMinPosYAndMinPosX(allSelectedWidgets);

		// SORTING AND ALIGNING ON XAXIS
		const sortedSelectedWidgetsAfterXValue = sortWidgetsOnXAxis(allSelectedWidgets);
		if (minWidgetPos[0] && minWidgetPos[1]) {
			alignWidgetsHorizontallyAndVerticallyInLine(sortedSelectedWidgetsAfterXValue, minWidgetPos[0], minWidgetPos[1]);

			// returns minCoorPosX and minCoorPosY from coodinate system
			// needed for sorting and alignment of widgets in second step
			const minCoorPoxTemp = await createCoordinateSystem(
				minWidgetPos[0],
				minWidgetPos[1],
				inputXAxis,
				inputYAxis,
				widgetWidth,
				widgetHeight,
				totalWigdetWidthHeightTemp[0],
				totalWigdetWidthHeightTemp[1]
			);

			setTotalWidgetWidth(totalWigdetWidthHeightTemp[0]);
			setTotalWidgetHeight(totalWigdetWidthHeightTemp[1]);

			setMinWidgetPosX(minWidgetPos[0]);
			setMinWidgetPosY(minWidgetPos[1]);

			setMinCoorPosX(minCoorPoxTemp[0]);
			setMinCoorPosY(minCoorPoxTemp[1]);
		}
	};

	// TODO: CORRECT BUG: Fails when multiple widgets have same number -> first number is taken into account, rest is ignored
	// works only for one type of widget because of widget.bound.width calculation
	// ignores other widgets which have the same number tag -> only sorts first one
	// works with number tag and other tags as well
	const sortMatrixAndWidgets = async () => {
		const allSelectedWidgets = await miro.board.getSelection();
		const allTags = await miro.board.get({ type: 'tag' });

		if (minCoorPosX === undefined && minCoorPosY === undefined) {
			alert('You must setup a Matrix first, before you can sort the Matrix');
			return;
		}

		// SORTING AND ALIGNING ON XAXIS
		const sortedSelectedWidgetsAfterXValue = sortWidgetsOnXAxis(allSelectedWidgets);
		alignWidgetsHorizontally(sortedSelectedWidgetsAfterXValue, minCoorPosX!!);

		// SORTING AND ALIGNING ON YAXIS
		// add tag number and widget in separated array to be able to sort this array in next step
		const sortedSelectedWidgetsAfterXAndYValueWithNumericTag = addNumericTags(
			allTags,
			sortedSelectedWidgetsAfterXValue
		);

		const sortedSelectedWidgetsAfterXAndYValue = sortWidgetsOnYAxisAfterNumericTag(
			sortedSelectedWidgetsAfterXAndYValueWithNumericTag
		);

		alignWidgetsVerticallyAfterNumericTag(sortedSelectedWidgetsAfterXAndYValue, minCoorPosY!!);
	};

	const drawDebugDot = async (x: number, y: number, color: string = '#000000') => {
		await miro.board.createShape({
			shape: 'circle',
			x: x,
			y: y,
			height: 25,
			width: 25,
			content: 'TEST',
			style: {
				fillColor: color,
			},
		});
	};

	const consoleLogSelection = async () => {
		const selection = await miro.board.getSelection();
		console.log(selection);
	};

	const drawCategoryQuarter = async (quarter: MatrixQuarterData) => {
		const quarterWidget = await miro.board.createShape({
			shape: 'rectangle',
			// shape is drawn from the center point origin (origin: "center" as default value)
			x: quarter.centerPoint.x,
			y: quarter.centerPoint.y,
			height: Math.abs(quarter.height),
			width: Math.abs(quarter.width),
			content: quarter.content,
			style: {
				fillColor: quarter.contentColor,
				textAlign: 'center',
				fontSize: 48,
			},
		});

		// move QuarterWidgets in the back, so they don't overflow MatrixWidgets
		miro.board.sendToBack(quarterWidget);
		return quarterWidget;
	};

	const showCategorizationOfMatrix = async (showCategorization: boolean) => {
		if (showCategorization) {
			if (minCoorPosX && minCoorPosY) {
				// * 0.75 = take 3/4 or the totalWidgetWidth
				const topLeftQuarterData: MatrixQuarterData = {
					centerPoint: { x: minCoorPosX + totalWidgetWidth / 4, y: minCoorPosY + totalWidgetHeight / 4 },
					width: totalWidgetWidth / 2,
					height: totalWidgetHeight / 2,
					content: 'Luxury',
					contentColor: MATRIX_QUARTER_CATEGORIES.TOP_LEFT.color,
				};
				const topRightQuarterData: MatrixQuarterData = {
					centerPoint: { x: minCoorPosX + totalWidgetWidth * 0.75, y: minCoorPosY + totalWidgetHeight / 4 },
					width: totalWidgetWidth / 2,
					height: totalWidgetHeight / 2,
					content: 'Strategisch',
					contentColor: MATRIX_QUARTER_CATEGORIES.TOP_RIGHT.color,
				};
				const bottomLeftQuarterData: MatrixQuarterData = {
					centerPoint: { x: minCoorPosX + totalWidgetWidth / 4, y: minCoorPosY + totalWidgetHeight * 0.75 },
					width: totalWidgetWidth / 2,
					height: totalWidgetHeight / 2,
					content: 'Low Hanging Fruits',
					contentColor: MATRIX_QUARTER_CATEGORIES.BOTTOM_LEFT.color,
				};
				const bottomRightQuarterData: MatrixQuarterData = {
					centerPoint: { x: minCoorPosX + totalWidgetWidth * 0.75, y: minCoorPosY + totalWidgetHeight * 0.75 },
					width: totalWidgetWidth / 2,
					height: totalWidgetHeight / 2,
					content: 'Fokus',
					contentColor: MATRIX_QUARTER_CATEGORIES.BOTTOM_RIGHT.color,
				};

				// Can't use "content" property of QuarterWodget, since content would be behind MatrixWidgets because of sendToBack
				setTopLeftQuarter(await drawCategoryQuarter(topLeftQuarterData));
				setTopRightQuarter(await drawCategoryQuarter(topRightQuarterData));
				setBottomLeftQuarter(await drawCategoryQuarter(bottomLeftQuarterData));
				setBottomRightQuarter(await drawCategoryQuarter(bottomRightQuarterData));

				setQuarterDataList({
					topLeft: topLeftQuarterData,
					topRight: topRightQuarterData,
					bottomLeft: bottomLeftQuarterData,
					bottomRight: bottomRightQuarterData,
				});

				if (DEBUG_DOT) {
					drawDebugDot(topLeftQuarterData.centerPoint.x, topLeftQuarterData.centerPoint.y);
					drawDebugDot(bottomLeftQuarterData.centerPoint.x, bottomLeftQuarterData.centerPoint.y);
					drawDebugDot(topRightQuarterData.centerPoint.x, topRightQuarterData.centerPoint.y);
					drawDebugDot(bottomRightQuarterData.centerPoint.x, bottomRightQuarterData.centerPoint.y);
				}
			}
		} else {
			topLeftQuarter && (await miro.board.remove(topLeftQuarter));
			topRightQuarter && (await miro.board.remove(topRightQuarter));
			bottomLeftQuarter && (await miro.board.remove(bottomLeftQuarter));
			bottomRightQuarter && (await miro.board.remove(bottomRightQuarter));
		}
	};

	const createCategorizedList = async () => {
		if (minCoorPosX && minCoorPosY) {
			const allWidgets = await miro.board.get();
			const categoryListElementWidth = 1500;
			const paddingXBetweenMatrixAndCategoryList = 300;
			const paddingYBetweenCategoryListTitleAndCategoryList = 24;
			const categoryListPosX =
				minCoorPosX + totalWidgetWidth + categoryListElementWidth / 2 + paddingXBetweenMatrixAndCategoryList;
			let categoryList: MatrixCategoryListElement[] = [];
			let widgetTitle = '';

			// Delete already existing categoryList and categoryListTitle before new list and title is created
			if (matrixCategoryListWidgets && matrixCategoryListWidgets.length !== 0) {
				matrixCategoryListWidgets.forEach(async (textWidget) => {
					textWidget && (await miro.board.remove(textWidget));
				});
			}

			allWidgets.forEach((widget) => {
				if (widget.type == 'card' || widget.type == 'sticky_note') {
					if (quarterDataList) {
						// get only title of card / sticky_note
						// structure of text in card / sticky_note: <p>Title</p><p>Some Description</p><p>..</p>
						if (widget.type == 'card') {
							widgetTitle = widget.title.split('</p>')[0];
						} else if (widget.type == 'sticky_note') {
							widgetTitle = widget.content.split('</p>>')[0];
						}

						// widget x and y coordinates are on the center point of widget
						DEBUG_DOT && drawDebugDot(widget.x, widget.y);

						// check for widgets in topLeft & bottomLeft quarter
						/* ___ ___
				      |_x_|___|
				      |_x_|___|  */
						if (
							widget.x >= quarterDataList?.topLeft.centerPoint.x - quarterDataList.topLeft.width / 2 &&
							widget.x <= quarterDataList.topLeft.centerPoint.x + quarterDataList.topLeft.width / 2
						) {
							// check for widgets in topLeft quarter -> Luxury
							/* ___ ___
				          |_x_|___|
				          |___|___|  */
							if (
								widget.y >= quarterDataList?.topLeft.centerPoint.y - quarterDataList.topLeft.height / 2 &&
								widget.y <= quarterDataList.topLeft.centerPoint.y + quarterDataList.topLeft.height / 2
							) {
								categoryList.push({
									widgetPosX: widget.x,
									widgetPosY: widget.y,
									category: MATRIX_QUARTER_CATEGORIES.TOP_LEFT,
									text: widgetTitle,
								});
							}
							// check for widgets in bottomLeft quarter -> Low Hanging Fruits
							/* ___ ___
				          |___|___|
				          |_x_|___|  */
							else if (
								widget.y >= quarterDataList?.bottomLeft.centerPoint.y - quarterDataList.bottomLeft.height / 2 &&
								widget.y <= quarterDataList.bottomLeft.centerPoint.y + quarterDataList.bottomLeft.height / 2
							) {
								categoryList.push({
									widgetPosX: widget.x,
									widgetPosY: widget.y,
									category: MATRIX_QUARTER_CATEGORIES.BOTTOM_LEFT,
									text: widgetTitle,
								});
							}
						} else if (
							// check for widgets in topRight & bottomRight quarter
							/* ___ ___
				          |___|_x_|
				          |___|_x_|  */
							widget.x >= quarterDataList?.topRight.centerPoint.x - quarterDataList.topRight.width / 2 &&
							widget.x <= quarterDataList.topRight.centerPoint.x + quarterDataList.topRight.width / 2
						) {
							// check for widgets in topRight quarter -> Strategisch
							/* ___ ___
				          |___|_x_|
				          |___|___|  */
							if (
								widget.y >= quarterDataList?.topRight.centerPoint.y - quarterDataList.topRight.height / 2 &&
								widget.y <= quarterDataList.topRight.centerPoint.y + quarterDataList.topRight.height / 2
							) {
								categoryList.push({
									widgetPosX: widget.x,
									widgetPosY: widget.y,
									category: MATRIX_QUARTER_CATEGORIES.TOP_RIGHT,
									text: widgetTitle,
								});
							} else if (
								// check for widgets in bottomRight quarter -> Focus
								/* ___ ___
				          	  |___|___|
							  |___|_x_|  */
								widget.y >= quarterDataList?.bottomRight.centerPoint.y - quarterDataList.bottomRight.height / 2 &&
								widget.y <= quarterDataList.bottomRight.centerPoint.y + quarterDataList.bottomRight.height / 2
							) {
								categoryList.push({
									widgetPosX: widget.x,
									widgetPosY: widget.y,
									category: MATRIX_QUARTER_CATEGORIES.BOTTOM_RIGHT,
									text: widgetTitle,
								});
							}
						}
					}
				}
			});

			// sort according to x position (importance)
			categoryList.sort((a, b) => Math.abs(a.widgetPosX) - Math.abs(b.widgetPosX));
			// sort according to prio (focus -> strategic - low hanging fruits - luxury)
			categoryList.sort((a, b) => a.category.prio - b.category.prio);

			// save widgets in array to set them as state to be able to delete them later on, when new list is created
			let categoryListWidgets: Text[] = [];

			// Categorized List Title
			const categorizedListTitle = await miro.board.createText({
				x: categoryListPosX,
				y: minCoorPosY,
				width: categoryListElementWidth,
				// height is read-only, is calculated automatically based on content and font size
				// element.text = "<p>...</p>" -> to add number in front without line break,"<p>" must be removed
				content: '<p>PRIORITÄTEN LISTE</p>',
				style: {
					fontSize: 92,
				},
			});
			categorizedListTitle.y = minCoorPosY + categorizedListTitle.height / 2;
			categorizedListTitle.sync();
			categoryListWidgets.push(categorizedListTitle);

			// Categorized List
			categoryList.forEach(async (element, index) => {
				const textWidget = await miro.board.createText({
					x: categoryListPosX,
					y: minCoorPosY,
					width: categoryListElementWidth,
					// height is read-only, is calculated automatically based on content and font size
					// element.text = "<p>...</p>" -> to add number in front without line break,"<p>" must be removed
					content: `<p>${(index + 1).toString()}. ${element.text.replace('<p>', '')}</p>`,
					style: {
						fontSize: 72,
						fillColor: element.category.color,
					},
				});
				textWidget.y =
					minCoorPosY +
					textWidget.height / 2 +
					textWidget.height * index +
					categorizedListTitle.height +
					paddingYBetweenCategoryListTitleAndCategoryList;
				textWidget.sync();
				categoryListWidgets.push(textWidget);
			});

			miro.board.viewport.set({
				viewport: {
					x: minCoorPosX,
					y: minCoorPosY,
					width: totalWidgetWidth + categoryListElementWidth + paddingXBetweenMatrixAndCategoryList,
					height: totalWidgetHeight,
				},
				padding: { top: 100, bottom: 400, left: 550, right: 100 },
				animationDurationInMs: 200,
			});

			setMatrixCategoryListWidgets(categoryListWidgets);
		}
	};

	return (
		<div style={appContainer}>
			<h3 style={h3Style}>CREATE MATRIX</h3>
			<div style={inputContainer}>
				<label style={labelStyle}>x-Axis: </label>
				<input style={inputStyle} value={inputXAxis} onChange={(e) => setInputXAxis(e.target.value)} />
			</div>
			<div style={inputContainer}>
				<label style={labelStyle}>y-Axis: </label>
				<input style={inputStyle} value={inputYAxis} onChange={(e) => setInputYAxis(e.target.value)} />
			</div>
			<button style={buttonStyle} onClick={() => setupMatrixAndWidgets()}>
				Setup Matrix
			</button>
			<button style={buttonStyle} onClick={() => sortMatrixAndWidgets()}>
				Sort Matrix
			</button>
			{/* <div>
				<label style={labelStyle}>Show Matrix Categories</label>
				<input
					type='checkbox'
					id='showCategorizationOfMatrix'
					name='showCategorizationOfMatrix'
					checked={showCategorization}
					onChange={() => setShowCategorization(!showCategorization)}
				/>
			</div> */}
			<button style={buttonStyle} onClick={() => setShowCategorization(!showCategorization)}>
				Show Matrix Categories
			</button>
			<button style={buttonStyle} onClick={() => createCategorizedList()}>
				Create List
			</button>
			<br />
			<br />
			<button style={buttonStyle} onClick={() => consoleLogSelection()}>
				Log Selection
			</button>
		</div>
	);
};

export default MatrixApp;
