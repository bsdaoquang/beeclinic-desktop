/** @format */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import handleAPI from '../apis/handleAPI';
import FooterComponent from '../components/FooterComponent';
import HeaderComponent from '../components/HeaderComponent';
import RouterComponent from './RouterComponent';
import { addClinic } from '../store/reducers/clinic-reducer';

const Routers = () => {
	// khi app được mở, nghĩa là bảng phòng khám đã được tạo
	// nếu không có dữ liệu phòng khám -> tạo dữ liệu mới, nếu có mạng -> đồng bộ dữ liệu với server => có _id -> cập nhật dữ liệu phòng khám
	// nếu đã có dữ liệu phòng khám -> kiểm tra nếu có mạng -> đồng bộ dữ liệu với server => có _id -> cập nhật dữ liệu phòng khám

	useEffect(() => {
		handleSyncClinicData();
	}, []);

	const isOnline = navigator.onLine;
	const dispatch = useDispatch();

	const handleSyncClinicData = async () => {
		try {
			const machineId = await window.beeclinicAPI.getMachineId();
			const { version } = await window.beeclinicAPI.getVersion();

			let data: any = {
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

						data._id = resServer._id;
					}
				}

				data.id = id;
			} else {
				// đã có phòng khám
				const clinic = res[0];
				// nếu chưa có _id là app trước đó chưa có mạng, hoặc app đã được cài trước khi làm phần này
				if (isOnline) {
					if (!clinic._id) {
						const resServer = await handleAPI('/clinic', clinic, 'post');
						if (resServer && resServer._id) {
							// cập nhật _id từ server về phòng khám
							await window.beeclinicAPI.updateClinicById(clinic.id, {
								_id: resServer._id,
							});
						}

						data = { ...clinic, _id: resServer._id };
					} else {
						// đã có _id, đồng bộ dữ liệu
						// update lên server, không update ActivationKey
						const { _id, ActivationKey, ...rest } = clinic;
						await handleAPI(`/clinic/${_id}`, rest, 'put');

						// cập nhật activation key về tránh hack
						const res = await handleAPI(`/clinic/${clinic._id}`);
						// console.log(res);
						if (res && res._id) {
							// cập nhật dữ liệu mới nhất từ server về phòng khám
							await window.beeclinicAPI.updateClinicById(clinic.id, {
								ActivationKey: res.ActivationKey,
							});

							data = { ...clinic, ActivationKey: res.ActivationKey };
						}
					}
				} else {
					data = { ...clinic };
				}
			}

			dispatch(addClinic(data));
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
