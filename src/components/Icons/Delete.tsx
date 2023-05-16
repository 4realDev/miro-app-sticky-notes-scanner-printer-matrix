import React from 'react';

const Delete = ({ ...props }) => {
	return (
		<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
			<path
				d='M20 0C8.95 0 0 8.95 0 20C0 31.05 8.95 40 20 40C31.05 40 40 31.05 40 20C40 8.95 31.05 0 20 0ZM30 27.17L27.17 30L20 22.83L12.83 30L10 27.17L17.17 20L10 12.83L12.83 10L20 17.17L27.17 10L30 12.83L22.83 20L30 27.17Z'
				fill='black'
			/>
		</svg>
	);
};

export default Delete;
