/** @format */

import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createDatabase } from '../main/db.js';
import fs from 'fs';
import db from '../main/db.js';

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

	win.loadURL(
		'http://localhost:5173'
		// `file://${path.join(__dirname, '../dist/index.html')}`
	);
}

app.whenReady().then(() => {
	createDatabase();
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

/*
 * Thông tin về bệnh nhân:
 *   - id: string (định danh duy nhất của bệnh nhân)
 *   - name: string (tên bệnh nhân)
 *   - age: number (tuổi của bệnh nhân)
 *   - phone: string (số điện thoại)
 *   - address: string (địa chỉ)
 *   - citizenId: string (số CMND/CCCD)
 *   - email?: string (email, tùy chọn)
 *   - gender?: 'male' | 'female' | undefined (giới tính, tùy chọn)
 *   - createdAt: Date (ngày tạo)
 *   - updatedAt: Date (ngày cập nhật)
 *   - medicalHistory: string (lịch sử bệnh án)
 *   - allergies: string (dị ứng)
 *   - photoUrl: string (đường dẫn ảnh bệnh nhân)
 *   - notes: string (ghi chú thêm)
 *   - weight?: number (cân nặng, tùy chọn)
 *   - ma_dinh_danh_y_te?: string (mã định danh y tế, tùy chọn)
 *   - bhyt?: string (mã số thẻ bảo hiểm y tế, tùy chọn)
 *   - guardian?: string (người giám hộ, tùy chọn)
 *
 * @format
 */
ipcMain.handle('add-patient', (event, patient) => {
	return new Promise((resolve, reject) => {
		const query = `
		INSERT INTO patients (
			name, age, phone, address, citizenId, email, gender, createdAt, updatedAt, medicalHistory, allergies, photoUrl, notes, weight, ma_dinh_danh_y_te, bhyt, guardian
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
				patient.weight,
				patient.ma_dinh_danh_y_te,
				patient.bhyt,
				patient.guardian,
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

// get patient by id
ipcMain.handle('get-patient-by-id', async (event, id) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM patients WHERE id = ?';
		db.get(query, [id], (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
});

// update patient by id
ipcMain.handle('update-patient-by-id', async (event, { id, updates }) => {
	return new Promise((resolve, reject) => {
		const fields = [
			'name',
			'age',
			'phone',
			'address',
			'citizenId',
			'email',
			'gender',
			'medicalHistory',
			'allergies',
			'photoUrl',
			'notes',
			'weight',
			'ma_dinh_danh_y_te',
			'bhyt',
			'guardian',
		];

		const setClause = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => `${field} = ?`)
			.join(', ');

		const values = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => updates[field]);

		// Always update updatedAt
		const query = `UPDATE patients SET ${setClause}, updatedAt = ? WHERE id = ?`;
		values.push(new Date().toISOString(), id);

		db.run(query, values, function (err) {
			if (err) reject(err);
			else resolve({ success: true, changes: this.changes });
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
