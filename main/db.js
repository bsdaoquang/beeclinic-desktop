/** @format */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

sqlite3.verbose();

const dbPath = path.join(app.getPath('userData'), '/beeclinic.db');
// console.log(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('Không thể kết nối SQLite:', err.message);
	} else {
		console.log('Kết nối SQLite thành công:', dbPath);
	}
});

const createDatabase = async () => {
	if (!fs.existsSync(dbPath)) {
		console.log('Tạo mới cơ sở dữ liệu...');
	}

	db.serialize(() => {
		// table of clinic info
		db.run(`CREATE TABLE IF NOT EXISTS clinic_infos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  _id TEXT, -- ID duy nhất của phòng khám
  lockscreen_password TEXT, -- Mật khẩu khóa màn hình
  CSKCBID TEXT, -- Mã cơ sở KCB (quan trọng khi gửi lên hệ thống)
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

		// add _id column if not exists (để đồng bộ với server)
		db.all(`PRAGMA table_info(clinic_infos);`, (err, columns) => {
			if (err) return;
			const hasId = columns.some((col) => col.name === '_id');
			if (!hasId) {
				db.run(`ALTER TABLE clinic_infos ADD COLUMN _id TEXT;`);
			}
			const hasLockscreenPassword = columns.some(
				(col) => col.name === 'lockscreen_password'
			);
			if (!hasLockscreenPassword) {
				db.run(`ALTER TABLE clinic_infos ADD COLUMN lockscreen_password TEXT;`);
			}
		});

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

		// Tạo bảng prescriptions nếu chưa có
		db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ma_don_thuoc TEXT UNIQUE,
  patient_id INTEGER NOT NULL,
  loai_don_thuoc TEXT,         -- 'c'|'n'|'h'|'y'
  diagnosis TEXT,
  note TEXT,
  ngay_gio_ke_don TEXT,        -- ISO string
  ngay_tai_kham TEXT,       -- số ngày
  thong_tin_don_thuoc_json TEXT, -- JSON string of items
  thong_tin_dich_vu_json TEXT, -- JSON string of service items
  total REAL,                  -- Tổng tiền đơn thuốc + dịch vụ
  sent INTEGER DEFAULT 0,      -- 0: chưa gửi, 1: đã gửi
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reason_for_visit TEXT,           -- Lý do đến khám (tùy chọn)
  disease_progression TEXT         -- Diễn tiến bệnh (tùy chọn)
  );`);

		// Nếu bảng prescriptions đã tồn tại, thêm cột thong_tin_dich_vu_json nếu chưa có
		db.all(`PRAGMA table_info(prescriptions);`, (err, columns) => {
			if (err) return;
			const hasDichVu = columns.some(
				(col) => col.name === 'thong_tin_dich_vu_json'
			);
			if (!hasDichVu) {
				db.run(
					`ALTER TABLE prescriptions ADD COLUMN thong_tin_dich_vu_json TEXT DEFAULT NULL;`
				);
			}
			const hasTotal = columns.some((col) => col.name === 'total');
			if (!hasTotal) {
				db.run(`ALTER TABLE prescriptions ADD COLUMN total REAL DEFAULT NULL;`);
			}
		});

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

		// tạo bảng dịch vụ - thủ thuật
		db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_dich_vu TEXT NOT NULL,
    mo_ta TEXT,
    gia REAL,
    thoi_gian INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

		db.run(`CREATE TABLE IF NOT EXISTS icd10 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    title TEXT,
    slug TEXT
  )`);
	});

	return dbPath;
};

export default db;
export { createDatabase };
