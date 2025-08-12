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
      notes TEXT -- Ghi chú
    )`);
	});
	return dbPath;
};

export default db;
export { createDatabase };
