/**
 * Những thông tin về bệnh nhân:
 *   - id: string (định danh duy nhất của bệnh nhân)
 *   - name: string (tên bệnh nhân)
 *   - age: number (tuổi của bệnh nhân, ngày tháng năm sinh)
 *   - phone: string (số điện thoại)
 *   - address: string (địa chỉ)
 *   - số CMND/CCCD: string (số chứng minh nhân dân hoặc căn cước công dân)
 *   - email: string (email)
 *   - giới tính
 *   - createdAt: Date (ngày tạo)
 *   - updatedAt: Date (ngày cập nhật)
 *   - medicalHistory: string (lịch sử bệnh án)
 *   - allergies: string (dị ứng)
 *   - link ảnh bệnh nhân: string (đường dẫn đến ảnh bệnh nhân)
 *   - notes: string (ghi chú thêm)
 *
 * @format
 */

export interface PatientModel {
	id: string;
	name: string;
	age: number;
	phone: string;
	address: string;
	citizenId: string; // Số CMND/CCCD
	email?: string;
	gender?: 'male' | 'female' | undefined;
	createdAt: Date;
	updatedAt: Date;
	medicalHistory: string;
	allergies: string;
	photoUrl: string;
	notes: string;
}
