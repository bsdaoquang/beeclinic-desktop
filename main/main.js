/** @format */

import { app, BrowserWindow } from 'electron';

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		// webPreferences: {
		// 	preload: path.join(__dirname, 'preload.js'), // có thể thêm sau
		// },
	});

	// Sử dụng địa chỉ của Vite server trong quá trình dev
	win.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
