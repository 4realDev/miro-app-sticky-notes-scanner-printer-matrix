import React, { useState } from 'react';
import { SDK } from '../../typings/miro';
import { h3Style, inputContainer, inputStyle, buttonStyle } from '../app';
const miro = window.miro;

type NumericTaggedWidget = {
	widget: SDK.IWidget;
	numericTag: number;
};

const MatrixApp = () => {
	const [inputXAxis, setInputXAxis] = useState('Importance');
	const [inputYAxis, setInputYAxis] = useState('Difficulty');

	let minCoorPosX: number | undefined = undefined;
	let minCoorPosY: number | undefined = undefined;

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const calculateMinPosYAndMinPosX = (
		allSelectedWidgets: SDK.IWidget[],
		minPosX: number | undefined,
		minPosY: number | undefined
	) => {
		// set initial value for minPosX and minPosY
		if (minPosX === undefined) minPosX = allSelectedWidgets[0].bounds.x;
		if (minPosY === undefined) minPosY = allSelectedWidgets[0].bounds.y;

		// calculate most top y and most left x of all selected widgets
		allSelectedWidgets.forEach((widget) => {
			if (minPosX && minPosY) {
				if (widget.bounds.x < minPosX) minPosX = widget.bounds.x;
				if (widget.bounds.y < minPosY) minPosY = widget.bounds.y;
			}
		});

		return [minPosX, minPosY];
	};

	const sortWidgetsOnXAxis = (allSelectedWidgets: SDK.IWidget[]) => {
		return allSelectedWidgets.sort((a, b) => {
			return a.bounds.x - b.bounds.x;
		});
	};

	// adjust x any y position of widgets to be perfectly horizontal and vertical aligned in a line by respecting the manually created order on x axis
	const alignWidgetsHorizontallyAndVerticallyInLine = (
		sortedSelectedWidgetsAfterXValue: SDK.IWidget[],
		minPosX: number,
		minPosY: number
	) => {
		let widgetTagCount = -1;
		sortedSelectedWidgetsAfterXValue.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			await miro.board.widgets.update({
				...widget,
				x: minPosX + widget.bounds.width * widgetTagCount,
				y: minPosY,
			});
		});
	};

	// adjust x position of widgets to be perfectly horizontal aligned by respecting the manually created order on x axis
	const alignWidgetsHorizontally = async (sortedSelectedWidgetsAfterXValue: SDK.IWidget[], minCoorPosX: number) => {
		let widgetTagCount = -1;
		sortedSelectedWidgetsAfterXValue.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			await miro.board.widgets.update({
				...widget,
				x: minCoorPosX + widget.bounds.width * widgetTagCount,
			});
		});
	};

	const addNumericTags = (allTags: SDK.ITag[], allSelectedWidgets: SDK.IWidget[]) => {
		let sortedSelectedWidgetsAfterYValueWithNumericTag: NumericTaggedWidget[] = [];
		allTags.forEach((tag) => {
			if (isNumeric(tag.title)) {
				const widgetWithNumericTag = allSelectedWidgets.find((widget) => tag.widgetIds.includes(widget.id));
				if (widgetWithNumericTag) {
					sortedSelectedWidgetsAfterYValueWithNumericTag.push({
						widget: widgetWithNumericTag,
						numericTag: parseInt(tag.title),
					});
				}
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

	// vertical alignment according to the sorting
	// update every widget in sorted array with new sorted y position and aligned x position
	const alignWidgetsVerticallyAfterNumericTag = async (
		sortedSelectedWidgetsAfterYValue: SDK.IWidget[],
		minCoorPosY: number
	) => {
		let widgetTagCount = -1;
		sortedSelectedWidgetsAfterYValue.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			await miro.board.widgets.update({
				...widget,
				x: widget.bounds.x,
				y: minCoorPosY!! + widget.bounds.height * widgetTagCount + widget.bounds.height / 2,
			});
		});
	};

	const createCoordinateSystem = async (
		minWidgetPosX: number | undefined,
		minWidgetPosY: number | undefined,
		inputXAxis: string,
		inputYAxis: string,
		widgetWidth: number,
		widgetHeight: number,
		widgets: SDK.IWidget[]
	) => {
		const totalWidgetWidth = widgets.length * widgetWidth;
		const totalWidgetHeight = widgets.length * widgetHeight;
		const paddingToWidgets = widgetHeight;
		const distanceTextToAxis = 20;

		// bottom left edge point of the coordinate system
		// TODO: Understand why I have to subtract "widgetWidth / 2"
		const coorOriginX = minWidgetPosX!! - widgetWidth / 2;
		const coorOriginY = minWidgetPosY!! - totalWidgetHeight - paddingToWidgets;

		/*** CREATE AXIS ***/
		// create Y-Axis
		await miro.board.widgets.create({
			type: 'LINE',
			startPosition: {
				x: coorOriginX,
				y: coorOriginY,
			},
			endPosition: {
				x: coorOriginX,
				y: minWidgetPosY!! - paddingToWidgets,
			},
			style: {
				lineColor: '#000000',
				lineStyle: 2,
				lineThickness: 2,
				lineEndStyle: 8,
				lineStartStyle: 0,
				lineType: 0,
			},
		});

		// create X-Axis
		await miro.board.widgets.create({
			type: 'LINE',
			startPosition: {
				x: coorOriginX,
				y: coorOriginY,
			},
			endPosition: {
				x: coorOriginX + totalWidgetWidth,
				y: coorOriginY,
			},
			style: {
				lineColor: '#000000',
				lineStyle: 2,
				lineThickness: 2,
				lineEndStyle: 8,
				lineStartStyle: 0,
				lineType: 0,
			},
		});

		/*** CREATE LABELS ***/
		// Create X-Axis Label
		// https://developers.miro.com/reference/text
		// -20px is because of the positioning of the label underneith the x-axis
		await miro.board.widgets.create({
			type: 'TEXT',
			x: coorOriginX + totalWidgetWidth / 2,
			y: coorOriginY - distanceTextToAxis,
			width: 300,
			scale: 1.2857142857142858,
			style: {
				bold: 1,
				textAlign: 'c',
				textColor: '#1a1a1a',
			},
			text: inputXAxis,
		});

		// Create Y-Axis Label
		// -180px is because of the position changing caused by the rotation of the label
		await miro.board.widgets.create({
			type: 'TEXT',
			x: coorOriginX - distanceTextToAxis,
			y: coorOriginY + totalWidgetHeight / 2,
			width: 300,
			rotation: -90,
			text: inputYAxis,
			scale: 1.2857142857142858,
			style: {
				bold: 1,
				textAlign: 'c',
				textColor: '#1a1a1a',
			},
		});

		miro.board.viewport.set(
			{ x: coorOriginX, y: coorOriginY, width: totalWidgetWidth, height: totalWidgetHeight },
			{ padding: { top: 50, bottom: 150, left: 0, right: 0 }, animationTimeInMS: 200 }
		);

		return [coorOriginX, coorOriginY];
	};

	const setupMatrixAndWidgets = async () => {
		const allSelectedWidgets = await miro.board.selection.get();
		let minPosX: number | undefined = undefined;
		let minPosY: number | undefined = undefined;

		// all selected widgets are suppost to have same height and width
		// therefore, just take height and width of first element
		const widgetHeight = allSelectedWidgets[0].bounds.height;
		const widgetWidth = allSelectedWidgets[0].bounds.width;

		[minPosX, minPosY] = calculateMinPosYAndMinPosX(allSelectedWidgets, minPosX, minPosY);
		// SORTING AND ALIGNING ON XAXIS
		const sortedSelectedWidgetsAfterXValue = sortWidgetsOnXAxis(allSelectedWidgets);
		alignWidgetsHorizontallyAndVerticallyInLine(sortedSelectedWidgetsAfterXValue, minPosX, minPosY);

		// returns minCoorPosX and minCoorPosY from coodinate system
		// needed for sorting and alignment of widgets in second step
		[minCoorPosX, minCoorPosY] = await createCoordinateSystem(
			minPosX,
			minPosY,
			inputXAxis,
			inputYAxis,
			widgetWidth,
			widgetHeight,
			allSelectedWidgets
		);
	};

	// TODO: CORRECT BUG: Fails when multiple widgets have same number -> first number is taken into account, rest is ignored
	// works only for one type of widget because of widget.bound.width calculation
	// ignores other widgets which have the same number tag -> only sorts first one
	// works with number tag and other tags as well
	const sortMatrixAndWidgets = async () => {
		const allSelectedWidgets = await miro.board.selection.get();
		const allTags = await miro.board.tags.get();

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

	return (
		<div>
			<h3 style={h3Style}>CREATE MATRIX</h3>
			<div style={inputContainer}>
				<label>x-Axis: </label>
				<input style={inputStyle} value={inputXAxis} onChange={(e) => setInputXAxis(e.target.value)} />
			</div>
			<div style={inputContainer}>
				<label>y-Axis: </label>
				<input style={inputStyle} value={inputYAxis} onChange={(e) => setInputYAxis(e.target.value)} />
			</div>
			<button style={buttonStyle} onClick={() => setupMatrixAndWidgets()}>
				Setup Matrix
			</button>
			<button style={buttonStyle} onClick={() => sortMatrixAndWidgets()}>
				Sort Matrix
			</button>
		</div>
	);
};

export default MatrixApp;
