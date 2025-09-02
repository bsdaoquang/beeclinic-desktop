/** @format */

import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createDatabase } from '../main/db.js';
import fs from 'fs';
import db from '../main/db.js';
import pkg from 'node-machine-id';
import updatepkg from 'electron-updater';

const { autoUpdater } = updatepkg;
const { machineIdSync } = pkg;

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
		icon: path.join(__dirname, '../assets/icons/icon.png'), // Linux, Windows
	});

	win.maximize();

	if (app.isPackaged) {
		win.loadFile(path.join(__dirname, '../dist/index.html'));
	} else {
		win.loadURL('http://localhost:5173');
		// win.webContents.openDevTools();
	}
}

app.whenReady().then(async () => {
	await createDatabase();
	await ensureIcd10Data();
	await ensureClinicInfo();
	createWindow();
	autoUpdater.checkForUpdatesAndNotify();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// get version
ipcMain.handle('get-version', async () => {
	return { version: app.getVersion() };
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
				thong_tin_dich_vu_json,
				sent,
				sent_at,
				created_at,
				reason_for_visit,
				disease_progression,
				total
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
				JSON.stringify(prescription.thong_tin_dich_vu_json),
				prescription.sent ? 1 : 0,
				prescription.sent_at || null,
				new Date().toISOString(),
				prescription.reason_for_visit,
				prescription.disease_progression,
				prescription.total || 0,
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

// get prescription by id
ipcMain.handle('get-prescription-by-id', async (event, id) => {
	return new Promise((resolve, reject) => {
		db.get('SELECT * FROM prescriptions WHERE id = ?', [id], (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
});

// get precriptions by patient id
ipcMain.handle('get-prescriptions-by-patient-id', async (event, patientId) => {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC',
			[patientId],
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
				expDate,
				gia_mua,
				gia_ban
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
				medicine.gia_mua || 0, // Default to 0 if not provided
				medicine.gia_ban || 0, // Default to 0 if not provided
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
			'gia_mua',
			'gia_ban',
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
ipcMain.handle('get-clinic-infos', async () => {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT * FROM clinic_infos ORDER BY CreatedAt DESC',
			(err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			}
		);
	});
});

ipcMain.handle('ensure-clinic-info', async () => {
	return ensureClinicInfo().then(async (result) => {
		// Always update MachineId if not set
		return new Promise((resolve, reject) => {
			db.get('SELECT MachineId FROM clinic_infos WHERE id = 1', (err, row) => {
				if (err) return reject(err);
				if (!row) {
					db.run(
						'UPDATE clinic_infos SET MachineId = ?, UpdatedAt = ? WHERE id = 1',
						[id, new Date().toISOString()],
						function (updateErr) {
							if (updateErr) reject(updateErr);
							else resolve(result);
						}
					);
				} else {
					resolve(result);
				}
			});
		});
	});
});

ipcMain.handle('update-clinic-info-by-id', async (event, { id, updates }) => {
	return new Promise((resolve, reject) => {
		const fields = [
			'CSKCBID',
			'TenCSKCB',
			'DiaChi',
			'DienThoai',
			'Email',
			'SoGiayPhepHoatDong',
			'NgayCapGiayPhep',
			'NoiCapGiayPhep',
			'HoTenBS',
			'SoChungChiHanhNghe',
			'KhoaPhong',
			'ChucVu',
			'MachineId',
			'AppVersion',
			'ActivationKey',
			'CongKham', // bổ sung công khám
		];

		const setClause = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => `${field} = ?`)
			.join(', ');

		const values = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => updates[field]);

		const query = `UPDATE clinic_infos SET ${setClause}, UpdatedAt = ? WHERE id = ?`;
		values.push(new Date().toISOString(), id);

		db.run(query, values, function (err) {
			if (err) reject(err);
			else resolve({ success: true, changes: this.changes });
		});
	});
});

ipcMain.handle('add-service', async (event, service) => {
	return new Promise((resolve, reject) => {
		const query = `
			INSERT INTO services (
				ten_dich_vu,
				mo_ta,
				gia,
				thoi_gian,
				createdAt,
				updatedAt
			) VALUES (?, ?, ?, ?, ?, ?)
		`;
		const now = new Date().toISOString();
		db.run(
			query,
			[
				service.ten_dich_vu,
				service.mo_ta || '',
				service.gia || 0,
				service.thoi_gian || 0,
				now,
				now,
			],
			function (err) {
				if (err) reject(err);
				else resolve({ id: this.lastID });
			}
		);
	});
});

ipcMain.handle('get-services', async () => {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM services ORDER BY createdAt DESC', (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
});

ipcMain.handle('update-service-by-id', async (event, { id, updates }) => {
	return new Promise((resolve, reject) => {
		const fields = ['ten_dich_vu', 'mo_ta', 'gia', 'thoi_gian'];

		const setClause = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => `${field} = ?`)
			.join(', ');

		const values = fields
			.filter((field) => updates[field] !== undefined)
			.map((field) => updates[field]);

		const query = `UPDATE services SET ${setClause}, updatedAt = ? WHERE id = ?`;
		values.push(new Date().toISOString(), id);

		db.run(query, values, function (err) {
			if (err) reject(err);
			else resolve({ success: true, changes: this.changes });
		});
	});
});

ipcMain.handle('delete-service-by-id', async (event, id) => {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM services WHERE id = ?';
		db.run(query, [id], function (err) {
			if (err) {
				reject(err);
			} else {
				resolve({ success: true, changes: this.changes });
			}
		});
	});
});

// read json cid10 form ../assets/icd-10.json
const jsonPath = path.join(__dirname, '../assets/icd-10.json');

const icd10Data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const machineId = machineIdSync();

console.log(icd10Data.length + ' ICD-10 codes loaded');

// Ensure clinic_infos row with id=1 exists at startup
async function ensureClinicInfo() {
	return new Promise((resolve, reject) => {
		db.get('SELECT * FROM clinic_infos WHERE id = 1', (err, row) => {
			if (err) {
				// Table might not exist yet, try to create it
				const createTableQuery = `
					CREATE TABLE IF NOT EXISTS clinic_infos (
						id INTEGER PRIMARY KEY,
						CSKCBID TEXT,
						TenCSKCB TEXT,
						DiaChi TEXT,
						DienThoai TEXT,
						Email TEXT,
						SoGiayPhepHoatDong TEXT,
						NgayCapGiayPhep TEXT,
						NoiCapGiayPhep TEXT,
						HoTenBS TEXT,
						SoChungChiHanhNghe TEXT,
						KhoaPhong TEXT,
						ChucVu TEXT,
						MachineId TEXT,
						AppVersion TEXT,
						ActivationKey TEXT,
						ClinicAccessToken TEXT,
						DoctorAccessToken TEXT,
						CongKham INTEGER DEFAULT 100000,
						CreatedAt TEXT,
						UpdatedAt TEXT
					)
				`;
				db.run(createTableQuery, (createErr) => {
					if (createErr) return reject(createErr);
					// After creating table, insert default row
					const now = new Date().toISOString();
					const insertQuery = `
						INSERT INTO clinic_infos (
							id,
							CSKCBID,
							TenCSKCB,
							DiaChi,
							DienThoai,
							Email,
							SoGiayPhepHoatDong,
							NgayCapGiayPhep,
							NoiCapGiayPhep,
							HoTenBS,
							SoChungChiHanhNghe,
							KhoaPhong,
							ChucVu,
							MachineId,
							AppVersion,
							ActivationKey,
							ClinicAccessToken,
							DoctorAccessToken,
							CreatedAt,
							UpdatedAt,
							CongKham,
						) VALUES (
							1, '', '', '', '', '', '', '', '', '', '', '', '', ?, '', '', '', '', ?, ?, ?
						)
					`;
					db.run(insertQuery, [machineId, now, now], function (insertErr) {
						if (insertErr) reject(insertErr);
						else resolve({ created: true, id: 1 });
					});
				});
			} else if (row) {
				resolve({ exists: true, id: 1 });
			} else {
				const now = new Date().toISOString();
				const insertQuery = `
					INSERT INTO clinic_infos (
						id,
						CSKCBID,
						TenCSKCB,
						DiaChi,
						DienThoai,
						Email,
						SoGiayPhepHoatDong,
						NgayCapGiayPhep,
						NoiCapGiayPhep,
						HoTenBS,
						SoChungChiHanhNghe,
						KhoaPhong,
						ChucVu,
						MachineId,
						AppVersion,
						ActivationKey,
						ClinicAccessToken,
						DoctorAccessToken,
						CreatedAt,
						UpdatedAt,
						CongKham
					) VALUES (
						1, '', '', '', '', '', '', '', '', '', '', '', '', ?, '', '', '', '', ?, ?, ?
					)
				`;
				db.run(insertQuery, [machineId, now, now], function (insertErr) {
					if (insertErr) reject(insertErr);
					else resolve({ created: true, id: 1 });
				});
			}
		});
	});
}

// tự động thêm dữ liệu từ icd10.json vào bảng icd10 nếu bảng rỗng
async function ensureIcd10Data() {
	return new Promise((resolve, reject) => {
		db.get('SELECT COUNT(*) as count FROM icd10', (err, row) => {
			if (err) return reject(err);
			if (row.count === 0) {
				// Bảng icd10 rỗng, thêm dữ liệu từ icd10.json
				console.log('Bảng icd10 rỗng, đang thêm dữ liệu từ icd10.json');
				const insertQuery = `
					INSERT INTO icd10 (code, title, slug)
					VALUES (?, ?, ?)
				`;
				const promises = icd10Data.map((item) => {
					return new Promise((res, rej) => {
						db.run(
							insertQuery,
							[item.code, item.title, item.slug],
							function (insertErr) {
								if (insertErr) rej(insertErr);
								else res();
							}
						);
					});
				});
				Promise.all(promises)
					.then(() => resolve({ inserted: true }))
					.catch(reject);
			} else {
				resolve({ exists: true });
			}
		});
	});
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
