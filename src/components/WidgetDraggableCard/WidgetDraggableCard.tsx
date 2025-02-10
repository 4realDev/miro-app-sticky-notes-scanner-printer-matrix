import React, { useCallback, useEffect } from 'react';
import styles from './WidgetDraggableCard.module.scss';

type WidgetDraggableCard = {
	title: string;
	thumbnail: string;
	createWidgetMethod: (x: number, y: number) => Promise<void>;
};

const WidgetDraggableCard = ({ title, thumbnail, createWidgetMethod }: WidgetDraggableCard) => {
	const dropHandler = useCallback(
		async ({ x, y }) => {
			await createWidgetMethod(x, y);
		},
		[createWidgetMethod]
	);

	useEffect(() => {
		// register event once component mounts
		// event handler calls a function when the dragged panel item is dropped on the board
		console.log('component mount');
		miro.board.ui.on('drop', dropHandler);

		// unregister event on component unmount
		return () => {
			console.log('component unmount');
			miro.board.ui.off('drop', dropHandler);
		};
	}, []);

	return (
		<div className={styles.wizard__draggableCardContainer}>
			<div className={styles.wizard__draggableCardText}>{title}</div>
			<img
				src={thumbnail}
				draggable={false}
				className='miro-draggable'
				height='50'
				style={{ cursor: 'pointer' }}
			/>
		</div>
	);
};

export default WidgetDraggableCard;
