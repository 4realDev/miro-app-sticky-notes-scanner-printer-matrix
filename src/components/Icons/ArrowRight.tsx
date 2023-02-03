import React from 'react';

const ArrowRight = ({ ...props }) => {
	return (
		<svg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
			<path
				fill-rule='evenodd'
				clip-rule='evenodd'
				d='M12.8189 5.29289C13.2094 4.90237 13.8426 4.90237 14.2331 5.29289L18.2331 9.29289C18.6236 9.68342 18.6236 10.3166 18.2331 10.7071L14.2331 14.7071C13.8426 15.0976 13.2094 15.0976 12.8189 14.7071C12.4284 14.3166 12.4284 13.6834 12.8189 13.2929L15.1118 11H3.526C2.97372 11 2.526 10.5523 2.526 10C2.526 9.44772 2.97372 9 3.526 9H15.1118L12.8189 6.70711C12.4284 6.31658 12.4284 5.68342 12.8189 5.29289Z'
				fill='black'
			/>
		</svg>
	);
};

export default ArrowRight;
