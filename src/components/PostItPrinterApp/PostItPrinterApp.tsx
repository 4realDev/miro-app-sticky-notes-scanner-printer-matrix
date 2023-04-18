// 1. VON BELIEBIGEM PC AUS (ORTSUNGEBUNDEN):
// Über POST request Möglichkeit, eine SVG Datei (von jedem PC oder Handy) an den Server zu senden
// (soll in einer Miro App realisiert werden -> JS)
// 2. VOM PC MIT DRUCKER (ORTSGEBUNDEN):
// Über POST request Möglichkeit IP Addresse des PC's mit Drucker anzugeben,
// sodass Server dem PC mit Drucker alle SVG's als POST request weiterleitet,
// die über einen POST request an den Server gesendet werden
// 3. PC mit Drucker reagiert auf POST requests von Server, indem dieser alle SVG Dateien die gesendet werden,
// mit Hilfe des über USB angeschlossenen Druckers ausdruckt

import { drawRect, detectObjects } from './utilities';
import * as tf from '@tensorflow/tfjs';
import React, { useEffect, useState } from 'react';
import { NotificationType, SelectionUpdateEvent, StickyNote, StickyNoteColor } from '@mirohq/websdk-types';
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
	const [stickyNoteSliderImages, setStickyNoteSliderImages] = useState<Array<{ img: string; id: string }>>([]);
	const stickyNotePostItWidth = 305;

	// TODO: Extract in unility class
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
		img.setAttribute('src', 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString))));

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

	const convertStickyNoteDataToStickyNoteSVGString = (stickyNote: StickyNote, forDrawingOnScreen = false) => {
		const outerBoxBackground =
			forDrawingOnScreen === false ? 'white' : mapStickyNoteColorToPrintColor(stickyNote.style.fillColor, true);
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
			transform: ${outerBoxTransform};
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

		innerBox.textContent = stickyNote.content.replaceAll('<p>', '').replaceAll('</p>', '').replaceAll('<br>', '\n');

		outerBox.appendChild(innerBox);

		// Add the html to the body to make it visible
		document.body.appendChild(outerBox);

		const startFont = stickyNotePostItWidth;
		calculateFontSize(startFont, innerBox, stickyNotePostItWidth);

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
			const imgStickyNotePrintColor = mapStickyNoteColorToPrintColor(selectedStickyNote.style.fillColor);
			const fileName = Date.now().toString();

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
	// RUN: npm i @tensorflow/tfjs -> https://www.npmjs.com/package/@tensorflow/tfjs

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

			<button onClick={() => capture()}>CAPTURE</button>

			<p className={styles.descriptionText}>Select one or more sticky notes and press “Print”.</p>

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
