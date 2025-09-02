/** @format */

import {
	Button,
	Card,
	Descriptions,
	Divider,
	Empty,
	List,
	Space,
	Tabs,
	Typography,
} from 'antd';
import useMessage from 'antd/es/message/useMessage';
import useModal from 'antd/es/modal/useModal';
import { useEffect, useRef, useState } from 'react';
import { IoPrintOutline } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { PrescriptionPrint } from '../printPages';
import type { PatientModel } from '../types/PatientModel';
import type {
	PrescriptionItem,
	PrescriptionModel,
} from '../types/PrescriptionModel';
import type { ServiceModel } from '../types/ServiceModel';
import {
	formatDateToString,
	getShortDateTime,
	getYearOld,
} from '../utils/datetime';
import { numToString } from '../utils/numToString';

const PrescriptionDetail = () => {
	const { id } = useParams<{ id: string }>();

	const [prescription, setPrescription] = useState<PrescriptionModel | null>(
		null
	);
	const [patient, setPatient] = useState<PatientModel | null>(null);

	const printRef = useRef<HTMLDivElement>(null);
	const [modal, modalHolder] = useModal();
	const [messageAPI, messageHolder] = useMessage();
	const navigate = useNavigate();

	const printPrescription = useReactToPrint({
		contentRef: printRef,
		pageStyle: `
			@page {
				size: A5 portrait;
				margin: 1cm;
			}
			@media print {
				body {
					-webkit-print-color-adjust: exact;
				}
			}
		`,
		onAfterPrint: () => {},
	});

	useEffect(() => {
		id && getPrescriptionData(id);
	}, [id]);

	useEffect(() => {
		prescription && getPatientData(prescription.patient_id);
	}, [prescription]);

	const getPatientData = async (id: number) => {
		try {
			const res = await (window as any).beeclinicAPI.getPatientById(id);
			setPatient(res);
		} catch (error) {
			console.log(error);
		}
	};

	const getPrescriptionData = async (id: string) => {
		try {
			const res = await (window as any).beeclinicAPI.getPrescriptionById(id);
			setPrescription(res);
		} catch (error) {
			console.log(error);
		}
	};

	const renderMedications = (data: string) => {
		const medicines: PrescriptionItem[] = JSON.parse(data || '[]');

		return medicines.length > 0 ? (
			<div className='col-sm-12 col-md-8'>
				<List
					footer={
						<div className='col text-end mt-3'>
							<Button
								onClick={() => printPrescription()}
								icon={<IoPrintOutline size={16} />}>
								In đơn thuốc
							</Button>
						</div>
					}
					size='small'
					dataSource={medicines}
					renderItem={(item, index) => (
						<List.Item
							key={item.id}
							extra={
								<span
									style={{
										fontWeight: 'bold',
									}}>{`${item.quantity} ${item.unit}`}</span>
							}>
							<List.Item.Meta
								title={`${numToString(index + 1)}. ${item.ten_thuoc}`}
								description={`${item.instruction}`}
							/>
						</List.Item>
					)}
				/>
			</div>
		) : (
			<Empty description='Không có dữ liệu' />
		);
	};

	const renderServices = (data: string) => {
		const services: ServiceModel[] = JSON.parse(data || '[]');

		return services.length > 0 ? (
			<div className='col-sm-12 col-md-8'>
				<List
					size='small'
					dataSource={services}
					renderItem={(item, index) => (
						<List.Item key={item.id}>
							<List.Item.Meta
								title={`${numToString(index + 1)}. ${item.ten_dich_vu}`}
								description={`${item.mo_ta}`}
							/>
						</List.Item>
					)}
				/>
			</div>
		) : (
			<Empty description='Không có dịch vụ, thủ thuật nào được sử dụng' />
		);
	};

	const handleDeletePresciptions = async () => {
		try {
			await (window as any).beeclinicAPI.deletePrescriptionById(id);
			messageAPI.success('Xóa đơn thuốc thành công');
			navigate(-1);
		} catch (error) {
			console.log(error);
		}
	};

	return prescription && patient ? (
		<div className='container pt-2'>
			{modalHolder}
			{messageHolder}
			<div className='row'>
				<div className='col-sm-12 col-md-8 offset-md-2'>
					<div className='row'>
						<div className='col'>
							<Typography.Title level={3} type='secondary' className='mb-0'>
								Chi tiết đơn thuốc
							</Typography.Title>
							<Typography.Text type='secondary'>
								Mã đơn: <span>{prescription?.ma_don_thuoc?.toUpperCase()}</span>
							</Typography.Text>
						</div>
						<div className='col text-end'>
							<Space>
								<Button
									danger
									onClick={() =>
										modal.confirm({
											title: 'Xóa phiên khám',
											content: 'Bạn có chắc chắn muốn xóa phiên khám này?',
											onOk: () => handleDeletePresciptions(),
										})
									}
									type='text'>
									Xóa phiên khám
								</Button>
								{/* <Button type='primary' ghost>
									Sử dụng lại
								</Button> */}
							</Space>
						</div>
					</div>
					<Card className='mt-3' title='Thông tin phiên khám' size='small'>
						<Descriptions column={3}>
							<Descriptions.Item label='Họ tên' span={1}>
								{patient?.name ?? ''}
							</Descriptions.Item>
							<Descriptions.Item label='Giới tính' span={1}>
								{patient?.gender
									? patient.gender === 'male'
										? 'Nam'
										: 'Nữ'
									: ''}
							</Descriptions.Item>
							<Descriptions.Item label='Tuổi' span={1}>
								{patient?.age
									? `${formatDateToString(new Date(patient.age))} (${getYearOld(
											new Date(patient.age).toISOString()
									  )} tuổi)`
									: ''}
							</Descriptions.Item>
							<Descriptions.Item label='Số điện thoại' span={1}>
								{patient?.phone ?? ''}
							</Descriptions.Item>
							<Descriptions.Item label='Địa chỉ' span={2}>
								{patient?.address ?? ''}
							</Descriptions.Item>
						</Descriptions>
						<Divider />
						<Descriptions column={1}>
							<Descriptions.Item label='Ngày giờ khám' span={1}>
								{prescription?.ngay_gio_ke_don
									? getShortDateTime(prescription.ngay_gio_ke_don)
									: ''}
							</Descriptions.Item>
							<Descriptions.Item label='Lý do khám' span={1}>
								{prescription?.reason_for_visit}
							</Descriptions.Item>
							<Descriptions.Item label='Tiến triển bệnh' span={1}>
								{prescription?.disease_progression}
							</Descriptions.Item>
							<Descriptions.Item label='Chẩn đoán'>
								{prescription?.diagnosis
									? prescription.diagnosis.replace(',', ' / ')
									: ''}
							</Descriptions.Item>
							<Descriptions.Item label='Ghi chú'>
								{prescription?.note}
							</Descriptions.Item>
						</Descriptions>
					</Card>
					<Tabs
						type='card'
						className='mt-3'
						items={[
							{
								key: 'medications',
								label: 'Thuốc',
								children: renderMedications(
									prescription.thong_tin_don_thuoc_json
								),
							},
							{
								key: 'services',
								label: 'Dịch vụ - Thủ thuật',
								children: renderServices(prescription.thong_tin_dich_vu_json),
							},
						]}
					/>
				</div>
			</div>
			<div className='d-none d-print-block' ref={printRef}>
				<PrescriptionPrint
					patient={patient}
					prescriptionItems={
						prescription.thong_tin_don_thuoc_json
							? JSON.parse(prescription.thong_tin_don_thuoc_json)
							: []
					}
				/>
			</div>
		</div>
	) : (
		<Empty description='Không có dữ liệu' />
	);
};

export default PrescriptionDetail;
