import React, { Dispatch, SetStateAction, useRef } from 'react';
import styles from './CustomFileInput.module.scss';
import Button from '../Button/Button';
import ImageUpload from '../../Icons/ImageUpload';

type CustomFileInputProps = {
	setSelectedImages: Dispatch<SetStateAction<FileList | null>>;
	setSliderImages: Dispatch<
		SetStateAction<
			Array<{
				img: string;
				id: string;
			}>
		>
	>;
};

const CustomFileInput = ({ setSelectedImages, setSliderImages }: CustomFileInputProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleButtonClick = () => {
		fileInputRef.current && fileInputRef.current.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		// const file = event.target.files[0];
		// setSelectedFile(file);
		if (event.target.files) {
			setSelectedImages(event.target.files);
			const sliderImagesList = Array.from(event.target.files).map((file) => {
				return { img: URL.createObjectURL(file), id: file.name };
			});
			setSliderImages(sliderImagesList);
		}
	};

	return (
		<div className={styles.container}>
			<input
				type='file'
				id='myImage'
				name='myImage'
				multiple
				hidden
				ref={fileInputRef}
				onChange={handleFileChange}
				className={styles.fileInput}
				// accept='image/*'
			/>

			<Button
				isLight
				buttonIcon={<ImageUpload />}
				buttonText={'Upload images'}
				onClickFunction={handleButtonClick}
			/>
		</div>
	);
};

export default CustomFileInput;
