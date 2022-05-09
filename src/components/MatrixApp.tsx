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

	// TODO: CORRECT BUG: Fails when multiple widgets have same number -> first number is taken into account, rest is ignored
	// works only for one type of widget because of widget.bound.width calculation
	// ignores other widgets which have the same number tag -> only sorts first one
	// works with number tag and other tags as well
	const getNumericTags = async () => {
		const allSelectedWidgets = await miro.board.selection.get();
		const allTags = await miro.board.tags.get();
		let minPosX: number | undefined = undefined;
		let minPosY: number | undefined = undefined;

		let sortedSelectedWidgetsAfterXValue = [];
		let sortedSelectedWidgetsAfterYValue: NumericTaggedWidget[] = [];

		// calculate most top y and most left x
		allSelectedWidgets.forEach((widget) => {
			if (minPosX === undefined) minPosX = widget.bounds.x;
			else if (widget.bounds.x < minPosX) minPosX = widget.bounds.x;
			if (minPosY === undefined) minPosY = widget.bounds.y;
			else if (widget.bounds.y < minPosY) minPosY = widget.bounds.y;
		});

		// sort selection widgets according to x position to keep the manually created prioritizing on x axis
		sortedSelectedWidgetsAfterXValue = allSelectedWidgets.sort((a, b) => {
			return a.bounds.x - b.bounds.x;
		});

		// adjust x position of widgets to be perfectly horizontal aligned by respecting the manually created order on x axis
		let widgetTagCount = -1;
		sortedSelectedWidgetsAfterXValue.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			widget.bounds.x = minPosX!! + widget.bounds.width * widgetTagCount;
		});

		// add tag number and widget in separated array to be able to sort this array in next step
		allTags.forEach((tag) => {
			if (isNumeric(tag.title)) {
				const widgetWithNumericTag = allSelectedWidgets.find((widget) => tag.widgetIds.includes(widget.id));
				widgetWithNumericTag &&
					sortedSelectedWidgetsAfterYValue.push({ widget: widgetWithNumericTag, numericTag: parseInt(tag.title) });
			}
		});

		// sort widgets according to their numeric tag (lowest to highest)
		sortedSelectedWidgetsAfterYValue.sort((a, b) => {
			return b.numericTag - a.numericTag;
		});

		// remove numeric tag after sorting to get the array with only the sorted widgets in the correct order
		const newSortedWidgets = sortedSelectedWidgetsAfterYValue.map((numericWidget) => numericWidget.widget);
		const widgetWidth = newSortedWidgets[0].bounds.width;
		const widgetHeight = newSortedWidgets[0].bounds.height;

		widgetTagCount = -1;
		// vertical alignment according to the sorting
		// update every widget in sorted array with new sorted y position and aligned x position
		newSortedWidgets.forEach(async (widget) => {
			widgetTagCount = widgetTagCount + 1;
			await miro.board.widgets.update({
				...widget,
				x: widget.bounds.x,
				y: minPosY!! + widgetHeight * widgetTagCount,
			});
		});

		await createCoordinateSystem(minPosX, minPosY, inputXAxis, inputYAxis, widgetWidth, widgetHeight, newSortedWidgets);
	};

	return (
		<div>
			<h3 style={h3Style}>SORTING FUNCTION</h3>
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
