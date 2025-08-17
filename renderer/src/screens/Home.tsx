/** @format */

import { Alert, AutoComplete, Button, Flex, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BiSearchAlt2 } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { AddPatient } from '../modals';
import type { PatientModel } from '../types/PatientModel';
import { replaceName } from '../utils/replaceName';
import type { ClinicModel } from '../types/ClinicModel';
import {
	collection,
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const Home = () => {
	const [options, setOptions] = useState<any[]>([]);
	const [patients, setPatients] = useState<PatientModel[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [clinicInfos, setClinicInfos] = useState<ClinicModel>();
	const [isVisibleModalAddPatient, setIsVisibleModalAddPatient] =
		useState(false);

	const inpRef = useRef<any>(null);

	useEffect(() => {
		getPatients();
		inpRef.current.focus();
		getClinic();
	}, []);

	useEffect(() => {
		if (patients.length > 0) {
			setOptions(
				patients.map((item) => ({
					value: `${item.id}`,
					label: (
						<Flex align='center' justify='space-between'>
							{item.name} <span>{item.phone ?? ''}</span>
						</Flex>
					),
				}))
			);
		}
	}, [patients]);

	useEffect(() => {
		clinicInfos && checkFirebaseConnection();
	}, [clinicInfos]);

	const getClinic = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getClinicInfo();
			res && res.length > 0 && setClinicInfos(res[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const checkFirebaseConnection = async () => {
		if (!clinicInfos) {
			return;
		}

		/*
		Kiểm tra xem trên firebase có item nào có machineId = machineId không
		// nếu không có tạo mới với clinicInfo
		// trên firebase lưu các thông tin như: ngày tạo, ngày hết hạn, mã máy, key kích hoạt...

		mỗi khi ứng dụng khởi động sẽ kiểm tra xem có kết nối với firebase khôn
		*/
		const machineId = clinicInfos.MachineId;

		const clinicRef = doc(collection(db, 'clinics'), machineId);
		const clinicSnap = await getDoc(clinicRef);

		// if (!clinicSnap.exists()) {
		// 	await setDoc(clinicRef, {
		// 		...clinicInfos,
		// 		createdAt: serverTimestamp(),
		// 	});

		// 	console.log('Created new clinic document:', machineId);
		// }
	};

	const getPatients = async () => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.getPatients();
			setPatients(res);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (key: string) => {
		const val = replaceName(key);
		const values = patients.filter(
			(element) =>
				replaceName(element.name).includes(val) ||
				(element.phone && element.phone.includes(val)) ||
				(element.citizenId && element.citizenId.includes(val))
		);

		setOptions(
			values.map((item) => ({
				label: (
					<Flex align='center' justify='space-between'>
						{item.name}
						<span>{item.phone}</span>
					</Flex>
				),
				value: `${item.id}`,
			}))
		);
	};

	const navigate = useNavigate();

	return (
		<div>
			<div className='container-fluid'>
				<div className='container'>
					<div className='row mt-5'>
						<div className='col-8 offset-2'>
							<div className='mb-5'>
								<Typography.Title level={1} type='secondary' className='mb-0'>
									Bee Clinic
								</Typography.Title>
								<Typography.Paragraph
									type='secondary'
									style={{
										fontSize: 18,
									}}>
									Phần mềm quản lý phòng khám
								</Typography.Paragraph>
							</div>
							<div className='my-3'>
								<AutoComplete
									ref={inpRef}
									disabled={isLoading}
									variant='filled'
									style={{
										width: '100%',
									}}
									onSelect={(val) =>
										navigate(`/prescriptions/add-new?patient-id=${val}`)
									}
									onChange={handleSearch}
									options={options}
									prefix={<BiSearchAlt2 size={20} className='text-muted' />}
									size='large'
									allowClear
									placeholder='Tìm kiếm theo tên, số điện thoại hoặc CCCD...'
								/>
							</div>
							<div className='text-center mt-4'>
								<Button
									onClick={() => setIsVisibleModalAddPatient(true)}
									type='default'
									className='px-5'
									size='large'>
									Thêm bệnh nhân
								</Button>
							</div>
						</div>
					</div>
				</div>

				<AddPatient
					visible={isVisibleModalAddPatient}
					onClose={() => setIsVisibleModalAddPatient(false)}
					onFinish={() => {
						getPatients();
						inpRef.current.focus();
					}}
				/>
			</div>
		</div>
	);
};

export default Home;
