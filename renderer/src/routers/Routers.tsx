/** @format */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import handleAPI from '../apis/handleAPI';
import FooterComponent from '../components/FooterComponent';
import HeaderComponent from '../components/HeaderComponent';
import { addClinic } from '../store/reducers/clinic-reducer';
import type { ClinicModel } from '../types/ClinicModel';
import RouterComponent from './RouterComponent';

const Routers = () => {
	const isOnline = navigator.onLine;

	const dispatch = useDispatch();

	useEffect(() => {
		checkAndSyncData();
	}, []);

	const checkAndSyncData = async () => {
		try {
			const machineId = await window.beeclinicAPI.getMachineId();
			const version = await window.beeclinicAPI.getVersion();

			const res: ClinicModel[] | null =
				await window.beeclinicAPI.getClinicInfo();

			const data =
				res && res.length
					? res[0]
					: {
							MachineId: machineId,
							AppVersion: version.version,
							ActivationKey: '',
					  };
			if (!res || !res.length) {
				await window.beeclinicAPI.addClinic(data);
			}

			await handleAsyncData(data);
		} catch (error) {
			console.log(error);
		}
	};

	const handleAsyncData = async (data: any) => {
		// xử lý dữ liệu bất đồng bộ
		// đồng bộ dữ liệu với server
		// nếu có internet
		if (isOnline) {
			// đồng bộ dữ liệu
			// Đồng bộ như thế nào để dữ liệu luôn đúng và không bị mất mát

			// khi người dùng cập nhật, cũng cập nhật lên server
			// như vậy chỉ cần cập nhật từ server về
			// mỗi lần truy cập ứng dụng sẽ kiểm tra và đồng bộ dữ liệu, để đảm bảo dữ liệu chính xác, đặc biệt là mã kích hoạt

			// get data from server and compare with local data
			// if different, update local data
			// else do nothing

			// nếu chưa có dữ liệu trên server thì tạo mới
			const res = await handleAPI('/clinic/machine/' + data.MachineId);

			if (res) {
				dispatch(addClinic(res));
				await window.beeclinicAPI.updateClinicById(data.id, res);
			} else {
				const newData = { ...data };
				newData.id && delete newData.id; // xóa id để tránh lỗi khi thêm mới
				const addRes = await handleAPI('/clinic', newData, 'post');
				dispatch(addClinic(addRes));
			}
		} else {
			console.log('Không có kết nối internet, không thể đồng bộ dữ liệu');
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
