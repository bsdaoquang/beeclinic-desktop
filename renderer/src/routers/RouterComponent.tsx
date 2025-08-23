/** @format */

import { Alert, Button } from 'antd';
import { Route, Routes } from 'react-router-dom';
import {
	AddPrescription,
	Home,
	PatientDetail,
	Patients,
	Prescriptions,
	Services,
	Settings,
	Storages,
} from '../screens';
import type { ClinicModel } from '../types/ClinicModel';

const RouterComponent = ({ clinic }: { clinic: ClinicModel | undefined }) => {
	return (
		<div
			className='p-2'
			style={{
				height: 'calc(100vh - 90px)',
				overflow: 'auto',
			}}>
			{clinic &&
				!clinic.ActivationKey &&
				(() => {
					const createdAt = new Date(clinic.CreatedAt as string);
					const now = new Date();
					const diffDays = Math.floor(
						(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
					);
					if (diffDays >= 14) {
						return (
							<Alert
								banner
								type='warning'
								message='Thời gian dùng thử đã hết. Vui lòng nhập mã kích hoạt để tiếp tục sử dụng đầy đủ tính năng.'
								action={
									<Button type='link' size='small'>
										Kích hoạt
									</Button>
								}
							/>
						);
					}
					return null;
				})()}

			<Routes>
				<Route path='/' index element={<Home />} />
				<Route path='/patients' element={<Patients />} />
				<Route path='/patients/:id' element={<PatientDetail />} />
				<Route path='/prescriptions' element={<Prescriptions />} />
				<Route path='/prescriptions/add-new' element={<AddPrescription />} />
				<Route path='/settings' element={<Settings />} />
				<Route path='/storages' element={<Storages />} />
				<Route path='/services' element={<Services />} />
			</Routes>
		</div>
	);
};

export default RouterComponent;
