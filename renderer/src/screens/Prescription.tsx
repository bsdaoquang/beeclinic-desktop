/** @format */

// Đây là trang kê đơn
/*
  Payload gửi lên hệ thống đơn thuốc quốc gia
  const payload = {
      loai_don_thuoc: loai_don_thuoc,
      ma_don_thuoc,
      ho_ten_benh_nhan: patient.name,
      ma_dinh_danh_y_te: patient.ma_dinh_danh_y_te || '',
      ma_dinh_danh_cong_dan: patient.ma_dinh_danh_cong_dan || '',
      ngay_sinh_benh_nhan: formatDateDMY(patient.dob),
      can_nang: patient.weight || '',
      gioi_tinh: patient.gender === 'Nam' ? 2 : 3,
      ma_so_the_bao_hiem_y_te: patient.bhyt || '',
      thong_tin_nguoi_giam_ho: patient.guardian || '',
      dia_chi: patient.address || '',
      chan_doan: patient.chan_doan || [],
      luu_y: note || '',
      hinh_thuc_dieu_tri: '', // map as needed
      dot_dung_thuoc: null,
      thong_tin_don_thuoc: items.map(it => ({
        ma_thuoc: it.ma_thuoc || '',
        biet_duoc: it.biet_duoc || '',
        ten_thuoc: it.ten_thuoc,
        don_vi_tinh: it.unit || '',
        so_luong: it.quantity,
        cach_dung: it.instruction || ''
      })),
      loi_dan: '',
      so_dien_thoai_nguoi_kham_benh: patient.phone || '',
      ngay_tai_kham: payload.ngay_tai_kham || null,
      ngay_gio_ke_don
      // signature omitted here
    };

*/

const Prescription = () => {
	return <div>Prescription</div>;
};

export default Prescription;
