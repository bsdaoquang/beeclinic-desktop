/** @format */

import {
	Button,
	Divider,
	message,
	Modal,
	Space,
	Table,
	Tooltip,
	Typography,
} from 'antd';
import type { ColumnProps } from 'antd/es/table';
import { useEffect, useState } from 'react';
import type { PrescriptionModel } from '../types/PrescriptionModel';
import { getShortDateTime } from '../utils/datetime';
import { BiSync, BiTrash } from 'react-icons/bi';

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
				await getPrescriptionData();
			} catch (error) {
				console.log(error);
			}
		}
	};

	const handleSyncPrescription = async (id: number) => {
		modalAPI.info({
			title: 'Đồng bộ đơn thuốc',
			content:
				'Bạn cần phải đăng nhập vào Hệ thống ĐTQG để lấy mã đồng bộ đơn thuốc này.',
		});
	};

	const columns: ColumnProps<PrescriptionModel>[] = [
		{
			key: 'date',
			title: 'Ngày khám',
			render: (text, record) => getShortDateTime(record.ngay_gio_ke_don),
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
			width: 90,
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
			render: (text, record) => record.patient?.name,
			width: 100,
			ellipsis: true,
		},
		{
			key: 'diagnosis',
			title: 'Chẩn đoán',
			dataIndex: 'diagnosis',
			width: 200,
			ellipsis: true,
		},
		{
			key: 'sent',
			title: 'Đồng bộ',
			dataIndex: 'sent',
			render: (text, record) => (
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
				<Space className='patient-actions'>
					<Tooltip title='Đồng bộ lên hệ thống ĐTQG'>
						<Button
							disabled={val.sent}
							type='link'
							size='small'
							onClick={() => handleSyncPrescription(val.id as number)}
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
				<div className='container'>
					<div className='row py-3'>
						<div className='col'>
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
											onClick={() => handleSyncPrescription(1)}
											type='link'
											size='small'
											className='mt-2'>
											Đồng bộ {selectedRowKeys.length} đơn thuốc đã chọn
										</Button>
									</>
								)}
							</Space>
						</div>
					</div>
					<Table
						rowSelection={{
							selectedRowKeys,
							onChange: onSelectChange,
							columnWidth: 50,
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
