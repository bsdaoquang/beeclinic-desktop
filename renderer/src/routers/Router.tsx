/** @format */

import { BrowserRouter, Route as R, Routes } from 'react-router-dom';
import { Home, PatientDetail, Patients } from '../screens';

const Router = () => {
	return (
		<div
			className='p-2'
			style={{
				height: 'calc(100vh - 90px)',
				overflow: 'auto',
			}}>
			<BrowserRouter>
				<Routes>
					<R path='/' index element={<Home />} />
					<R path='/patients' element={<Patients />} />
					<R path='/patients/:id' element={<PatientDetail />} />
				</Routes>
			</BrowserRouter>
		</div>
	);
};

export default Router;
