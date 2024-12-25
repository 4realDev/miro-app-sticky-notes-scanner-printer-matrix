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
