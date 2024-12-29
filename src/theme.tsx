import { createTheme } from '@mui/material/styles';

// Create a theme instance
export const theme = createTheme({
	// palette: {
	// 	primary: {
	// 		main: '#FFEF00',
	// 	},
	// 	secondary: {
	// 		main: '#283042',
	// 	},
	// },
	// Overrides of components
	components: {
		// *** MUI STEPPER ADJUSTMENTS ***
		MuiStep: {
			styleOverrides: {
				root: {
					paddingLeft: '0px',
					paddingRight: '0px',
				},
			},
		},
		MuiStepper: {
			styleOverrides: {
				root: {
					width: '100%',
					transition: 'all ease-in-out 0.5',
					cursor: 'default',
				},
			},
		},
		MuiStepButton: {
			defaultProps: {
				disableRipple: true,
				disableTouchRipple: true,
			},
			styleOverrides: {
				root: {
					padding: '0px',
					margin: '0px',
				},
			},
		},

		MuiStepLabel: {
			styleOverrides: {
				iconContainer: {
					paddingRight: '0px',
				},
			},
		},
		MuiStepConnector: {
			styleOverrides: {
				line: {
					borderColor: '#000000',
					marginLeft: '8px',
					marginRight: '8px',
				},
			},
		},

		MuiSvgIcon: {
			styleOverrides: {
				root: {
					height: '24px',
					width: '24px',
					fill: '#CFCFCF',
					transition: 'ease-in-out all 200ms',
					'&.Mui-active': {
						fill: '#000000',
					},
					'&.Mui-active > text': {
						fill: '#ffffff',
					},

					'&.Mui-completed': {
						fill: '#000000',
					},
				},
			},
		},

		MuiOutlinedInput: {
			styleOverrides: {
				notchedOutline: {
					borderColor: '#000000',
				},
			},
		},

		MuiStepIcon: {
			styleOverrides: {
				text: {
					fontSize: '14px',
					fontWeight: 500,
					fill: '#6A6A6A',
				},
			},
		},
		// *** MUI STEPPER ADJUSTMENTS ***

		// *** MUI INPUT FIELD MUI MENU LIST ADJUSTMENTS ***
		// used in Presentation Mode
		MuiPaper: {
			styleOverrides: {
				root: {
					top: '17%',
					height: '72%',
				},
			},
		},
		// *** MUI INPUT FIELD MUI MENU LIST ADJUSTMENTS ***
	},
});
