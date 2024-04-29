import React, { useEffect } from 'react';
import styles from './CreateMatrixCard.module.scss';
import specialCardThumbnail from '../../../assets/special_card_thumbnail.png';

const CreateMatrixCard = () => {
	useEffect(() => {
		const createMatrixCard = async (x: number, y: number) => {
			const matrixCardPadding = 30;
			const matrixCardWidth = 600;
			const matrixCardHeight = 430;
			const frame = await miro.board.createFrame({
				title: 'Card',
				style: {
					fillColor: '#ffffff',
				},
				x: x,
				y: y,
				width: matrixCardWidth,
				height: matrixCardHeight,
			});

			const frameBackground = await miro.board.createShape({
				content: '',
				width: matrixCardWidth,
				height: matrixCardHeight,
				rotation: 0,
				x: x,
				y: y,
				style: {
					fillColor: '#ffffff',
				},
			});

			const picturePlaceHolderWidth = 217;
			const picturePlaceHolderHeight = 196;
			const framePicturePlaceholder = await miro.board.createShape({
				content: '<p>Pictures or Illustrations</p>',
				height: picturePlaceHolderHeight,
				width: picturePlaceHolderWidth,
				x: x - matrixCardWidth / 2 + picturePlaceHolderWidth / 2 + matrixCardPadding,
				y: y - 30,
				style: {
					borderColor: '#1a1a1a',
					borderOpacity: 0.2,
					borderStyle: 'normal',
					borderWidth: 1,
					color: '#1a1a1a',
					fillColor: 'transparent',
					fillOpacity: 1,
					fontFamily: 'open_sans',
					fontSize: 10,
					textAlign: 'center',
					textAlignVertical: 'middle',
				},
			});

			const titleWidth = 444;
			const titleHeight = 34;
			const frameTitle = await miro.board.createText({
				content: '<p><strong>Titel</strong></p>',
				height: titleHeight,
				width: titleWidth,
				x: x - matrixCardWidth / 2 + titleWidth / 2 + matrixCardPadding,
				y: y - matrixCardHeight / 2 + titleHeight / 2 + matrixCardPadding,
				style: {
					color: '#1a1a1a',
					fillColor: 'transparent',
					fillOpacity: 1,
					fontFamily: 'open_sans',
					fontSize: 24,
					textAlign: 'left',
				},
			});

			const detailsWidth = 320;
			const detailsHeight = 120;
			const frameDetails = await miro.board.createText({
				content:
					'<ol><li data-list="bullet"><span class="ql-ui"><span class="ql-list-ui"></span></span>Detail text of this epic, solution idea or item</li><li data-list="bullet"><span class="ql-ui"><span class="ql-list-ui"></span></span>Detail</li><li data-list="bullet"><span class="ql-ui"><span class="ql-list-ui"></span></span>Detail</li><li data-list="bullet"><span class="ql-ui"><span class="ql-list-ui"></span></span>Detail</li><li data-list="bullet"><span class="ql-ui"><span class="ql-list-ui"></span></span>Detail</li><li data-list="bullet"><span class="ql-ui"><span class="ql-list-ui"></span></span>Detail</li></ol>',
				height: detailsHeight,
				width: detailsWidth,
				x: x + detailsWidth / 2.75,
				y: y - matrixCardPadding * 2.2,
				style: {
					color: '#1a1a1a',
					fillColor: 'transparent',
					fillOpacity: 1,
					fontFamily: 'open_sans',
					fontSize: 14,
					textAlign: 'left',
				},
			});

			const stickyNoteSize = 66;
			const frameDifficultyStickyNote = await miro.board.createStickyNote({
				content: '<p>Difficulty</p>',
				x: x - matrixCardWidth / 2 + stickyNoteSize / 2 + matrixCardPadding,
				y: y + matrixCardHeight / 2 - stickyNoteSize / 2 - matrixCardPadding,
				width: stickyNoteSize,
				style: {
					fillColor: 'gray',
					textAlign: 'center',
					textAlignVertical: 'middle',
				},
			});

			const titleImageWidth = 50;
			const titleImageHeight = 19;
			const frameTitleImage = await miro.board.createImage({
				url: 'https://media.licdn.com/dms/image/C4E0BAQFVx-QQTeAb3A/company-logo_200_200/0/1583501052292?e=2147483647&v=beta&t=5sawspaZSLsWzqnkeUcs278sxJ2DL2zVgkQLRFI8JbM',
				x: x + matrixCardWidth / 2 - titleImageWidth / 2 - matrixCardPadding,
				y: y - matrixCardHeight / 2 + titleImageHeight / 2 + matrixCardPadding,
				width: titleImageWidth,
			});

			frame.childrenIds = [
				frameBackground.id,
				framePicturePlaceholder.id,
				frameTitle.id,
				frameDetails.id,
				frameDifficultyStickyNote.id,
				frameTitleImage.id,
			];

			await frame.sync();
		};

		// register event once component mounts
		// event handler calls a function when the dragged panel item is dropped on the board
		miro.board.ui.on('drop', ({ x, y }) => {
			createMatrixCard(x, y);
		});

		// unregister event on component unmount
		return () => {
			miro.board.ui.off('drop', ({ x, y }) => {
				createMatrixCard(x, y);
			});
		};
	}, []);

	// return <Button onClickFunction={() => createMatrixCard()} buttonText='Create Matrix Card' isLight={true} />;
	return (
		<div className={styles.wizard__draggableCardContainer}>
			<div className={styles.wizard__draggableCardText}>Draggable Special Card:</div>
			<img
				src={specialCardThumbnail}
				draggable={false}
				className='miro-draggable'
				height='50'
				style={{ cursor: 'pointer' }}
			/>
		</div>
	);
};

export default CreateMatrixCard;
