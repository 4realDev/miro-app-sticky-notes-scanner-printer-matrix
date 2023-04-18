// 1. VON BELIEBIGEM PC AUS (ORTSUNGEBUNDEN):
// Über POST request Möglichkeit, eine SVG Datei (von jedem PC oder Handy) an den Server zu senden
// (soll in einer Miro App realisiert werden -> JS)
// 2. VOM PC MIT DRUCKER (ORTSGEBUNDEN):
// Über POST request Möglichkeit IP Addresse des PC's mit Drucker anzugeben,
// sodass Server dem PC mit Drucker alle SVG's als POST request weiterleitet,
// die über einen POST request an den Server gesendet werden
// 3. PC mit Drucker reagiert auf POST requests von Server, indem dieser alle SVG Dateien die gesendet werden,
// mit Hilfe des über USB angeschlossenen Druckers ausdruckt

// npm i @tensorflow/tfjs -> https://www.npmjs.com/package/@tensorflow/tfjs
import * as tf from '@tensorflow/tfjs';

import React, { useEffect, useState } from 'react';
import { drawRect, detectObjects } from './utilities';

import { NotificationType, SelectionUpdateEvent, StickyNote, StickyNoteColor } from '@mirohq/websdk-types';
import styles from './PostItPrinterApp.module.scss';
import Button from '../ui/Button/Button';
import Printer from '../Icons/Printer';
import StickyNotePreviewSlider from './StickyNotePreviewSlider/StickyNotePreviewSlider';

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
	const [stickyNoteSliderImages, setStickyNoteSliderImages] = useState<Array<{ img: string; id: string }>>([]);
	const stickyNotePostItWidth = 305;

	// TODO: Extract in unility class
	const sendNotification = async (notification: string) => {
		// Display the notification on the board UI.
		await miro.board.notifications.show({ message: notification, type: NotificationType.Error });
	};

	const convertStickyNoteSVGToStickyNotePNG = async (
		iconSvg: SVGSVGElement,
		imgWidth: number,
		imgHeight: number
	): Promise<string> => {
		// const xmlSerializer = new XMLSerializer();
		// let _svgStr = xmlSerializer.serializeToString(iconSvg);
		// // const imgg = document.createElement('img');
		// const imgg = new Image();
		// console.log(window.btoa(unescape(encodeURIComponent(_svgStr))));
		// imgg.setAttribute('src', 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(_svgStr))));
		// console.log(imgg);
		// var canvas = document.createElement('canvas');
		// canvas.width = imgWidth;
		// canvas.height = imgHeight;
		// var ctx = canvas.getContext('2d');
		// ctx && ctx.drawImage(imgg, 0, 0);
		// console.log(canvas);
		// console.log(ctx);
		// return canvas.toDataURL('image/png', 1.0);

		// solution without third party libry
		// canvg - doesn't support all of SVG capabilities
		// D3 or other libraries - often something other doesn't work (e.g. textPath)

		// 1. Get the DOM URL for the specific browser
		// Dom has API method to create an object - createObjectURL(svgtext)
		// API differs from browser to browser, but here's how to find it
		// const domUrl = window.URL || window.webkitURL || window;
		// if (!domUrl) {
		// 	throw new Error('(browser doesnt support this)');
		// }

		// // 2. Create Blob object from svg outHTML data
		// let svgText = iconSvg.outerHTML;
		// const svg = new Blob([svgText], {
		// 	type: 'image/svg+xml;charset=utf-8',
		// });

		// // 3. Use the Blob object to create an objectURL inside the dom URL
		// const svgUrl = domUrl.createObjectURL(svg);

		const xmlSerializer = new XMLSerializer();
		let _svgStr = xmlSerializer.serializeToString(iconSvg);
		// const imgg = document.createElement('img');
		const img = new Image();
		console.log(window.btoa(unescape(encodeURIComponent(_svgStr))));
		img.setAttribute('src', 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(_svgStr))));

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

				// we don't need the original any more
				// domUrl.revokeObjectURL(svgUrl);

				// now we can resolve the promise, passing the base64 url
				resolve(canvas.toDataURL('image/png'));
			};
			img.onerror = reject;
		});

		// load the image -> calls the onload() method
		// img.src = svgUrl;

		const imgUrl = await imgPromise;

		return imgUrl;
	};

	const calculateFontSize = (startFontSize: number, longestRow: string, context: CanvasRenderingContext2D) => {
		let maxTextWidth = 80;
		let updatedFontSize = startFontSize;
		let fontArgs = context!!.font.split(' ');
		let newSize = `${startFontSize}px`;
		context!!.font = newSize + ' ' + fontArgs[fontArgs.length - 1]; /// using the last part

		let metrics = context!!.measureText(longestRow);
		let longestRowWidth = metrics.width;
		console.log('longestRow Width:', longestRowWidth);

		while (metrics.width > maxTextWidth) {
			updatedFontSize = updatedFontSize - 1;

			fontArgs = context!!.font.split(' ');
			// console.log(`${updatedFontSize}px` + ' ' + fontArgs[fontArgs.length - 1]);
			context!!.font = `${updatedFontSize}px` + ' ' + fontArgs[fontArgs.length - 1]; /// using the last part
			metrics = metrics = context!!.measureText(longestRow);
		}
		return updatedFontSize;
	};

	const convertStickyNoteDataToStickyNoteSVG = (stickyNote: StickyNote, forDrawingOnScreen = false) => {
		const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		// CREATE SVG
		const iconSvgSize = stickyNotePostItWidth;

		iconSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		iconSvg.setAttribute('height', iconSvgSize.toString());
		iconSvg.setAttribute('width', iconSvgSize.toString());

		forDrawingOnScreen === false
			? iconSvg.setAttribute('style', 'background: white')
			: iconSvg.setAttribute(
					'style',
					`background: ${mapStickyNoteColorToPrintColor(stickyNote.style.fillColor, true)}`
			  );

		forDrawingOnScreen === false && iconSvg.setAttribute('transform', 'rotate(90 0 0)');

		// CREATE SVG RECT
		// const iconRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		// // #9cbbc4 - blue
		// // #ddb0ad - pink
		// // #f8ec86 - yellow
		// forDrawingOnScreen === false
		// 	? iconRect.setAttribute('fill', 'white')
		// 	: iconRect.setAttribute('fill', mapStickyNoteColorToPrintColor(stickyNote.style.fillColor, true));
		// iconRect.setAttribute('height', iconSvgSize.toString());
		// iconRect.setAttribute('width', iconSvgSize.toString());
		// iconRect.setAttribute('x', '0');
		// iconRect.setAttribute('y', '0');
		// iconSvg.appendChild(iconRect);

		if (stickyNote.content.length > 0) {
			var foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
			foreignObject.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			foreignObject.setAttribute('height', iconSvgSize.toString());
			foreignObject.setAttribute('width', iconSvgSize.toString());
			foreignObject.setAttribute('font-size', '12');
			foreignObject.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
			foreignObject.setAttribute('font-weight', 'bold');

			// foreignObject.setAttribute('width', '100');
			// foreignObject.setAttribute('height', '100');
			// foreignObject.setAttribute('text-anchor', 'middle');
			// foreignObject.setAttribute('dominant-baseline', 'middle');
			// foreignObject.setAttribute('x', '50%');
			// foreignObject.setAttribute('y', '50%');
			// foreignObject.setAttribute('style', 'overflow-wrap: break-word;');

			// foreignObject.setAttribute('x', iconSvgPadding.toString());
			// foreignObject.setAttribute('y', iconSvgPadding.toString());
			// foreignObject.setAttribute('height', (iconSvgSize - iconSvgPadding * 2).toString());
			// foreignObject.setAttribute('width', (iconSvgSize - iconSvgPadding * 2).toString());

			const iconTextContainer = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			iconTextContainer.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
			iconTextContainer.setAttribute('height', iconSvgSize.toString());
			iconTextContainer.setAttribute('width', iconSvgSize.toString());
			// iconTextContainer.setAttribute('fill', 'black');
			// iconTextContainer.setAttribute('font-size', '2');
			iconTextContainer.setAttribute(
				'style',
				`height: ${iconSvgSize}px;
				width: ${iconSvgSize}px;
				display: flex;
				justify-content: center;
				align-items: center;`
			);

			const iconText = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			iconText.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
			// iconText.setAttribute('height', iconSvgSize.toString());
			// iconText.setAttribute('width', iconSvgSize.toString());
			iconText.setAttribute(
				'style',
				`height: calc(100% - 16px);
				width: calc(100% - 16px);
				display: flex;
				justify-content: center;
				align-items: center;
				text-align: center;
				overflow-wrap: break-word;
				flex-direction: column;`
			);

			const regexp = new RegExp('(?<=<s*p[^>]*>)(.*?)(?=<s*/s*p>)', 'g');
			let textContentRows = [...stickyNote.content.matchAll(regexp)].map(
				(textContentRow) => textContentRow[1]
			) as unknown as Array<string>;

			if (textContentRows.length > 0) {
				textContentRows.forEach((row) => {
					const iconTextSpan = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
					iconTextSpan.textContent = row;
					iconText.appendChild(iconTextSpan);
				});

				const longestRow = textContentRows.reduce((prev, cur) => {
					return cur.length > prev.length ? cur : prev;
				});

				// re-use canvas object for better performance
				// const canvas = document.createElement('canvas');
				// const context = canvas.getContext('2d');
				// context!!.font = '12';
				// const metrics = context!!.measureText(longestRow);
				// console.log(metrics.width);

				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');
				let calculatedfontSize = 44;

				if (context) {
					switch (textContentRows.length) {
						case 1:
							calculatedfontSize = calculateFontSize(44, longestRow, context);
							break;
						case 2:
							calculatedfontSize = calculateFontSize(36, longestRow, context);
							break;
						case 3:
							calculatedfontSize = calculateFontSize(28, longestRow, context);
							break;
						case 4:
							calculatedfontSize = calculateFontSize(20, longestRow, context);
							break;
						case 5:
							calculatedfontSize = calculateFontSize(16, longestRow, context);
							break;
						case 6:
							calculatedfontSize = calculateFontSize(14, longestRow, context);
							break;
						case 7:
							console.log('YES');
							calculatedfontSize = calculateFontSize(12, longestRow, context);
							break;
						default:
							calculatedfontSize = calculateFontSize(10, longestRow, context);
							break;
					}
					// TODO: Play with factor
					foreignObject.setAttribute('font-size', (calculatedfontSize * 2.8).toString());
				}
			}

			// foreignObject.setAttribute('font-size', .toString());

			// for (var i = 0; i < textContentRows.length; i++) {
			// 	const iconTextSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
			// 	if (i !== 0) iconTextSpan.setAttribute('dy', `${1.2 * i}em`);
			// 	// iconTextSpan.setAttribute('x', '50%');
			// 	iconTextSpan.textContent = textContentRows[i];
			// 	iconText.appendChild(iconTextSpan);
			// 	// iconText.appendChild(document.createTextNode(textContentRows[i]));
			// 	// iconText.appendChild(b);
			// }

			// iconText.textContent = stickyNote.content;
			// let stickyNoteText = stickyNote.content.replace('</p>', '<br/>');
			// stickyNoteText = stickyNoteText.replace('<p>', '');
			// iconText.textContent = 'test \n test';
			// const textContent = document.createTextNode('Test \n \n \r\n Test');
			// iconText.innerHTML = 'Test test <br/> Test test';

			iconSvg.appendChild(foreignObject);
			iconTextContainer.appendChild(iconText);
			// iconText.appendChild(textContent);
			foreignObject.appendChild(iconTextContainer);
		}

		return iconSvg;

		// CREATE SVG TEXT
		if (stickyNote.content.length > 0) {
			const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			iconText.setAttribute('fill', 'black');
			iconText.setAttribute('text-anchor', 'middle');
			iconText.setAttribute('dominant-baseline', 'middle');
			iconText.setAttribute('x', '50%');
			iconText.setAttribute('y', '50%');
			// iconText.setAttribute('height', iconSvgSize.toString());
			// iconText.setAttribute('width', iconSvgSize.toString());
			iconText.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
			iconText.setAttribute('font-weight', 'bold');

			// GET ALL ROWS IN ARRAY
			const regexp = new RegExp('(?<=<s*p[^>]*>)(.*?)(?=<s*/s*p>)', 'g');
			let textContentRows = [...stickyNote.content.matchAll(regexp)].map(
				(textContentRow) => textContentRow[1]
			) as unknown as Array<string>;

			// GET LONGEST ROW
			const longestRow = textContentRows.reduce((prev, cur) => {
				return cur.length > prev.length ? cur : prev;
			});
			console.log('longest row', longestRow);

			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const longestRowText = ctx!!.measureText('iiiiiiiii');
			const longestRowWidth = longestRowText.width;
			console.log(longestRowWidth);

			let charNumDependentFontSize = 28;
			// if (longestRowWidth < 27) {
			// 	charNumDependentFontSize = 64;
			// } else if (longestRowWidth > 27) {
			// 	charNumDependentFontSize = 48;
			// }

			// // GET NUM OF CHARACTER IN LONGEST ROW
			// const maxCharacterCount = longestRow.length;

			// // ADJUST FONT SIZE OF TEXT ACCORDING TO NUMBER OF ROWS AND TO LONGEST ROW
			// let charNumDependentFontSize = 0;

			// if (textContentRows.length === 1 && maxCharacterCount > 16) {
			// 	textContentRows = splitTextInMultipleRows(textContentRows);
			// 	charNumDependentFontSize = 10;
			// } else {
			// 	charNumDependentFontSize = calculateStickyNoteFontSize(maxCharacterCount, textContentRows);
			// }

			// CREATE SVG TEXT SPAN FOR EACH ROW
			textContentRows.forEach((textContentRow, index) => {
				const iconTextSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				if (index !== 0) iconTextSpan.setAttribute('dy', '1.2em');
				iconTextSpan.setAttribute('x', '50%');
				iconTextSpan.textContent = textContentRow;
				iconText.appendChild(iconTextSpan);
			});

			// ADJUST Y POSITION OF TEXT ACCORDING TO NUMBER OF ROWS
			iconText.setAttribute('dy', `${(-1.2 * (textContentRows.length - 1)) / 2}em`);
			iconText.setAttribute('font-size', `${charNumDependentFontSize}`);
			iconSvg.appendChild(iconText);
		}

		return iconSvg;
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
			const iconSvg = convertStickyNoteDataToStickyNoteSVG(selectedStickyNote);
			const imgBase64Url: string = await convertStickyNoteSVGToStickyNotePNG(
				iconSvg,
				stickyNotePostItWidth,
				stickyNotePostItWidth
			);
			// var s = new XMLSerializer().serializeToString(iconSvg);
			// var encodedData = window.btoa(unescape(encodeURIComponent(s)));
			// var imgBase64Url = 'data:image/svg+xml;base64,' + encodedData;
			// console.log(imgBase64Url);
			const imgStickyNotePrintColor = mapStickyNoteColorToPrintColor(selectedStickyNote.style.fillColor);
			const fileName = Date.now().toString();

			// downloadStickyNotePNG(imgBase64Url, fileName); // TODO: CAN BE REMOVED AFTERWARDS (DOWNLOAD IS NOT NECESSARY)

			stickyNoteDataList.push({
				id: fileName,
				base64Url: imgBase64Url,
				color: imgStickyNotePrintColor,
				xpos: Math.round(selectedStickyNote.x),
				ypos: Math.round(selectedStickyNote.y),
			});
		}

		connectToWebSocketAndSendPrintingData({ stickyNoteDataList: stickyNoteDataList, miroBoardId: miroBoardId });
	};

	// TODO: ADD TO CHEAT SHEET
	// HOW TO EVENTLISTENER WITH USEEFFECT
	// COMPONENT IS CALLED MULTIPLE TIMES
	// MAKE SURE TO REGISTER EVENTS ONCE IN USEEFFECT (onMount) or in USEMEMO (variable change)
	// mount

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
			const stickyNotes = selectedItems.filter((item) => item.type === 'sticky_note') as Array<StickyNote>;
			updateStickyNoteImageSliderChildren(stickyNotes);
		};

		// register the miro 'selection:update' event to store the current user selection inside the selectedStickyNotes state
		miro.board.ui.on('selection:update', onSelectionUpdate);

		// like unmount
		return () => {
			miro.board.ui.off('selection:update', onSelectionUpdate);
		};
	}, []);

	const updateStickyNoteImageSliderChildren = async (selectedStickyNotes: Array<StickyNote>) => {
		// if some selected sticky note (yet) does not exist in the image slider children
		// draw it inside the image slider DOM

		const stateArrayCopy = [...stickyNoteSliderImages]; // make a separate copy of the array

		for (const sticky of selectedStickyNotes) {
			// selectedStickyNotes.forEach((sticky) => {
			console.log(sticky.id);
			console.log(stickyNoteSliderImages);
			const selectedSliderChild = stickyNoteSliderImages.find((child) => child.id === sticky.id);
			if (!selectedSliderChild) {
				// drawSticky(sticky);
				const iconSvg = convertStickyNoteDataToStickyNoteSVG(sticky, true);
				const imgBase64Url: string = await convertStickyNoteSVGToStickyNotePNG(
					iconSvg,
					stickyNotePostItWidth,
					stickyNotePostItWidth
				);
				// var s = new XMLSerializer().serializeToString(iconSvg);
				// var encodedData = window.btoa(unescape(encodeURIComponent(s)));
				// var imgBase64Url = 'data:image/svg+xml;base64,' + encodedData;
				// console.log(imgBase64Url);
				// console.log(imgBase64Url);
				stateArrayCopy.push({ img: imgBase64Url, id: sticky.id });
			}
		}

		// some child inside the image slider does not exist (anymore) in the newest selection
		// remove the child from the image slider
		stickyNoteSliderImages.forEach((img) => {
			if (selectedStickyNotes.some((selectedStickyNote) => selectedStickyNote.id === img.id) === false) {
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

	// !!! STICKY NOTE SCANNING INSIDE MIRO TEST !!!
	const downloadStickyNotePNG = (base64Url: string, fileName: string) => {
		var downloadLink = document.createElement('a');
		downloadLink.href = base64Url;
		downloadLink.download = fileName;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
	};

	const [myNet, setMyNet] = useState<undefined | any>(undefined);
	const [startCapture, setStartCapture] = useState(false);
	const [myCanvas, setCanvas] = useState<undefined | HTMLCanvasElement>(undefined);
	const [myVideo, setVideo] = useState<undefined | HTMLVideoElement>(undefined);

	useEffect(() => {
		const test = async () => {
			const net = await tf.loadGraphModel(
				// 'https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json'
				'https://brazhnik.de/miro-app-poc-testing/tfod-model/model.json'
			);
			setMyNet(net);
		};
		test();
	}, []);

	const cropImage = async (base64Url: string, newX: number, newY: number, newWidth: number, newHeight: number) => {
		const img = new Image();
		img.setAttribute('src', base64Url);

		var canvas = document.createElement('canvas');
		canvas.width = newWidth;
		canvas.height = newHeight;
		var ctx = canvas.getContext('2d');

		// when the image is loaded we can get it as base64 url
		const imgPromise = new Promise<string>((resolve, reject) => {
			img.onload = () => {
				// draw it to the canvas
				ctx && ctx.drawImage(img, newX, newY, newWidth, newHeight, 0, 0, newWidth, newHeight);

				// we don't need the original any more
				// domUrl.revokeObjectURL(svgUrl);

				// now we can resolve the promise, passing the base64 url
				// resolve(canvas.toDataURL('image/png'));
				resolve(canvas.toDataURL());
			};
			img.onerror = reject;
		});

		const imgUrl = await imgPromise;
		console.log('imgUrl', imgUrl);

		return imgUrl;
	};

	const capture = async () => {
		try {
			if (startCapture === false) {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				setStartCapture(true);
				// asking permission to use a media input to record current tab
				const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
				const video = document.createElement('video');
				video.addEventListener('loadedmetadata', () => {
					// passing video width & height as canvas width & height
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;

					// playing the video so the drawn image won't be black or blank
					video.play();
					ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

					// terminating first video track of the stream
					// stream.getVideoTracks()[0].stop();
					document.body.appendChild(canvas);
					setCanvas(canvas);
					setVideo(video);
					// downloadStickyNotePNG(canvas!!.toDataURL(), 'YEAH');
				});
				// passing capture stream data as video source object
				video.srcObject = stream;
			} else {
				// additional check to deal with error occuring while changing camera facingMode
				// reason: Tensorflow.js tries to transform video into tensor via tf.browser.fromPixels and reads width and height from video DOM element
				// since width and height are 0 at the moment of changing facingMode, an error is received -> "Error: Requested texture size [0x0] is invalid."
				if (myVideo === undefined || myCanvas === undefined) return;
				const myCanvasContext = myCanvas.getContext('2d');
				if (myCanvasContext === null) return;

				// MAKE DETECTIONS
				// convert webcam feed to a number of pixels
				const img = tf.browser.fromPixels(myVideo);
				// resize img to fixed size of the webcam feed
				// const resized = tf.image.resizeBilinear(img, [640, 480]);
				const resized = tf.image.resizeBilinear(img, [myVideo.videoWidth, myVideo.videoHeight]);
				// cast resized img into int32 to make model perform little bit better
				const casted = resized.cast('int32');
				// put resized,casted img into another set of arrays -> how tensorflow model expects the feed
				const expanded = casted.expandDims(0);

				// using the network which is loaded server
				// we use the executeAsync method and pass the pre-processed image to get as the result some detection inside the obj variable
				// detection results of the pre-processed img (expand) from the model
				const obj = await myNet.executeAsync(expanded);

				// ADJUST obj[x] AFTER EVERY NEW MODEL UPLOAD!
				// post-processed boxes, classes, indexes, non-post-processed boxes, confidence scores, counter of detected objects

				// obj[1] represents different bounding boxes [y, x, width, height]
				const boxes = await obj[4].array();
				// // obj[4] represents classes ["ThumbsUp", ThumbsDown", "ThankYou", "LiveLong"]
				const classes = await obj[2].array();
				// // obj[2] represents scores - how confident net is, that what's been detected is accurate
				const scores = await obj[6].array();

				// console.log('obj[0]', obj[0].array());
				// console.log('obj[1]', obj[1].array());
				// console.log('obj[2]', obj[2].array());
				// console.log('obj[3]', obj[3].array());
				// console.log('obj[4]', obj[4].array());
				// console.log('obj[5]', obj[5].array());
				// console.log('obj[6]', obj[6].array());
				// console.log('obj[7]', obj[7].array());

				const boundingBoxLineWidth = 4;
				const recognitionThreshold = 0.9;

				// draw the image first, so the rect can be drawn over it
				myCanvasContext.drawImage(myVideo, 0, 0, myCanvas.width, myCanvas.height);

				drawRect(
					boxes[0],
					classes[0],
					scores[0],
					recognitionThreshold,
					boundingBoxLineWidth,
					myVideo.videoWidth,
					myVideo.videoHeight,
					myCanvasContext
				);

				const detectedSelectedStickyNotes = detectObjects(
					boxes[0],
					scores[0],
					recognitionThreshold,
					myVideo.videoWidth,
					myVideo.videoHeight
				);

				let stickyNoteDataList: StickyNoteDataObj[] = [];
				const miroBoardInfo = await miro.board.getInfo();
				const miroBoardId = miroBoardInfo.id;

				for await (const detectedSelectedStickyNote of detectedSelectedStickyNotes) {
					const detectedSelectedStickyNoteBase64URL = await cropImage(
						myCanvas.toDataURL(),
						detectedSelectedStickyNote.x,
						detectedSelectedStickyNote.y,
						detectedSelectedStickyNote.width,
						detectedSelectedStickyNote.height
					);
					const newSlide = { img: detectedSelectedStickyNoteBase64URL, id: '1' };
					setStickyNoteSliderImages((prevState) => [...prevState, newSlide]);
					console.log(detectedSelectedStickyNoteBase64URL);

					const fileName = Date.now().toString();

					stickyNoteDataList.push({
						id: fileName,
						base64Url: detectedSelectedStickyNoteBase64URL,
						color: 'blue',
						xpos: Math.round(detectedSelectedStickyNote.x),
						ypos: Math.round(detectedSelectedStickyNote.y),
					});
				}

				connectToWebSocketAndSendPrintingData({ stickyNoteDataList: stickyNoteDataList, miroBoardId: miroBoardId });
				document.body.appendChild(myCanvas);
				downloadStickyNotePNG(myCanvas.toDataURL(), 'MiroStickyNoteDetection');
			}
		} catch (error) {
			console.log(error);
		}
	};
	// !!! STICKY NOTE SCANNING INSIDE MIRO TEST !!!

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Sticky Note Printer</h1>
			<img id='yeah' style={{ width: '200px', height: '200px' }} src='' alt='screenshot'></img>

			{/* https://codesandbox.io/s/2qkt9 */}
			{/* <div className={styles.imageSlider}></div> */}
			<p className={styles.descriptionText}>Select one or more sticky notes and press “Print”.</p>

			<button
				onClick={() => {
					capture();
				}}
			>
				CAPTURE
			</button>

			<h1 className={styles.previewTitle}>Preview:</h1>

			<StickyNotePreviewSlider stickyNoteSliderImages={stickyNoteSliderImages} />
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

// useEffect(() => {
// 	const interval = setInterval(async () => {
// 		const allStickies = await miro.board.get({ type: ['sticky_note'] });

// 		setAllStickyNotes((previousState: BoardNode[]) => {
// 			const newStickyNotes: StickyNote[] = allStickies.filter(
// 				(stickyNoteFromUpdatedList) => !previousState.some((element) => element.id === stickyNoteFromUpdatedList.id)
// 			) as StickyNote[];

// 			newStickyNotes.forEach((newStickyNote) => {
// 				const stickyNoteSvgImage = startPrintJob(newStickyNote);
// 				// TODO: Start print job with svg image path
// 				// needs maybe a server (node.js -> runs on pc on server - not in client)
// 			});

// 			return allStickies;
// 		});
// 	}, 5000);

// 	// return function is called once when component is unmounting
// 	// important for services and events, as well as for custom eventListeners and services for which you subscribe
// 	return () => {
// 		clearInterval(interval);
// 	};
// }, []);

// const splitTextInMultipleRows = (textContentRows: string[]) => {
// 	// // TODO: CODE FALLBACK FOR WHEN NO BREAKS ARE USED -> row = 1

// 	const words = textContentRows[0].split(' ');
// 	let rowSentence: string = '';
// 	const newTextContentRows: Array<string> = [];
// 	words.forEach((word, index) => {
// 		console.log(rowSentence);
// 		console.log(word);
// 		if (rowSentence.length + 1 + word.length < 20) {
// 			if (index === 0) rowSentence = word;
// 			else rowSentence = `${rowSentence} ${word}`;
// 		} else {
// 			newTextContentRows.push(rowSentence);
// 			rowSentence = word;
// 		}
// 	});
// 	console.log(newTextContentRows);
// 	return newTextContentRows;
// };

// const calculateStickyNoteFontSize = (maxCharacterCount: number, textContentRows: string[]) => {
// 	let charNumDependentFontSize = 0;

// 	// prettier-ignore
// 	if(maxCharacterCount <= 3) charNumDependentFontSize = 64
//     else if(maxCharacterCount > 3 && maxCharacterCount <= 4) charNumDependentFontSize = 48
//     else if(maxCharacterCount > 4 && maxCharacterCount <= 6) charNumDependentFontSize = 32
//     else if(maxCharacterCount > 6 && maxCharacterCount <= 8) charNumDependentFontSize = 24
//     else if(maxCharacterCount > 8 && maxCharacterCount <= 11) charNumDependentFontSize = 18
//     else if(maxCharacterCount > 11 && maxCharacterCount <= 14) charNumDependentFontSize = 14
//     else if(maxCharacterCount > 14 && maxCharacterCount <= 16) charNumDependentFontSize = 12
//     else if(maxCharacterCount > 16) charNumDependentFontSize = 10

// 	// prettier-ignore
// 	if(textContentRows.length === 2) charNumDependentFontSize = 48
// 	else if (textContentRows.length === 3) charNumDependentFontSize = 32;
// 	else if (textContentRows.length === 4) charNumDependentFontSize = 24;
// 	else if (textContentRows.length === 5 || textContentRows.length === 6) charNumDependentFontSize = 18;
// 	else if (textContentRows.length === 7) charNumDependentFontSize = 14;
// 	else if (textContentRows.length === 8) charNumDependentFontSize = 12;
// 	else if (textContentRows.length === 8 || textContentRows.length === 9) charNumDependentFontSize = 12;
// 	else if (textContentRows.length > 9) charNumDependentFontSize = 10;

// 	console.log('max character', maxCharacterCount);
// 	console.log('row count', textContentRows.length);
// 	console.log('final font size', charNumDependentFontSize);

// 	return charNumDependentFontSize;
// };
