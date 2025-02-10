export const createScanningStartPoint = async (x: number, y: number) => {
	const shape = await miro.board.createShape({
		style: {
			fillColor: '#fef445',
			borderColor: '#1a1a1a',
			borderOpacity: 0.2,
			borderStyle: 'dashed',
			borderWidth: 5,
			color: '#1a1a1a',
			fillOpacity: 1,
			fontFamily: 'open_sans',
			fontSize: 48,
			textAlign: 'center',
			textAlignVertical: 'middle',
		},
		x: x,
		y: y,
		width: 380,
		height: 145,
		rotation: 0,
		shape: 'rectangle',
		content: '<p><strong>[scanning]</strong></p>',
	});

	await shape.sync();
};
