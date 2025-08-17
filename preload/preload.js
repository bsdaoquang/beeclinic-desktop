/** @format */

// preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('beeclinicAPI', {
	addPatient: (data) => ipcRenderer.invoke('add-patient', data),
	getPatients: () => ipcRenderer.invoke('get-patients'),
	deletePatient: (id) => ipcRenderer.invoke('delete-patient', id),
	getPatientById: (id) => ipcRenderer.invoke('get-patient-by-id', id),
	updatePatientById: (id, data) =>
		ipcRenderer.invoke('update-patient-by-id', {
			id,
			updates: data,
		}),
	saveFileToAssets: (data) => ipcRenderer.invoke('save-file-to-assets', data),
	addPrescription: (data) => ipcRenderer.invoke('add-prescription', data),
	getPrescriptions: () => ipcRenderer.invoke('get-prescriptions'),
	// getPrescriptionById: (id) => ipcRenderer.invoke('get-prescription-by-id', id),
	deletePrescriptionById: (id) =>
		ipcRenderer.invoke('delete-prescription-by-id', id),
	addMedicine: (medicine) => ipcRenderer.invoke('add-medicine', medicine),
	updateMedicineById: (id, updates) =>
		ipcRenderer.invoke('update-medicine-by-id', { id, updates }),
	getMedicines: () => ipcRenderer.invoke('get-medicines'),
	deleteMedicineById: (id) => ipcRenderer.invoke('delete-medicine-by-id', id),
	// clinic
	getClinicInfo: () => ipcRenderer.invoke('get-clinic-infos'),
	addClinic: (data) => ipcRenderer.invoke('create-clinic-info', data),
	updateClinicById: (id, updates) =>
		ipcRenderer.invoke('update-clinic-info-by-id', { id, updates }),
});
