/** @format */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	clinicData: null,
};

const clinicSlice = createSlice({
	name: 'clinic',
	initialState,
	reducers: {
		addClinic: (state, action) => {
			state.clinicData = action.payload;
		},
		removeClinic: (state, _action) => {
			state.clinicData = null;
		},
		updateClinic: (state, action) => {
			const { clinicData }: { clinicData: any } = state;
			if (clinicData) {
				const newClinicData = {
					...clinicData,
					...action.payload,
				};
				state.clinicData = newClinicData;
			}
		},
	},
});

export const { addClinic, removeClinic, updateClinic } = clinicSlice.actions;
export const clinicSelector = (state: any) => state.clinic.clinicData;

export const clinicReducer = clinicSlice.reducer;
