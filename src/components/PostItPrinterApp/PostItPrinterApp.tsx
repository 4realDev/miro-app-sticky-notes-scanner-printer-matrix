// 1. VON BELIEBIGEM PC AUS (ORTSUNGEBUNDEN):
// Über POST request Möglichkeit, eine SVG Datei (von jedem PC oder Handy) an den Server zu senden
// (soll in einer Miro App realisiert werden -> JS)
// 2. VOM PC MIT DRUCKER (ORTSGEBUNDEN):
// Über POST request Möglichkeit IP Addresse des PC's mit Drucker anzugeben,
// sodass Server dem PC mit Drucker alle SVG's als POST request weiterleitet,
// die über einen POST request an den Server gesendet werden
// 3. PC mit Drucker reagiert auf POST requests von Server, indem dieser alle SVG Dateien die gesendet werden,
// mit Hilfe des über USB angeschlossenen Druckers ausdruckt

import React, { useEffect, useState } from 'react';
import {
	NotificationType,
	SelectionUpdateEvent,
	StickyNote,
	StickyNoteColor,
} from '@mirohq/websdk-types';
import styles from './PostItPrinterApp.module.scss';
import Button from '../ui/Button/Button';
import Printer from '../Icons/Printer';
import StickyNotePreviewSlider from './StickyNotePreviewSlider/StickyNotePreviewSlider';
import { elementToSVG } from 'dom-to-svg';

type StickyNoteDataObj = {
	id: string;
	base64Url: string;
	color: StickyNoteColor | `${StickyNoteColor}`;
	xpos: number;
	ypos: number;
};

type StickyNoteTransferedDataObj = {
	stickyNoteDataList: StickyNoteDataObj[];
	miroBoardId: string;
};

const PostItPrinterApp = () => {
	const [stickyNoteSliderImages, setStickyNoteSliderImages] = useState<
		Array<{ img: string; id: string }>
	>([]);
	const stickyNotePostItWidth = 305;

	// TODO: Extract in utility class
	const sendNotification = async (notification: string) => {
		// Display the notification on the board UI.
		await miro.board.notifications.show({ message: notification, type: NotificationType.Error });
	};

	const convertStickyNoteSVGStringToStickyNotePNGBase64URL = async (
		svgString: string,
		imgWidth: number,
		imgHeight: number
	): Promise<string> => {
		const img = new Image();
		img.setAttribute(
			'src',
			'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)))
		);

		// 4. Create Canvas with the height and width from the svg for temporarily use
		var canvas = document.createElement('canvas');
		canvas.width = imgWidth;
		canvas.height = imgHeight;
		var ctx = canvas.getContext('2d');

		// 5. Create new image
		// Set the src of the image to the svgUrl (onload() is called)
		// Draw the image with the svgUrl onto the canvas
		// Revoke the svgUrl and call toDataURL() on the canvas with the drawn svg (image)
		// to get the url of the base64 representation from the drawn svg image
		// Wrap everything in a promise, so it can be resolved
		// with the dataUrl of the final representation of the canvas with the svg as image inside
		// const img = new Image();

		// when the image is loaded we can get it as base64 url
		const imgPromise = new Promise<string>((resolve, reject) => {
			img.onload = () => {
				// draw it to the canvas
				ctx && ctx.drawImage(img, 0, 0);

				// now we can resolve the promise, passing the base64 url
				resolve(canvas.toDataURL('image/png'));
			};
			img.onerror = reject;
		});

		const imgUrl = await imgPromise;

		return imgUrl;
	};

	const calculateFontSize = (
		font_size: number,
		innerBox: HTMLElement,
		iconSvgSize: number
	): (() => number) | number => {
		innerBox.style.fontSize = `${font_size}px`;
		const block_inner_width = innerBox.clientWidth;
		const block_inner_height = innerBox.clientHeight;

		if (block_inner_height > iconSvgSize || iconSvgSize < block_inner_width) {
			font_size = font_size * 0.9;
			return calculateFontSize(font_size, innerBox, iconSvgSize);
		} else {
			return font_size;
		}
	};

	const convertStickyNoteDataToStickyNoteSVGString = (
		stickyNote: StickyNote,
		forDrawingOnScreen = false
	) => {
		const outerBoxBackground =
			forDrawingOnScreen === false
				? 'white'
				: mapStickyNoteColorToPrintColor(stickyNote.style.fillColor, true);
		const outerBoxTransform = forDrawingOnScreen === false ? 'rotate(90 0 0)' : 'none';
		const outerBox = document.createElement('div');
		outerBox.setAttribute(
			'style',
			`
			height: ${stickyNotePostItWidth}px;
			width: ${stickyNotePostItWidth}px;
			display: flex;
			justify-content: center;
			align-items: center;
			background: ${outerBoxBackground};
			`
		);

		const innerBox = document.createElement('div');
		innerBox.setAttribute(
			'style',
			`
			font-size: ${stickyNotePostItWidth};
			font-family: sans-serif;
			font-weight: bold;
			text-align: center;
			line-height: 1.5;
			margin-bottom: 10px; /* quickfix to vertical align the text because of default offset */
			padding: 32px;
		
			word-wrap: break-word;      /* IE 5.5-7 */
			white-space: -moz-pre-wrap; /* Firefox 1.0-2.0 */
			white-space: pre-wrap;      /* current browsers */
			`
		);

		innerBox.textContent = stickyNote.content
			.replaceAll('<p>', '')
			.replaceAll('</p>', '')
			.replaceAll('<br>', '\n');

		outerBox.appendChild(innerBox);

		// Add the html to the body to make it visible
		document.body.appendChild(outerBox);

		const startFont = stickyNotePostItWidth;
		calculateFontSize(startFont, innerBox, stickyNotePostItWidth);

		// uses following library https://www.npmjs.com/package/dom-to-svg?activeTab=readme
		const svgDocument = elementToSVG(outerBox);
		const svgString = new XMLSerializer().serializeToString(svgDocument);

		// TODO: FIND OUT WHY ERROR
		// -> Uncaught (in promise) DOMException: Node.removeChild: The node to be removed is not a child of this node occures
		// Remove the html from the body to keep the dom tree clean
		document.body.removeChild(outerBox);

		return svgString;
	};

	const mapStickyNoteColorToPrintColor = (
		stickyNoteColor: StickyNoteColor | `${StickyNoteColor}`,
		forDrawingOnScreen = false
	) => {
		if (
			stickyNoteColor === StickyNoteColor.LightYellow ||
			stickyNoteColor === StickyNoteColor.Yellow ||
			stickyNoteColor === StickyNoteColor.LightGreen ||
			stickyNoteColor === StickyNoteColor.Green ||
			stickyNoteColor === StickyNoteColor.DarkGreen
		) {
			return forDrawingOnScreen === false ? 'yellow' : '#F8F1B9';
		} else if (
			stickyNoteColor === StickyNoteColor.LightBlue ||
			stickyNoteColor === StickyNoteColor.Blue ||
			stickyNoteColor === StickyNoteColor.DarkBlue ||
			stickyNoteColor === StickyNoteColor.Cyan
		) {
			return forDrawingOnScreen === false ? 'blue' : '#CDE4F1';
		} else if (
			stickyNoteColor === StickyNoteColor.LightPink ||
			stickyNoteColor === StickyNoteColor.Pink ||
			stickyNoteColor === StickyNoteColor.Violet ||
			stickyNoteColor === StickyNoteColor.Red ||
			stickyNoteColor === StickyNoteColor.Orange ||
			stickyNoteColor === StickyNoteColor.Gray ||
			stickyNoteColor === StickyNoteColor.Black
		) {
			return forDrawingOnScreen === false ? 'pink' : '#F5D7D7';
		} else {
			return forDrawingOnScreen === false ? 'yellow' : '#F8F1B9';
		}
	};

	const connectToWebSocketAndSendPrintingData = (data: StickyNoteTransferedDataObj) => {
		console.log('Client starts connection to websocket server! (Consumer)');
		// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
		const websocket = new WebSocket('wss://toolbox-toolbox-printing-server.gke.cando-image.com');

		// Connection opened
		websocket.addEventListener('open', () => {
			console.log('Client has connected to websocket server! (Consumer)');
			// as soon as connection is opened, send the printing data obj
			websocket.send(JSON.stringify(data));
			alert('We have sent your printing job.');
		});

		// Listen for messages
		websocket.addEventListener('message', (event) => {
			console.log(`Server has send data to the Client: ${event.data}.`);
			// Data is printing feedback forwarded from Provider - Show feedback to user
			// disconnect client, when feedback has been received
			websocket.close();
		});
	};

	const startPrintJob = async () => {
		const selectedWidgets = await miro.board.getSelection();
		const selectedStickyNotes = selectedWidgets.filter(
			(selectedWidget) => selectedWidget.type === 'sticky_note'
		) as Array<StickyNote>;

		if (selectedStickyNotes.length === 0) {
			sendNotification('Please select all sticky notes you want to print.');
			return;
		}

		let stickyNoteDataList: StickyNoteDataObj[] = [];
		const miroBoardInfo = await miro.board.getInfo();
		const miroBoardId = miroBoardInfo.id;

		for await (const selectedStickyNote of selectedStickyNotes) {
			const iconSvgString = convertStickyNoteDataToStickyNoteSVGString(selectedStickyNote);
			const imgBase64Url = await convertStickyNoteSVGStringToStickyNotePNGBase64URL(
				iconSvgString,
				stickyNotePostItWidth,
				stickyNotePostItWidth
			);
			const imgStickyNotePrintColor = mapStickyNoteColorToPrintColor(
				selectedStickyNote.style.fillColor
			);
			const fileName = Date.now().toString();

			stickyNoteDataList.push({
				id: fileName,
				base64Url: imgBase64Url,
				color: imgStickyNotePrintColor as StickyNoteColor,
				xpos: Math.round(selectedStickyNote.x),
				ypos: Math.round(selectedStickyNote.y),
			});
		}

		connectToWebSocketAndSendPrintingData({
			stickyNoteDataList: stickyNoteDataList,
			miroBoardId: miroBoardId,
		});
	};

	// component is called multiple times
	// to unsure only one creation of the event, register event in useEffect
	// and unregister event, when component unmounts
	useEffect(() => {
		const setInitialSelection = async () => {
			const initialSelection = await miro.board.getSelection();
			const filteredInitialSelection = initialSelection.filter(
				(item) => item.type === 'sticky_note'
			) as Array<StickyNote>;
			updateStickyNoteImageSliderChildren(filteredInitialSelection);
		};

		setInitialSelection();

		const onSelectionUpdate = (event: SelectionUpdateEvent) => {
			// TODO: Maybe make selectedItems to a global state
			// Filter sticky notes from the selected items
			const selectedItems = event.items;
			const stickyNotes = selectedItems.filter(
				(item) => item.type === 'sticky_note'
			) as Array<StickyNote>;
			updateStickyNoteImageSliderChildren(stickyNotes);
		};

		// register the miro 'selection:update' event to store the current user selection inside the selectedStickyNotes state
		miro.board.ui.on('selection:update', onSelectionUpdate);

		// unregister the miro 'selection:update' event when the component unmounts
		return () => {
			miro.board.ui.off('selection:update', onSelectionUpdate);
		};
	}, []);

	const updateStickyNoteImageSliderChildren = async (selectedStickyNotes: Array<StickyNote>) => {
		// if some selected sticky note (yet) does not exist in the image slider children
		// draw it inside the image slider DOM

		const stateArrayCopy = [...stickyNoteSliderImages]; // make a separate copy of the array

		for (const sticky of selectedStickyNotes) {
			const selectedSliderChild = stickyNoteSliderImages.find((child) => child.id === sticky.id);
			if (!selectedSliderChild) {
				const iconSvgString = convertStickyNoteDataToStickyNoteSVGString(sticky, true);
				const imgBase64Url = await convertStickyNoteSVGStringToStickyNotePNGBase64URL(
					iconSvgString,
					stickyNotePostItWidth,
					stickyNotePostItWidth
				);

				stateArrayCopy.push({ img: imgBase64Url, id: sticky.id });
			}
		}

		// some child inside the image slider does not exist (anymore) in the newest selection
		// remove the child from the image slider
		stickyNoteSliderImages.forEach((img) => {
			if (
				selectedStickyNotes.some((selectedStickyNote) => selectedStickyNote.id === img.id) === false
			) {
				var index = stateArrayCopy.indexOf(img);
				if (index !== -1) {
					stateArrayCopy.splice(index, 1);
				}
				// stickyNoteSliderImages.reduce(child, 0)
				// child.remove();
			}
		});

		setStickyNoteSliderImages(stateArrayCopy);
	};

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Sticky Note Printer</h1>
			<p className={styles.descriptionText}>Select one or more sticky notes and press “Print”.</p>
			<h1 className={styles.previewTitle}>Preview:</h1>

			<StickyNotePreviewSlider
				stickyNoteSliderImages={stickyNoteSliderImages}
				setStickyNotesSliderImages={setStickyNoteSliderImages}
			/>
			<Button
				onClickFunction={startPrintJob}
				buttonIcon={<Printer />}
				buttonText={'Print'}
				isDisabled={stickyNoteSliderImages.length === 0}
			/>
		</div>
	);
};

export default PostItPrinterApp;
