import React from 'react';
import styles from './Button.module.scss';
import cn from 'classnames';

export type ButtonProps = {
	onClickFunction: any;
	buttonText?: string | undefined;
	buttonIcon?: React.ReactNode;
	isLight?: boolean;
	isDisabled?: boolean;
};

const Button = ({ onClickFunction, buttonIcon, buttonText, isLight = false, isDisabled = false }: ButtonProps) => {
	return (
		<button
			className={cn(isLight ? styles['button__light'] : styles['button__dark'], {
				[styles['button__light__disabled']]: isDisabled && isLight,
				[styles['button__dark__disabled']]: isDisabled && !isLight,
			})}
			onClick={() => onClickFunction()}
		>
			{buttonIcon}
			{buttonText && <span>{buttonText}</span>}
		</button>
	);
};

export default Button;
