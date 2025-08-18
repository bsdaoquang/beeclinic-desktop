/** @format */

import { ConfigProvider, message } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';
import dayjs, { locale } from 'dayjs';
import 'dayjs/locale/vi'; // Import ngôn ngữ tiếng Việt cho dayjs
import '../src/styles/index.css';
import FooterComponent from './components/FooterComponent';
import HeaderComponent from './components/HeaderComponent';
import RouterComponent from './routers/RouterComponent';
import { theme } from './styles/theme';
import { HashRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ClinicModel } from './types/ClinicModel';

// Quản lý phần mềm như thế nào?
// Kể cả tính năng cập nhật phiên bản, quản lý cài đặt, v.v.
/*
	Người dùng sử dụng bằng cách tải xuống ứng dụng từ trang web chính thức.
	Ứng dụng sẽ tự động kiểm tra cập nhật phiên bản mới nhất khi khởi động
	và thông báo cho người dùng nếu có phiên bản mới.

	Kiểm tra quyền sử dụng bằng tài khoản người dùng, 
	mối người dùng sẽ có một tài khoản duy nhất để đăng nhập vào ứng dụng.
	Ứng dụng sẽ lưu trữ các cài đặt cá nhân của người dùng trong cơ sở dữ liệu cục bộ,
	bao gồm các tùy chọn cá nhân hóa, lịch sử sử dụng, và các dữ liệu liên quan khác.
	Người dùng có thể thay đổi cài đặt cá nhân của mình thông qua giao diện người dùng,
	và các thay đổi này sẽ được lưu trữ và áp dụng ngay lập tức, đữ liệu người dùng được sao lưu khi có internet để đảm bảo đồng bộ
	hoạt động giống như phần mền vs code
	
*/

dayjs.locale('vi'); // Đặt ngôn ngữ cho dayjs
message.config({});

function App() {
	const [clinic, setClinic] = useState<ClinicModel>();

	useEffect(() => {
		getClinic();
	}, []);

	useEffect(() => {
		clinic && localStorage.setItem('clinic', JSON.stringify(clinic));
	}, [clinic]);

	const getClinic = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getClinicInfo();
			if (res && res.length > 0) {
				setClinic(res[0]);
			}
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<ConfigProvider theme={theme} locale={locale as any}>
			<HashRouter basename='/'>
				<div style={{ padding: 0, margin: 0 }}>
					<HeaderComponent clinic={clinic} />
					<RouterComponent clinic={clinic} />
					<FooterComponent />
				</div>
			</HashRouter>
		</ConfigProvider>
	);
}

export default App;
