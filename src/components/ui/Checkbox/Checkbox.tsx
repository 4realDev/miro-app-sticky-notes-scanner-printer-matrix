import React from 'react';
import styles from './Checkbox.module.scss';

type CheckboxType = {
	label: string;
	value: boolean | undefined;
	onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
};

const Checkbox = ({ label, value, onChange }: CheckboxType) => {
	return (
		<label className={styles.checkboxContainer}>
			<input
				type='checkbox'
				checked={value}
				onChange={onChange}
				className={styles.checkbox}
			/>
			<div className={styles.checkboxLabel}>{label}</div>
		</label>
	);
};

export default Checkbox;
