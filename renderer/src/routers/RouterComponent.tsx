/** @format */

import { Route, Routes } from 'react-router-dom';
import {
	AddPrescription,
	Home,
	PatientDetail,
	Patients,
	Prescriptions,
	Settings,
} from '../screens';

const RouterComponent = () => {
	return (
		<div
			className='p-2'
			style={{
				height: 'calc(100vh - 90px)',
				overflow: 'auto',
			}}>
			<Routes>
				<Route path='/' index element={<Home />} />
				<Route path='/patients' element={<Patients />} />
				<Route path='/patients/:id' element={<PatientDetail />} />
				<Route path='/prescriptions' element={<Prescriptions />} />
				<Route path='/prescriptions/add-new' element={<AddPrescription />} />
				<Route path='/settings' element={<Settings />} />
			</Routes>
		</div>
	);
};

export default RouterComponent;
