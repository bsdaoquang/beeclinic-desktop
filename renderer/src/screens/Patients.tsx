/** @format */

import {
	Avatar,
	Button,
	Divider,
	Flex,
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
import { FaUserPlus } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { AddPatient } from '../modals';
import type { PatientModel } from '../types/PatientModel';
import { formatDateToString, getYearOld } from '../utils/datetime';
import { replaceName } from '../utils/replaceName';

const Patients = () => {
	const [isVisibleModalAddPatient, setIsVisibleModalAddPatient] =
		useState(false);
	const [patients, setPatients] = useState<PatientModel[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [modal, contextHolder] = Modal.useModal();
	const [messageAPI, messageHolder] = message.useMessage();
	const [results, setResults] = useState<PatientModel[]>([]);

	useEffect(() => {
		getPatientsData();
	}, []);

	const getPatientsData = async () => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.getPatients();
			setPatients(res);
			setResults(res);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const columns: ColumnProps[] = [
		{
			key: 'photoUrl',
			dataIndex: 'photoUrl',
			render: (url) => <Avatar src={url} />,
			title: 'Ảnh',
			width: 70,
			align: 'center',
			fixed: 'left',
		},
		{
			key: 'name',
			title: 'Họ và Tên',
			dataIndex: '',
			width: 300,
			render: (item) => <Link to={`/patients/${item.id}`}>{item.name}</Link>,
			sorter: (a: any, b: any) => a.name.localeCompare(b.name),
			fixed: 'left',
		},
		{
			key: 'birthday',
			dataIndex: 'age',
			title: 'Ngày sinh',
			render: (val) => (val ? formatDateToString(new Date(val)) : ''),
			width: 130,
			sorter: (a: any, b: any) => a - b,
			align: 'right',
		},
		{
			key: 'yearOld',
			title: 'Tuổi',
			align: 'center',
			dataIndex: 'age',
			render: (val) => (val ? getYearOld(val) : ''),
			width: 80,
		},
		{
			key: 'gender',
			dataIndex: 'gender',
			title: 'Giới tính',
			render: (val: 'male' | 'female') => (val === 'male' ? 'Nam' : 'Nữ'),
			align: 'center',
			width: 100,
		},
		{
			key: 'phone',
			dataIndex: 'phone',
			title: 'Điện thoại',
			align: 'right',
			width: 120,
		},
		{
			key: 'address',
			dataIndex: 'address',
			title: 'Địa chỉ',
			width: 400,
			ellipsis: true,
		},
		{
			key: 'created',
			dataIndex: 'createdAt',
			render: (val) => (val ? formatDateToString(new Date(val)) : ''),
			width: 120,
			align: 'right',
			title: 'Ngày tạo',
			sorter: (a: any, b: any) => a - b,
		},
		{
			key: 'actions',
			align: 'center',
			title: '',
			dataIndex: '',
			render: (item) => (
				<Space className='patient-actions'>
					<Link to={`/prescriptions/add-new?patient-id=${item.id}`}>
						Kê đơn
					</Link>
					<Divider
						type='vertical'
						style={{
							marginBottom: 0,
							marginTop: 0,
						}}
					/>
					<Tooltip title='Xoá'>
						<Button
							size='small'
							style={{ margin: 0 }}
							type='text'
							onClick={() => handleDeletePatient(item)}
							icon={
								<IoClose
									size={22}
									style={{
										marginBottom: -3,
									}}
								/>
							}
							danger
						/>
					</Tooltip>
				</Space>
			),
			fixed: 'right',
			width: 150,
		},
	];

	const handleDeletePatient = (item: PatientModel) => {
		modal.confirm({
			title: 'Xác nhận',
			content: `Bạn muốn xoá thông tin bệnh nhân ${item.name}?`,
			onOk: async () => {
				try {
					await (window as any).beeclinicAPI.deletePatient(item.id);
					await getPatientsData();
					messageAPI.success(`Đã xoá thông tin bệnh nhân`);
				} catch (error) {
					console.log(error);
					messageAPI.error(`Không thể xoá thông tin bệnh nhân`);
				}
			},
			onCancel: () => console.log('Cancel'),
		});
	};

	const handleSearchPatients = async (val: string) => {
		try {
			const value = replaceName(val);
			const datas = results.filter(
				(element: any) =>
					replaceName(element.name).includes(value) ||
					(element.phone && element.phone.includes(value)) ||
					(element.citizenId && element.citizenId.includes(value))
			);

			setPatients(datas);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div>
			{contextHolder}
			{messageHolder}
			<div className='container-fluid'>
				<div className=''>
					<Flex align='center' justify='space-between'>
						<Typography.Title level={3} type='secondary'>
							Bệnh nhân
						</Typography.Title>
						<Space>
							<Input.Search
								variant='filled'
								placeholder='Tìm kiếm'
								onSearch={(val) => handleSearchPatients(val)}
								onClear={() => setPatients(results)}
								style={{
									minWidth: '40vw',
								}}
								allowClear
								onChange={(val) => handleSearchPatients(val.target.value)}
							/>
							<Button
								onClick={() => setIsVisibleModalAddPatient(true)}
								type='link'
								icon={<FaUserPlus size={18} />}>
								{' '}
								Tạo mới
							</Button>
						</Space>
					</Flex>
					<div className='mt-2'>
						<Table
							style={{
								width: '100%',
							}}
							columns={columns}
							bordered
							size='small'
							loading={isLoading}
							rowKey={(val) => `${val.id}`}
							dataSource={patients}
							onRow={() => ({
								className: 'row-custom',
							})}
						/>
					</div>
				</div>
			</div>
			<AddPatient
				visible={isVisibleModalAddPatient}
				onClose={() => setIsVisibleModalAddPatient(false)}
				onFinish={getPatientsData}
			/>
		</div>
	);
};

export default Patients;
