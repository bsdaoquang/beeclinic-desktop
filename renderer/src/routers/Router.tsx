/** @format */

import { BrowserRouter, Routes, Route as R } from 'react-router-dom';
import { Patients } from '../screens';

const Router = () => {
	return (
		<div className='p-2'>
			<BrowserRouter>
				<Routes>
					<R path='/' index element={<Patients />} />
				</Routes>
			</BrowserRouter>
		</div>
	);
};

export default Router;
