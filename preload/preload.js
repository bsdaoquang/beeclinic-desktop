/** @format */

// preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('beeclinicAPI', {
	getVersion: () => ipcRenderer.invoke('get-version'),
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
	getPrescriptionById: (id) => ipcRenderer.invoke('get-prescription-by-id', id),
	getDiagnosis: () => ipcRenderer.invoke('get-all-diagnosis-in-prescription'),
	deletePrescriptionById: (id) =>
		ipcRenderer.invoke('delete-prescription-by-id', id),
	// get prescriptions by patient id
	getPrescriptionsByPatientId: (patientId) =>
		ipcRenderer.invoke('get-prescriptions-by-patient-id', patientId),
	// search diagnosis from icd10 search-icd-diagnosis
	searchIcdDiagnosis: (key) => ipcRenderer.invoke('search-icd-diagnosis', key),
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
	// services
	addService: (service) => ipcRenderer.invoke('add-service', service),
	updateServiceById: (id, updates) =>
		ipcRenderer.invoke('update-service-by-id', { id, updates }),
	getServices: () => ipcRenderer.invoke('get-services'),
	deleteServiceById: (id) => ipcRenderer.invoke('delete-service-by-id', id),
	// get-machine-id
	getMachineId: () => ipcRenderer.invoke('get-machine-id'),
	// get version
	getVersion: () => ipcRenderer.invoke('get-version'),
	// icd10
	getIcd10s: () => ipcRenderer.invoke('get-icd10s'),
	addIcd10: (data) => ipcRenderer.invoke('add-icd10', data),
	connectGoogle: () => ipcRenderer.invoke('backup:connectGoogle'),
	isConnected: () => ipcRenderer.invoke('backup:isConnected'),
	run: (payload) => ipcRenderer.invoke('backup:run', payload),
	delete: (payload) => ipcRenderer.invoke('backup:delete', payload),
	list: () => ipcRenderer.invoke('backup:list'),
	restore: (payload) => ipcRenderer.invoke('backup:restore', payload),
	setSchedule: (payload) => ipcRenderer.invoke('backup:schedule:set', payload),
	onScheduledOk: (cb) =>
		ipcRenderer.on('backup:scheduled:ok', (_, ts) => cb(ts)),
	onScheduledErr: (cb) =>
		ipcRenderer.on('backup:scheduled:err', (_, msg) => cb(msg)),
	checkSchedule: () => ipcRenderer.invoke('backup:schedule:check'),
	stopSchedule: () => ipcRenderer.invoke('backup:schedule:stop'),

	// open external link
	openExternal: (url) => ipcRenderer.invoke('open-external', url),

	// updater
	check: () => ipcRenderer.invoke('updater:check'),
	download: () => ipcRenderer.invoke('updater:download'),
	install: () => ipcRenderer.invoke('updater:install'),

	onChecking: (cb) => ipcRenderer.on('updater:checking', () => cb()),
	onAvailable: (cb) =>
		ipcRenderer.on('updater:available', (_, info) => cb(info)),
	onNotAvailable: (cb) =>
		ipcRenderer.on('updater:not-available', (_, info) => cb(info)),
	onError: (cb) => ipcRenderer.on('updater:error', (_, e) => cb(e)),
	onProgress: (cb) => ipcRenderer.on('updater:progress', (_, p) => cb(p)),
	onDownloaded: (cb) =>
		ipcRenderer.on('updater:downloaded', (_, info) => cb(info)),
});
