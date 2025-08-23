/** @format */

/*
  Service
  id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_dich_vu TEXT NOT NULL,
    mo_ta TEXT,
    gia REAL,
    thoi_gian INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
*/
export interface ServiceModel {
	id: number;
	ten_dich_vu: string;
	mo_ta?: string;
	gia?: number;
	thoi_gian?: number; // thời gian thực hiện dịch vụ (tính bằng phút)
	createdAt?: string; // ngày tạo
	updatedAt?: string; // ngày cập nhật
}
