/** @format */
/*
  Trang này để quản lý sao lưu và phục hồi dữ liệu phòng khám
  Nếu không có kết nối internet -> Hiển thị thông báo không thể sao lưu trực tuyến
  nếu có kết nối internet:
  Nếu chưa đăng nhập -> Đăng nhập
  Nếu đã đăng nhập -> Hiển thị bản sao lưu gần nhất và các bản sao lưu khác (nếu có)
  Cài đặt lịch sao lưu tự động (nếu có)
  Nút "Sao lưu ngay" để tạo bản sao lưu mới
  Nút "Phục hồi" để phục hồi từ bản sao lưu đã chọn
  Hiển thị trạng thái sao lưu và phục hồi (thành công, thất bại, đang tiến hành)
  Hướng dẫn người dùng cách sao lưu và phục hồi dữ liệu phòng khám
*/

import { Button } from 'antd';
import { useEffect } from 'react';

declare global {
	interface Window {
		beeclinicAPI: {
			connectGoogle: () => Promise<{ ok: boolean }>;
			isConnected: () => Promise<{ ok: boolean }>;
			run: (p: { passphrase: string; keep?: number }) => Promise<any>;
			list: () => Promise<
				Array<{ id: string; name: string; createdTime: string; size: string }>
			>;
			restore: (p: { fileId: string; passphrase: string }) => Promise<any>;
			setSchedule: (p: {
				cronExp?: string;
				passphrase: string;
				keep?: number;
			}) => Promise<{ ok: boolean }>;
			onScheduledOk: (cb: (ts: string) => void) => void;
			onScheduledErr: (cb: (msg: string) => void) => void;
		};
	}
}

const ClinicBackup = () => {
	// kiểm tra kết nối internet
	const isOnline = navigator.onLine;

	if (!isOnline) {
		// Hiển thị thông báo không thể sao lưu trực tuyến
		return (
			<div className='container alert alert-warning' role='alert'>
				<p>Không thể sao lưu trực tuyến. Vui lòng kiểm tra kết nối internet.</p>
			</div>
		);
	}

	return (
		<div className='container'>
			<Button
				onClick={() => {
					const r = (window as any).beeclinicAPI.connectGoogle();
					r.then((res: any) => {
						if (res.ok) {
							alert('Kết nối thành công');
						} else {
							alert('Kết nối thất bại');
						}
					});
				}}>
				Đăng nhập google Driver
			</Button>
		</div>
	);
};

export default ClinicBackup;
