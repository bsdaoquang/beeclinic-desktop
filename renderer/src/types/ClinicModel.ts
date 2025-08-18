/** @format */

export interface ClinicModel {
	// Thông tin cơ sở khám chữa bệnh
	CSKCBID: string; // Mã cơ sở KCB (bắt buộc khi gửi đơn thuốc quốc gia)
	TenCSKCB: string; // Tên cơ sở KCB
	DiaChi: string; // Địa chỉ
	DienThoai?: string; // Điện thoại (có thể để trống)
	Email?: string; // Email liên hệ (nếu có)

	// Giấy phép hoạt động
	SoGiayPhepHoatDong: string; // Số giấy phép hoạt động
	NgayCapGiayPhep?: string; // Ngày cấp giấy phép (yyyy-MM-dd)
	NoiCapGiayPhep?: string; // Nơi cấp

	// Thông tin bác sĩ phụ trách kê đơn
	HoTenBS: string; // Họ tên bác sĩ
	SoChungChiHanhNghe: string; // Số chứng chỉ hành nghề
	KhoaPhong?: string; // Khoa/phòng (nếu có)
	ChucVu?: string; // Chức vụ (BSCKI, BSCKII, ThS, TS...)

	// Thông tin hệ thống quản lý
	MachineId: string; // Mã máy (tự sinh khi cài app)
	AppVersion: string; // Phiên bản phần mềm
	ActivationKey?: string; // Mã kích hoạt (nếu có)

	// Metadata
	CreatedAt?: string; // Ngày tạo (ISO string)
	UpdatedAt?: string; // Ngày cập nhật gần nhất

	ClinicAccessToken: string;
	DoctorAccessToken: string;
}
