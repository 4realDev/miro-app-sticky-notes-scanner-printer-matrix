import { useState, useEffect } from 'react';

const getStorageValue = (key: string, defaultValue: any) => {
	// getting stored value
	const saved = sessionStorage.getItem(key);
	console.log(saved);
	console.log(typeof saved);
	return saved && saved !== 'undefined' ? JSON.parse(saved) : defaultValue;
};

export const useSessionStorage = (key: string, defaultValue: any) => {
	const [value, setValue] = useState(() => {
		return getStorageValue(key, defaultValue);
	});

	useEffect(() => {
		// storing input name
		sessionStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
};
