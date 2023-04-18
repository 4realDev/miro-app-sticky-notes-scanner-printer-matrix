import { BoardNode } from '@mirohq/websdk-types';
import React from 'react';

type SmallBoardData = {
	id: string;
	boardName: string;
};

const CreateRecipeWithTemplates = () => {
	const createNewMiroBoard = async (title: string, description: string, bearer: string) => {
		const options = {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			body: JSON.stringify({
				name: title,
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
			}),
		};

		return fetch('https://api.miro.com/v2/boards', options)
			.then((response) => response.json())
			.then((response) => {
				console.log(response);
				return response.id;
			})
			.catch((err) => console.error(err));
	};

	const getAllBoardNamesAndIds = async (bearer: string): Promise<Array<SmallBoardData>> => {
		const options = {
			method: 'GET',
			headers: {
				accept: 'application/json',
				authorization: `Bearer ${bearer}`,
			},
		};

		return fetch('https://api.miro.com/v2/boards?sort=default', options)
			.then((res) => res.json())
			.then((json) => {
				console.log(json);
				return json.data;
			})
			.then((data) => data.map((board: any) => ({ id: board.id, boardName: board.name })))
			.catch((err) => console.error(err));
	};

	const getAllBoardItems = async (boardId: string, bearer: string, cursor = '') => {
		const options = {
			method: 'GET',
			headers: {
				accept: 'application/json',
				authorization: `Bearer ${bearer}`,
			},
		};

		let url;
		if (cursor === '') url = `https://api.miro.com/v2/boards/${boardId.replace('=', '%3D')}/items?limit=50`;
		else url = `https://api.miro.com/v2/boards/${boardId.replace('=', '%3D')}/items?limit=50&cursor=${cursor}`;

		return (
			fetch(url, options)
				.then((res) => res.json())
				.then((json) => {
					console.log(json);
					return json;
				})
				// .then((data) => {
				// 	console.log(data);
				// 	return data;
				// })
				.catch((err) => console.error(err))
		);
	};

	const createFrame = async (
		method: string,
		x: number,
		y: number,
		height: number,
		width: number,
		bearer: string,
		boardId: string
	) => {
		const options = {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			body: JSON.stringify({
				data: { format: 'custom', title: method, type: 'freeform' },
				position: { origin: 'center', x: x, y: y },
				geometry: { height: height, width: width },
			}),
		};

		return fetch(`https://api.miro.com/v2/boards/${boardId}/frames`, options)
			.then((response) => response.json())
			.then((response) => {
				console.log(response);
				return response.id;
			})
			.catch((err) => console.error(err));
	};

	const createWidgetWithData = async (data: any, widgetType: string, board_id: string, bearer: string) => {
		if ('position' in data) {
			if ('relativeTo' in data.position) {
				delete data.position.relativeTo;
			}
		}
		if ('geometry' in data) {
			if (widgetType == 'sticky_note' && 'height' in data.geometry) {
				delete data.geometry.height;
			}
		}

		if ('parent' in data) {
			if ('links' in data.parent) {
				delete data.parent.links;
			}
		}

		// This solves a bug on Miro -> Miro returns transparent elements with fillColor: "transparent" as
		// "style" : {"fillColor" : "#ffffff", "fillOpacity" : "0.0"}
		// setting the fillColor to "transparent" does not work ->
		// "message" : "Color value has invalid hex string, only css compatible hex strings are allowed"
		// the solution is to delete the fillColor property in this case
		// the data will be created then with: style: {fillColor: "transparent", fillOpacity: 1 ... } as it should be
		if ('style' in data) {
			if (
				'fillColor' in data.style &&
				'fillOpacity' in data.style &&
				data.style.fillColor === '#ffffff' &&
				data.style.fillOpacity === '0.0'
			) {
				delete data.style.fillColor;
			}
		}

		// This solves a bug on Miro -> Miro returns the type "unknown" for frames
		// ​data: Object { format: "custom", showContent: true, title: "Frame 1", type: "unknown" }
		// this type must be changed to "freeform" for the REST API request to work
		// otherwise: message: "Invalid parameters", status: 400,
		// { field: "data.type", message: "Unexpected value [unknown], expected one of: [freeform]" }
		if ('data' in data && widgetType == 'frame') {
			if ('type' in data.data) {
				data.data.type = 'freeform';
			}
		}

		// This solves a bug on Miro -> Miro returns the format
		// "a4, letter, phone, tablet, browser, ratio_1x1, ratio_16x9, ratio_4x3, ratio_1x1 ..." for frames with specific formats
		// data: Object { format: "ratio_1x1", showContent: true, title: "Frame 5", type: "unknown" }
		// this format must be changed to "custom" for the REST API request to work
		// otherwise: message: "Invalid parameters", status: 400,
		// { field: "data.format", message: "Unexpected value [ratio_16x9], expected one of: [custom]" }
		const specificFrameFormats = [
			'a4',
			'letter',
			'phone',
			'tablet',
			'desktop',
			'ratio_1x1',
			'ratio_16x9',
			'ratio_4x3',
			'ratio_1x1',
		];

		if ('data' in data) {
			if ('format' in data.data) {
				if (specificFrameFormats.includes(data.data.format)) {
					data.data.format = 'custom';
				}
			}
		}

		// if ('data' in data && 'shape' in data.data && data.data.shape === 'square') {
		// 	console.log(data.data.shape);
		// 	data.data.shape = 'rectangle';
		// }
		if ('createdAt' in data) delete data.createdAt;
		if ('createdBy' in data) delete data.createdBy;
		if ('modifiedAt' in data) delete data.modifiedAt;
		if ('modifiedBy' in data) delete data.modifiedBy;
		if ('links' in data) delete data.links;
		if ('id' in data) delete data.id;
		if ('type' in data) delete data.type;

		// # if 'parent' in data:
		// #     for subElement in list(data['parent']):
		// #         if 'links' in subElement:
		// #             del data['parent']['links']

		const options = {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			body: JSON.stringify(data),
		};

		const url = `https://api.miro.com/v2/boards/${board_id.replace('=', '%3D')}/${widgetType}s`;

		return fetch(url, options)
			.then((response) => response.json())
			.then((response) => {
				console.log(response);
				return response;
			})
			.catch((err) => console.error(err));
	};

	const createRecipe = async (
		methods: Array<string>,
		newBoardName: string,
		newBoardDescription: string,
		bearer: string
	) => {
		const recipeBoardId = await createNewMiroBoard(newBoardName, newBoardDescription, bearer);
		console.log(recipeBoardId);

		const allBoardNamesAndIds = await getAllBoardNamesAndIds(bearer);
		console.log(allBoardNamesAndIds);

		const paddingBetweenMethods = 150;
		let methodStartPositionX = undefined;
		let methodStartPositionY = undefined;

		for (const method of methods) {
			const templateBoard = allBoardNamesAndIds.find((board) => board.boardName === method);
			console.log(templateBoard);

			if (!templateBoard) {
				console.log(`Given Template Board ${method} does not exist.`);
				return;
			}

			let allItems: Array<any> = [];
			let allTemplateBoardItems = await getAllBoardItems(templateBoard.id, bearer);

			allItems.push(...allTemplateBoardItems.data);

			// while ('links' in allTemplateBoardItems && 'next' in allTemplateBoardItems.links) {
			// 	const allTemplateBoardItemsCopy = await getAllBoardItems(templateBoard.id, allTemplateBoardItems.cursor);
			// 	allItems.push(...allTemplateBoardItemsCopy.data);
			// 	allTemplateBoardItems = allTemplateBoardItemsCopy;
			// }

			console.log(allItems);

			const minXOfItems = Math.min(...allItems.map((item) => item.x));
			const maxXOfItems = Math.max(...allItems.map((item) => item.x));
			const minYOfItems = Math.min(...allItems.map((item) => item.y));
			const maxYOfItems = Math.max(...allItems.map((item) => item.y));
			const widthOfItems = maxXOfItems - minXOfItems;
			const heightOfItems = maxYOfItems - minYOfItems;

			if (methodStartPositionY === undefined) methodStartPositionY = methodStartPositionY + minYOfItems;

			// allItem.forEach((item) => await createWidgetWithData(item, item.type, templateBoard.id));

			// await Promise.all(
			// 	allItems.map(async (item) => {
			// 		await createWidgetWithData(item, item.type, templateBoard.id);
			// 	})
			// );

			// const allItemsWithFramesInFront = allItems.reduce((acc, element) => {
			// 	if (element.type === 'frame') {
			// 		return [element, ...acc];
			// 	}
			// 	return [...acc, element];
			// }, []);

			// console.log(allItemsWithFramesInFront);

			// Search for items without parent -> those are the frames
			// Loop through every frame and get its id
			// Search for items inside the allItems which are children of the frames
			// (which have the id as parent)
			// Create the frame and get its NEW id
			// Set the NEW id for the children as the NEW parent value
			// Remove the frame and it's children from the allItems array
			// TODO: Optimize this loop

			const methodFrameId = await createFrame(
				method,
				methodStartPositionX,
				methodStartPositionY,
				heightOfItems,
				widthOfItems,
				bearer,
				recipeBoardId
			);

			for (const item of allItems) {
				if (item.type === 'frame' && 'parent' in item === false) {
					// pass copy, because otherwise original is changed and frame id is removed
					const frameOldId = item.id;
					item.parent.id = methodFrameId;
					const frameObject = await createWidgetWithData(item, item.type, recipeBoardId, bearer);
					for (const subItem of allItems) {
						if ('parent' in subItem && subItem.parent.id === frameOldId) {
							console.log('FOUND CORRECT PARENT');
							subItem.parent.id = frameObject.id;
							await createWidgetWithData(subItem, subItem.type, recipeBoardId, bearer);
						}
					}
				}
			}

			methodStartPositionX = methodStartPositionX + maxXOfItems + paddingBetweenMethods;
		}

		// for (const item of allItemsWithFramesInFront) {
		// 	await createWidgetWithData(item, item.type, recipeBoardId, bearer);
		// }
	};

	const bearer = 'eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_dJFmha4uq9mmYZ9YP3jR42x9_98';

	// TODO: Make it to an array
	const methods = ["What's on Your Radar?", 'I Like, I Wish'];
	const newBoardName = 'My new Recipe';
	const newBoardDescription = `This is a recipe with the methods: ${methods}`;

	return (
		<div>
			<button onClick={() => createRecipe(methods, newBoardName, newBoardDescription, bearer)}>CREATE</button>
		</div>
	);
};

export default CreateRecipeWithTemplates;
