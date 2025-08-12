/** @format */

import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import db from '../main/db.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, '../preload/preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	win.maximize();
	// Sử dụng địa chỉ của Vite server trong quá trình dev
	win.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

//API lưu bệnh nhân

ipcMain.handle('add-patient', (event, patient) => {
	return new Promise((resolve, reject) => {
		const query = `
		INSERT INTO patients (
			name, age, phone, address, citizenId, email, gender, createdAt, updatedAt, medicalHistory, allergies, photoUrl, notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`;
		db.run(
			query,
			[
				patient.name,
				patient.age,
				patient.phone,
				patient.address,
				patient.citizenId,
				patient.email,
				patient.gender,
				new Date().toISOString(),
				new Date().toISOString(),
				patient.medicalHistory,
				patient.allergies,
				patient.photoUrl,
				patient.notes,
			],
			function (err) {
				if (err) reject(err);
				else resolve({ id: this.lastID });
			}
		);
	});
});

// get patients
ipcMain.handle('get-patients', async () => {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM patients ORDER BY createdAt DESC', (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
});

// delete patient
ipcMain.handle('delete-patient', async (event, id) => {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM patients WHERE id = ?';
		db.run(query, [id], function (err) {
			if (err) {
				reject(err);
			} else {
				resolve({ success: true, changes: this.changes });
			}
		});
	});
});

// files handle
ipcMain.handle('save-file-to-assets', async (event, { fileName, buffer }) => {
	try {
		const assetsPath = path.join(__dirname, '../renderer/public/assets/files');
		if (!fs.existsSync(assetsPath)) {
			fs.mkdirSync(assetsPath);
		}

		const filePath = path.join(assetsPath, fileName);
		fs.writeFileSync(filePath, Buffer.from(buffer));

		return { success: true, path: filePath };
	} catch (err) {
		console.error(err);
		return { success: false, error: err.message };
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
