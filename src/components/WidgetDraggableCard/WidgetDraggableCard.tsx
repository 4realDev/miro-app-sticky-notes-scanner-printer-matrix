import React, { memo } from 'react';
import styles from './WidgetDraggableCard.module.scss';
import { MatrixDraggleId } from '../MatrixWizard/MatrixWizard/MatrixWizard';

type WidgetDraggableCard = {
	title: string;
	thumbnail: string;
	id?: MatrixDraggleId;
};

const WidgetDraggableCard = ({ title, thumbnail, id }: WidgetDraggableCard) => {
	return (
		<div className={styles.wizard__draggableCardContainer}>
			<div className={styles.wizard__draggableCardText}>{title}</div>
			<img
				src={thumbnail}
				draggable={false}
				className='miro-draggable'
				id={id}
				height='50'
				style={{ cursor: 'pointer' }}
			/>
		</div>
	);
};

export default memo(WidgetDraggableCard);
