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
		const isOnline = window.navigator.onLine;

		if (isOnline) {
			const _id = data._id;

			if (_id) {
				const res = await handleAPI(`/clinic/${_id}`);
				if (res) {
					await window.beeclinicAPI.updateClinicById(data.id, {
						ActivationKey: res.ActivationKey,
					});
				}
				dispatch(
					addClinic({
						...data,
						ActivationKey: res ? res.ActivationKey : '',
					})
				);
			} else {
				const newData = { ...data };
				delete newData._id;
				const res = await handleAPI('/clinic', newData, 'post');
				await window.beeclinicAPI.updateClinicById(data.id, {
					ActivationKey: res.ActivationKey,
				});
				dispatch(addClinic(res));
			}
		} else {
			dispatch(addClinic(data));
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
