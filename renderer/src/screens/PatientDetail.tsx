/** @format */

import {
	Button,
	Card,
	Descriptions,
	Image,
	message,
	Modal,
	Space,
	Spin,
	Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PatientModel } from '../types/PatientModel';
import { formatDateToString, getYearOld } from '../utils/datetime';
import { AddPatient } from '../modals';

/** @format */

const PatientDetail = () => {
	const { id } = useParams<{ id: string }>();
	const [patient, setPatient] = useState<PatientModel>();
	const [isLoading, setIsLoading] = useState(false);
	const [isVisibleModalPatient, setIsVisibleModalPatient] = useState(false);
	const [modal, modalHolder] = Modal.useModal();
	const [messageAPI, messageHolder] = message.useMessage();

	useEffect(() => {
		id && getPatientDetail();
	}, [id]);

	const getPatientDetail = async () => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.getPatientById(id);
			setPatient(res);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeletePatient = (item: PatientModel) => {
		modal.confirm({
			title: 'Xác nhận',
			content: `Bạn muốn xoá thông tin bệnh nhân ${item.name}?`,
			onOk: async () => {
				try {
					await (window as any).beeclinicAPI.deletePatient(item.id);
					window.history.back();
					messageAPI.success(`Đã xoá thông tin bệnh nhân`);
				} catch (error) {
					console.log(error);
					messageAPI.error(`Không thể xoá thông tin bệnh nhân`);
				}
			},
			onCancel: () => console.log('Cancel'),
		});
	};

	return (
		<div className='container-fluid'>
			{modalHolder}
			{messageHolder}
			<div className='container py-3'>
				{isLoading ? (
					<div className='text-center'>
						<Spin />
					</div>
				) : patient ? (
					<>
						<Card size='small' title='Thông tin bệnh nhân' className='mb-4'>
							<div className='row'>
								<div className='col-4'>
									<Typography.Paragraph>Ảnh đại diện</Typography.Paragraph>
									<div className=''>
										<Image
											style={{
												maxHeight: 200,
												borderRadius: 12,
											}}
											src={patient.photoUrl}
										/>
									</div>
								</div>
								<div className='col'>
									<Descriptions column={3}>
										<Descriptions.Item
											span={4}
											label='Họ và Tên'
											style={{
												textTransform: 'capitalize',
												fontWeight: 'bold',
											}}>
											{patient.name}
										</Descriptions.Item>
										<Descriptions.Item span={1} label='Giới tính'>
											{patient.gender
												? patient.gender === 'male'
													? 'Nam'
													: 'Nữ'
												: ''}
										</Descriptions.Item>
										<Descriptions.Item span={1} label='Ngày sinh'>
											{patient.age
												? formatDateToString(new Date(patient.age))
												: ''}{' '}
											{patient.age
												? ` (${getYearOld(
														new Date(patient.age).toISOString()
												  )} tuổi)`
												: ''}
										</Descriptions.Item>
										<Descriptions.Item span={1} label='BHYT'>
											{patient.bhyt}
										</Descriptions.Item>
										<Descriptions.Item span={1} label='SĐT'>
											{patient.phone}
										</Descriptions.Item>
										<Descriptions.Item span={1} label='CCCD'>
											{patient.citizenId}
										</Descriptions.Item>
										<Descriptions.Item span={1} label='Email'>
											{patient.email}
										</Descriptions.Item>
										<Descriptions.Item span={4} label='Địa chỉ'>
											{patient.address}
										</Descriptions.Item>
										<Descriptions.Item span={4} label='Thông tin liên hệ'>
											{patient.guardian}
										</Descriptions.Item>
										<Descriptions.Item span={4} label='Ngày tạo'>
											{formatDateToString(new Date(patient.createdAt))}
										</Descriptions.Item>
									</Descriptions>
								</div>
							</div>
							<div className='mt-3 text-end'>
								<Space>
									<Button
										danger
										type='text'
										onClick={() => handleDeletePatient(patient)}>
										Xoá hồ sơ
									</Button>
									<Button
										className='px-4'
										onClick={() => setIsVisibleModalPatient(true)}
										type='primary'>
										Cập nhật
									</Button>
								</Space>
							</div>
						</Card>
						<Card size='small' title='Lịch sử khám bệnh' className=''></Card>
					</>
				) : (
					<Typography.Paragraph type='secondary'>
						Không tìm thấy thông tin bệnh nhân
					</Typography.Paragraph>
				)}
			</div>

			<AddPatient
				visible={isVisibleModalPatient}
				onClose={() => setIsVisibleModalPatient(false)}
				onFinish={() => getPatientDetail()}
				patient={patient}
			/>
		</div>
	);
};

export default PatientDetail;
