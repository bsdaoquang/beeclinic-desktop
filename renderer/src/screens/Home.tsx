/** @format */

import logoUrl from '@/assets/icons/icon.png';
import { AutoComplete, Button, Flex, Modal, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BiSearchAlt2 } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { AddPatient } from '../modals';
import type { PatientModel } from '../types/PatientModel';
import { replaceName } from '../utils/replaceName';
import axios from 'axios';

const Home = () => {
	const [patients, setPatients] = useState<
		{
			value: string;
			label: React.ReactNode;
			key: string;
			name: string;
			phone: string;
			citizenId: string;
		}[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSyncIcd10, setIsSyncIcd10] = useState(false);
	const [isVisibleModalAddPatient, setIsVisibleModalAddPatient] =
		useState(false);
	const inpRef = useRef<any>(null);
	const navigate = useNavigate();

	useEffect(() => {
		getPatients();
		syncIcd10();
		inpRef.current.focus();
	}, []);

	const getPatients = async () => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.getPatients();
			setPatients(
				res && res.length
					? res.map((item: PatientModel) => ({
							value: `${item.id}`,
							key: `${replaceName(item.name ?? '')}-${item.phone ?? ''}-${
								item.citizenId ?? ''
							}`,
							name: item.name,
							phone: item.phone,
							citizenId: item.citizenId,
							label: (
								<Flex align='center' justify='space-between'>
									{item.name} <span>{item.phone ?? ''}</span>
								</Flex>
							),
					  }))
					: []
			);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	// đồng bộ icd10 nếu chưa có
	const syncIcd10 = async () => {
		try {
			const icd10s = await window.beeclinicAPI.getIcd10s();
			if (
				!icd10s ||
				!icd10s.length ||
				(icd10s.length && icd10s.length < 36689)
			) {
				setIsSyncIcd10(true);

				const res = await axios('https://beeclinic.vercel.app/api/v1/icd10');

				const { data } = res.data;
				const newDatas = data.map((item: any) => {
					const title = `${item.code} - ${item.title}`;

					return {
						code: item.code,
						title,
						slug: replaceName(title),
					};
				});
				await window.beeclinicAPI.bulkCreateIcd10s(newDatas);

				setIsSyncIcd10(false);
			}
		} catch (error) {
			console.log(error);
		} finally {
			setIsSyncIcd10(false);
		}
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
										src={logoUrl}
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
											const selectedOption = patients.find(
												(patient: {
													name: string;
													phone: string;
													citizenId: string;
												}) =>
													patient.name === value ||
													patient.phone === value ||
													patient.citizenId === value
											);

											if (selectedOption) {
												navigate(
													`/prescriptions/add-new?patient-id=${selectedOption.value}`
												);
											} else {
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
									filterOption={(inputValue, option) =>
										option && inputValue
											? option.key.includes(replaceName(inputValue))
											: false
									}
									ref={inpRef}
									disabled={isLoading}
									variant='filled'
									style={{
										width: '100%',
									}}
									onSelect={(val) =>
										navigate(`/prescriptions/add-new?patient-id=${val}`)
									}
									options={patients}
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

			{isSyncIcd10 && (
				<Modal open={true} footer={null} closable={false} centered>
					<div className='text-center p-3'>
						<Typography.Text>
							Đang đồng bộ dữ liệu chẩn đoán ICD10, vui lòng chờ trong giây
							lát...
						</Typography.Text>

						<Typography.Text className='d-block mt-3' type='secondary'>
							Quá trình này chỉ diễn ra 1 lần duy nhất khi bạn mới sử dụng phần
							mềm.
						</Typography.Text>
					</div>
				</Modal>
			)}
		</div>
	);
};

export default Home;
