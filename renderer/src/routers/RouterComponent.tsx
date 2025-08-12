/** @format */

import { Route, Routes } from 'react-router-dom';
import { Home, PatientDetail, Patients } from '../screens';

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
			</Routes>
		</div>
	);
};

export default RouterComponent;
