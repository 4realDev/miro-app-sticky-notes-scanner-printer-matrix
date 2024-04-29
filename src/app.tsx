// server: https://brazhnik.de/miro-app-poc/

import React from 'react';
import ReactDOM from 'react-dom';
import './app.scss';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import ToolboxStartScreen from './components/ToolboxStartScreen/ToolboxStartScreen';

const App = () => {
	return (
		<ThemeProvider theme={theme}>
			<ToolboxStartScreen />
		</ThemeProvider>
	);
};
export default App;

// window.miro.onReady(() => {
// 	ReactDOM.render(
// 		<React.StrictMode>
// 			<App />
// 		</React.StrictMode>,
// 		document.getElementById('root')
// 	);
// });

ReactDOM.render(<App />, document.getElementById('root'));
