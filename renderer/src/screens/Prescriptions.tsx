/** @format */

import {
	Button,
	Divider,
	Input,
	message,
	Modal,
	Space,
	Table,
	Tooltip,
	Typography,
} from 'antd';
import type { ColumnProps } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { BiSync, BiTrash } from 'react-icons/bi';
import { IoIosSearch } from 'react-icons/io';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import type { PatientModel } from '../types/PatientModel';
import type { PrescriptionModel } from '../types/PrescriptionModel';
import { getShortDateTime } from '../utils/datetime';

/*
  Prescription list
*/

const Prescriptions = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [prescriptions, setPrescriptions] = useState<PrescriptionModel[]>([]);
	const [results, setResults] = useState<PrescriptionModel[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	const [messageAPI, messageHolder] = message.useMessage();
	const [modalAPI, modalHolder] = Modal.useModal();

	useEffect(() => {
		getPrescriptionData();
	}, []);

	useEffect(() => {
		formatPrescriptions(results);
	}, [results]);

	const getPrescriptionData = async () => {
		setIsLoading(true);
		try {
			const data = await (window as any).beeclinicAPI.getPrescriptions();
			setResults(data);
		} catch (error) {
			console.log(error);
			messageAPI.error(`Không thể lấy đơn thuốc`);
		} finally {
			setIsLoading(false);
		}
	};

	const formatPrescriptions = async (data: PrescriptionModel[]) => {
		try {
			const promisedData = data.map(async (item) => {
				const patient = await (window as any).beeclinicAPI.getPatientById(
					item.patient_id
				);
				return {
					...item,
					patient,
				};
			});

			setPrescriptions(await Promise.all(promisedData));
		} catch (error) {
			console.log(error);
		}
	};

	const handleDeletePrescription = async (id: number) => {
		try {
			await (window as any).beeclinicAPI.deletePrescriptionById(id);
			messageAPI.success(`Đã xóa đơn thuốc`);
			await getPrescriptionData();
		} catch (error) {
			console.log(error);
		}
	};

	const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
		setSelectedRowKeys(newSelectedRowKeys);
	};

	const handleDeleteSelectedPrescriptions = async () => {
		if (selectedRowKeys.length > 0) {
			try {
				await Promise.all(
					selectedRowKeys.map((id) =>
						(window as any).beeclinicAPI.deletePrescriptionById(id)
					)
				);
				messageAPI.success(`Đã xóa ${selectedRowKeys.length} đơn thuốc`);
				setSelectedRowKeys([]);
				await getPrescriptionData();
			} catch (error) {
				console.log(error);
			}
		}
	};

	const navigate = useNavigate();

	const handleSyncPrescription = async () => {
		modalAPI.info({
			title: 'Đồng bộ đơn thuốc',
			content:
				'Bạn cần phải đăng nhập vào Hệ thống ĐTQG để lấy mã đồng bộ đơn thuốc này.',
			onOk: () => navigate('/settings'),
			okText: 'Đến phần cài đặt',
		});
	};

	const columns: ColumnProps<PrescriptionModel>[] = [
		{
			key: 'date',
			title: 'Ngày khám',
			render: (val) => getShortDateTime(val),
			width: 100,
			dataIndex: 'ngay_gio_ke_don',
			sorter: (a: any, b: any) =>
				new Date(a.ngay_gio_ke_don).getTime() -
				new Date(b.ngay_gio_ke_don).getTime(),
		},
		{
			key: 'prescription_code',
			title: 'Mã đơn thuốc',
			dataIndex: 'ma_don_thuoc',
			width: 120,
			ellipsis: true,
			render: (text) => text.toUpperCase(),
		},
		{
			key: 'type',
			title: 'Loại đơn',
			dataIndex: 'loai_don_thuoc',
			width: 80,
			ellipsis: true,
			render: (text: string) => (
				<Typography.Text type='secondary'>
					{{
						c: 'Cơ bản',
						n: 'Gây nghiện',
						h: 'Hướng thần',
						y: 'YHCT',
					}[text] || text}
				</Typography.Text>
			),
		},
		{
			key: 'patient',
			dataIndex: 'patient',
			render: (record: PatientModel) => (record ? record.name : ''),
			width: 120,
			title: 'Bệnh nhân',
			ellipsis: true,
		},
		{
			key: 'diagnosis',
			title: 'Chẩn đoán',
			dataIndex: 'diagnosis',
			width: 200,
			ellipsis: false,
			render: (text: string) => text.replace(/,/g, ' / '),
		},
		{
			key: 'total',
			dataIndex: 'total',
			title: 'Tổng tiền',
			render: (val) =>
				val
					? val.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
					: 0,
			width: 100,
			align: 'right',
			sorter: (a: any, b: any) => (a.total || 0) - (b.total || 0),
		},
		{
			key: 'sent',
			title: 'Trạng thái',
			dataIndex: 'sent',
			render: (record) => (
				<Typography.Text type={record.sent ? 'success' : 'secondary'}>
					{record.sent ? 'Đã đồng bộ' : 'Chưa đồng bộ'}
				</Typography.Text>
			),
			width: 100,
		},
		{
			key: 'actions',
			dataIndex: '',
			title: '',
			width: 50,
			align: 'right',
			fixed: 'right',
			render: (val: PrescriptionModel) => (
				<Space>
					<Tooltip title='Xem đơn thuốc'>
						<Button
							onClick={() => navigate('/prescriptions/' + val.id)}
							icon={<IoInformationCircleOutline size={20} />}
							type='link'
							size='small'
							// onClick={() => handleViewPrescription(val.id as number)}
						/>
					</Tooltip>
					<Tooltip title='Đồng bộ lên hệ thống ĐTQG'>
						<Button
							disabled={val.sent}
							type='link'
							size='small'
							onClick={() => handleSyncPrescription()}
							icon={<BiSync size={22} />}
						/>
					</Tooltip>

					<Tooltip title='Xóa đơn thuốc'>
						<Button
							icon={<BiTrash size={20} />}
							type='text'
							size='small'
							onClick={() => handleDeletePrescription(val.id as number)}
							danger
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<div>
			{messageHolder}
			{modalHolder}
			<div className='container-fluid'>
				<div className=''>
					<div className='row py-3'>
						<div className='col-8'>
							<Space align='center'>
								<Typography.Title className='mb-0' level={3} type='secondary'>
									Danh sách đơn thuốc
								</Typography.Title>
								<Divider type='vertical' />
								{selectedRowKeys.length > 0 && (
									<>
										<Button
											onClick={handleDeleteSelectedPrescriptions}
											type='text'
											danger
											size='small'
											className='mt-2'>
											Xoá {selectedRowKeys.length} đơn thuốc đã chọn
										</Button>
										<Button
											onClick={() => handleSyncPrescription()}
											type='link'
											size='small'
											className='mt-2'>
											Đồng bộ {selectedRowKeys.length} đơn thuốc đã chọn
										</Button>
									</>
								)}
							</Space>
						</div>
						<div className='col'>
							<Input
								placeholder='Tìm kiếm đơn thuốc'
								prefix={<IoIosSearch size={20} className='text-muted' />}
								onChange={() => {}}
								onClear={() => {}}
								allowClear
							/>
						</div>
					</div>
					<Table
						rowSelection={{
							selectedRowKeys,
							onChange: onSelectChange,
							columnWidth: 50,
						}}
						pagination={{
							pageSize: 20,
							showSizeChanger: true,
							pageSizeOptions: ['10', '20', '50'],
						}}
						dataSource={prescriptions}
						columns={columns}
						loading={isLoading}
						rowKey='id'
						size='small'
						onRow={() => ({
							className: 'row-custom',
						})}
					/>
				</div>
			</div>
		</div>
	);
};

export default Prescriptions;
