import React, { useState } from 'react';
import styles from './StickyNotePreviewSlider.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import Delete from '../../Icons/Delete';

type StickyNotePreviewSliderType = {
	stickyNoteSliderImages: Array<{ img: string; id: string }>;
	setStickyNotesSliderImages: React.Dispatch<
		React.SetStateAction<
			{
				img: string;
				id: string;
			}[]
		>
	>;
};
const StickyNotePreviewSlider = ({
	stickyNoteSliderImages,
	setStickyNotesSliderImages,
}: StickyNotePreviewSliderType) => {
	const [thumbsSwiper, setThumbsSwiper] = useState(null);

	return (
		<div className={styles.imageSliderContainer}>
			{stickyNoteSliderImages.length > 0 ? (
				<Swiper
					style={{
						'--swiper-navigation-color': '#000000',
						'--swiper-pagination-color': '#000000',
					}}
					// spaceBetween={1}
					thumbs={{
						swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
					}}
					slidesPerView={1}
					navigation
					modules={[FreeMode, Navigation, Thumbs]}
					centeredSlides
					slideToClickedSlide
					roundLengths
					className='imageSlider'>
					{stickyNoteSliderImages.map((img) => {
						return (
							<SwiperSlide
								key={`${img.id}-${img.img}`}
								style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
								<img
									id={img.id}
									src={img.img}
									className={styles.sliderImage}
									alt={img.id}
								/>
							</SwiperSlide>
						);
					})}
				</Swiper>
			) : (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<div
						style={{
							width: '208px',
							height: '208px',
							background: '#D9D9D9',
							boxShadow:
								'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px',
							marginBottom: '24px',
						}}
					/>
				</div>
			)}
			<div className={styles.thumbnailSliderContainer}>
				{stickyNoteSliderImages.length > 0 ? (
					<Swiper
						onSwiper={setThumbsSwiper}
						spaceBetween={8}
						// slidesPerView={}
						freeMode={true} // necessary for swiping the thumbnails left/right with cursor
						watchSlidesProgress={true} // necessary for thumbnails
						modules={[FreeMode, Navigation, Thumbs]}
						className={styles.thumbnailSlider}
						// centeredSlides
						width={75}
						height={75}
						slideToClickedSlide
						roundLengths
						navigation={{
							nextEl: '.thumb_next',
							prevEl: '.thumb_prev',
						}}
						slidesOffsetAfter={-195}
						// breakpoints={{
						// 	640: {
						// 		slidesPerView: 4,
						// 		spaceBetween: 20,
						// 	},
						// 	768: {
						// 		slidesPerView: 5,
						// 		spaceBetween: 40,
						// 	},
						// 	1024: {
						// 		slidesPerView: 8,
						// 		spaceBetween: 20,
						// 	},
						// }}
					>
						{stickyNoteSliderImages.map((img, index) => {
							return (
								<SwiperSlide style={{ marginLeft: index === 0 ? '8px' : '0px' }}>
									<button
										className={styles.deleteButton}
										onClick={() => {
											let arrayCopy = [...stickyNoteSliderImages];
											const indexOfElementToRemove = stickyNoteSliderImages.indexOf(img);
											if (indexOfElementToRemove !== -1) {
												arrayCopy.splice(indexOfElementToRemove, 1);
												setStickyNotesSliderImages(arrayCopy);
											}
										}}>
										<Delete />
									</button>
									<img
										key={img.id}
										src={img.img}
										className={styles.sliderImageThumbnail}
									/>
								</SwiperSlide>
							);
						})}
					</Swiper>
				) : (
					<div style={{ gap: '8px', display: 'flex', marginBottom: '31px' }}>
						<div
							style={{
								width: '75px',
								height: '75px',
								background: '#D9D9D9',
							}}
						/>
						<div
							style={{
								width: '75px',
								height: '75px',
								background: '#D9D9D9',
							}}
						/>
						<div
							style={{
								width: '75px',
								height: '75px',
								background: '#D9D9D9',
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default StickyNotePreviewSlider;
