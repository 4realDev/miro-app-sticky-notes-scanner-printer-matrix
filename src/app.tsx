import React from 'react';
import ReactDOM from 'react-dom';
import CSS from 'csstype';
import FilteringApp from './components/FilteringApp';
import MatrixApp from './components/MatrixApp';

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

export const buttonStyle: CSS.Properties = {
	fontSize: '0.875rem',
	lineHeight: '1.125rem',
	borderRadius: '3px',
	border: '1px solid transparent',
	fontWeight: '700',
	textTransform: 'uppercase',
	padding: '8px 16px',
	textAlign: 'center',
	backgroundColor: '#459fd8',
	color: '#fff',
	fontFamily: 'Inter,sans-serif',
	fontStretch: 'normal',
	fontStyle: 'normal',
	letterSpacing: 'normal',
	marginTop: '16px',
	marginBottom: '4px',
	width: '100%',
};

export const inputStyle: CSS.Properties = {
	fontSize: '0.875rem',
	lineHeight: '1.125rem',
	borderRadius: '3px',
	border: '1px solid transparent',
	outline: '2px solid #459fd8',
	fontWeight: '500',
	padding: '8px 16px',
	textAlign: 'left',
	backgroundColor: '#fff',
	color: '#000',
	fontFamily: 'Inter,sans-serif',
	fontStretch: 'normal',
	fontStyle: 'normal',
	letterSpacing: 'normal',
	width: ' 100%',
};

export const inputContainer: CSS.Properties = {
	display: 'flex',
	justifyContent: 'center',
	flexDirection: 'column',
	marginBottom: '8px',
	height: 'auto',
};

export const h1Style: CSS.Properties = {
	fontSize: '1.8rem',
	fontWeight: '700',
	fontFamily: 'Inter,sans-serif',
	fontStretch: 'normal',
	fontStyle: 'normal',
	letterSpacing: 'normal',
};

export const h3Style: CSS.Properties = {
	fontSize: '1.2rem',
	fontWeight: '500',
	fontFamily: 'Inter,sans-serif',
	fontStretch: 'normal',
	fontStyle: 'normal',
	letterSpacing: 'normal',
	marginTop: '42px',
	marginBottom: '8px',
};

const App = () => {
	// const [counter, updateCounter] = useState(0);
	// return <h1>Counter: {counter}</h1>;
	return (
		<div>
			<h1 style={h1Style}>MIRO APP POC</h1>
			<FilteringApp />
			<MatrixApp />
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

window.miro.onReady(() => {
	ReactDOM.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
		document.getElementById('root')
	);
});

// ReactDOM.render(<App />, document.getElementById('root'));
