/** @format */

import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './reducers/auth-reducer';
import { clinicReducer } from './reducers/clinic-reducer';

const store = configureStore({
	reducer: {
		auth: authReducer,
		clinic: clinicReducer,
	},
});

export default store;
