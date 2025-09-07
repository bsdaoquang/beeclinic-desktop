/** @format */

import { Alert, Button } from 'antd';
import { Route, Routes, useNavigate } from 'react-router-dom';
import {
	AddPrescription,
	Home,
	PatientDetail,
	Patients,
	PrescriptionDetail,
	Prescriptions,
	Reports,
	Services,
	Settings,
	Storages,
} from '../screens';
import type { BackupFile, ClinicModel } from '../types/ClinicModel';
import { useSelector } from 'react-redux';
import { clinicSelector } from '../store/reducers/clinic-reducer';

declare global {
	interface Window {
		beeclinicAPI: {
			check: () => Promise<void>;
			getClinicInfo: () => Promise<ClinicModel[]>;
			addClinic: (data: any) => Promise<{ ok: boolean }>;
			updateClinicById: (id: number, data: any) => Promise<{ ok: boolean }>;
			downloadUpdate: () => Promise<void>;
			installUpdate: () => Promise<void>;
			getVersion: () => Promise<{ version: string }>;
			getMachineId: () => Promise<string>;
			openExternal: (url: string) => Promise<{ ok: boolean }>;
			onChecking: (cb: () => void) => void;
			onAvailable: (cb: (info: any) => void) => void;
			onNotAvailable: (cb: (info: any) => void) => void;
			onError: (cb: (e: any) => void) => void;
			onProgress: (cb: (p: any) => void) => void;
			onDownloaded: (cb: (info: any) => void) => void;
			connectGoogle: () => Promise<{ ok: boolean }>;
			isConnected: () => Promise<{ ok: boolean }>;
			run: (p: { passphrase: string; keep?: number }) => Promise<any>;
			delete: (p: { fileId: string }) => Promise<any>;
			list: () => Promise<Array<BackupFile>>;
			restore: (p: { fileId: string; passphrase: string }) => Promise<any>;
			setSchedule: (p: {
				cronExp?: string;
				passphrase: string;
				keep?: number;
			}) => Promise<{ ok: boolean }>;
			onScheduledOk: (cb: (ts: string) => void) => void;
			onScheduledErr: (cb: (msg: string) => void) => void;
			checkSchedule: () => Promise<{ isScheduled: boolean }>;
			stopSchedule: () => Promise<{ ok: boolean }>;
			getIcd10s: () => Promise<any[]>;
			bulkCreateIcd10s: (data: any[]) => Promise<{ ok: boolean }>;
		};
	}
}

const RouterComponent = () => {
	const clinic: ClinicModel | undefined = useSelector(clinicSelector);
	const navigate = useNavigate();
	return (
		<div
			className='p-2'
			style={{
				height: 'calc(100vh - 100px)',
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
									<Button
										type='link'
										size='small'
										onClick={() => navigate('/settings?tab=activation')}>
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
				<Route path='/prescriptions/:id' element={<PrescriptionDetail />} />
				<Route path='/prescriptions/add-new' element={<AddPrescription />} />
				<Route path='/settings' element={<Settings />} />
				<Route path='/storages' element={<Storages />} />
				<Route path='/services' element={<Services />} />
				<Route path='/reports' element={<Reports />} />
			</Routes>
		</div>
	);
};

export default RouterComponent;
