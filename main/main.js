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

// prescription handle
/*
	Prescription table columns
	id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_don_thuoc TEXT UNIQUE,
      patient_id INTEGER NOT NULL,
      loai_don_thuoc TEXT,         -- 'c'|'n'|'h'|'y'
      diagnosis TEXT,
      note TEXT,
      ngay_gio_ke_don TEXT,        -- ISO string
      ngay_tai_kham INTEGER,       -- số ngày
      thong_tin_don_thuoc_json TEXT, -- JSON string of items
      sent INTEGER DEFAULT 0,      -- 0: chưa gửi, 1: đã gửi
      sent_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
*/

// save prescription
ipcMain.handle('add-prescription', async (event, prescription) => {
	return new Promise((resolve, reject) => {
		const query = `
			INSERT INTO prescriptions (
				ma_don_thuoc,
				patient_id,
				loai_don_thuoc,
				diagnosis,
				note,
				ngay_gio_ke_don,
				ngay_tai_kham,
				thong_tin_don_thuoc_json,
				sent,
				sent_at,
				created_at,
				reason_for_visit,
				disease_progression
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		db.run(
			query,
			[
				prescription.ma_don_thuoc,
				prescription.patient_id,
				prescription.loai_don_thuoc,
				prescription.diagnosis,
				prescription.note,
				prescription.ngay_gio_ke_don,
				prescription.ngay_tai_kham,
				JSON.stringify(prescription.thong_tin_don_thuoc_json),
				prescription.sent ? 1 : 0,
				prescription.sent_at || null,
				new Date().toISOString(),
				prescription.reason_for_visit,
				prescription.disease_progression,
			],
			function (err) {
				if (err) reject(err);
				else resolve({ id: this.lastID });
			}
		);
	});
});

// get all prescriptions
ipcMain.handle('get-prescriptions', async () => {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT * FROM prescriptions ORDER BY created_at DESC',
			(err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			}
		);
	});
});

// delete prescription by id
ipcMain.handle('delete-prescription-by-id', async (event, id) => {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM prescriptions WHERE id = ?';
		db.run(query, [id], function (err) {
			if (err) {
				reject(err);
			} else {
				resolve({ success: true, changes: this.changes });
			}
		});
	});
});

// medicine
/*
 id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_thuoc TEXT,         -- Mã thuốc (nếu có trong danh mục)
    biet_duoc TEXT,        -- Tên biệt dược (nếu có)
    ten_thuoc TEXT NOT NULL, -- Tên thuốc (bắt buộc)
    unit TEXT,             -- Đơn vị tính (viên, ống, gói...)
    quantity INTEGER,      -- Số lượng
    instruction TEXT,      -- Cách dùng
    expDate TEXT           -- Hạn dùng (ISO string hoặc yyyy-mm-dd)
*/
// add medicine
ipcMain.handle('add-medicine', async (event, medicine) => {
	return new Promise((resolve, reject) => {
		const query = `
			INSERT INTO medicines (
				ma_thuoc,
				biet_duoc,
				ten_thuoc,
				unit,
				quantity,
				instruction,
				expDate
			) VALUES (?, ?, ?, ?, ?, ?, ?)
		`;
		db.run(
			query,
			[
				medicine.ma_thuoc,
				medicine.biet_duoc,
				medicine.ten_thuoc,
				medicine.unit,
				medicine.quantity,
				medicine.instruction,
				medicine.expDate,
			],
			function (err) {
				if (err) reject(err);
				else resolve({ id: this.lastID });
			}
		);
	});
});

// update medicine by id
ipcMain.handle('update-medicine-by-id', async (event, { id, updates }) => {
	return new Promise((resolve, reject) => {
		const fields = [
			'ma_thuoc',
			'biet_duoc',
			'ten_thuoc',
			'unit',
			'quantity',
			'instruction',
			'expDate',
		];

		const setClause = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => `${field} = ?`)
			.join(', ');

		const values = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => updates[field]);

		const query = `UPDATE medicines SET ${setClause} WHERE id = ?`;
		values.push(id);

		db.run(query, values, function (err) {
			if (err) reject(err);
			else resolve({ success: true, changes: this.changes });
		});
	});
});

// get all medicines
ipcMain.handle('get-medicines', async () => {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM medicines ORDER BY ten_thuoc ASC', (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
});

// delete medicine by id
ipcMain.handle('delete-medicine-by-id', async (event, id) => {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM medicines WHERE id = ?';
		db.run(query, [id], function (err) {
			if (err) {
				reject(err);
			} else {
				resolve({ success: true, changes: this.changes });
			}
		});
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
