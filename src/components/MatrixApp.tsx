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

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const createCoordinateSystem = async (
		minPosX: number | undefined,
		minPosY: number | undefined,
		inputXAxis: string,
		inputYAxis: string,
		widgetWidth: number,
		widgetHeight: number,
		widgets: SDK.IWidget[]
	) => {
		const totalWidgetWidth = widgets.length * widgetWidth;
		const totalWidgetHeight = widgets.length * widgetHeight;
		// (0,0) point of the coordinate system -> bottom left edge
		const coordinateSystemOrigin = minPosY!! + totalWidgetHeight - widgetHeight / 2;

		/*** CREATE AXIS ***/
		// create Y-Axis
		await miro.board.widgets.create({
			type: 'LINE',
			captions: [{ text: 'TEST' }],
			startPosition: {
				x: minPosX!! - widgetWidth / 2,
				y: minPosY!! - widgetHeight,
			},
			endPosition: {
				x: minPosX!! - widgetWidth / 2,
				y: coordinateSystemOrigin,
			},
			style: {
				lineColor: '#000000',
				lineStyle: 2,
				lineThickness: 2,
				lineEndStyle: 0,
				lineStartStyle: 8,
				lineType: 0,
			},
		});

		// create X-Axis
		await miro.board.widgets.create({
			type: 'LINE',
			startPosition: {
				x: minPosX!! - widgetWidth / 2,
				y: coordinateSystemOrigin,
			},
			endPosition: {
				x: minPosX!! + totalWidgetWidth,
				y: coordinateSystemOrigin,
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
		// +20px is because of the positioning of the label underneith the x-axis
		await miro.board.widgets.create({
			type: 'TEXT',
			x: minPosX!! + totalWidgetWidth / 2 - widgetWidth / 2,
			y: coordinateSystemOrigin + 20,
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
			x: minPosX!! - 180,
			y: minPosY!! + totalWidgetHeight / 2 - widgetHeight / 2,
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

	// adjust x position of widgets to be perfectly horizontal aligned by respecting the manually created order on x axis
	const alignWidgetsHorizontally = (sortedSelectedWidgetsAfterXValue: SDK.IWidget[], minPosX: number) => {
		let widgetTagCount = -1;
		sortedSelectedWidgetsAfterXValue.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			widget.bounds.x = minPosX + widget.bounds.width * widgetTagCount;
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
	const alignWidgetsVertically = (
		sortedSelectedWidgetsAfterYValue: SDK.IWidget[],
		minPosY: number,
		widgetHeight: number
	) => {
		let widgetTagCount = -1;
		sortedSelectedWidgetsAfterYValue.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			await miro.board.widgets.update({
				...widget,
				x: widget.bounds.x,
				y: minPosY!! + widgetHeight * widgetTagCount,
			});
		});
	};

	// TODO: CORRECT BUG: Fails when multiple widgets have same number -> first number is taken into account, rest is ignored
	// works only for one type of widget because of widget.bound.width calculation
	// ignores other widgets which have the same number tag -> only sorts first one
	// works with number tag and other tags as well
	const getNumericTags = async () => {
		const allSelectedWidgets = await miro.board.selection.get();
		const allTags = await miro.board.tags.get();

		let minPosX: number | undefined = undefined;
		let minPosY: number | undefined = undefined;

		// all selected widgets are suppost to have same height and width
		// therefore, just take height and width of first element
		const widgetHeight = allSelectedWidgets[0].bounds.height;
		const widgetWidth = allSelectedWidgets[0].bounds.width;

		[minPosX, minPosY] = calculateMinPosYAndMinPosX(allSelectedWidgets, minPosX, minPosY);

		// SORTING AND ALIGNING ON XAXIS
		const sortedSelectedWidgetsAfterXValue = sortWidgetsOnXAxis(allSelectedWidgets);
		alignWidgetsHorizontally(sortedSelectedWidgetsAfterXValue, minPosX);

		// add tag number and widget in separated array to be able to sort this array in next step
		const sortedSelectedWidgetsAfterYValueWithNumericTag = addNumericTags(allTags, allSelectedWidgets);

		const sortedSelectedWidgetsAfterYValue = sortWidgetsOnYAxisAfterNumericTag(
			sortedSelectedWidgetsAfterYValueWithNumericTag
		);

		alignWidgetsVertically(sortedSelectedWidgetsAfterYValue, minPosY, widgetHeight);

		await createCoordinateSystem(
			minPosX,
			minPosY,
			inputXAxis,
			inputYAxis,
			widgetWidth,
			widgetHeight,
			sortedSelectedWidgetsAfterYValue
		);
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
			<button style={buttonStyle} onClick={() => getNumericTags()}>
				Sort in order
			</button>
		</div>
	);
};

export default MatrixApp;
