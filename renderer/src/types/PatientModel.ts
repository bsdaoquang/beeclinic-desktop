/**
 * Thông tin về bệnh nhân:
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
	weight?: number;
	ma_dinh_danh_y_te?: string;
	bhyt?: string; // mã số thẻ bảo hiểm y tế
	guardian?: string;
}
