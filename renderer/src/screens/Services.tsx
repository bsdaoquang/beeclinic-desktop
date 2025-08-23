/** @format */

import {
	Button,
	Flex,
	Input,
	message,
	Modal,
	Space,
	Table,
	Tooltip,
	Typography,
} from 'antd';
import { IoIosAdd, IoIosSearch } from 'react-icons/io';
import { AddService } from '../modals';
import { useEffect, useState } from 'react';
import type { ServiceModel } from '../types/ServiceModel';
import type { ColumnProps } from 'antd/es/table';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { replaceName } from '../utils/replaceName';

const Services = () => {
	const [isAddService, setIsAddService] = useState(false);
	const [isloading, setIsloading] = useState(false);
	const [results, setResults] = useState<ServiceModel[]>([]);
	const [services, setServices] = useState<ServiceModel[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [serviceSelected, setServiceSelected] = useState<ServiceModel>();

	const [modal, modalHolder] = Modal.useModal();
	const [messageAPI, messageHolder] = message.useMessage();
	useEffect(() => {
		getAllServices();
	}, []);

	const getAllServices = async () => {
		setIsloading(true);
		try {
			const res = await (window as any).beeclinicAPI.getServices();
			setServices(res);
			setResults(res);
		} catch (error) {
			console.log('Error fetching services:', error);
		} finally {
			setIsloading(false);
		}
	};

	const columns: ColumnProps<ServiceModel>[] = [
		{
			key: 'ten_dich_vu',
			title: 'Tên dịch vụ',
			dataIndex: 'ten_dich_vu',
			width: 200,
			fixed: 'left',
		},
		{
			key: 'mo_ta',
			title: 'Mô tả',
			dataIndex: 'mo_ta',
			width: 300,
			render: (text: string) =>
				text ? <Typography.Text ellipsis>{text}</Typography.Text> : '',
		},
		{
			key: 'gia',
			title: 'Giá (VNĐ)',
			dataIndex: 'gia',
			render: (value) =>
				value
					? (value as number).toLocaleString('vi-VN', {
							style: 'currency',
							currency: 'VND',
					  })
					: '',
			width: 150,
		},
		{
			key: 'thoi_gian',
			title: 'Thời gian (phút)',
			dataIndex: 'thoi_gian',
			width: 150,
		},
		{
			key: 'actions',
			dataIndex: '',
			align: 'right',
			width: 100,
			fixed: 'right',
			render: (item) => (
				<Space>
					<Button
						size='small'
						icon={<BiEdit size={20} />}
						onClick={() => {
							setServiceSelected(item);
							setIsAddService(true);
						}}
						type='link'
					/>
					<Tooltip title='Xoá dịch vụ - thủ thuật'>
						<Button
							size='small'
							onClick={() => {
								modal.confirm({
									title: 'Xoá dịch vụ',
									content: 'Bạn có chắc chắn muốn xoá dịch vụ này?',
									onOk: async () => {
										try {
											await handleDeleteService(item.id);
											messageAPI.success('Xoá dịch vụ thành công');
											await getAllServices();
										} catch (error) {
											console.log(error);
										}
									},
								});
							}}
							icon={<BiTrash size={20} />}
							type='text'
							danger
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	const handleDeleteService = async (id: number) => {
		try {
			await (window as any).beeclinicAPI.deleteServiceById(id);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className='container-fluid py-3'>
			{messageHolder}
			{modalHolder}
			<div className='container'>
				<div className='row'>
					<div className='col'>
						<Typography.Title level={2} className='mb-4' type='secondary'>
							Dịch vụ - Thủ thuật
						</Typography.Title>
					</div>
					<div className='col text-end'>
						<Flex>
							<Input
								prefix={<IoIosSearch size={22} className='text-muted' />}
								placeholder='Tìm kiếm dịch vụ'
								variant='filled'
								style={{ width: '100%' }}
								allowClear
								onClear={() => setServices(results)}
								onChange={(val) => {
									const key = val.target.value && replaceName(val.target.value);
									key &&
										setServices(
											results.filter((element) =>
												replaceName(element.ten_dich_vu).includes(key)
											)
										);
								}}
							/>

							<Button
								onClick={() => setIsAddService(true)}
								icon={<IoIosAdd size={22} />}
								type='link'>
								Thêm dịch vụ
							</Button>
						</Flex>
					</div>
				</div>
				{selectedRowKeys.length > 0 && (
					<Space>
						<Button
							onClick={async () => {
								const promises = selectedRowKeys.map(async (id) => {
									console.log(id);
									await handleDeleteService(parseInt(id as string, 10));
								});

								await Promise.all(promises);
								messageAPI.success('Đã xoá dịch vụ đã chọn');
								setSelectedRowKeys([]);
								await getAllServices();
							}}
							type='link'
							danger>
							Xoá dịch vụ đã chọn
						</Button>
					</Space>
				)}
				<Table
					loading={isloading}
					dataSource={services}
					columns={columns}
					size='small'
					rowKey={(item) => `${item.id}-services`}
					rowSelection={{
						selectedRowKeys,
						onChange: (newSelectedRowKeys) => {
							setSelectedRowKeys(newSelectedRowKeys);
						},
					}}
					bordered
				/>
			</div>
			<AddService
				visible={isAddService}
				onClose={() => {
					setServiceSelected(undefined);
					setIsAddService(false);
				}}
				service={serviceSelected}
				onOK={() => getAllServices()}
			/>
		</div>
	);
};

export default Services;
