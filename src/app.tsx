// server: https://brazhnik.de/miro-app-poc/

import React from 'react';
import ReactDOM from 'react-dom';
import './app.scss';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import PostItPrinterApp from './components/PostItPrinterApp/PostItPrinterApp';

const App = () => {
	return (
		<ThemeProvider theme={theme}>
			<PostItPrinterApp />
		</ThemeProvider>
	);
};
export default App;

ReactDOM.render(<App />, document.getElementById('root'));
