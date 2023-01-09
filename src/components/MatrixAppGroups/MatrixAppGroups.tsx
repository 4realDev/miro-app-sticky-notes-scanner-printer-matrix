// IMPORTANT: AFTER EACH DEPLOY TO FILEZILLA - APP MUST BE REINSTALLED VIA LINK!
// IMPORTANT: WHEN UPLOADING NEW APP VERSION - REMEMBER TO CLEAR THE CACHE

import { Card, FontFamily, Frame, Item, Shape, StickyNote, Tag, Text } from '@mirohq/websdk-types';
import React, { useEffect, useState } from 'react'; // react is needed for Miro
// import styles from './MatrixApp.module.scss';
import styles from '../../index.module.scss';
const miro = window.miro;

type NumericTaggedWidget = {
	widget: StickyNote | Card | Frame;
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
	TOP_LEFT: { color: '#E9F7FD', prio: 1 }, // luxury (least important)
	TOP_RIGHT: { color: '#FCFFC6', prio: 3 }, // strategic
	BOTTOM_LEFT: { color: '#E4F6DF', prio: 2 }, // low hanging fruits
	BOTTOM_RIGHT: { color: '#FFDCE4', prio: 4 }, // focus (most important)
} as const;

const MATRIX_LABELS_FONT_FAMILY: FontFamily = 'plex_sans';
const MATRIX_AXIS_COLOR = '#000000';
const MATRIX_AXIS_LINE_WIDTH = 8;
const MATRIX_AXIS_LABEL_COLOR = '#000000';
const MATRIX_CATEGORY_QUARTER_CONTENT_COLOR = '#000000';
const MATRIX_PRIORITY_LIST_TITLE_COLOR = '#000000';
const MATRIX_PRIORITY_LIST_ITEMS_COLOR = '#000000';

const DEBUG_DOT = false;

const MatrixApp = () => {
	// const [inputXAxis, setInputXAxis] = useState('Importance');
	// const [inputYAxis, setInputYAxis] = useState('Difficulty');

	const [showCategorization, _setShowCategorization] = useState(false);
	const showCategorizationRef = React.useRef(showCategorization);
	const setShowCategorization = (data: boolean) => {
		showCategorizationRef.current = data;
		_setShowCategorization(data);
	};

	// const [workWithFramedObjects, _setWorkWithFramedObjects] = useState(false);
	// const workWithFramedObjectsRef = React.useRef(workWithFramedObjects);
	// const setWorkWithFramedObjects = (data: boolean) => {
	// 	workWithFramedObjectsRef.current = data;
	// 	_setWorkWithFramedObjects(data);
	// };

	const [, setMinWidgetPosX] = useState<number | undefined>(undefined);
	const [, setMinWidgetPosY] = useState<number | undefined>(undefined);

	// const [matrixCoordinateSystemWidgets, setMatrixCoordinateSystemWidgets] = useState<Item[] | undefined>(undefined);

	const [matrixWidgetSelection, setMatrixWidgetSelection] = useState<Array<StickyNote | Frame | Card> | undefined>(
		undefined
	);
	const [coorOriginX, setCoorOriginX] = useState<number | undefined>(undefined);
	const [coorOriginY, setCoorOriginY] = useState<number | undefined>(undefined);
	const [coordXAxisWidgets, setCoorXAxisWidgets] = useState<Item[] | undefined>(undefined);
	const [coorYAxisWidgets, setCoorYAxisWidgets] = useState<Item[] | undefined>(undefined);

	const [totalWidgetWidth, setTotalWidgetWidth] = useState(0);
	const [, setTotalWidgetHeight] = useState(0);
	const [
		totalWidgetHeightAfterVerticalAlignmentWithNumericTag,
		setTotalWidgetHeightAfterVerticalAlignmentWithNumericTag,
	] = useState(0);

	const paddingXBetweenWidgets: number = 50;
	const paddingYBetweenWidgets: number = 50;

	const additionalPaddingXAxisToLowestWidget: number = 50;
	const additionalPaddingYAxisToLeftMostWidget: number = 50;

	const distanceAxisLabelTextToAxis = 65;
	// length of the x or y-axis line, which is additionally added to the width or height of the matrix
	// the result is, that the axis line is longer then the matrix itself, which in this case is called "overlapping"
	const additionalAxisMatrixOverlapping = 50;

	const [bottomLeftQuarter, setBottomLeftQuarter] = useState<Shape | undefined>(undefined);
	const [bottomRightQuarter, setBottomRightQuarter] = useState<Shape | undefined>(undefined);
	const [topLeftQuarter, setTopLeftQuarter] = useState<Shape | undefined>(undefined);
	const [topRightQuarter, setTopRightQuarter] = useState<Shape | undefined>(undefined);

	const [quarterDataList, setQuarterDataList] = useState<MatrixQuarterDataList | undefined>(undefined);

	const [matrixCategoryListWidgets, setMatrixCategoryListWidgets] = useState<Text[] | undefined>(undefined);

	useEffect(() => {
		showCategorizationOfMatrix(showCategorization);
		console.log('showCategorization: ', showCategorization);
	}, [showCategorization]);

	// useEffect(() => {
	// 	setWorkWithFramedObjects(workWithFramedObjects);
	// 	console.log('workWithFramedObjects: ', workWithFramedObjects);
	// }, [workWithFramedObjects]);

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const calculateTotalWidgetWidthAndHeight = (widgets: Array<StickyNote | Card | Frame>) => {
		let totalWidgetWidth = 0;
		let totalWidgetHeight = 0;
		widgets.forEach((widget) => {
			if ((widget.type !== 'frame' && widget.parentId === null) || widget.type === 'frame') {
				// if (index === widgets.length - 1) {
				// 	// last element should not have padding
				// 	totalWidgetWidth = totalWidgetWidth + widget.width;
				// 	totalWidgetHeight = totalWidgetHeight + widget.height;
				// } else {
				totalWidgetWidth = totalWidgetWidth + widget.width + paddingXBetweenWidgets;
				totalWidgetHeight = totalWidgetHeight + widget.height + paddingYBetweenWidgets;
				// }
			}
		});

		// for last element, which should not have padding, otherwise axis padding size larger then widgets with padding
		return [totalWidgetWidth, totalWidgetHeight];
	};

	const sortWidgetsOnXAxis = (allSelectedWidgets: Array<StickyNote | Card | Frame>) => {
		return allSelectedWidgets.sort((a, b) => {
			return a.x - b.x;
		});
	};

	// adjust x any y position of widgets to be perfectly horizontal and vertical aligned in a line by respecting the manually created order on x axis
	const alignWidgetsHorizontallyAndVerticallyInLine = async (
		sortedSelectedWidgetsByXValue: Array<StickyNote | Card | Frame>,
		minPosX: number,
		minPosY: number
	) => {
		// let widgetTagCount = -1;
		let updatedWidgetDistanceX = 0;
		for (const [index, widget] of sortedSelectedWidgetsByXValue.entries()) {
			widget.x = minPosX + updatedWidgetDistanceX;
			widget.y = minPosY;
			widget.sync();
			if (sortedSelectedWidgetsByXValue[index + 1]) {
				updatedWidgetDistanceX =
					updatedWidgetDistanceX +
					widget.width / 2 +
					sortedSelectedWidgetsByXValue[index + 1].width / 2 +
					paddingXBetweenWidgets;
			}
		}
	};

	const addNumericTags = async (allTags: Tag[], allSelectedWidgets: Array<StickyNote | Card | Frame>) => {
		let numericTaggedWidgets: NumericTaggedWidget[] = [];
		let tagError = false;
		const selectedWidgets = allSelectedWidgets.filter(
			(selectedWidget) =>
				selectedWidget.type === 'frame' || selectedWidget.type === 'sticky_note' || selectedWidget.type === 'card'
		);

		for (const widget of selectedWidgets) {
			let widgetTag: Tag | undefined = undefined;

			// widget is a sticky note or a card without a parent (not inside a frame)
			// find its widgetTag -> it should correspond to the estimation tag
			if ((widget.type === 'sticky_note' || widget.type === 'card') && widget.parentId === null) {
				widget.tagIds.forEach((tagId: string) => {
					// TODO: Replace with filter to search even in stickies with multiple tags
					widgetTag = allTags.find((tag) => tag.id === tagId);
				});
			}

			// widget is a frame
			// check if a sticky_note with only one tag exists
			// if yes, this could be the estimation tag of the frame
			// frame should only have one sticky note, which has only one tag
			// this sticky note with its tag corresponds to the estimation tag
			else if (widget.type === 'frame') {
				const frameChildren = await widget.getChildren();
				const frameWidgetWithTag = frameChildren.find(
					(frameChild: Item) => frameChild.type === 'sticky_note' && frameChild.tagIds.length === 1
				) as StickyNote | undefined;
				widgetTag = allTags.find((tag) => tag.id === frameWidgetWithTag?.tagIds[0]);
			}

			// if the widget in the selection is neither a sticky without a parent nor a frame
			// just continue with the next element in selection
			else {
				continue;
			}

			// Check if some estimation tag was successfully found
			if (widgetTag !== undefined) {
				// This enables to use the Matrix even with the "Miro Estimation Tool"
				// 'Estimate: [num]' is the tag title, which is used by the "Miro Estimation Tool"
				// [num] can be 1,2,3,5,8,13,21
				const widgetTagEstimationNumber = isNumeric(widgetTag.title)
					? widgetTag.title
					: widgetTag.title.replace('Estimate: ', '');

				if (isNumeric(widgetTagEstimationNumber)) {
					numericTaggedWidgets.push({
						widget: widget,
						numericTag: parseInt(widgetTagEstimationNumber),
					});
				} else {
					alert(
						'It seems like one or more selected items have a wrong tag. Please make sure that your tag is a number tag (e.g "4") \nor use the Miro Estimation Tool to add a correct number tag (e.g "Estimate: 4").'
					);
					tagError = true;
					break;
				}
			} else {
				alert(
					'One or more selected items are missing a tag.\nEnter a number tag (e.g "4")\nor use the Miro Estimation Tool to add a number tag to the widgets \n(e.g "Estimate: 4").'
				);
				tagError = true;
				break;
			}
		}
		if (tagError) return undefined;
		return numericTaggedWidgets;

		// return await Promise.all(
		// 	selectedWidgets.map(async (widget) => {
		// 		// widget is either sticky_note or card and is not inside a frame
		// 		// get the widgetTag of the sticky_note
		// 		// sticky notes and cards should have only one tag, which should be the estimation tag
		// 		if ((widget.type === 'sticky_note' || widget.type === 'card') && widget.parentId === null) {
		// 			widget.tagIds.forEach((tagId: string) => {
		// 				widgetTag = allTags.find((tag) => tag.id === tagId);
		// 			});
		// 		}
		// 		// widget is a frame
		// 		// check if a sticky_note with only one tag exists
		// 		// if yes, this could be the estimation tag of the frame
		// 		// frame should only have one sticky note, which has only one tag
		// 		// this sticky note with its tag corresponds to the estimation tag
		// 		else if (widget.type === 'frame') {
		// 			const frameChildren = await widget.getChildren();
		// 			const frameWidgetWithTag = frameChildren.find(
		// 				(frameChild: Item) => frameChild.type === 'sticky_note' && frameChild.tagIds.length === 1
		// 			) as StickyNote | undefined;
		// 			console.log(frameWidgetWithTag);
		// 			widgetTag = allTags.find((tag) => tag.id === frameWidgetWithTag?.tagIds[0]);
		// 		}
		// 		console.log(widgetTag);
		// 		if (widgetTag !== undefined) {
		// 			// This enables to use the Matrix even with the "Miro Estimation Tool"
		// 			// 'Estimate: [num]' is the tag title, which is used by the "Miro Estimation Tool"
		// 			// [num] can be 1,2,3,5,8,13,21
		// 			const widgetTagEstimationNumber = isNumeric(widgetTag.title)
		// 				? widgetTag.title
		// 				: widgetTag.title.replace('Estimate: ', '');

		// 			if (isNumeric(widgetTagEstimationNumber)) {
		// 				return {
		// 					widget: widget,
		// 					numericTag: parseInt(widgetTagEstimationNumber),
		// 				};
		// 			}
		// 			alert(
		// 				'It seems like one or more selected items have a wrong tag. Please make sure that your tag is a number tag (e.g "4") \nor use the Miro Estimation Tool to add a correct number tag (e.g "Estimate: 4").'
		// 			);
		// 			return;
		// 		}
		// 		alert(
		// 			'One or more selected items are missing a tag.\nEnter a number tag (e.g "4")\nor use the Miro Estimation Tool to add a number tag to the widgets \n(e.g "Estimate: 4").'
		// 		);
		// 		return;
		// 	})
		// );
	};

	// sort widgets according to their numeric tag (lowest to highest)
	// remove their numeric tag after sorting to get array with only the sorted widgets in the correct order
	const sortWidgetsOnYAxisByNumericTag = (sortedSelectedWidgetsAfterYValueWithNumericTag: NumericTaggedWidget[]) => {
		return sortedSelectedWidgetsAfterYValueWithNumericTag.sort((a, b) => {
			return b.numericTag - a.numericTag;
		});
		// .map((numericWidget) => numericWidget.widget);
	};

	// vertical alignment according to the sorting
	// update every widget in sorted array with new sorted y position and aligned x position
	const alignWidgetsVerticallyByNumericTag = async (
		sortedSelectedWidgetsAfterXAndYValueWithNumericTag: NumericTaggedWidget[],
		coorOriginY: number
	) => {
		let updatedWidgetDistanceY = 0;
		let totalWidgetHeightAfterVerticalAlignmentWithNumericTag = 0;
		for (const [index, widgetWithNumericTag] of sortedSelectedWidgetsAfterXAndYValueWithNumericTag.entries()) {
			if (
				sortedSelectedWidgetsAfterXAndYValueWithNumericTag[index - 1] &&
				sortedSelectedWidgetsAfterXAndYValueWithNumericTag[index].numericTag !==
					sortedSelectedWidgetsAfterXAndYValueWithNumericTag[index - 1].numericTag
			) {
				updatedWidgetDistanceY =
					updatedWidgetDistanceY +
					sortedSelectedWidgetsAfterXAndYValueWithNumericTag[index - 1].widget.height +
					paddingYBetweenWidgets;
			}

			// Add the height of the last widget to the total widget height after the mapping of the numeric tags to the y axis
			// (with attention to the widgets, which have equal numeric tags)
			if (index === sortedSelectedWidgetsAfterXAndYValueWithNumericTag.length - 1) {
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag =
					totalWidgetHeightAfterVerticalAlignmentWithNumericTag +
					updatedWidgetDistanceY +
					widgetWithNumericTag.widget.height;
			}

			// Add additional
			widgetWithNumericTag.widget.x = widgetWithNumericTag.widget.x + additionalPaddingXAxisToLowestWidget;
			widgetWithNumericTag.widget.y =
				coorOriginY!! +
				updatedWidgetDistanceY +
				widgetWithNumericTag.widget.height / 2 -
				additionalPaddingYAxisToLeftMostWidget;
			widgetWithNumericTag.widget.sync();
		}

		for (const widgetWithNumericTag of sortedSelectedWidgetsAfterXAndYValueWithNumericTag) {
			widgetWithNumericTag.widget.y =
				widgetWithNumericTag.widget.y - totalWidgetHeightAfterVerticalAlignmentWithNumericTag;
			widgetWithNumericTag.widget.sync();
		}
		return totalWidgetHeightAfterVerticalAlignmentWithNumericTag;
	};

	const drawCoordinateSystemXAxis = async (
		minWidgetPosX: number,
		minWidgetPosY: number,
		inputXAxis: string,
		widgetMaxHeight: number,
		totalWidgetWidth: number
	) => {
		const paddingToWidgets = widgetMaxHeight;

		// bottom left edge point of the coordinate system
		const xAxisCoorOriginX = minWidgetPosX;
		const yAxisCoorOriginY = minWidgetPosY - paddingToWidgets;

		// Delete already existing matrixCoordinateSystem before new coordinateSystem is created
		if (coordXAxisWidgets && coordXAxisWidgets.length !== 0) {
			Promise.all(coordXAxisWidgets.map(async (widget) => widget && (await miro.board.remove(widget))));
		}

		// create X-Axis
		const xAxis = await miro.board.createShape({
			shape: 'rectangle',
			x: xAxisCoorOriginX + totalWidgetWidth / 2 + additionalAxisMatrixOverlapping / 2,
			y: yAxisCoorOriginY,
			height: MATRIX_AXIS_LINE_WIDTH,
			width: totalWidgetWidth + additionalAxisMatrixOverlapping,
			style: {
				fillColor: MATRIX_AXIS_COLOR,
			},
		});

		/*** CREATE LABELS ***/
		// Create X-Axis Label
		// https://developers.miro.com/reference/text
		// -20px is because of the positioning of the label underneith the x-axis
		const xAxisLabel = await miro.board.createText({
			x: xAxisCoorOriginX + totalWidgetWidth / 2,
			y: yAxisCoorOriginY + (minWidgetPosY - paddingToWidgets - yAxisCoorOriginY) + distanceAxisLabelTextToAxis,
			width: 360,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>${inputXAxis}</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		// Create X-Axis High
		const xAxisHighText = await miro.board.createText({
			x: xAxisCoorOriginX + totalWidgetWidth + distanceAxisLabelTextToAxis + additionalAxisMatrixOverlapping,
			y: yAxisCoorOriginY,
			width: 360,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>High</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		// Create X-Axis / Y-Axis Low
		const xyAxisLowText = await miro.board.createText({
			x: xAxisCoorOriginX - distanceAxisLabelTextToAxis,
			y: yAxisCoorOriginY,
			width: 360,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>Low</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		miro.board.viewport.set({
			viewport: {
				x: xAxisCoorOriginX,
				y: yAxisCoorOriginY,
				width: totalWidgetWidth,
				height: widgetMaxHeight + paddingToWidgets,
			},
			padding: { top: 100, bottom: 400, left: 550, right: 100 },
			animationDurationInMs: 200,
		});

		setCoorXAxisWidgets([xAxis, xAxisLabel, xAxisHighText, xyAxisLowText]);

		return [xAxisCoorOriginX, yAxisCoorOriginY];
	};

	const drawCoordinateSystemYAxis = async (
		coorOriginX: number,
		coorOriginY: number,
		totalWidgetHeightAfterVerticalAlignmentWithNumericTag: number
	) => {
		// const paddingToWidgets = widgetHeight * 2;
		const distanceAxisLabelTextToAxis = 65;
		// length of the x or y-axis line, which is additionally added to the width or height of the matrix
		// the result is, that the axis line is longer then the matrix itself, which in this case is called "overlapping"
		const additionalAxisMatrixOverlapping = 50;

		// bottom left edge point of the coordinate system
		const yAxisCoorOriginX = coorOriginX;
		const yAxisCoorOriginY = coorOriginY - totalWidgetHeightAfterVerticalAlignmentWithNumericTag;

		// Delete already existing matrixCoordinateSystem before new coordinateSystem is created
		if (coorYAxisWidgets && coorYAxisWidgets.length !== 0) {
			Promise.all(coorYAxisWidgets.map(async (widget) => widget && (await miro.board.remove(widget))));
		}

		/*** CREATE AXIS ***/
		// create Y-Axis
		const yAxis = await miro.board.createShape({
			shape: 'rectangle',
			x: yAxisCoorOriginX,
			y:
				yAxisCoorOriginY +
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2 -
				additionalAxisMatrixOverlapping / 2,
			height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag + additionalAxisMatrixOverlapping,
			width: MATRIX_AXIS_LINE_WIDTH,
			style: {
				fillColor: MATRIX_AXIS_COLOR,
			},
		});

		// Create Y-Axis Label
		// -180px is because of the position changing caused by the rotation of the label
		const yAxisLabel = await miro.board.createText({
			x: yAxisCoorOriginX - distanceAxisLabelTextToAxis,
			y: yAxisCoorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
			width: 360,
			rotation: -90,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>Difficulty</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		// Create Y-Axis High
		const yAxisHighText = await miro.board.createText({
			x: yAxisCoorOriginX,
			y: yAxisCoorOriginY - additionalAxisMatrixOverlapping - distanceAxisLabelTextToAxis,
			width: 360,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>High</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		miro.board.viewport.set({
			viewport: {
				x: yAxisCoorOriginX,
				y: yAxisCoorOriginY,
				width: totalWidgetWidth,
				height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag,
			},
			padding: { top: 100, bottom: 400, left: 550, right: 100 },
			animationDurationInMs: 200,
		});

		setCoorYAxisWidgets([yAxis, yAxisLabel, yAxisHighText]);

		return [yAxisCoorOriginX, yAxisCoorOriginY];
	};

	const sortByXAxis = async () => {
		console.log(matrixWidgetSelection);
		let filteredSelectedWidgets = undefined;
		if (matrixWidgetSelection !== undefined) {
			filteredSelectedWidgets = matrixWidgetSelection;
		} else {
			const selectedWidgets = await miro.board.getSelection();
			filteredSelectedWidgets = selectedWidgets.filter(
				(selectedWidget) =>
					(selectedWidget.type === 'sticky_note' && selectedWidget.parentId === null) ||
					(selectedWidget.type === 'card' && selectedWidget.parentId === null) ||
					selectedWidget.type === 'frame'
			) as Array<StickyNote | Frame | Card>;
		}

		const [totalWigdetWidth, totalWigdetHeight] = calculateTotalWidgetWidthAndHeight(filteredSelectedWidgets);

		// The finding of the widget with the smallest x / y position is necessary
		// to subtract half of the widget width / height to get the widgets most left point / most top point, instead of the center
		const widgetWithMinPosX: StickyNote | Card | Frame = filteredSelectedWidgets.reduce((prev, cur) =>
			cur.x < prev.x ? cur : prev
		);
		const widgetWithMinPosY: StickyNote | Card | Frame = filteredSelectedWidgets.reduce((prev, cur) =>
			cur.y < prev.y ? cur : prev
		);

		const minPosX = widgetWithMinPosX.x;
		const minPosY = widgetWithMinPosY.y;

		// necessary to setup the padding for the widgets to the matrix in the first step and to set the miro-zoom-viewport correctly
		const widgetMaxHeight = Math.max(...filteredSelectedWidgets.map((selectedWidget) => selectedWidget.height)); // prettier-ignore

		// SORTING AND ALIGNING ON XAXIS
		const sortedSelectedWidgetsByXValue = sortWidgetsOnXAxis(filteredSelectedWidgets);
		if (minPosX && minPosY) {
			await alignWidgetsHorizontallyAndVerticallyInLine(sortedSelectedWidgetsByXValue, minPosX, minPosY);

			const [xAxisCoorOriginX, xAxisCoorOriginY] = await drawCoordinateSystemXAxis(
				minPosX - widgetWithMinPosX.width / 2,
				minPosY - widgetWithMinPosY.height / 2,
				'Importance',
				widgetMaxHeight,
				totalWigdetWidth + additionalPaddingXAxisToLowestWidget
			);

			setTotalWidgetWidth(totalWigdetWidth + additionalPaddingXAxisToLowestWidget);
			setTotalWidgetHeight(totalWigdetHeight);

			setMinWidgetPosX(minPosX);
			setMinWidgetPosY(minPosY);

			setCoorOriginX(xAxisCoorOriginX);
			setCoorOriginY(xAxisCoorOriginY);

			setMatrixWidgetSelection(filteredSelectedWidgets);
		}
	};

	const sortByYAxis = async () => {
		console.log(matrixWidgetSelection);
		// use selection from sortByXAxis method
		let filteredSelectedWidgets = matrixWidgetSelection as Array<StickyNote | Frame | Card>;
		await sortByXAxis();

		// if (matrixWidgetSelection !== undefined) {
		// 	filteredSelectedWidgets = matrixWidgetSelection;
		// } else {
		// 	const selectedWidgets = await miro.board.getSelection();
		// 	filteredSelectedWidgets = selectedWidgets.filter(
		// 		(selectedWidget) =>
		// 			selectedWidget.type === 'sticky_note' || selectedWidget.type === 'card' || selectedWidget.type === 'frame'
		// 	) as Array<StickyNote | Card | Frame>;
		// }

		const allTags = await miro.board.get({ type: 'tag' });

		if (coorOriginX === undefined && coorOriginY === undefined) {
			alert('You must first setup the Matrix X-Axis, before you can sort the Matrix');
			return;
		}

		// add tag number and widget in separated array to be able to sort this array in next step
		const selectedWidgetsWithNumericTag: NumericTaggedWidget[] | undefined = await addNumericTags(
			allTags,
			filteredSelectedWidgets
		);

		if (selectedWidgetsWithNumericTag) {
			const selectedWidgetsSortedByNumericTag: NumericTaggedWidget[] = sortWidgetsOnYAxisByNumericTag(
				selectedWidgetsWithNumericTag as Array<NumericTaggedWidget>
			);

			const totalWidgetHeightAfterVerticalAlignmentWithNumericTag = await alignWidgetsVerticallyByNumericTag(
				selectedWidgetsSortedByNumericTag,
				coorOriginY!!
			);

			const [, yAxisCoorOriginY] = await drawCoordinateSystemYAxis(
				coorOriginX!!,
				coorOriginY!!,
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag + additionalPaddingYAxisToLeftMostWidget
			);
			// Update matrix coordinate system y origin position with new yAxisCoorOriginY position
			// x origin position should have changed -> therefore it stays the same
			setCoorOriginY(yAxisCoorOriginY);

			setTotalWidgetHeightAfterVerticalAlignmentWithNumericTag(
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag + additionalPaddingYAxisToLeftMostWidget
			);
		}
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

	// TODO: not that important, but maybe bind the shown categories to the matrix,
	// so show category button does not trigger the categories shown in a different matrix
	const drawCategoryQuarter = async (quarter: MatrixQuarterData) => {
		const quarterWidget = await miro.board.createShape({
			shape: 'rectangle',
			// shape is drawn from the center point origin (origin: "center" as default value)
			x: quarter.centerPoint.x,
			y: quarter.centerPoint.y,
			height: Math.abs(quarter.height),
			width: Math.abs(quarter.width),
			content: `<p style="color: ${MATRIX_CATEGORY_QUARTER_CONTENT_COLOR};">${quarter.content}</p>`,
			style: {
				fillColor: quarter.contentColor,
				textAlign: 'center',
				fontSize: 48,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		// move QuarterWidgets in the back, so they don't overflow MatrixWidgets
		await miro.board.sendToBack(quarterWidget);
		return quarterWidget;
	};

	const showCategorizationOfMatrix = async (showCategorization: boolean) => {
		if (showCategorization) {
			if (coorOriginX && coorOriginY) {
				// * 0.75 = take 3/4 or the totalWidgetWidth
				const topLeftQuarterData: MatrixQuarterData = {
					centerPoint: {
						x: coorOriginX + totalWidgetWidth / 4,
						y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 4,
					},
					width: totalWidgetWidth / 2,
					height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
					content: 'Luxury',
					contentColor: MATRIX_QUARTER_CATEGORIES.TOP_LEFT.color,
				};
				const topRightQuarterData: MatrixQuarterData = {
					centerPoint: {
						x: coorOriginX + totalWidgetWidth * 0.75,
						y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 4,
					},
					width: totalWidgetWidth / 2,
					height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
					content: 'Strategic',
					contentColor: MATRIX_QUARTER_CATEGORIES.TOP_RIGHT.color,
				};
				const bottomLeftQuarterData: MatrixQuarterData = {
					centerPoint: {
						x: coorOriginX + totalWidgetWidth / 4,
						y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag * 0.75,
					},
					width: totalWidgetWidth / 2,
					height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
					content: 'Low Hanging Fruits',
					contentColor: MATRIX_QUARTER_CATEGORIES.BOTTOM_LEFT.color,
				};
				const bottomRightQuarterData: MatrixQuarterData = {
					centerPoint: {
						x: coorOriginX + totalWidgetWidth * 0.75,
						y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag * 0.75,
					},
					width: totalWidgetWidth / 2,
					height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
					content: 'Focus',
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

	// get title of card (widget.title) / sticky_note (widget.content) / frame (get highest text child)
	// structure of text in card / sticky_note: <p>Title</p><p>Some Description</p><p>..</p>
	const getWidgetTitle = async (widget: Card | Frame | StickyNote) => {
		let widgetTitle = '';
		if (widget.type === 'card') {
			widgetTitle = widget.title.split('</p>')[0];
		} else if (widget.type === 'sticky_note') {
			widgetTitle = widget.content.split('</p>')[0];
		} else if (widget.type === 'frame') {
			const frameChildren = await widget.getChildren();
			const frameTextWidgets: Text[] = frameChildren.filter((textWidget) => textWidget.type === 'text') as Text[];
			// Text element with the smallest position y (highest text element) in frame,
			// is meant to be the title of the frame and will be shown in category list
			if (frameTextWidgets.length > 0) {
				const frameTitle = frameTextWidgets.reduce((prev, cur) => (cur.y < prev.y ? cur : prev)).content;
				widgetTitle = frameTitle;
			}
		}
		return widgetTitle;
	};

	const getWidgetMatrixQuarterCategory = async (widget: Card | Frame | StickyNote) => {
		if (!quarterDataList) return undefined;

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
			/* 	___ ___
			   |_x_|___|
			   |___|___|  */
			if (
				widget.y >= quarterDataList?.topLeft.centerPoint.y - quarterDataList.topLeft.height / 2 &&
				widget.y <= quarterDataList.topLeft.centerPoint.y + quarterDataList.topLeft.height / 2
			) {
				return MATRIX_QUARTER_CATEGORIES.TOP_LEFT;
			}
			// check for widgets in bottomLeft quarter -> Low Hanging Fruits
			/* ___ ___
			  |___|___|
			  |_x_|___|  */
			else if (
				widget.y >= quarterDataList?.bottomLeft.centerPoint.y - quarterDataList.bottomLeft.height / 2 &&
				widget.y <= quarterDataList.bottomLeft.centerPoint.y + quarterDataList.bottomLeft.height / 2
			) {
				return MATRIX_QUARTER_CATEGORIES.BOTTOM_LEFT;
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
				return MATRIX_QUARTER_CATEGORIES.TOP_RIGHT;
			} else if (
				// check for widgets in bottomRight quarter -> Focus
				/* ___ ___
				  |___|___|
				  |___|_x_|  */
				widget.y >= quarterDataList?.bottomRight.centerPoint.y - quarterDataList.bottomRight.height / 2 &&
				widget.y <= quarterDataList.bottomRight.centerPoint.y + quarterDataList.bottomRight.height / 2
			) {
				return MATRIX_QUARTER_CATEGORIES.BOTTOM_RIGHT;
			}
		}
		return undefined;
	};

	const createCategorizedList = async () => {
		if (coorOriginX && coorOriginY) {
			const allCardStickyNoteFrameWidgets = (await miro.board.get({ type: ['card', 'sticky_note', 'frame'] })) as Array<
				Card | StickyNote | Frame
			>;
			const categoryListElementWidth = 1500;
			const paddingXBetweenMatrixAndCategoryList = 300;
			const paddingYBetweenCategoryListTitleAndCategoryList = 24;
			const categoryListPosX =
				coorOriginX + totalWidgetWidth + categoryListElementWidth / 2 + paddingXBetweenMatrixAndCategoryList;
			let categoryList: MatrixCategoryListElement[] = [];

			// Delete already existing categoryList and categoryListTitle before new list and title is created
			if (matrixCategoryListWidgets && matrixCategoryListWidgets.length !== 0) {
				Promise.all(
					matrixCategoryListWidgets.map(async (textWidget) => textWidget && (await miro.board.remove(textWidget)))
				);
			}

			// Promise.all(
			// allCardStickyNoteFrameWidgets.map(async (widget) => {
			for (const widget of allCardStickyNoteFrameWidgets) {
				const widgetCategory = await getWidgetMatrixQuarterCategory(widget);
				if (widgetCategory) {
					const widgetTitle = await getWidgetTitle(widget);
					categoryList.push({
						widgetPosX: widget.x,
						widgetPosY: widget.y,
						category: widgetCategory,
						text: widgetTitle,
					});
				}
			}
			// );

			console.log(categoryList);

			// sort according to x position (importance)
			categoryList.sort((a, b) => {
				console.log('TEST');
				console.log(a);
				console.log(b);
				console.log(a.widgetPosX);
				console.log(b.widgetPosY);
				return Math.abs(a.widgetPosX) - Math.abs(b.widgetPosX);
			});

			console.log(categoryList.sort((a, b) => Math.abs(a.widgetPosX) - Math.abs(b.widgetPosX)));

			// sort according to prio (focus -> strategic - low hanging fruits - luxury)
			categoryList.sort((a, b) => b.category.prio - a.category.prio);

			console.log(categoryList.sort((a, b) => b.category.prio - a.category.prio));

			// save widgets in array to set them as state to be able to delete them later on, when new list is created
			let categoryListWidgets: Text[] = [];

			// Categorized List Title
			const categorizedListTitle = await miro.board.createText({
				x: categoryListPosX,
				y: coorOriginY,
				width: categoryListElementWidth,
				// height is read-only, is calculated automatically based on content and font size
				// element.text = "<p>...</p>" -> to add number in front without line break,"<p>" must be removed
				content: `<p style="color: ${MATRIX_PRIORITY_LIST_TITLE_COLOR};"><strong>PRIORITY LIST</strong></p>`,
				style: {
					fontSize: 92,
					fontFamily: MATRIX_LABELS_FONT_FAMILY,
				},
			});
			categorizedListTitle.y = coorOriginY + categorizedListTitle.height / 2;
			categorizedListTitle.sync();
			categoryListWidgets.push(categorizedListTitle);

			// Categorized List
			Promise.all(
				categoryList.map(async (element, index) => {
					const textWidget = await miro.board.createText({
						x: categoryListPosX,
						y: coorOriginY,
						width: categoryListElementWidth,
						// height is read-only, is calculated automatically based on content and font size
						// element.text = "<p>...</p>" -> to add number in front without line break,"<p>" must be removed
						content: `<p style="color: ${MATRIX_PRIORITY_LIST_ITEMS_COLOR};">${(
							index + 1
						).toString()}. ${element.text.replace('<p>', '')}</p>`,
						style: {
							fontSize: 72,
							fillColor: element.category.color,
							fontFamily: MATRIX_LABELS_FONT_FAMILY,
						},
					});
					textWidget.y =
						coorOriginY +
						textWidget.height / 2 +
						textWidget.height * index +
						categorizedListTitle.height +
						paddingYBetweenCategoryListTitleAndCategoryList;
					textWidget.sync();
					categoryListWidgets.push(textWidget);
				})
			);

			miro.board.viewport.set({
				viewport: {
					x: coorOriginX,
					y: coorOriginY,
					width: totalWidgetWidth + categoryListElementWidth + paddingXBetweenMatrixAndCategoryList,
					height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag,
				},
				padding: { top: 100, bottom: 400, left: 550, right: 100 },
				animationDurationInMs: 200,
			});

			setMatrixCategoryListWidgets(categoryListWidgets);
		}
	};

	const consoleLogSelection = async () => {
		const selection = await miro.board.getSelection();
		console.log(selection);
	};

	return (
		<div className={styles.appContainer}>
			<h3 className={styles.h3Style}>CREATE MATRIX</h3>
			{/* <div className={styles.inputContainer}>
				<label className={styles.labelStyle}>x-Axis: </label>
				<input className={styles.inputStyle} value={inputXAxis} onChange={(e) => setInputXAxis(e.target.value)} />
			</div>
			<div className={styles.inputContainer}>
				<label className={styles.labelStyle}>y-Axis: </label>
				<input className={styles.inputStyle} value={inputYAxis} onChange={(e) => setInputYAxis(e.target.value)} />
			</div> */}
			{/* <div>
				<label className={styles.labelStyle}>Work with grouped objects:</label>
				<input
					type='checkbox'
					id='workWithFramedObjects'
					name='workWithFramedObjects'
					checked={workWithFramedObjects}
					onChange={() => setWorkWithFramedObjects(!workWithFramedObjects)}
				/>
			</div> */}
			<button className={styles.buttonStyle} onClick={() => sortByXAxis()}>
				Sort by x-Axis
			</button>
			<button className={styles.buttonStyle} onClick={() => sortByYAxis()}>
				Sort by y-Axis
			</button>
			<button className={styles.buttonStyle} onClick={() => setShowCategorization(!showCategorization)}>
				Show Categories
			</button>
			<button className={styles.buttonStyle} onClick={() => createCategorizedList()}>
				Create List
			</button>
			<br />
			<br />
			<button className={styles.buttonStyle} onClick={() => consoleLogSelection()}>
				Log Selection
			</button>
		</div>
	);
};

export default MatrixApp;
