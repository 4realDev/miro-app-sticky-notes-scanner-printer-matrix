import customicon from './assets/customicon.svg?raw';
import libraryIcon from './assets/libraryicon.svg?raw';
import './fonts/Heebo/Heebo-Regular.ttf';
import './fonts/Heebo/Heebo-Bold.ttf';

async function init() {
	// Clean the sessionStorage which is used,
	// because the miro estimation tool closes and reopens the app
	// which leads to a data lost without the usage of sessionStorage
	sessionStorage.clear();

	// Enable the 'icon:click' event on the app icon
	miro.board.ui.on('icon:click', async () => {
		// In this example: when the app icon is clicked, a method opens a panel
		await miro.board.ui.openPanel({
			// The content displayed on the panel is fetched from the specified HTML resource
			url: 'app.html',
		});
	});
}

init();

// window.miro.onReady(() => {
// 	console.log('miro onReady');
// 	miro.initialize({
// 		extensionPoints: {
// 			toolbar: {
// 				title: 'User Interaction Test',
// 				toolbarSvgIcon: libraryIcon,
// 				librarySvgIcon: customicon, // icon visible in toolbar >>

// 				async onClick() {
// 					// Remember that 'app.html' resolves relative to index.js file. So app.html have to be in the /dist/ folder.
// 					// HTML UI Shows after clicking the app icon
// 					// app.html calls the app.tsx script, which runs the app functionality
// 					// miro.board.ui.openLibrary disappears after clicking on canvas
// 					// therefore related script stops running and related listeners don’t listen anymore
// 					// to prevent this behaviour, use openLeftSidebar, which stays open after clicking on canvas
// 					await miro.board.ui.openLeftSidebar('app.html');
// 				},
// 			},
// 		},
// 	});
// });
