/** @format */

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(
	process.env.PORTABLE_EXECUTABLE_DIR || __dirname,
	'/beeclinic.db'
);

if (!fs.existsSync(dbPath)) {
	console.log('Tạo mới cơ sở dữ liệu...');
}

const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('Không thể kết nối SQLite:', err.message);
	} else {
		console.log('Kết nối SQLite thành công:', dbPath);
	}
});

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
    notes TEXT -- Ghi chú
  )`);
});

export default db;
