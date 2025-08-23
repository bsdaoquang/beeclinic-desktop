/** @format */

import type { PatientModel } from './PatientModel';

/** @format */
export interface PrescriptionItem {
	id?: number;
	ma_thuoc?: string; // Mã thuốc (nếu có trong danh mục)
	biet_duoc?: string; // Tên biệt dược (nếu có)
	ten_thuoc: string; // Tên thuốc (bắt buộc)
	unit?: string; // Đơn vị tính (viên, ống, gói...)
	quantity: number; // Số lượng
	instruction?: string; // Cách dùng
	expDate?: string; // hạn dùng
	gia_mua?: number | 0; // Giá mua (nếu có)
	gia_ban?: number | 0; // Giá bán (nếu có)
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
	thong_tin_don_thuoc_json: string; // Danh sách thuốc
	thong_tin_dich_vu_json: string; // Danh sách dịch vụ
	total?: number; // Tổng tiền
	sent?: boolean; // Đã gửi hay chưa
	sent_at?: string; // Ngày giờ gửi (ISO)
	created_at?: string; // Ngày tạo,
	reason_for_visit?: string; // Lý do đến khám
	disease_progression?: string; // Diễn tiến bệnh
}
