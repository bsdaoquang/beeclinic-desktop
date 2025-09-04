/** @format */

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import fs from 'fs';
import cron from 'node-cron';
import pkg from 'node-machine-id';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import db, { createDatabase } from '../main/db.js';
import {
	listBackups,
	restoreFromDrive,
	runFullBackup,
} from './backupService.js';
import { GoogleAuth } from './googleAuth.js';
import dotenv from 'dotenv';

dotenv.config();

const { machineIdSync } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// google auth connect and backup
const googleAuth = new GoogleAuth({
	clientId: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

let savedTokens = null;

// đường dẫn dữ liệu thực
const DB_PATH = path.join(app.getPath('userData'), 'beeclinic.db');
const FILES_DIR = path.join(app.getPath('userData'), 'attachments');
if (!fs.existsSync(FILES_DIR)) {
	fs.mkdirSync(FILES_DIR);
}

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
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// connect to google
// ====== IPC: Google Drive Connect ======
ipcMain.handle('backup:connectGoogle', async () => {
	const url = googleAuth.getAuthUrl();
	// mở system browser để login
	await shell.openExternal(url);
	const tokens = await googleAuth.startLocalServerWaitForCode();
	savedTokens = tokens;
	return { ok: true };
});

// ====== IPC: Run Backup Now ======
ipcMain.handle('backup:run', async (e, { passphrase, keep = 7 }) => {
	if (!savedTokens) throw new Error('Chưa kết nối Google Drive');
	googleAuth.setTokens(savedTokens);

	const uploaded = await runFullBackup(googleAuth.getClient(), {
		paths: [DB_PATH, FILES_DIR],
		passphrase,
		keep,
	});
	return uploaded;
});

// ====== IPC: List Backups ======
ipcMain.handle('backup:list', async () => {
	if (!savedTokens) throw new Error('Chưa kết nối Google Drive');
	googleAuth.setTokens(savedTokens);
	const files = await listBackups(googleAuth.getClient());
	return files;
});

// ====== IPC: Restore ======
ipcMain.handle('backup:restore', async (e, { fileId, passphrase }) => {
	if (!savedTokens) throw new Error('Chưa kết nối Google Drive');
	googleAuth.setTokens(savedTokens);

	// CẢNH BÁO: cần đảm bảo đóng DB/khóa app trước khi ghi đè
	// Tốt nhất: backup hiện tại trước, tắt các kết nối DB, sau đó restore và prompt restart app.
	const extractTo = app.getPath('userData');
	const r = await restoreFromDrive(googleAuth.getClient(), {
		fileId,
		passphrase,
		extractToDir: extractTo,
	});
	return r;
});

// ====== Lịch tự động (mặc định 20:00 hằng ngày) ======
let cronTask = null;
ipcMain.handle(
	'backup:schedule:set',
	async (e, { cronExp = '0 20 * * *', passphrase, keep = 7 }) => {
		if (cronTask) cronTask.stop();
		cronTask = cron.schedule(
			cronExp,
			async () => {
				try {
					if (!savedTokens) return; // chưa kết nối thì thôi
					googleAuth.setTokens(savedTokens);
					await runFullBackup(googleAuth.getClient(), {
						paths: [DB_PATH, FILES_DIR],
						passphrase,
						keep,
					});
					win?.webContents.send(
						'backup:scheduled:ok',
						new Date().toISOString()
					);
				} catch (err) {
					win?.webContents.send('backup:scheduled:err', err.message);
				}
			},
			{ timezone: 'Asia/Ho_Chi_Minh' }
		);
		return { ok: true };
	}
);

ipcMain.handle('backup:isConnected', async () => {
	return { ok: !!savedTokens };
});

// get version
ipcMain.handle('get-version', async () => {
	return { version: app.getVersion() };
});

// get machine id
ipcMain.handle('get-machine-id', async () => {
	return { machineId: machineIdSync() };
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

// get all diagnosis in prescription
ipcMain.handle('get-all-diagnosis-in-prescription', async (event) => {
	return new Promise((resolve, reject) => {
		db.all('SELECT diagnosis FROM prescriptions', (err, rows) => {
			if (err) {
				reject(err);
			} else {
				/*
				// console.log(rows);
				[
  { diagnosis: 'Viêm họng cấp' },
  { diagnosis: 'Viêm phế quản,Tăng huyết áp' },
  { diagnosis: 'Viêm họng cấp,Đái tháo đường type II' }
]
				*/
				// chuyển dữ liệu thành 1 danh sách các chẩn đoán, tách bởi dấu phẩy, không trùng lặp
				const diagnosisList = Array.from(
					new Set(rows.flatMap((row) => row.diagnosis.split(',')))
				);
				resolve(diagnosisList);
			}
		});
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

// tìm kiếm chẩn đoán từ icd10 table, icd10 fts5 đã làm trước đó, dựa trên key người dùng nhập theo slug hoặc code
// trả về dang <code>-<slug>

ipcMain.handle('search-icd-diagnosis', async (event, key) => {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT * FROM icd10 WHERE slug LIKE ? OR code LIKE ?',
			[`%${key}%`, `%${key}%`],
			(err, rows) => {
				if (err) reject(err);
				else resolve(rows.map((row) => `${row.code} ${row.title}`));
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
		db.all('SELECT * FROM clinic_infos', (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
});

ipcMain.handle('create-clinic-info', async (event, data) => {
	return new Promise((resolve, reject) => {
		const query = `
			INSERT INTO clinic_infos (
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
				CongKham
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const values = [
			data.CSKCBID,
			data.TenCSKCB,
			data.DiaChi,
			data.DienThoai,
			data.Email,
			data.SoGiayPhepHoatDong,
			data.NgayCapGiayPhep,
			data.NoiCapGiayPhep,
			data.HoTenBS,
			data.SoChungChiHanhNghe,
			data.KhoaPhong,
			data.ChucVu,
			data.MachineId,
			data.AppVersion,
			data.ActivationKey,
			data.CongKham,
		];
		db.run(query, values, function (err) {
			if (err) reject(err);
			else resolve({ id: this.lastID });
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

// icd10

ipcMain.handle('get-icd10s', async () => {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM icd10 LIMIT 5', (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
});

ipcMain.handle('add-icd10', async (event, icd10) => {
	return new Promise((resolve, reject) => {
		const query = `
			INSERT INTO icd10 (
				code,
				title,
				slug
			) VALUES (?, ?, ?)
		`;
		const now = new Date().toISOString();
		db.run(query, [icd10.code, icd10.title, icd10.slug || ''], function (err) {
			if (err) reject(err);
			else resolve({ id: this.lastID });
		});
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
