/** @format */

import { BrowserRouter, Routes, Route as R } from 'react-router-dom';
import { Home, Patients } from '../screens';

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
				</Routes>
			</BrowserRouter>
		</div>
	);
};

export default Router;
