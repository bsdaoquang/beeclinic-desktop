/** @format */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

sqlite3.verbose();

const dbPath = path.join(app.getPath('userData'), '/beeclinic.db');

const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('Không thể kết nối SQLite:', err.message);
	} else {
		console.log('Kết nối SQLite thành công:', dbPath);
	}
});

/* Thông tin về bệnh nhân:
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

/*
  Medicine
  ma_thuoc?: string; // Mã thuốc (nếu có trong danh mục)
	biet_duoc?: string; // Tên biệt dược (nếu có)
	ten_thuoc: string; // Tên thuốc (bắt buộc)
	unit?: string; // Đơn vị tính (viên, ống, gói...)
	quantity: number; // Số lượng
	instruction?: string; // Cách dùng
	expDate?: string; // hạn dùng
*/

const createDatabase = () => {
	if (!fs.existsSync(dbPath)) {
		console.log('Tạo mới cơ sở dữ liệu...');
	}

	db.serialize(() => {
		db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Mã bệnh nhân
    name TEXT NOT NULL, -- Tên bệnh nhân
    age INTEGER, -- Tuổi
    phone TEXT, -- Số điện thoại
    address TEXT, -- Địa chỉ
    citizenId TEXT, -- Số CMND/CCCD
    email TEXT, -- Email
    gender TEXT, -- Giới tính: 'male' hoặc 'female'
    createdAt TEXT NOT NULL, -- Ngày tạo
    updatedAt TEXT NOT NULL, -- Ngày cập nhật
    medicalHistory TEXT, -- Tiền sử bệnh
    allergies TEXT, -- Dị ứng
    photoUrl TEXT, -- Ảnh đại diện
    notes TEXT, -- Ghi chú
    weight REAL, -- Cân nặng (tùy chọn)
    ma_dinh_danh_y_te TEXT, -- Mã định danh y tế (tùy chọn)
    bhyt TEXT, -- Mã số thẻ bảo hiểm y tế (tùy chọn)
    guardian TEXT -- Người giám hộ (tùy chọn)
  )`);

		db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reason_for_visit TEXT,           -- Lý do đến khám (tùy chọn)
      disease_progression TEXT         -- Diễn tiến bệnh (tùy chọn)
      );
    `);
	});

	db.run(`CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_thuoc TEXT,         -- Mã thuốc (nếu có trong danh mục)
    biet_duoc TEXT,        -- Tên biệt dược (nếu có)
    ten_thuoc TEXT NOT NULL, -- Tên thuốc (bắt buộc)
    unit TEXT,             -- Đơn vị tính (viên, ống, gói...)
    quantity INTEGER,      -- Số lượng
    instruction TEXT,      -- Cách dùng
    expDate TEXT           -- Hạn dùng (ISO string hoặc yyyy-mm-dd)
  )`);

	return dbPath;
};

export default db;
export { createDatabase };
