/** @format */

import {
	AutoComplete,
	Button,
	Flex,
	Modal,
	Progress,
	Space,
	Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BiSearchAlt2 } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { AddPatient } from '../modals';
import type { PatientModel } from '../types/PatientModel';
import { replaceName } from '../utils/replaceName';

const Home = () => {
	const [options, setOptions] = useState<any[]>([]);
	const [patients, setPatients] = useState<PatientModel[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isVisibleModalAddPatient, setIsVisibleModalAddPatient] =
		useState(false);
	const [isAddDatas, setIsAddDatas] = useState(false);
	const [icd10Datas, setIcd10Datas] = useState<any[]>([]);
	const [updatePercent, setUpdatePercent] = useState(0);
	const [messageUpdate, setMessageUpdate] = useState('');

	const inpRef = useRef<any>(null);
	const navigate = useNavigate();

	useEffect(() => {
		getPatients();
		inpRef.current.focus();
		checkDatas();
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
		if (icd10Datas.length > 0) {
			handleSaveIcd10Datas();
		}
	}, [icd10Datas]);

	const checkDatas = async () => {
		try {
			await checkIcd10datas();
		} catch (error) {
			console.log(error);
		}
	};

	const checkIcd10datas = async () => {
		const res = await (window as any).beeclinicAPI.getIcd10s();
		if (res && res.length > 0) {
		} else {
			setMessageUpdate('Đang tải dữ liệu ICD10 từ server...');
			const result = await fetch('https://beeclinic.vercel.app/api/v1/icd10');
			const data = await result.json();
			setIcd10Datas(data.data);
		}
	};

	const handleSaveIcd10Datas = async () => {
		try {
			if (icd10Datas.length > 0) {
				setIsAddDatas(true);
				setMessageUpdate(
					'Đã tải dữ liệu ICD10 từ server, tiến hành lưu vào local...'
				);
				// await handleSaveIcd10Datas();
				setMessageUpdate('Đang lưu dữ liệu ICD10 vào local...');
				const promises = icd10Datas.map(async (item: any) => {
					const newItem = {
						code: item.code,
						title: item.title,
						slug: item.slug,
					};

					await (window as any).beeclinicAPI.addIcd10(newItem);
					setUpdatePercent((prev) => prev + 100 / icd10Datas.length);
				});
				await Promise.all(promises);
				console.log('Đã lưu dữ liệu ICD10 vào local');
				setMessageUpdate('Đã lưu xong dữ liệu ICD10 vào local');
			}
		} catch (error) {
			console.log(error);
		} finally {
			setIsAddDatas(false);
		}
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

	return (
		<div>
			<div className='container-fluid'>
				<div className='container'>
					<div className='row mt-5'>
						<div className='col-8 offset-2'>
							<div className='mb-5 pt-5'>
								<Space size={8} style={{ alignItems: 'flex-start' }}>
									<img
										src='./assets/icons/icon.png'
										alt='logo'
										style={{ width: 80, height: 80 }}
									/>
									<div>
										<Typography.Title
											level={1}
											type='secondary'
											className='mb-0'>
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
								</Space>
							</div>

							<div className='my-3'>
								<AutoComplete
									notFoundContent={
										<Typography.Text type='secondary'>
											Không tìm thấy kết quả
										</Typography.Text>
									}
									onInputKeyDown={(e: any) => {
										const value = e.target.value;
										if (e.key === 'Enter' && value) {
											const selectedOption = options.find(
												(option) => option.value === value
											);
											if (selectedOption) {
												navigate(
													`/prescriptions/add-new?patient-id=${selectedOption.value}`
												);
											} else {
												// console.log('No matching option found');
												// Create patient with name = value and navigate to prescriptions
												(window as any).beeclinicAPI
													.addPatient({ name: value })
													.then((res: any) => {
														navigate(
															`/prescriptions/add-new?patient-id=${res.id}`
														);
													})
													.catch((error: any) => {
														console.error('Error creating patient:', error);
													});
											}
										}
									}}
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

				<Modal
					title='Bổ sung dữ liệu'
					closable={false}
					centered
					style={{ minHeight: 400 }}
					footer={null}
					open={isAddDatas}>
					<div className='p-4'>
						<Typography.Paragraph>{messageUpdate}</Typography.Paragraph>
						<Progress percent={Math.round(updatePercent)} showInfo />
					</div>
				</Modal>
			</div>
		</div>
	);
};

export default Home;
