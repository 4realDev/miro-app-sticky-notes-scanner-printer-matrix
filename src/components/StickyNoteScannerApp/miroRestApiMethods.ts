import axios, { AxiosError } from 'axios';

export type SimplifiedBoardObjectType = {
	boardName: string;
	boardId: string;
};

// TODO: ADJUST, IF MIRO APPLICATION TOKEN CHANGES
export const bearer = 'eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_Uh4H10PkaGl8IN_5ajQzd_Kl8hc';

export const getAllMiroBoardNamesAndIds = async (bearer: string) => {
	try {
		return await axios({
			method: 'GET',
			url: 'https://api.miro.com/v2/boards?limit=50&sort=default',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
		}).then((res) => {
			const boardNameAndIdArray: Array<SimplifiedBoardObjectType> = res.data.data.map(
				(board: any) => {
					return { boardName: board.name, boardId: board.id };
				}
			);
			return boardNameAndIdArray;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		throw new AxiosError('Error creating miro board', AxiosError.ERR_NETWORK);
	}
};

export const createNewMiroBoard = async (name: string, description: string, bearer: string) => {
	// remove "Policy" and "SharingPolicy" to use the default settings which are defined in miro admin "Permission" tab
	try {
		return await axios({
			method: 'POST',
			url: 'https://api.miro.com/v2/boards',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			data: {
				name: name,
				description: description,
			},
		}).then((res) => {
			if (res.status === 201) {
				console.log(
					`\nSuccessfully created new miro board with the name ${name} and the board_id ${res.data.id}.\n`
				);
			}
			return res.data.id;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		return '-1';
	}
};

export const createNewMiroBoardOrGetExisting = async (
	name: string,
	description: string,
	createNewBoard: boolean,
	bearer: string
) => {
	const boardNamesAndIds = await getAllMiroBoardNamesAndIds(bearer);

	if (boardNamesAndIds === undefined) {
		console.log('ERROR: No Boards where found.');
		return '-1';
	}

	console.log(`\nExisting Boards: \n`);
	boardNamesAndIds.forEach((boardNamesAndIds: any) => {
		console.log(JSON.stringify(boardNamesAndIds));
	});

	//  1. save_in_existing_miro_board flag is set manually to "True" (default is "False")
	// search for the given board name inside all existing miro boards
	if (createNewBoard === false) {
		// 1.1 Board with the board given name exists -> return its id

		boardNamesAndIds.forEach((boardNameAndId: SimplifiedBoardObjectType) => {
			if (boardNameAndId.boardName === name) {
				console.log(`\nINFO: The board with the name ${name} already exist. \n`);
				return boardNameAndId.boardId;
			}
			// 1.2 Board with the given board name does not exist -> return ERROR and stop function
			// "-1" works as savety check for MIRO REST API behaviour
			// new created miro board could still be in query for indexing and
			// therefore could be not found by getAllMiroBoardNamesAndIds()
			// "If you use any other filter (then teamId), you need to give a few seconds
			// for the indexing of newly created boards before retrieving boards."
			console.log(
				`\n ERROR: The 'Create new Miro Board' checkbox is set to ${createNewBoard} and the given miro board name ${name} was not found inside all miro boards. It could be possible that the searched board does not exist or must be still indexed from MIRO. Please wait a few seconds and try again or check the 'Create new Miro Board' checkbox to create a new miro board. \n`
			);

			return '-1';
		});
	}

	// 2. save_in_existing_miro_board flag is "False" -> create a new miro board with the given name
	// (no matter if the board with this name already exist)
	// remove "Policy" and "SharingPolicy" to use the default settings which are defined in miro admin "Permission" tab
	try {
		return await axios({
			method: 'POST',
			url: 'https://api.miro.com/v2/boards',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			data: {
				name: name,
				description: description,
			},
		}).then((res) => {
			if (res.status === 201) {
				console.log(
					`\nSuccessfully created new miro board with the name ${name} and the board_id ${res.data.id}.\n`
				);
			}
			return res.data.id;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		return '-1';
	}
};

// GET ALL BOARD ITEMS
// default limit is maximum (50)
export const getAllBoardItems = async (board_id: string, max_num_of_items = 50, item_type = '') => {
	let url = `https://api.miro.com/v2/boards/${board_id.replace(
		'=',
		'%3D'
	)}/items?limit=${max_num_of_items}`;

	if (item_type !== '') url = url + `&type=${item_type}`;

	try {
		return await axios({
			method: 'GET',
			url: url,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
		}).then((res) => {
			return res.data.data;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		throw new AxiosError('Error creating miro board', AxiosError.ERR_NETWORK);
	}
};

// ****** CREATE MIRO WIDGETS ******

// CREATE FRAME
export const create_frame = async (
	pos_x: number,
	pos_y: number,
	title: string,
	height: number,
	width: number,
	boardId: string
) => {
	const url = `https://api.miro.com/v2/boards/${boardId.replace('=', '%3D')}/frames`;
	const payload = {
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
	};

	const headers = {
		accept: '*/*',
		'content-type': 'application/json',
		authorization: `Bearer ${bearer}`,
	};

	try {
		return await axios({
			method: 'POST',
			url: url,
			headers: headers,
			data: payload,
		}).then((res) => {
			if (res.status === 201) {
				console.log(`\nSuccessfully created frame named ${title}.\n`);
			}
			return res.data.id;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		return '-1';
	}
};

// CREATE IMAGE
export const create_image = async (
	pos_x: number,
	pos_y: number,
	width: number,
	title: string,
	img: File,
	board_id: string,
	parent_id: string
) => {
	const url = `https://api.miro.com/v2/boards/${board_id.replace('=', '%3D')}/images`;

	const headers = {
		accept: '*/*',
		authorization: `Bearer ${bearer}`,
	};

	const payload = {
		title: title,
		position: {
			x: pos_x,
			y: pos_y,
			origin: 'center',
		},
		geometry: {
			width: width,
			rotation: 0,
		},
		parent: { id: parent_id },
	};

	const data = new FormData();
	data.append('resource', img, `${title}.png`);
	data.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

	try {
		return await axios({
			method: 'POST',
			url: url,
			headers: headers,
			data: data,
		}).then((res) => {
			if (res.status === 201) {
				console.log(`Successfully created image of the sticky note with the name ${img.name}.`);
			}
			return res.status;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		return '-1';
	}
};

// CREATE LINE
export const create_line = async (
	pos_x: number,
	pos_y: number,
	width: number,
	height: number,
	color: string,
	board_id: string,
	parent_id: string
) => {
	const url = `https://api.miro.com/v2/boards/${board_id.replace('=', '%3D')}/shapes`;

	const payload = {
		data: { shape: 'round_rectangle' },
		style: { fillColor: color },
		position: {
			origin: 'center',
			x: pos_x,
			y: pos_y,
		},
		geometry: {
			height: height,
			width: width,
		},
		parent: { id: parent_id },
	};

	try {
		return await axios({
			method: 'POST',
			url: url,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			data: payload,
		}).then((res) => {
			return res;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		return '-1';
	}
};

// CREATE ITEM
export const create_sticky_note = async (
	pos_x: number,
	pos_y: number,
	width: number,
	shape: string,
	color: string,
	text: string,
	board_id: string,
	parent_id: string
): Promise<[number, string]> => {
	// When generating sticky notes with the Miro REST API, it can happen that phyical sticky notes are scanned,
	// which have a line in the text that says "Data".
	// This is recognized by the Google Vision API as for example "Learn\nData\nScience".
	// In this case, \nData\n is interpreted as an avoidable threat, which blocks the request.
	// To solve this, specifically for this case, the string "\nData\n" was replaced by the string " \nData \n".
	const adjusted_text = text.replace('\ndata\n', '\ndata \n').replace('\nData\n', '\nData \n');

	const url = `https://api.miro.com/v2/boards/${board_id.replace('=', '%3D')}/sticky_notes`;
	const payload = {
		data: {
			content: `<p>${adjusted_text}</p>`,
			shape: shape,
		},
		style: { fillColor: color },
		position: {
			origin: 'center',
			x: pos_x,
			y: pos_y,
		},
		geometry: {
			width: width,
		},
		parent: { id: parent_id },
	};

	try {
		return await axios({
			method: 'POST',
			url: url,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
			data: payload,
		}).then((res) => {
			if (res.status === 201) {
				console.log(`Successfully created sticky note with with the text ${text}.`);
			}
			return [res.status, res.data.id];
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		return [-1, '-1'];
	}
};

// ****** DELETE MIRO WIDGETS ******

// DELETE BOARD ITEM
export const deleteItem = async (itemId: string, boardId: string) => {
	const url = `https://api.miro.com/v2/boards/${boardId.replace('=', '%3D')}/items/${itemId}`;

	try {
		return await axios({
			method: 'DELETE',
			url: url,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
		}).then((res) => {
			return res.status;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		throw new AxiosError('Error creating miro board', AxiosError.ERR_NETWORK);
	}
};

// DELETE FRAME
export const deleteFrame = async (frameId: string, boardId: string) => {
	const url = `https://api.miro.com/v2/boards/${boardId.replace('=', '%3D')}/frames/${frameId}`;

	try {
		return await axios({
			method: 'DELETE',
			url: url,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				authorization: `Bearer ${bearer}`,
			},
		}).then((res) => {
			return res.status;
		});
	} catch (err: any) {
		console.log(err.response?.data, err.response?.data?.context);
		throw new AxiosError('Error creating miro board', AxiosError.ERR_NETWORK);
	}
};
