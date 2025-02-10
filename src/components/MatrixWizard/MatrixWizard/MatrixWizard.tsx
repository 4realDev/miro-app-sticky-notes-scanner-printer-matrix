// IMPORTANT: AFTER EACH DEPLOY TO FILEZILLA - APP MUST BE REINSTALLED VIA LINK!
// IMPORTANT: WHEN UPLOADING NEW APP VERSION - REMEMBER TO CLEAR THE CACHE

import React, { useState } from 'react';
import styles from './MatrixWizard.module.scss';
import { StepButton, StepLabel } from '@mui/material';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';

import ShowCategoriesButtonIcon from '../../Icons/ShowCategoriesButtonIcon';
import SortByImportanceButtonIcon from '../../Icons/SortByImportanceButtonIcon';
import SortByImportanceImg from '../../Icons/SortByImportanceImg';
import ShowCategoriesImg from '../../Icons/ShowCategoriesImg';
import CreatePrioritiesListImg from '../../Icons/CreatePrioritiesListImg';
import CreatePrioritiesListButtonIcon from '../../Icons/CreatePrioritiesListButtonIcon';
import GroupSelectionButtonIcon from '../../Icons/GroupSelectionButtonIcon';
import GroupSelectionImg from '../../Icons/GroupSelectionImg';
import ArrowRight from '../../Icons/ArrowRight';
import ArrowLeft from '../../Icons/ArrowLeft';
import {
	StickyNote,
	Frame,
	FontFamily,
	Item,
	Shape,
	Tag,
	Card,
	Text,
	NotificationType,
} from '@mirohq/websdk-types';
import { clearSessionStorageAndStates, useSessionStorage } from '../../useSessionStorage';
import Button from '../../ui/Button/Button';
import SortByDifficultyImg from '../../Icons/SortByDifficultyImg';
import specialCardThumbnail from '../../../assets/special_card_thumbnail.png';
import WidgetDraggableCard from '../../WidgetDraggableCard/WidgetDraggableCard';
import { createMatrixCard } from './utils';

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
	colorText: string;
	color: string;
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
	TOP_LEFT: { color: '#CAF1F7', colorText: '#026678', prio: 1 }, // luxury (least important)
	TOP_RIGHT: { color: '#F8F1B7', colorText: '#A39000', prio: 3 }, // strategic
	BOTTOM_LEFT: { color: '#CCF8C7', colorText: '#0C7A00', prio: 2 }, // low hanging fruits
	BOTTOM_RIGHT: { color: '#F8D1D0', colorText: '#7A0200', prio: 4 }, // focus (most important)
} as const;

const MATRIX_LABELS_FONT_FAMILY: FontFamily = 'plex_sans';
const MATRIX_AXIS_COLOR = '#000000';
const MATRIX_AXIS_LINE_WIDTH = 8;
const MATRIX_AXIS_LABEL_COLOR = '#000000';
const MATRIX_PRIORITY_LIST_TITLE_COLOR = '#000000';
const MATRIX_PRIORITY_LIST_ITEMS_COLOR = '#000000';

const DEBUG_DOT = false;

export type StepData = {
	title: string;
	description?: string;
	steps: string[];
	buttonText: string;
	img: React.ReactNode;
	buttonIcon: React.ReactNode;
	methodSucceed: boolean;
};

const steps: StepData[] = [
	{
		title: 'Select your Topics',
		steps: [
			'Make sure all topics are estimated with story points',
			'Select all topics that you want to discuss',
			'Press button "Group Selection"',
		],
		buttonText: 'Group Selection',
		img: <GroupSelectionImg />,
		buttonIcon: <GroupSelectionButtonIcon />,
		methodSucceed: false,
	},
	{
		title: 'Sort by Importance',
		steps: [
			'Prioritize your topics horizontally by importance',
			'Press button "Sort by Importance" to allign cards',
			'If you make any changes update by pressing the button again to realign',
		],
		buttonText: 'Sort by Importance',
		img: <SortByImportanceImg />,
		buttonIcon: <SortByImportanceButtonIcon />,
		methodSucceed: false,
	},
	{
		title: 'Sort by Difficulty',
		steps: [
			'Press button "Sort by Difficulty". Based on the agreed story points the topics are sorted vertically by difficulty',
			'If you re-estimate story points, update by pressing the button again',
		],
		buttonText: 'Sort by Difficulty',
		img: <SortByDifficultyImg />,
		buttonIcon: <SortByImportanceButtonIcon />,
		methodSucceed: false,
	},
	{
		title: 'Identify what to focus on',
		steps: ['Press button "Show Categories"', 'Analyse findings'],
		buttonText: 'Show Categories',
		img: <ShowCategoriesImg />,
		buttonIcon: <ShowCategoriesButtonIcon />,
		methodSucceed: false,
	},
	{
		title: 'Create Priorities List',
		steps: [
			'Press button "Create Priorities List" to get a proposal',
			'Rearrange list manually according to discussions',
			'Finished!',
		],
		buttonText: 'Create Priorities List',
		img: <CreatePrioritiesListImg />,
		buttonIcon: <CreatePrioritiesListButtonIcon />,
		methodSucceed: false,
	},
];

const addNewTopicButtonText = 'Update existing matrix (added or removed topics)';
const drawNewMatrixButtonText = 'Create new matrix';

const CustomErrorMessages = {
	NoSelection: 'Please select all topics you want to prioritize.',
	WrongSelection:
		'Object selection invalid. Use objects allowing estimates or Cando special cards.',
	WrongOrNoTag: 'One or more topics have no estimation, please add one to proceed.',
};

export const MatrixWizard = () => {
	const [step, setStep] = useSessionStorage('step', 0) as [
		number,
		React.Dispatch<React.SetStateAction<number>>
	];

	const [minWidgetPosX, setMinWidgetPosX] = useSessionStorage('minWidgetPosX', 0) as [
		number,
		React.Dispatch<React.SetStateAction<number>>
	];
	const [minWidgetPosY, setMinWidgetPosY] = useSessionStorage('minWidgetPosY', 0) as [
		number,
		React.Dispatch<React.SetStateAction<number>>
	];

	const [matrixWidgetSelection, setMatrixWidgetSelection] = useSessionStorage(
		'matrixWidgetSelection',
		[]
	) as [
		Array<StickyNote | Frame | Card>,
		React.Dispatch<React.SetStateAction<Array<StickyNote | Frame | Card>>>
	];

	const [coorOriginX, setCoorOriginX] = useSessionStorage('coorOriginX', undefined) as [
		number | undefined,
		React.Dispatch<React.SetStateAction<number | undefined>>
	];

	const [coorOriginY, setCoorOriginY] = useSessionStorage('coorOriginY', undefined) as [
		number | undefined,
		React.Dispatch<React.SetStateAction<number | undefined>>
	];

	const [coordXAxisWidgets, setCoorXAxisWidgets] = useSessionStorage(
		'coordXAxisWidgets',
		undefined
	) as [Item[] | undefined, React.Dispatch<React.SetStateAction<Item[] | undefined>>];

	const [coorYAxisWidgets, setCoorYAxisWidgets] = useSessionStorage(
		'coorYAxisWidgets',
		undefined
	) as [Item[] | undefined, React.Dispatch<React.SetStateAction<Item[] | undefined>>];

	const [totalWidgetWidth, setTotalWidgetWidth] = useSessionStorage('totalWidgetWidth', 0) as [
		number,
		React.Dispatch<React.SetStateAction<number>>
	];

	const [, setTotalWidgetHeight] = useSessionStorage('totalWidgetHeight', 0) as [
		number,
		React.Dispatch<React.SetStateAction<number>>
	];

	const [
		totalWidgetHeightAfterVerticalAlignmentWithNumericTag,
		setTotalWidgetHeightAfterVerticalAlignmentWithNumericTag,
	] = useSessionStorage('totalWidgetHeightAfterVerticalAlignmentWithNumericTag', 0) as [
		number,
		React.Dispatch<React.SetStateAction<number>>
	];

	const axisArrowWidth = 40;
	const axisArrowHeight = 40;

	const paddingXBetweenWidgets: number = 50;
	const paddingYBetweenWidgets: number = 50;

	const additionalPaddingBetweenYAxisAndLeftMostWidget: number = 50;
	const additionalPaddingBetweenXAxisAndBottomMostWidget: number = 50;

	const distanceAxisLabelTextToAxis = 65;

	// length of the x or y-axis line, which is additionally added to the width or height of the matrix
	// the result is, that the axis line is longer then the matrix itself, which in this case is called "overlapping"
	const additionalAxisMatrixOverlapping = 50;

	const [bottomLeftQuarter, setBottomLeftQuarter] = useSessionStorage(
		'bottomLeftQuarter',
		undefined
	) as [Shape | undefined, React.Dispatch<React.SetStateAction<Shape | undefined>>];
	const [bottomRightQuarter, setBottomRightQuarter] = useSessionStorage(
		'bottomRightQuarter',
		undefined
	) as [Shape | undefined, React.Dispatch<React.SetStateAction<Shape | undefined>>];
	const [topLeftQuarter, setTopLeftQuarter] = useSessionStorage('topLeftQuarter', undefined) as [
		Shape | undefined,
		React.Dispatch<React.SetStateAction<Shape | undefined>>
	];
	const [topRightQuarter, setTopRightQuarter] = useSessionStorage('topRightQuarter', undefined) as [
		Shape | undefined,
		React.Dispatch<React.SetStateAction<Shape | undefined>>
	];

	const [quarterDataList, setQuarterDataList] = useSessionStorage('quarterDataList', undefined) as [
		MatrixQuarterDataList | undefined,
		React.Dispatch<React.SetStateAction<MatrixQuarterDataList | undefined>>
	];

	const [matrixCategoryListWidgets, setMatrixCategoryListWidgets] = useSessionStorage(
		'matrixCategoryListWidgets',
		undefined
	) as [
		Array<Text | Shape> | undefined,
		React.Dispatch<React.SetStateAction<Array<Text | Shape> | undefined>>
	];

	const isNumeric = (str: string) => {
		return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
	};

	const calculateTotalWidgetWidthAndHeight = (widgets: Array<StickyNote | Card | Frame>) => {
		let totalWidgetWidth = 0;
		let totalWidgetHeight = 0;
		widgets.forEach((widget) => {
			if ((widget.type !== 'frame' && widget.parentId === null) || widget.type === 'frame') {
				totalWidgetWidth = totalWidgetWidth + widget.width + paddingXBetweenWidgets;
				totalWidgetHeight = totalWidgetHeight + widget.height + paddingYBetweenWidgets;
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
		minPosY: number,
		widgetMaxHeight: number,
		groupWidgetsAbove: boolean
	) => {
		let updatedWidgetDistanceX = 0;
		for (const [index, widget] of sortedSelectedWidgetsByXValue.entries()) {
			widget.x = minPosX + updatedWidgetDistanceX;
			if (groupWidgetsAbove) widget.y = minPosY - widgetMaxHeight * 2.25;
			else widget.y = minPosY;
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

	const addNumericTags = async (
		allTags: Tag[],
		allSelectedWidgets: Array<StickyNote | Card | Frame>
	) => {
		let numericTaggedWidgets: NumericTaggedWidget[] = [];
		// let tagError = false;
		const selectedWidgets = allSelectedWidgets.filter(
			(selectedWidget) =>
				selectedWidget.type === 'frame' ||
				selectedWidget.type === 'sticky_note' ||
				selectedWidget.type === 'card'
		);

		for (const widget of selectedWidgets) {
			let widgetsTag: Tag | undefined = undefined;

			// SCENARIO 1: SORTING STICKY NOTE OR CARD
			// widget is a sticky note or a card without a parent (not inside a frame)
			// find its widgetsTag -> it should correspond to the estimation tag
			if ((widget.type === 'sticky_note' || widget.type === 'card') && widget.parentId === null) {
				widget.tagIds.forEach((tagId: string) => {
					// TODO: Replace with filter to search even in stickies with multiple tags
					widgetsTag = allTags.find((tag) => tag.id === tagId);
				});
			}

			// SCENARIO 2: SORTING FRAMES
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
				// TODO: Replace with filter to search even in stickies with multiple tags
				widgetsTag = allTags.find((tag) => tag.id === frameWidgetWithTag?.tagIds[0]);
			}

			// if the widget in the selection is neither a sticky without a parent nor a frame
			// just continue with the next element in selection
			else {
				continue;
			}

			// Check if some estimation tag was successfully found
			if (widgetsTag !== undefined) {
				// This enables to use the Matrix even with the "Miro Estimation Tool"
				// 'Estimate: [num]' is the tag title, which is used by the "Miro Estimation Tool"
				// [num] can be 1,2,3,5,8,13,21
				const widgetsTagEstimationNumber = isNumeric(widgetsTag.title)
					? widgetsTag.title
					: widgetsTag.title.replace('Estimate: ', '');

				if (isNumeric(widgetsTagEstimationNumber)) {
					numericTaggedWidgets.push({
						widget: widget,
						numericTag: parseInt(widgetsTagEstimationNumber),
					});
				} else {
					sendNotification(CustomErrorMessages.WrongOrNoTag);
					return undefined;
					// tagError = true;
					// break;
				}
			} else {
				sendNotification(CustomErrorMessages.WrongOrNoTag);
				return undefined;
				// tagError = true;
				// break;
			}
		}
		// if (tagError) return undefined;
		return numericTaggedWidgets;
	};

	// sort widgets according to their numeric tag (lowest to highest)
	// remove their numeric tag after sorting to get array with only the sorted widgets in the correct order
	const sortWidgetsOnYAxisByNumericTag = (
		sortedSelectedWidgetsAfterYValueWithNumericTag: NumericTaggedWidget[]
	) => {
		return sortedSelectedWidgetsAfterYValueWithNumericTag.sort((a, b) => {
			return b.numericTag - a.numericTag;
		});
	};

	// vertical alignment according to the sorting
	// update every widget in sorted array with new sorted y position and aligned x position
	const alignWidgetsVerticallyByNumericTag = async (
		sortedSelectedWidgetsAfterXAndYValueWithNumericTag: NumericTaggedWidget[],
		coorOriginY: number
	) => {
		let updatedWidgetDistanceY = 0;
		let totalWidgetHeightAfterVerticalAlignmentWithNumericTag = 0;
		for (const [
			index,
			widgetWithNumericTag,
		] of sortedSelectedWidgetsAfterXAndYValueWithNumericTag.entries()) {
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
			widgetWithNumericTag.widget.x =
				widgetWithNumericTag.widget.x + additionalPaddingBetweenYAxisAndLeftMostWidget;
			widgetWithNumericTag.widget.y =
				coorOriginY!! +
				updatedWidgetDistanceY +
				widgetWithNumericTag.widget.height / 2 -
				additionalPaddingBetweenXAxisAndBottomMostWidget;
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
		widgetMaxHeight: number,
		totalWidgetWidth: number
	) => {
		// bottom left edge point of the coordinate system
		const xAxisCoorOriginX = minWidgetPosX;
		const xAxisCoorOriginY = minWidgetPosY - widgetMaxHeight;

		// Delete already existing matrixCoordinateSystem before new coordinateSystem is created
		if (coordXAxisWidgets && coordXAxisWidgets.length !== 0) {
			Promise.all(
				coordXAxisWidgets.map(async (widget) => {
					try {
						widget && (await miro.board.remove(widget));
					} catch {}
				})
			);
		}

		// Delete already existing matrixCoordinateSystem before new coordinateSystem is created
		if (coorYAxisWidgets && coorYAxisWidgets.length !== 0) {
			Promise.all(
				coorYAxisWidgets.map(async (widget) => {
					try {
						widget && (await miro.board.remove(widget));
					} catch {}
				})
			);
		}

		// create X-Axis
		const xAxis = await miro.board.createShape({
			shape: 'rectangle',
			x: xAxisCoorOriginX + totalWidgetWidth / 2 + additionalAxisMatrixOverlapping / 2,
			y: xAxisCoorOriginY,
			height: MATRIX_AXIS_LINE_WIDTH,
			width: totalWidgetWidth + additionalAxisMatrixOverlapping,
			style: {
				fillColor: MATRIX_AXIS_COLOR,
			},
		});

		// create X-Axis Arrow
		const xAxisArrow = await miro.board.createShape({
			shape: 'triangle',
			// + 12px so the arrow overlays the end of the x-axis
			x: xAxisCoorOriginX + totalWidgetWidth + additionalAxisMatrixOverlapping / 2 + 12,
			y: xAxisCoorOriginY,
			height: axisArrowHeight,
			width: axisArrowWidth,
			rotation: 90,
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
			y:
				xAxisCoorOriginY +
				(minWidgetPosY - widgetMaxHeight - xAxisCoorOriginY) +
				distanceAxisLabelTextToAxis,
			width: 360,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>Importance</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		// Create X-Axis High
		const xAxisHighText = await miro.board.createText({
			x:
				xAxisCoorOriginX +
				totalWidgetWidth +
				distanceAxisLabelTextToAxis +
				additionalAxisMatrixOverlapping,
			y: xAxisCoorOriginY,
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
			y: xAxisCoorOriginY,
			width: 360,
			content: `<p style="color: ${MATRIX_AXIS_LABEL_COLOR};"><strong>Low</strong></p>`,
			style: {
				textAlign: 'center',
				fontSize: 36,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
			},
		});

		setCoorXAxisWidgets([xAxis, xAxisArrow, xAxisLabel, xAxisHighText, xyAxisLowText]);

		return [xAxisCoorOriginX, xAxisCoorOriginY];
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
			Promise.all(
				coorYAxisWidgets.map(async (widget) => {
					try {
						widget && (await miro.board.remove(widget));
					} catch {}
				})
			);
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
			height:
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag + additionalAxisMatrixOverlapping,
			width: MATRIX_AXIS_LINE_WIDTH,
			style: {
				fillColor: MATRIX_AXIS_COLOR,
			},
		});

		const yAxisArrow = await miro.board.createShape({
			shape: 'triangle',
			x: yAxisCoorOriginX,
			// - 12px so the arrow overlays the end of the y-axis
			y: yAxisCoorOriginY - additionalAxisMatrixOverlapping - 12,
			height: axisArrowHeight,
			width: axisArrowWidth,
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

		setCoorYAxisWidgets([yAxis, yAxisArrow, yAxisLabel, yAxisHighText]);

		return [yAxisCoorOriginX, yAxisCoorOriginY];
	};

	// TODO: Extract in utility class
	const sendNotification = async (notification: string) => {
		// Display the notification on the board UI.
		await miro.board.notifications.show({
			message: notification,
			type: 'error' as NotificationType,
		});
	};

	// This method is called twice
	// The first time, it will take the selected widgets and sort them by the x-axis
	// Additionally, it will create the x-axis of the matrix, set the viewport to its position and save the widgets inside a state
	// The second time, the method is called by the function sortByXAxis, which should typically by called afterwards
	const sortByXAxis = async (
		setViewport = true,
		groupWidgetsAbove = false,
		reselectWidgets = true
	): Promise<boolean | [number, number, (StickyNote | Card | Frame)[], boolean]> => {
		let filteredSelectedWidgets = undefined;
		if (reselectWidgets) {
			const selectedWidgets = await miro.board.getSelection();

			if (selectedWidgets.length === 0) {
				await sendNotification(CustomErrorMessages.NoSelection);
				return false;
			}

			filteredSelectedWidgets = selectedWidgets.filter(
				(selectedWidget) =>
					(selectedWidget.type === 'sticky_note' &&
						selectedWidget.content !== '<p>Difficulty</p>' &&
						selectedWidget.content !== '<p>Aufwand</p>') ||
					(selectedWidget.type === 'card' && selectedWidget.parentId === null) ||
					selectedWidget.type === 'frame'
			) as Array<StickyNote | Frame | Card>;

			if (filteredSelectedWidgets.length === 0) {
				await sendNotification(CustomErrorMessages.WrongSelection);
				return false;
			}
		}
		// if selection already exists (sortByXAxis method was already called and is called again)
		else {
			const updatedMatrixWidgetSelection = await Promise.all(
				matrixWidgetSelection.map(async (alreadySelectedWidget) => {
					const alreadySelectedWidgetWithNewPosition = (await miro.board.getById(
						alreadySelectedWidget.id
					)) as StickyNote | Frame | Card;
					return alreadySelectedWidgetWithNewPosition;
				})
			);
			filteredSelectedWidgets = updatedMatrixWidgetSelection;

			if (filteredSelectedWidgets.length === 0) {
				await sendNotification(CustomErrorMessages.NoSelection);
				return false;
			}
		}

		const [calcTotalWigdetWidth, calcTotalWigdetHeight] =
			calculateTotalWidgetWidthAndHeight(filteredSelectedWidgets);

		const widgetWithMinPosX: StickyNote | Card | Frame = filteredSelectedWidgets.reduce(
			(prev, cur) => (cur.x < prev.x ? cur : prev)
		);

		const widgetWithMinPosY: StickyNote | Card | Frame = filteredSelectedWidgets.reduce(
			(prev, cur) => (cur.y < prev.y ? cur : prev)
		);

		// necessary to setup the padding for the widgets to the matrix in the first step and to set the miro-zoom-viewport correctly
		const widgetMaxHeight = Math.max(...filteredSelectedWidgets.map((selectedWidget) => selectedWidget.height)); // prettier-ignore

		// if "matrixWidgetSelection.length === 0" get widgetWithMinPosX and Y, else use the already saved "minWidgetPos"
		const minPosX = reselectWidgets ? widgetWithMinPosX.x : minWidgetPosX;
		const minPosY = reselectWidgets ? widgetWithMinPosY.y : minWidgetPosY;

		let xAxisCoorOriginX = 0;
		let xAxisCoorOriginY = 0;

		// SORTING AND ALIGNING ON XAXIS
		const sortedSelectedWidgetsByXValue = sortWidgetsOnXAxis(filteredSelectedWidgets);

		await alignWidgetsHorizontallyAndVerticallyInLine(
			sortedSelectedWidgetsByXValue,
			minPosX,
			minPosY,
			widgetMaxHeight,
			groupWidgetsAbove
		);

		[xAxisCoorOriginX, xAxisCoorOriginY] = await drawCoordinateSystemXAxis(
			minPosX - widgetWithMinPosX.width / 2,
			minPosY - widgetWithMinPosY.height / 2,
			widgetMaxHeight,
			calcTotalWigdetWidth + additionalPaddingBetweenYAxisAndLeftMostWidget
		);

		setTotalWidgetWidth(calcTotalWigdetWidth + additionalPaddingBetweenYAxisAndLeftMostWidget);
		setTotalWidgetHeight(calcTotalWigdetHeight);

		setMinWidgetPosX(minPosX);
		setMinWidgetPosY(minPosY);

		setCoorOriginX(xAxisCoorOriginX);
		setCoorOriginY(xAxisCoorOriginY);

		setMatrixWidgetSelection(filteredSelectedWidgets);

		if (setViewport) {
			miro.board.viewport.set({
				viewport: {
					x: xAxisCoorOriginX,
					y: groupWidgetsAbove ? xAxisCoorOriginY - widgetMaxHeight * 2.25 : xAxisCoorOriginY,
					width: calcTotalWigdetWidth,
					height: widgetMaxHeight * 2,
				},
				padding: { top: 100, bottom: 400, left: 550, right: 100 },
				animationDurationInMs: 200,
			});
		}

		return [xAxisCoorOriginX, xAxisCoorOriginY, filteredSelectedWidgets, true];
	};

	const sortByYAxis = async () => {
		// Update the matrix widget selection, if something inside the selected widgets is changed or adjusted (e.g. the tag)
		const updatedMatrixWidgetSelection = await Promise.all(
			matrixWidgetSelection.map(async (alreadySelectedWidget) => {
				const alreadySelectedWidgetWithUpdatedData = (await miro.board.getById(
					alreadySelectedWidget.id
				)) as StickyNote | Frame | Card;
				return alreadySelectedWidgetWithUpdatedData;
			})
		);

		const allTags = await miro.board.get({ type: 'tag' });

		// add tag number and widget in separated array to be able to sort this array in next step
		const selectedWidgetsWithNumericTag: NumericTaggedWidget[] | undefined = await addNumericTags(
			allTags,
			updatedMatrixWidgetSelection
		);

		// call sortByXAxis method again
		// necessary, if user moves the widgets around and changed their positions and the coordinate system origin points
		// redraws xAxis, recalculates coordinate system x and y origin points
		// updates filteredSelectedWidgets with their new positions (if they changed)
		// return values, because state change will only happen in next render
		// therefore states are the old one in this function context

		// if (coorOriginX === undefined && coorOriginY === undefined) {
		// 	alert('You must first setup the Matrix X-Axis, before you can sort the Matrix');
		// 	return;
		// }

		if (selectedWidgetsWithNumericTag) {
			const [coorOriginX, coorOriginY] = (await sortByXAxis(false, true, false)) as [
				number,
				number,
				Array<StickyNote | Card | Frame>,
				boolean
			];

			const selectedWidgetsSortedByNumericTag: NumericTaggedWidget[] =
				sortWidgetsOnYAxisByNumericTag(selectedWidgetsWithNumericTag as Array<NumericTaggedWidget>);

			// TODO: Search the moving on x-axis in alignWidgetsVerticallyByNumericTag
			const totalWidgetHeightAfterVerticalAlignmentWithNumericTag =
				await alignWidgetsVerticallyByNumericTag(selectedWidgetsSortedByNumericTag, coorOriginY!!);

			const [yAxisCoorOriginX, yAxisCoorOriginY] = await drawCoordinateSystemYAxis(
				coorOriginX!!,
				coorOriginY!!,
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag +
					additionalPaddingBetweenXAxisAndBottomMostWidget
			);

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

			// Update matrix coordinate system y origin position with new yAxisCoorOriginY position
			// x origin position should have changed -> therefore it stays the same
			setCoorOriginY(yAxisCoorOriginY);

			setTotalWidgetHeightAfterVerticalAlignmentWithNumericTag(
				totalWidgetHeightAfterVerticalAlignmentWithNumericTag +
					additionalPaddingBetweenXAxisAndBottomMostWidget
			);

			return true;
		} else {
			return false;
		}
	};

	const drawDebugDot = async (x: number, y: number, color: string = '#000000') => {
		await miro.board.createShape({
			shape: 'circle',
			x: x,
			y: y,
			height: 25,
			width: 25,
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
			content: `<p style="color: ${quarter.colorText};">${quarter.content}</p>`,
			style: {
				fillColor: quarter.color,
				textAlign: 'center',
				fontSize: 48,
				fontFamily: MATRIX_LABELS_FONT_FAMILY,
				borderOpacity: 0.2,
				borderWidth: 2,
			},
		});

		// move QuarterWidgets in the back, so they don't overflow MatrixWidgets
		// await miro.board.sendToBack(quarterWidget);

		return quarterWidget;
	};

	const showCategorizationOfMatrix = async () => {
		// for removing widgets, in case the widget does not exist anymore, use try and catch, to prevent crashing
		try {
			topLeftQuarter &&
				(await miro.board.getById(topLeftQuarter.id)) &&
				(await miro.board.remove(topLeftQuarter));
			topRightQuarter &&
				(await miro.board.getById(topRightQuarter.id)) &&
				(await miro.board.remove(topRightQuarter));
			bottomLeftQuarter &&
				(await miro.board.getById(bottomLeftQuarter.id)) &&
				(await miro.board.remove(bottomLeftQuarter));
			bottomRightQuarter &&
				(await miro.board.getById(bottomRightQuarter.id)) &&
				(await miro.board.remove(bottomRightQuarter));
		} catch {}

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
				colorText: MATRIX_QUARTER_CATEGORIES.TOP_LEFT.colorText,
				color: MATRIX_QUARTER_CATEGORIES.TOP_LEFT.color,
			};
			const topRightQuarterData: MatrixQuarterData = {
				centerPoint: {
					x: coorOriginX + totalWidgetWidth * 0.75,
					y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 4,
				},
				width: totalWidgetWidth / 2,
				height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
				content: 'Strategic',
				colorText: MATRIX_QUARTER_CATEGORIES.TOP_RIGHT.colorText,
				color: MATRIX_QUARTER_CATEGORIES.TOP_RIGHT.color,
			};
			const bottomLeftQuarterData: MatrixQuarterData = {
				centerPoint: {
					x: coorOriginX + totalWidgetWidth / 4,
					y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag * 0.75,
				},
				width: totalWidgetWidth / 2,
				height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
				content: 'Low Hanging Fruits',
				colorText: MATRIX_QUARTER_CATEGORIES.BOTTOM_LEFT.colorText,
				color: MATRIX_QUARTER_CATEGORIES.BOTTOM_LEFT.color,
			};
			const bottomRightQuarterData: MatrixQuarterData = {
				centerPoint: {
					x: coorOriginX + totalWidgetWidth * 0.75,
					y: coorOriginY + totalWidgetHeightAfterVerticalAlignmentWithNumericTag * 0.75,
				},
				width: totalWidgetWidth / 2,
				height: totalWidgetHeightAfterVerticalAlignmentWithNumericTag / 2,
				content: 'Focus',
				colorText: MATRIX_QUARTER_CATEGORIES.BOTTOM_RIGHT.colorText,
				color: MATRIX_QUARTER_CATEGORIES.BOTTOM_RIGHT.color,
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

			Promise.all(
				matrixWidgetSelection.map(async (widget) => {
					if (widget.type === 'frame') {
						const children = await widget.getChildren();
						const childrenWithZIndex = [];

						for (const child of children) {
							if (child.type === 'shape') {
								childrenWithZIndex.push({ zIndex: 0, widget: child });
							} else {
								childrenWithZIndex.push({ zIndex: 1, widget: child });
							}
						}

						childrenWithZIndex.sort((a, b) => a.zIndex - b.zIndex);

						for (const childWithIndex of childrenWithZIndex) {
							await miro.board.bringToFront(childWithIndex.widget);
						}
					} else {
						await miro.board.bringToFront(widget);
					}
				})
			);

			return true;
		} else {
			return false;
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
			const frameTextWidgets: Text[] = frameChildren.filter(
				(textWidget) => textWidget.type === 'text'
			) as Text[];
			// Text element with the smallest position y (highest text element) in frame,
			// is meant to be the title of the frame and will be shown in category list
			if (frameTextWidgets.length > 0) {
				const frameTitle = frameTextWidgets.reduce((prev, cur) =>
					cur.y < prev.y ? cur : prev
				).content;
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
				widget.y >=
					quarterDataList?.bottomLeft.centerPoint.y - quarterDataList.bottomLeft.height / 2 &&
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
				widget.y >=
					quarterDataList?.bottomRight.centerPoint.y - quarterDataList.bottomRight.height / 2 &&
				widget.y <=
					quarterDataList.bottomRight.centerPoint.y + quarterDataList.bottomRight.height / 2
			) {
				return MATRIX_QUARTER_CATEGORIES.BOTTOM_RIGHT;
			}
		}
		return undefined;
	};

	// ORDER:
	// 1. Fokus + 				high importance
	// 2. Fokus + 				low importance
	// 3. Strategic + 			high importance
	// 4. Strategic + 			low importance
	// 5. Low Hanging Fruits + 	high importance
	// 6. Low Hanging Fruits + 	low importance
	// 7. Luxury + 				high importance
	// 8. Luxury + 				low importance
	const createCategorizedList = async () => {
		if (coorOriginX && coorOriginY) {
			const allCardStickyNoteFrameWidgets = (await miro.board.get({
				type: ['card', 'sticky_note', 'frame'],
			})) as Array<Card | StickyNote | Frame>;
			const categoryListElementWidth = 1500;
			const paddingXBetweenMatrixAndCategoryList = 300;
			const paddingYBetweenCategoryListTitleAndCategoryList = 75;
			const categoryListPosX =
				coorOriginX +
				totalWidgetWidth +
				additionalAxisMatrixOverlapping +
				paddingXBetweenMatrixAndCategoryList;
			let categoryList: MatrixCategoryListElement[] = [];

			// Delete already existing categoryList and categoryListTitle before new list and title is created
			if (matrixCategoryListWidgets && matrixCategoryListWidgets.length !== 0) {
				Promise.all(
					matrixCategoryListWidgets.map(async (categoryListWidget) => {
						try {
							categoryListWidget && (await miro.board.remove(categoryListWidget));
						} catch {}
					})
				);
			}

			// TODO: UNDERSTAND WHY THIS DON'T WORK
			// TODO: THEN REMOVE CONSOLE.LOGS
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

			// sort asc according to x position (importance)
			categoryList.sort((a, b) => {
				return Math.abs(a.widgetPosX) - Math.abs(b.widgetPosX);
			});

			// sort according to prio (focus -> strategic - low hanging fruits - luxury)
			categoryList.sort((a, b) => b.category.prio - a.category.prio);

			// save widgets in array to set them as state to be able to delete them later on, when new list is created
			let categoryListWidgets: Array<Text | Shape> = [];

			// Categorized List Title
			const categorizedListTitle = await miro.board.createText({
				x: categoryListPosX + categoryListElementWidth / 2,
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
			const tableNumberCellWidth = 125;
			const tableCellHeight = 150;
			const tableTextCellWidth = categoryListElementWidth;
			const tableCellYGap = 25;

			Promise.all(
				categoryList.map(async (element, index) => {
					// CREATE TABLE CELL FOR THE NUMBER TEXT ELEMENT
					const tableNumberCell = await miro.board.createShape({
						shape: 'rectangle',
						// shape is drawn from the center point origin (origin: "center" as default value)
						x: categoryListPosX + tableNumberCellWidth / 2,
						y: coorOriginY,
						content: `<p><b>${index + 1}.</b></p>`,
						height: tableCellHeight,
						width: tableNumberCellWidth,
						style: {
							fillColor: '#ffffff',
							textAlign: 'center',
							fontSize: 72,
							borderOpacity: 0,
						},
					});

					// CREATE TABLE CELL FOR THE TEXT ELEMENT

					const tableTextCell = await miro.board.createShape({
						shape: 'rectangle',
						// shape is drawn from the center point origin (origin: "center" as default value)
						x: categoryListPosX + tableTextCellWidth / 2 + tableNumberCellWidth,
						y: coorOriginY,
						height: tableCellHeight,
						width: tableTextCellWidth,
						content: `<p style="color: ${MATRIX_PRIORITY_LIST_ITEMS_COLOR};">&nbsp;${element.text.replace(
							'<p>',
							''
						)}</p>`,
						style: {
							fontSize: 72,
							fillColor: element.category.color,
							fontFamily: MATRIX_LABELS_FONT_FAMILY,
							textAlign: 'left',
							borderOpacity: 0,
						},
					});

					// CREATE TEXT ELEMENT INSIDE TABLE CELL
					// const textWidget = await miro.board.createText({
					// 	x: categoryListPosX + tableNumberCellWidth + categoryListElementWidth / 2,
					// 	y: coorOriginY,
					// 	width: categoryListElementWidth,
					// 	// height is read-only, is calculated automatically based on content and font size
					// 	// element.text = "<p>...</p>" -> to add number in front without line break,"<p>" must be removed
					// 	content: `<p style="color: ${MATRIX_PRIORITY_LIST_ITEMS_COLOR};">${element.text.replace('<p>', '')}</p>`,
					// 	style: {
					// 		fontSize: 72,
					// 		fillColor: element.category.color,
					// 		fontFamily: MATRIX_LABELS_FONT_FAMILY,
					// 	},
					// });

					const updatedCategoryListElementHeight =
						coorOriginY +
						paddingYBetweenCategoryListTitleAndCategoryList +
						categorizedListTitle.height +
						tableCellHeight / 2 +
						tableCellHeight * index +
						tableCellYGap * index;

					tableNumberCell.y = updatedCategoryListElementHeight;
					tableTextCell.y = updatedCategoryListElementHeight;
					// textWidget.y = updatedCategoryListElementHeight;

					tableNumberCell.sync();
					tableTextCell.sync();
					// textWidget.sync();

					categoryListWidgets.push(tableNumberCell);
					categoryListWidgets.push(tableTextCell);
					// categoryListWidgets.push(textWidget);
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
			return true;
		} else {
			return false;
		}
	};

	const [resortByXAxisInSecondStep, setResortByXAxisInSecondStep] = useState(false);

	const moveStepBack = () => {
		if (step >= 0) setStep(step - 1);
	};

	const moveStepForward = () => {
		if (step < steps.length - 1) setStep(step + 1);
	};

	const onWizardStepButtonClicked = async () => {
		switch (step) {
			// "Group Selection" Step
			// always set the viewport
			// always don't group the widgets above (group them below)
			// always renew the selection
			case 0:
				// Clean the sessionStorage which is used,
				// because the miro estimation tool closes and reopens the app
				// which leads to a data lost without the usage of sessionStorage
				setMatrixWidgetSelection([]);
				const [, , , methodSucceedStepZero] = (await sortByXAxis(true, false, true)) as [
					number,
					number,
					Array<StickyNote | Card | Frame>,
					boolean
				];
				steps[step].methodSucceed = methodSucceedStepZero;
				break;
			case 1:
				if (resortByXAxisInSecondStep === false) setResortByXAxisInSecondStep(true);
				const [, , , methodSucceedStepOne] = (await sortByXAxis(true, true, false)) as [
					number,
					number,
					Array<StickyNote | Card | Frame>,
					boolean
				];
				steps[step].methodSucceed = methodSucceedStepOne;
				break;
			case 2:
				const methodSucceedStepTwo = await sortByYAxis();
				steps[step].methodSucceed = methodSucceedStepTwo;
				break;
			case 3:
				const methodSucceedThree = await showCategorizationOfMatrix();
				steps[step].methodSucceed = methodSucceedThree;
				break;
			case 4:
				const methodSucceedFour = await createCategorizedList();
				steps[step].methodSucceed = methodSucceedFour;
				break;
			default:
				break;
		}

		if (steps[step].methodSucceed) {
			moveStepForward();
		}
	};

	return (
		<div className={styles.wizard__container}>
			<div>
				<h1 className={styles.title}>Importance / Difficulty Matrix</h1>
				<Stepper
					activeStep={step}
					variant='outlined'>
					{steps.map((_stepItem, index) => {
						return (
							<Step key={index}>
								<StepButton
									onClick={() => {
										setStep(index);
									}}>
									<StepLabel
										key={index}
										icon={index + 1}
									/>
								</StepButton>
							</Step>
						);
					})}
				</Stepper>

				<h1 className={styles.wizard__title}>{steps[step].title}</h1>

				{steps[step].description && (
					<p className={styles.wizard__description}>{steps[step].description}</p>
				)}

				<ol className={styles.wizard__list}>
					{steps[step].steps.map((step) => (
						<li key={step}>{step}</li>
					))}
				</ol>

				<div className={styles.wizard__img}>{steps[step].img}</div>
			</div>
			<div className={styles.wizard__buttonAndHintWrapper}>
				<Button
					onClickFunction={onWizardStepButtonClicked}
					buttonText={steps[step].buttonText}
					buttonIcon={steps[step].buttonIcon}
				/>
				<div className={styles.wizard__stepper__button__container}>
					{step > 0 && (
						<Button
							onClickFunction={moveStepBack}
							buttonText={'Back'}
							buttonIcon={<ArrowLeft />}
							isLight={true}
						/>
					)}
					{step !== steps.length - 1 && (
						<Button
							onClickFunction={moveStepForward}
							buttonText={'Next Step'}
							buttonIcon={<ArrowRight />}
							isLight={true}
							isDisabled={steps[step].methodSucceed === false}
						/>
					)}
				</div>

				<WidgetDraggableCard
					thumbnail={specialCardThumbnail}
					title={'Draggable Special Card:'}
					createWidgetMethod={createMatrixCard}
				/>
				<div className={styles.wizard__hint}>
					{step > 0 && (
						<>
							<a
								className={styles.wizard__hintButton}
								onClick={() => {
									sessionStorage.clear();
									setStep(0);
								}}>
								{addNewTopicButtonText}
							</a>
							<a
								className={styles.wizard__hintButton}
								onClick={() => {
									clearSessionStorageAndStates();
									setStep(0);
								}}>
								{drawNewMatrixButtonText}
							</a>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
