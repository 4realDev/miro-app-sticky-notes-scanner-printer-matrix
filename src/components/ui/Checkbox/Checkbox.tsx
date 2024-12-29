import React from 'react';

type CheckboxType = {
	label: string;
	value: boolean | undefined;
	onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
};

const Checkbox = ({ label, value, onChange }: CheckboxType) => {
	return (
		<label>
			<input type='checkbox' checked={value} onChange={onChange} />
			{label}
		</label>
	);
};

export default Checkbox;
