import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './StickyNoteScannerApp.module.scss';
import {
	createNewMiroBoard,
	getAllBoardItems,
	create_frame,
	create_image,
	create_sticky_note,
	create_line,
	bearer,
	getAllMiroBoardNamesAndIds,
	SimplifiedBoardObjectType,
} from './miroRestApiMethods';
import StickyNotePreviewSlider from '../PostItPrinterApp/StickyNotePreviewSlider/StickyNotePreviewSlider';
import Checkbox from '../ui/Checkbox/Checkbox';
import Button from '../ui/Button/Button';
import Printer from '../Icons/Printer';
import CustomFileInput from '../ui/CustomFileInput/CustomFileInput';
import Refresh from '../Icons/Refresh';

type StickyNoteDataType = {
	color: string;
	height: number;
	name: string;
	ocr_recognized_text: string;
	path: string;
	position: {
		ymin: number;
		xmin: number;
		ymax: number;
		xmax: number;
	};
	width: number;
};

type TextDataType = {
	boxes: {
		bottomLeft: {
			x: number;
			y: number;
		};
		bottomRight: {
			x: number;
			y: number;
		};
		topLeft: {
			x: number;
			y: number;
		};
		topRight: {
			x: number;
			y: number;
		};
	};
	text: string;
};

type FetchedScannedDataType = {
	img_data: { width: number; height: number };
	sticky_note_data: Array<StickyNoteDataType>;
	text_data: Array<TextDataType>;
};

const StickyNoteScannerApp = () => {
	const [sliderImages, setSliderImages] = useState<Array<{ img: string; id: string }>>([]);

	const [selectedImages, setSelectedImages] = useState<FileList | null>(null);

	const [checkBoxScanWhiteboardText, setCheckBoxScanWhiteboardText] = useState(false);
	const [checkBoxDebug, setCheckBoxDebug] = useState(false);
	const [checkBoxCreateCroppedStickyNoteImages, setCheckBoxCreateCroppedStickyNoteImages] =
		useState(false);

	const [checkBoxUseExistingBoardForScanning, setCheckBoxCreateNewMiroBoard] = useState(false);

	const [inputBoardName, setInputBoardName] = useState('');

	useEffect(() => {
		showAvailableMiroBoardSelection();
	}, []);

	const handleChangeCheckBoxScanWhiteboardText = () => {
		setCheckBoxScanWhiteboardText(!checkBoxScanWhiteboardText);
	};

	const handleChangeCheckBoxDebug = () => {
		setCheckBoxDebug(!checkBoxDebug);
	};
	const handleChangeCheckBoxCreateCroppedStickyNoteImages = () => {
		setCheckBoxCreateCroppedStickyNoteImages(!checkBoxCreateCroppedStickyNoteImages);
	};

	const handleChangeCheckBoxUseExistingBoardForScanning = () => {
		setCheckBoxCreateNewMiroBoard(!checkBoxUseExistingBoardForScanning);
	};

	const handleChangeInputBoardName = (event: any) => {
		setInputBoardName(event.target.value);
	};

	const getTimestamp_YYYY_MM_DD_HH_MM_SS = () => {
		const date = new Date();

		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
		const day = String(date.getUTCDate()).padStart(2, '0');

		const hour = String(date.getUTCHours()).padStart(2, '0');
		const minute = String(date.getUTCMinutes()).padStart(2, '0');
		const second = String(date.getUTCSeconds()).padStart(2, '0');

		const strDate = year + '-' + month + '-' + day + '_' + hour + '-' + minute + '-' + second;

		return strDate;
	};

	const adjustImage = async (
		base64Url: string,
		newX: number,
		newY: number,
		newWidth: number,
		newHeight: number,
		crop: boolean
	) => {
		// Create image to receive the Data URI
		const img = new Image();
		// Put Data URI in img src attribute
		img.setAttribute('src', base64Url);

		// When "onload" event is triggered, img can be adjusted (resized or cropped)
		// when the image is loaded we can get it as base64 url
		const imgPromise = new Promise<string>((resolve, reject) => {
			img.onload = () => {
				// Create canvas and get its context
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');

				// Set dimensions at wanted size
				canvas.width = newWidth;
				canvas.height = newHeight;

				// Adjust image with canvas method drawImage() and draw it on canvas
				if (context) {
					crop
						? context.drawImage(img, newX, newY, newWidth, newHeight, 0, 0, newWidth, newHeight)
						: context.drawImage(img, newX, newY, newWidth, newHeight);
					// here you can make further adjustments in the image (like drawing rects and other forms inside)
				}

				// Resolve the promise, passing the base64 url -> return of the promise
				resolve(canvas.toDataURL());
			};
			img.onerror = reject;
		});

		const imgUrl = await imgPromise;
		return imgUrl;
	};

	const findScanningStartPoint = async (boardId: string) => {
		const allTextItems: Array<any> = await getAllBoardItems(boardId, 50, 'shape');
		return allTextItems.find((text: any) => text.data.content.includes('[scanning]'));
	};

	const startScanningProcess = async (
		selectedImages: FileList,
		scanWhiteBoard: boolean = false,
		debug: boolean = false
	) => {
		let boardId = '';
		let boardName = '';
		let scanningStartPointTextWidget = undefined;
		const paddingBetweenScanningStartPointAndScannings = 250;

		if (selectedMiroBoard.boardName === '') {
			// *** 1. CREATE NEW MIRO BOARD OR GET EXISTING ONE ***
			boardName = inputBoardName !== '' ? inputBoardName : getTimestamp_YYYY_MM_DD_HH_MM_SS();
			const boardDescription = `Scanning of ${Array.from(selectedImages).map(
				(img) => img.name + ', '
			)}`;

			boardId = await createNewMiroBoard(boardName, boardDescription, bearer);

			if (boardId === '-1') {
				console.log('\nERROR: Board could not be created.\n');
				return;
			}
		} else {
			boardId = selectedMiroBoard.boardId;
			boardName = selectedMiroBoard.boardName;
			scanningStartPointTextWidget = await findScanningStartPoint(boardId);

			if (scanningStartPointTextWidget === undefined) {
				console.log(
					`\nWARNING: No "[scanning]" text element was found in the Miro Board ${boardName}.\n`
				);
			}
		}

		console.log('Scanning started!');

		let prevFrameWidth = 0;
		let framePositionX = 0;
		let framePositionY = 0;
		let frameOffset = 0;
		const paddingBetweenFrames = 1000;

		for await (const [index, selectedImage] of Array.from(selectedImages).entries()) {
			console.log(`Scanning for ${selectedImage.name}:`);

			// *** 2. USE TOOLBOX-SCANNING-API TO RETRIEVE THE SCANNING DATA ***
			// using TensorFlow ML Object-Detection-Model and Google Cloud Vision API for OCR
			// all detections are done on a resized image
			// for tensorflow and cloud vision to work, the uploaded image has to be limited in file size
			// all detections and their coordinates are relative to the new resized image dimensions
			// these new resized image dimensions are return as well inside img_data
			const fetchedScanningData: FetchedScannedDataType = await fetchScanningData(
				selectedImage,
				scanWhiteBoard,
				debug
			);

			if (fetchedScanningData === undefined) {
				console.log(
					'\nERROR: Data could not be fetched. Check the API availability or your Network.\n'
				);
				return;
			}

			if (fetchedScanningData.sticky_note_data.length === 0) {
				console.log('\nWARNING: No sticky notes detected.\n');
				return;
			}

			// because the toolbox-scanning-api (called with fetchScanningData()) resizes the uploaded image
			// and returns coordinates according to the resized image
			// the original uploaded image has to be resized to the new dimensions as well (stored in img_data)
			const resizedImgHeight = fetchedScanningData.img_data.height;
			const resizedImgWidth = fetchedScanningData.img_data.width;

			const frameWidth = checkBoxCreateCroppedStickyNoteImages
				? resizedImgWidth * 2
				: resizedImgWidth;
			const frameHeight = resizedImgHeight;

			// calculate the x- and y-coordinates for the first frame of the scanning
			// according to the position of the scanningStartPointTextWidget
			// they can be only calculated with the frameWidth and
			// the knowledge of the dimensions from the resized (fetched) image
			if (index === 0 && scanningStartPointTextWidget) {
				framePositionX =
					scanningStartPointTextWidget.position.x -
					scanningStartPointTextWidget.geometry.width / 2 +
					frameWidth / 2;
				// there is no scanningStartPointTextWidget.geometry.height in miro text widgets, there padding of 250 is added
				framePositionY =
					scanningStartPointTextWidget.position.y +
					scanningStartPointTextWidget.geometry.height / 2 +
					frameHeight / 2 +
					paddingBetweenScanningStartPointAndScannings;
			}

			// if more then one frame need to be created, calculate the frameOffset with the help of the prevFrameWidth
			if (prevFrameWidth !== 0) {
				frameOffset = frameOffset + prevFrameWidth / 2 + frameWidth / 2 + paddingBetweenFrames;
			}

			const frame_title = selectedImage.name;

			// Create frame for this timestamp for store all sticky notes inside
			const frameId = await create_frame(
				framePositionX + frameOffset,
				framePositionY,
				frame_title,
				resizedImgHeight,
				frameWidth,
				boardId
			);

			const create_template_poster_status_code = await create_image(
				resizedImgWidth / 2,
				resizedImgHeight / 2,
				resizedImgWidth,
				`${boardName}-template-poster`,
				selectedImage,
				boardId,
				frameId
			);

			if (create_template_poster_status_code === 204) {
				console.log(
					`\nSuccessfully created the template poster background inside the miro board ${boardName}.\n`
				);
			}

			const create_sticky_notes_status_code_array: Array<number> = [];

			for (const sticky_note_data of fetchedScanningData.sticky_note_data) {
				let sticky_note_data_shape = 'square';
				if (sticky_note_data.width / sticky_note_data.height > 1.25) {
					sticky_note_data_shape = 'rectangle';
				}

				const [create_sticky_notes_status_code, sticky_note_id] = await create_sticky_note(
					sticky_note_data.position.xmin + sticky_note_data.width / 2,
					sticky_note_data.position.ymin + sticky_note_data.height / 2,
					sticky_note_data.width,
					sticky_note_data_shape,
					sticky_note_data.color,
					sticky_note_data.ocr_recognized_text,
					boardId,
					frameId
				);

				create_sticky_notes_status_code_array.push(create_sticky_notes_status_code);
			}

			if (create_sticky_notes_status_code_array.every((statusCode) => statusCode === 204)) {
				console.log(
					`\nSuccessfully created ${fetchedScanningData.sticky_note_data.length} sticky notes inside the miro board ${boardName}.\n")`
				);
			}

			if (checkBoxCreateCroppedStickyNoteImages) {
				await create_line(
					resizedImgWidth,
					resizedImgHeight / 2,
					8,
					resizedImgHeight,
					'#000000',
					boardId,
					frameId
				);

				const resizedImg: string = await adjustImage(
					URL.createObjectURL(selectedImage),
					0,
					0,
					fetchedScanningData.img_data.width,
					fetchedScanningData.img_data.height,
					false
				);

				for (const sticky_note_data of fetchedScanningData.sticky_note_data) {
					const croppedStickyNote = await adjustImage(
						resizedImg,
						sticky_note_data.position.xmin,
						sticky_note_data.position.ymin,
						sticky_note_data.width,
						sticky_note_data.height,
						true
					);

					// convert base64Url to File type again to use it with Miro REST API createImage function
					fetch(croppedStickyNote)
						.then((res) => res.blob())
						// eslint-disable-next-line no-loop-func
						.then((blob) => {
							const croppedStickyNoteFile = new File([blob], 'cropped-sticky.png', blob);
							if (croppedStickyNoteFile) {
								create_image(
									sticky_note_data.position.xmin + sticky_note_data.width / 2 + resizedImgWidth,
									sticky_note_data.position.ymin + sticky_note_data.height / 2,
									sticky_note_data.width,
									'sticky_note_img',
									croppedStickyNoteFile,
									boardId,
									frameId
								);
							}
						});
				}
			}
			prevFrameWidth = frameWidth;
		}
		console.log('Finish Scanning!');
	};

	const fetchScanningData = async (img: File, scanWhiteBoard: boolean, debug: boolean) => {
		const form = new FormData();
		form.append('image', img);

		const paramScanWhiteBoard = scanWhiteBoard ? 'True' : 'False';
		const paramDebug = debug ? 'True' : 'False';

		const options = {
			method: 'POST',
			url: 'http://localhost:5000/scan-sticky-notes',
			params: {
				scan_whiteboard_text: paramScanWhiteBoard,
				debug: paramDebug,
			},
			headers: { 'Content-Type': 'multipart/form-data;' },
			data: form,
		};

		try {
			return await axios(options).then((res: { data: any }) => {
				console.log(res.data);
				return res.data;
			});
		} catch (err: any) {
			console.log(err);
		}
	};

	const [miroBoardsSelectionOptions, setMiroBoardsSelectionOptions] = useState<Array<any>>([
		<option
			disabled
			value=''
			key=''>
			-- load miro boards --
		</option>,
	]);
	const [selectedMiroBoard, setSelectedMiroBoard] = useState({ boardId: '', boardName: '' });

	const showAvailableMiroBoardSelection = async () => {
		const allMiroBoard = await getAllMiroBoardNamesAndIds(bearer);
		const miroBoardOptions = allMiroBoard?.map((miroBoard: any) => {
			return (
				<option
					value={JSON.stringify({ boardId: miroBoard.boardId, boardName: miroBoard.boardName })}
					key={miroBoard.boardId}>
					{miroBoard.boardName}
				</option>
			);
		});
		miroBoardOptions?.unshift(
			<option
				disabled
				value=''
				selected
				key=''>
				-- choose a miro board --
			</option>
		);
		if (miroBoardOptions) {
			setMiroBoardsSelectionOptions(miroBoardOptions);
		}
	};

	return (
		<>
			<div className={styles.container}>
				<h1 className={styles.title}>Sticky Note Scanner</h1>
				<p className={styles.descriptionText}>
					Upload the images you want to Scan and select the Miro Board in which you want the Scans
					to be stored. Then press "Scan" to start the Scanning Process.
				</p>
				<div className={styles.imageSelectionContainer}>
					<h1 className={styles.previewTitle}>Image Selection:</h1>

					{selectedImages && (
						<>
							<StickyNotePreviewSlider
								stickyNoteSliderImages={sliderImages}
								setStickyNotesSliderImages={setSliderImages}
							/>
						</>
					)}

					<div className={styles.formElementsContainer}>
						<div className={styles.formElements}>
							<CustomFileInput
								setSelectedImages={setSelectedImages}
								setSliderImages={setSliderImages}
							/>

							<div className={styles.formSection}>
								{checkBoxUseExistingBoardForScanning === false ? (
									<>
										<label className={styles.formElementsText}>
											Create Miro Board with the name:{' '}
										</label>
										<input
											className={styles.selectField}
											type='text'
											value={inputBoardName}
											onChange={(e) => handleChangeInputBoardName(e)}
										/>
									</>
								) : (
									<>
										<label className={styles.formElementsText}>Choose a Miro Board:</label>
										<div className={styles.selectFieldContainer}>
											<select
												className={styles.selectField}
												defaultValue={selectedMiroBoard.boardName}
												onChange={(e) => {
													const selectedMiroBoardData: SimplifiedBoardObjectType = JSON.parse(
														e.target.value
													);
													console.log(JSON.parse(e.target.value));
													setSelectedMiroBoard(selectedMiroBoardData);
												}}>
												{miroBoardsSelectionOptions}
											</select>
											<button
												className={styles.refreshButton}
												onClick={() => showAvailableMiroBoardSelection()}>
												<Refresh
													height={18}
													width={18}
												/>
											</button>
										</div>
									</>
								)}
								<Checkbox
									label='Use existing Miro Board'
									value={checkBoxUseExistingBoardForScanning}
									onChange={handleChangeCheckBoxUseExistingBoardForScanning}
								/>
							</div>
							<div className={styles.formSection}>
								<div className={styles.formElementsText}>Scan Settings:</div>
								<Checkbox
									label='Create cropped sticky note images'
									value={checkBoxCreateCroppedStickyNoteImages}
									onChange={handleChangeCheckBoxCreateCroppedStickyNoteImages}
								/>
								<Checkbox
									label='Detect Text (experimental)'
									value={checkBoxScanWhiteboardText}
									onChange={handleChangeCheckBoxScanWhiteboardText}
								/>
								<Checkbox
									label='Debug'
									value={checkBoxDebug}
									onChange={handleChangeCheckBoxDebug}
								/>
							</div>
						</div>
					</div>
				</div>
				<br />
				<Button
					onClickFunction={() => {
						if (checkBoxUseExistingBoardForScanning && selectedMiroBoard.boardId === '') {
							alert(
								'To use the scanning inside an existing miro board, please choose one of your existing miro boards.'
							);
							return;
						}
						selectedImages &&
							startScanningProcess(selectedImages, checkBoxScanWhiteboardText, checkBoxDebug);
					}}
					buttonIcon={<Printer />}
					buttonText={'Scan'}
					isDisabled={sliderImages.length === 0}
				/>
			</div>
		</>
	);
};

export default StickyNoteScannerApp;
