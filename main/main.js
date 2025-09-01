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

app.whenReady().then(() => {
	createDatabase();
	createWindow();

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
/*


	db.run(`CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ma_thuoc TEXT,         -- Mã thuốc (nếu có trong danh mục)
  biet_duoc TEXT,        -- Tên biệt dược (nếu có)
  ten_thuoc TEXT NOT NULL, -- Tên thuốc (bắt buộc)
  unit TEXT,             -- Đơn vị tính (viên, ống, gói...)
  quantity INTEGER,      -- Số lượng
  instruction TEXT,      -- Cách dùng
  expDate TEXT,          -- Hạn dùng (ISO string hoặc yyyy-mm-dd)
  gia_mua REAL,          -- Giá mua
  gia_ban REAL           -- Giá bán
  )`);

	// table of clinic info
	db.run(`CREATE TABLE IF NOT EXISTS clinic_infos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  CSKCBID TEXT UNIQUE, -- Mã cơ sở KCB (quan trọng khi gửi lên hệ thống)
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
  ClinicAccessToken TEXT, -- Access token cho phòng khám
  DoctorAccessToken TEXT, -- Access token cho bác sĩ
  CongKham INTEGER DEFAULT 100000, -- Công khám, mặc định 100000
  CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TEXT
  )`);
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

// clinic_infos
/*
  CSKCBID TEXT UNIQUE, -- Mã cơ sở KCB (quan trọng khi gửi lên hệ thống)
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
  ClinicAccessToken TEXT, -- Access token cho phòng khám
  DoctorAccessToken TEXT, -- Access token cho bác sĩ
  CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TEXT
*/

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
const machineId = machineIdSync();

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

// Call ensureClinicInfo when app is ready
app.whenReady().then(() => {
	autoUpdater.checkForUpdatesAndNotify();
	ensureClinicInfo().catch(console.error);
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

// thêm, xoá, sửa dịch vụ - thủ thuật
/*
	db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_dich_vu TEXT NOT NULL,
    mo_ta TEXT,
    gia REAL,
    thoi_gian INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
*/

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

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
