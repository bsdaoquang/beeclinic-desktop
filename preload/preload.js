/** @format */

// preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('beeclinicAPI', {
	addPatient: (data) => ipcRenderer.invoke('add-patient', data),
	getPatients: () => ipcRenderer.invoke('get-patients'),
	saveFileToAssets: (data) => ipcRenderer.invoke('save-file-to-assets', data),
});
