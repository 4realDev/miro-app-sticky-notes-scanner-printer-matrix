// TODO: STICKY NOTE PRINTER
// C:\_WORK\GitHub\_data-science\TensorFlow\addons\infraView\i_view64.exe C:\color[dark_green]_xpos[-4542]_ypos[4085](8).png /resize=(205,205) /aspectratio /resample /print="nemonic MIP-001"
// TODO: INSTALLATION VON INFRAVIEW DOKUMENTIEREN
// Server (Strato) z.B. brazhnik.de/sticky-printer
// Script auf Server
// 1. VON BELIEBIGEM PC AUS (ORTSUNGEBUNDEN):
// Über POST request Möglichkeit, eine SVG Datei (von jedem PC oder Handy) an den Server zu senden
// (soll in einer Miro App realisiert werden -> JS)
// 2. VOM PC MIT DRUCKER (ORTSGEBUNDEN):
// Über POST request Möglichkeit IP Addresse des PC's mit Drucker anzugeben,
// sodass Server dem PC mit Drucker alle SVG's als POST request weiterleitet,
// die über einen POST request an den Server gesendet werden
// 3. PC mit Drucker reagiert auf POST requests von Server, indem dieser alle SVG Dateien die gesendet werden,
// mit Hilfe des über USB angeschlossenen Druckers ausdruckt

import { StickyNote, StickyNoteColor } from '@mirohq/websdk-types';
import React from 'react';
import styles from '../../index.module.scss';

type StickyNoteTransferedData = {
	stickyNoteData: {
		id: string;
		base64Url: string;
		color: StickyNoteColor | `${StickyNoteColor}`;
		xpos: number;
		ypos: number;
	};
	miroBoardId: string;
};

const PostItPrinterApp = () => {
	const convertStickyNoteSVGToStickyNotePNG = async (
		iconSvg: SVGSVGElement,
		imgWidth: number,
		imgHeight: number
	): Promise<string> => {
		// solution without third party libry
		// canvg - doesn't support all of SVG capabilities
		// D3 or other libraries - often something other doesn't work (e.g. textPath)

		// 1. Get the DOM URL for the specific browser
		// Dom has API method to create an object - createObjectURL(svgtext)
		// API differs from browser to browser, but here's how to find it
		const domUrl = window.URL || window.webkitURL || window;
		if (!domUrl) {
			throw new Error('(browser doesnt support this)');
		}

		// 2. Create Blob object from svg outHTML data
		let svgText = iconSvg.outerHTML;
		const svg = new Blob([svgText], {
			type: 'image/svg+xml;charset=utf-8',
		});

		// 3. Use the Blob object to create an objectURL inside the dom URL
		const svgUrl = domUrl.createObjectURL(svg);

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
		const img = new Image();

		// when the image is loaded we can get it as base64 url
		const imgPromise = new Promise<string>((resolve, reject) => {
			img.onload = () => {
				// draw it to the canvas
				ctx && ctx.drawImage(img, 0, 0);

				// we don't need the original any more
				domUrl.revokeObjectURL(svgUrl);

				// now we can resolve the promise, passing the base64 url
				resolve(canvas.toDataURL('image/png'));
			};
			img.onerror = reject;
		});

		// load the image -> calls the onload() method
		img.src = svgUrl;

		const imgUrl = await imgPromise;

		return imgUrl;
	};

	const calculateStickyNoteFontSize = (maxCharacterCount: number, textContentRows: string[]) => {
		let charNumDependentFontSize = 64;

		// prettier-ignore
		if(maxCharacterCount <= 3) charNumDependentFontSize = 64
        else if(maxCharacterCount > 3 && maxCharacterCount <= 4) charNumDependentFontSize = 48
        else if(maxCharacterCount > 4 && maxCharacterCount <= 6) charNumDependentFontSize = 32
        else if(maxCharacterCount > 6 && maxCharacterCount <= 8) charNumDependentFontSize = 24
        else if(maxCharacterCount > 8 && maxCharacterCount <= 11) charNumDependentFontSize = 18
        else if(maxCharacterCount > 11 && maxCharacterCount <= 14) charNumDependentFontSize = 14
        else if(maxCharacterCount > 14 && maxCharacterCount <= 16) charNumDependentFontSize = 12
        else if(maxCharacterCount > 16) charNumDependentFontSize = 10

		// prettier-ignore
		if(textContentRows.length === 2) charNumDependentFontSize = 48
		if (textContentRows.length === 3) charNumDependentFontSize = 32;
		if (textContentRows.length === 4) charNumDependentFontSize = 24;
		if (textContentRows.length === 5 || textContentRows.length === 6) charNumDependentFontSize = 18;
		if (textContentRows.length === 7) charNumDependentFontSize = 14;
		if (textContentRows.length === 8) charNumDependentFontSize = 12;
		if (textContentRows.length === 8 || textContentRows.length === 9) charNumDependentFontSize = 12;
		if (textContentRows.length > 9) charNumDependentFontSize = 10;

		console.log('max character', maxCharacterCount);
		console.log('row count', textContentRows.length);
		console.log('final font size', charNumDependentFontSize);

		return charNumDependentFontSize;
	};

	const convertStickyNoteDataToStickyNoteSVG = (stickyNote: StickyNote) => {
		const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		// CREATE SVG
		const iconSvgSize = stickyNote.width;
		iconSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		iconSvg.setAttribute('height', iconSvgSize.toString());
		iconSvg.setAttribute('width', iconSvgSize.toString());
		iconSvg.setAttribute('transform', 'rotate(90 0 0)');

		// CREATE SVG RECT
		const iconRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		iconRect.setAttribute('fill', 'white');
		iconRect.setAttribute('height', iconSvgSize.toString());
		iconRect.setAttribute('width', iconSvgSize.toString());
		iconRect.setAttribute('x', '0');
		iconRect.setAttribute('y', '0');

		// CREATE SVG TEXT
		const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		iconText.setAttribute('fill', 'black');
		iconText.setAttribute('text-anchor', 'middle');
		iconText.setAttribute('dominant-baseline', 'middle');
		iconText.setAttribute('x', '50%');
		iconText.setAttribute('y', '50%');
		iconText.setAttribute('height', iconSvgSize.toString());
		iconText.setAttribute('width', iconSvgSize.toString());
		iconText.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
		iconText.setAttribute('font-weight', 'bold');

		// GET ALL ROWS IN ARRAY
		const regexp = new RegExp('(?<=<s*p[^>]*>)(.*?)(?=<s*/s*p>)', 'g');
		const textContentRows = [...stickyNote.content.matchAll(regexp)] as unknown as Array<string>;

		// GET LONGEST ROW
		const longestRow = textContentRows.reduce((prev, cur) => {
			return cur[1].length > prev[1].length ? cur : prev;
		});
		console.log('longest row', longestRow[1]);

		// GET NUM OF CHARACTER IN LONGEST ROW
		const maxCharacterCount = longestRow[1].length;

		// CREATE SVG TEXT SPAN FOR EACH ROW
		textContentRows.forEach((textContentRow, index) => {
			const iconTextSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
			if (index !== 0) iconTextSpan.setAttribute('dy', '1.2em');
			iconTextSpan.setAttribute('x', '50%');
			iconTextSpan.textContent = textContentRow[1];
			iconText.appendChild(iconTextSpan);
		});

		// ADJUST Y POSITION OF TEXT ACCORDING TO NUMBER OF ROWS
		iconText.setAttribute('dy', `${(-1.2 * (textContentRows.length - 1)) / 2}em`);

		// ADJUST FONT SIZE OF TEXT ACCORDING TO NUMBER OF ROWS AND TO LONGEST ROW
		const charNumDependentFontSize = calculateStickyNoteFontSize(maxCharacterCount, textContentRows);
		iconText.setAttribute('font-size', `${charNumDependentFontSize * 2}`);

		iconSvg.appendChild(iconRect);
		iconSvg.appendChild(iconText);

		return iconSvg;
	};

	const downloadStickyNotePNG = (base64Url: string, fileName: string) => {
		var downloadLink = document.createElement('a');
		downloadLink.href = base64Url;
		downloadLink.download = fileName;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
	};

	const connectToWebSocketAndSendData = (data: StickyNoteTransferedData) => {
		console.log('Client starts connection to websocket server! (Consumer)');
		// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
		const websocket = new WebSocket('ws://localhost:8080');

		// Connection opened
		websocket.addEventListener('open', () => {
			console.log('Client has connected to websocket server! (Consumer)');
			// as soon as connection is opened, send the printing data obj
			websocket.send(JSON.stringify(data));
		});

		// Listen for messages
		websocket.addEventListener('message', (event) => {
			console.log('Server has send data to the Client!');
			console.log(`data: ${event.data}`);
			// Data is printing feedback forwarded from Provider - Show feedback to user
			alert(event.data);
			// disconnect client, when feedback has been received
			websocket.close();
		});
	};

	// mspaint /pt C:\Users\vbraz\Desktop\RADAR_SYNC_IMAGES\IMG_5566.jpg "nemonic MIP-001"
	const createStickyNoteSvgForPrinting = async () => {
		const selected_sticky_note = await miro.board.getSelection();
		let stickyNote: StickyNote;

		if (selected_sticky_note.length === 0) {
			alert('You have not selected a sticky note yet. Please select one sticky note for printing.');
			return;
		}

		if (selected_sticky_note.length > 1) {
			alert(
				`You selected ${selected_sticky_note.length} widgets. Please only select one sticky note widget for printing.`
			);
			return;
		}

		if (selected_sticky_note[0].type === 'sticky_note') {
			stickyNote = selected_sticky_note[0] as StickyNote;
			const iconSvg = convertStickyNoteDataToStickyNoteSVG(stickyNote);
			const imgBase64Url: string = await convertStickyNoteSVGToStickyNotePNG(
				iconSvg,
				stickyNote.width,
				stickyNote.width
			);

			const fileName = Date.now().toString();
			downloadStickyNotePNG(imgBase64Url, fileName); // TODO: CAN BE REMOVED AFTERWARDS (DOWNLOAD IS NOT NECESSARY)
			const miroBoardInfo = await miro.board.getInfo();
			const miroBoardId = miroBoardInfo.id;
			const data: StickyNoteTransferedData = {
				stickyNoteData: {
					id: fileName,
					base64Url: imgBase64Url,
					color: stickyNote.style.fillColor,
					xpos: Math.round(stickyNote.x),
					ypos: Math.round(stickyNote.y),
				},
				miroBoardId: miroBoardId,
			};
			connectToWebSocketAndSendData(data);
		} else {
			alert(
				`Your selected widget is a ${selected_sticky_note[0].type}. Please make sure that your selected widget is a sticky note.`
			);
		}
	};

	// useEffect(() => {
	// 	const interval = setInterval(async () => {
	// 		const allStickies = await miro.board.get({ type: ['sticky_note'] });

	// 		setAllStickyNotes((previousState: BoardNode[]) => {
	// 			const newStickyNotes: StickyNote[] = allStickies.filter(
	// 				(stickyNoteFromUpdatedList) => !previousState.some((element) => element.id === stickyNoteFromUpdatedList.id)
	// 			) as StickyNote[];

	// 			newStickyNotes.forEach((newStickyNote) => {
	// 				const stickyNoteSvgImage = createStickyNoteSvgForPrinting(newStickyNote);
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

	return (
		<div className={styles.appContainer}>
			<h3 className={styles.h3Style}>POST IT PRINTER APP</h3>
			<button className={styles.buttonStyle} onClick={() => createStickyNoteSvgForPrinting()}>
				Print Sticky Note
			</button>
		</div>
	);
};

export default PostItPrinterApp;
