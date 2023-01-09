import styles from '../../index.module.scss';
import React from 'react';

const MiroTemplateApp = () => {
	const auth_token = 'eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_6dLJhOYTfcjJcAMhAldgJVSA0NE';
	const headers = {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: `Bearer ${auth_token}`,
	};

	// CREATE FRAME
	// const options = {
	// 	method: 'POST',
	// 	headers: {accept: '*/*', 'content-type': 'application/json'},
	// 	body: JSON.stringify({
	// 	  data: {format: 'custom', title: 'Sample fraasdasdme title', type: 'freeform'},
	// 	  style: {fillColor: '#23dsa'},
	// 	  position: {origin: 'center', x: 234, y: 23423},
	// 	  geometry: {height: 234, width: 234}
	// 	})
	//   };

	//   fetch('https://api.miro.com/v2/boards/asdasd/frames', options)
	// 	.then(response => response.json())
	// 	.then(response => console.log(response))
	// 	.catch(err => console.error(err));

	const createFrame = async (
		pos_x: number,
		pos_y: number,
		title: string,
		height: number,
		width: number,
		board_id: string
	): Promise<string | null> => {
		const url = `https://api.miro.com/v2/boards/${board_id.replace('=', '%3D')}/frames`;
		const body = JSON.stringify({
			data: {
				format: 'custom',
				title: title,
				type: 'freeform',
			},
			style: { fillColor: '#ffffffff' },
			position: {
				origin: 'center',
				x: pos_x,
				y: pos_y,
			},
			geometry: {
				height: height,
				width: width,
			},
		});

		return fetch(url, { method: 'POST', headers: headers, body: body })
			.then((response) => response.json())
			.then((response) => {
				console.log(response);
				return response.id;
			})
			.catch((err) => {
				console.error(err);
				return null;
			});
	};

	// CREATE IMAGE
	// const options = {
	// 	method: 'POST',
	// 	headers: {
	// 	  accept: 'application/json',
	// 	  'content-type': 'application/json',
	// 	  authorization: 'Bearer 12321sadasdasd'
	// 	},
	// 	body: JSON.stringify({
	// 	  data: {
	// 		url: 'https://miro.com/static/images/page/mr-index/localization/en/slider/ideation_brainstorming.png',
	// 		title: 'sdfsd'
	// 	  },
	// 	  position: {origin: 'center', x: 234, y: 234},
	// 	  geometry: {height: 234, rotation: 0, width: 234},
	// 	  parent: {id: 234}
	// 	})
	//   };

	//   fetch('https://api.miro.com/v2/boards/34534534/images', options)
	// 	.then(response => response.json())
	// 	.then(response => console.log(response))
	// 	.catch(err => console.error(err));

	const createImage = async (
		pos_x: number,
		pos_y: number,
		width: number,
		title: string,
		img_url: string,
		board_id: string,
		parent_id: string
	) => {
		const url = `https://api.miro.com/v2/boards/${board_id.replace('=', '%3D')}/images`;
		const body = JSON.stringify({
			data: {
				url: img_url,
				title: title,
			},
			position: {
				origin: 'center',
				x: pos_x,
				y: pos_y,
			},
			geometry: {
				width: width,
				rotation: 0,
			},
			parent: { id: parent_id },
		});

		fetch(url, { method: 'POST', headers: headers, body: body })
			.then((response) => response.json())
			.then((response) => console.log(response))
			.catch((err) => console.error(err));
	};

	// CREATE NEW MIRO-BOARD
	const createMiroBoard = async (name: string, description: string): Promise<string | null> => {
		const url = 'https://api.miro.com/v2/boards';
		const body = JSON.stringify({
			name: name,
			description: description,
			policy: {
				permissionsPolicy: {
					collaborationToolsStartAccess: 'all_editors',
					copyAccess: 'anyone',
					sharingAccess: 'team_members_with_editing_rights',
				},
				sharingPolicy: {
					access: 'private',
					inviteToAccountAndBoardLinkAccess: 'no_access',
					organizationAccess: 'private',
					teamAccess: 'private',
				},
			},
		});

		return fetch(url, { method: 'POST', headers: headers, body: body })
			.then((response) => response.json())
			.then((response) => {
				return response.id;
			})
			.catch((err) => {
				console.error(err);
				return null;
			});
	};

	const getImageMeta = (url: string): Promise<HTMLImageElement> =>
		new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = (err) => {
				console.log(err);
				reject(err);
			};
			img.src = url;
		});

	type ImgObjectData = {
		title: string;
		imgUrl: string;
	};
	const createMiroTemplate = async (boardTitle: string, boardDescription: string, imgArray: ImgObjectData[]) => {
		const board_id = await createMiroBoard(boardTitle, boardDescription);
		console.log('board_id: ', board_id);

		if (board_id) {
			const framePadding = 150;
			const paddingBetweenImages = 25;
			let updatedImagesDistance = 0;

			for await (const [index, imgDataObject] of imgArray.entries()) {
				console.log(updatedImagesDistance);
				const img = await getImageMeta(imgDataObject.imgUrl);

				const parent_id = await createFrame(
					updatedImagesDistance,
					0,
					imgDataObject.title,
					img.naturalHeight + framePadding,
					img.naturalWidth + framePadding,
					board_id
				);
				console.log('parent_id: ', parent_id);

				if (parent_id) {
					await createImage(
						0 + img.naturalWidth / 2 + framePadding / 2,
						img.naturalHeight / 2 + framePadding / 2,
						img.naturalWidth,
						imgDataObject.title,
						imgDataObject.imgUrl,
						board_id,
						parent_id
					);
				}

				if (imgArray[index + 1]) {
					const imgNext = await getImageMeta(imgArray[index + 1].imgUrl);
					updatedImagesDistance =
						updatedImagesDistance +
						img.naturalWidth / 2 +
						imgNext.naturalWidth / 2 +
						paddingBetweenImages +
						framePadding;
				}
			}
		}
	};

	return (
		<div className={styles.appContainer}>
			<h3 className={styles.h3Style}>MIRO TEMPLATE APP</h3>
			<button
				className={styles.buttonStyle}
				onClick={() =>
					createMiroTemplate('Rezept XYZ', 'test_board_description', [
						{
							title: "What's on Your Radar",
							imgUrl: 'https://brazhnik.de/public-images/whats-on-your-radar.png',
						},
						{
							title: 'Importance Difficulty Matrix',
							imgUrl: 'https://brazhnik.de/public-images/importance-difficulty-matrix.png',
						},
						{
							title: "Bull's Eye Diagramming",
							imgUrl: 'https://brazhnik.de/public-images/bulls-eye-diagramming.png',
						},
						{
							title: "What's on Your Radar",
							imgUrl: 'https://brazhnik.de/public-images/whats-on-your-radar.png',
						},
						{
							title: 'Importance Difficulty Matrix',
							imgUrl: 'https://brazhnik.de/public-images/importance-difficulty-matrix.png',
						},
						{
							title: "Bull's Eye Diagramming",
							imgUrl: 'https://brazhnik.de/public-images/bulls-eye-diagramming.png',
						},
					])
				}
			>
				Create Miro Template
			</button>
		</div>
	);
};

export default MiroTemplateApp;
