/** @format */

import type { PatientModel } from '../types/PatientModel';

/** @format */
export interface PrescriptionItem {
	ma_thuoc?: string; // Mã thuốc (nếu có trong danh mục)
	biet_duoc?: string; // Tên biệt dược (nếu có)
	ten_thuoc: string; // Tên thuốc (bắt buộc)
	unit?: string; // Đơn vị tính (viên, ống, gói...)
	quantity: number; // Số lượng
	instruction?: string; // Cách dùng
}

export interface PrescriptionModel {
	id?: number; // ID trong DB (tự tăng)
	ma_don_thuoc: string; // Sinh tự động theo chuẩn
	patient_id: number; // ID bệnh nhân
	patient?: PatientModel; // Thông tin bệnh nhân (dùng khi gửi API)
	loai_don_thuoc: 'c' | 'n' | 'h' | 'y'; // Cơ bản / Gây nghiện / Hướng thần / YHCT
	diagnosis: string; // Chẩn đoán
	note?: string; // Ghi chú thêm
	ngay_gio_ke_don: string; // ISO datetime string
	ngay_tai_kham?: number; // Số ngày (optional)
	thong_tin_don_thuoc: PrescriptionItem[]; // Danh sách thuốc
	sent?: boolean; // Đã gửi hay chưa
	sent_at?: string; // Ngày giờ gửi (ISO)
	created_at?: string; // Ngày tạo
}
