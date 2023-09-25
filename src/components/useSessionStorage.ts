import { useState, useEffect } from 'react';

let sessionStorageStatesList: Array<{ value: any; setter: React.Dispatch<any> }> = [];

const getStorageValue = (key: string, defaultValue: any) => {
	// getting stored value
	const saved = sessionStorage.getItem(key);
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

	sessionStorageStatesList.push({ value: value, setter: setValue });
	return [value, setValue];
};

export const clearSessionStorageAndStates = () => {
	sessionStorageStatesList.forEach((valueSetterTuple) => {
		if (typeof valueSetterTuple.value === 'number') valueSetterTuple.setter(0);
		if (typeof valueSetterTuple.value === 'string') valueSetterTuple.setter('');
		else if (Array.isArray(valueSetterTuple.value)) valueSetterTuple.setter([]);
		else valueSetterTuple.setter(undefined);
	});
	sessionStorage.clear();
};
