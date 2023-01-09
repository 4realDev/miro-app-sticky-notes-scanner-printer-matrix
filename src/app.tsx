// server: https://brazhnik.de/miro-app-poc/

import React from 'react';
import ReactDOM from 'react-dom';
import GlobalFilteringApp from './components/GlobalFilteringApp/GlobalFilteringApp';
import SwipeableViews from 'react-swipeable-views';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import './app.scss';
import GlobalFilteringAppThroughForeground from './components/GlobalFilteringAppThroughForeground/GlobalFilteringAppThroughForeground';
import MatrixAppGroup from './components/MatrixAppGroups/MatrixAppGroups';
import PostItPrinterApp from './components/PostItPrinterApp/PostItPrinterApp';
import MiroTemplateApp from './components/MiroTemplateApp/MiroTemplateApp';
// interface ITag {
// 	id: string;
// 	title: string;
// 	color: string | number;
// 	widgetIds: string[];
// }

// async function init() {
// 	// const [sticker] = await miro.board.widgets.create({
// 	// 	type: 'sticker',
// 	// 	text: 'Hello, World!',
// 	// 	id: '3458764523613376856',
// 	// });

// 	// Create sticker and card with tag 'Red tag'
// 	let widgets = await miro.board.widgets.create([
// 		{ type: 'sticker', text: 'I am sticker', id: '1' },
// 		{ type: 'card', title: 'I am card' },
// 		// { type: 'card', title: 'I am card', tags: [{ id: '3458764523606869418', title: 'Red tag', color: '#f24726' }] },
// 	]);
// 	// await miro.board.tags.create({ title: 'Red tag', color: '#F24726', widgetIds: '1' });
// 	// await miro.board.viewport.zoomToObject(sticker);
// }

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

const TabPanel = (props: TabPanelProps) => {
	const { children, value, index, ...other } = props;

	return (
		<div
			role='tabpanel'
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
		>
			{value === index &&
				// <Box sx={{ p: 3 }}>
				// 	<Typography>{children}</Typography>
				// </Box>
				children}
		</div>
	);
};

function a11yProps(index: number) {
	return {
		id: `full-width-tab-${index}`,
		'aria-controls': `full-width-tabpanel-${index}`,
	};
}

const App = () => {
	// const [counter, updateCounter] = useState(0);
	// return <h1>Counter: {counter}</h1>;

	const [value, setValue] = React.useState(0);

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const handleChangeIndex = (index: number) => {
		setValue(index);
	};

	return (
		<div>
			<Tabs
				value={value}
				onChange={handleChange}
				indicatorColor='secondary'
				textColor='inherit'
				variant='fullWidth'
				aria-label='full width tabs example'
			>
				<Tab label='Matrix App' {...a11yProps(0)} />
				{/* <Tab label='Filtering Demo' {...a11yProps(1)} /> */}
				{/* <Tab label='Filtering App' {...a11yProps(1)} />
				<Tab label='Filtering App z-Index' {...a11yProps(2)} /> */}
				<Tab label='Post-It Printer App' {...a11yProps(1)} />
				<Tab label='Miro Template App' {...a11yProps(2)} />
			</Tabs>
			<SwipeableViews axis='x' index={value} onChangeIndex={handleChangeIndex}>
				<TabPanel value={value} index={0}>
					<div style={{ padding: 8 + 'px' }}>
						<MatrixAppGroup />
					</div>
				</TabPanel>
				{/* <TabPanel value={value} index={1}>
					<div style={{ padding: 8 + 'px' }}>
						<GlobalFilteringAppFunctionDemo />
					</div>
				</TabPanel> */}
				{/* <TabPanel value={value} index={1}>
					<div style={{ padding: 8 + 'px' }}>
						<GlobalFilteringApp />
					</div>
				</TabPanel>
				<TabPanel value={value} index={2}>
					<div style={{ padding: 8 + 'px' }}>
						<GlobalFilteringAppThroughForeground />
					</div>
				</TabPanel> */}
				<TabPanel value={value} index={1}>
					<div style={{ padding: 8 + 'px' }}>
						<PostItPrinterApp />
					</div>
				</TabPanel>
				<TabPanel value={value} index={2}>
					<div style={{ padding: 8 + 'px' }}>
						<MiroTemplateApp />
					</div>
				</TabPanel>
			</SwipeableViews>
			{/* <FilteringApp /> */}
		</div>
	);

	// return (
	// 	<div className='grid wrapper'>
	// 		<div className='cs1 ce12'>
	// 			<img src='/src/assets/congratulations.png' alt='' />
	// 		</div>
	// 		<div className='cs1 ce12'>
	// 			<h1>Custom HTML Fragments!</h1>
	// 			<p>Here you can show any custom HTML by returning it.</p>
	// 		</div>
	// 		<div className='cs1 ce12'>
	// 			<a className='button button-primary' target='_blank' href='https://developers.miro.com/docs/welcome'>
	// 				Read the documentation
	// 			</a>
	// 		</div>
	// 	</div>
	// );
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
