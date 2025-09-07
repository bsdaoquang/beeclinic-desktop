/** @format */

import { HashRouter } from 'react-router-dom';
import FooterComponent from '../components/FooterComponent';
import HeaderComponent from '../components/HeaderComponent';
import RouterComponent from './RouterComponent';
import { useEffect } from 'react';
import handleAPI from '../apis/handleAPI';

const Routers = () => {
	// khi app được mở, nghĩa là bảng phòng khám đã được tạo
	// nếu không có dữ liệu phòng khám -> tạo dữ liệu mới, nếu có mạng -> đồng bộ dữ liệu với server => có _id -> cập nhật dữ liệu phòng khám
	// nếu đã có dữ liệu phòng khám -> kiểm tra nếu có mạng -> đồng bộ dữ liệu với server => có _id -> cập nhật dữ liệu phòng khám

	useEffect(() => {
		handleSyncClinicData();
	}, []);

	const isOnline = navigator.onLine;

	const handleSyncClinicData = async () => {
		try {
			const machineId = await window.beeclinicAPI.getMachineId();
			const { version } = await window.beeclinicAPI.getVersion();

			const data = {
				MachineId: machineId,
				AppVersion: version,
				ActivationKey: '',
			};

			const res = await window.beeclinicAPI.getClinicInfo();
			if (!res.length) {
				// chưa có phòng khám
				const { id } = await window.beeclinicAPI.addClinic(data);
				if (isOnline) {
					const resServer = await handleAPI('/clinic', data, 'post');
					if (resServer && resServer._id) {
						// cập nhật _id từ server về phòng khám
						await window.beeclinicAPI.updateClinicById(id, {
							_id: resServer._id,
							...data,
						});
					}
				}
			} else {
				// Đã có phòng khám
				console.log(res);
			}
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<div>
			<HashRouter basename='/'>
				<div style={{ padding: 0, margin: 0 }}>
					<HeaderComponent />
					<RouterComponent />
					<FooterComponent />
				</div>
			</HashRouter>
		</div>
	);
};

export default Routers;
