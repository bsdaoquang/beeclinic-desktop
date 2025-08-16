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
import type { ColumnProps } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { BiEdit, BiPlus, BiTrash } from 'react-icons/bi';
import type { PrescriptionItem } from '../types/PrescriptionModel';
import { replaceName } from '../utils/replaceName';
import { AddMedicine } from '../modals';
import { formatDateToString } from '../utils/datetime';

const Storages = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);
	const [results, setResults] = useState<PrescriptionItem[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isAddMedicine, setIsAddMedicine] = useState(false);
	const [medicineSelected, setMedicineSelected] =
		useState<PrescriptionItem | null>(null);

	const [modal, modalHolder] = Modal.useModal();
	const [messageAPI, messageHolder] = message.useMessage();

	useEffect(() => {
		getStoragesItems();
	}, []);

	const getStoragesItems = async () => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.getMedicines();
			setMedicines(res);
			setResults(res);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
		setSelectedRowKeys(newSelectedRowKeys);
	};

	const handleDelete = async (item: PrescriptionItem) => {
		modal.confirm({
			title: 'Xoá thuốc',
			content: `Bạn có chắc chắn muốn xoá thuốc "${item.ten_thuoc}" khỏi danh mục?`,
			onOk: async () => {
				try {
					await (window as any).beeclinicAPI.deleteMedicineById(item.id);
					messageAPI.success('Đã xoá thuốc khỏi danh mục');
					getStoragesItems();
				} catch (error) {
					messageAPI.error('Xoá thuốc không thành công');
					console.error(error);
				}
			},
			onCancel() {},
		});
	};
	const handleSearchMedicine = (val: string) => {
		const key = replaceName(val);
		const filtered = medicines.filter(
			(item) =>
				replaceName(item.ten_thuoc).includes(key) ||
				(item.ma_thuoc && item.ma_thuoc.includes(key)) ||
				(item.biet_duoc && item.biet_duoc.includes(key))
		);
		setMedicines(filtered);
	};

	const columns: ColumnProps<PrescriptionItem>[] = [
		{
			title: 'Mã thuốc',
			key: 'code',
			dataIndex: 'ma_thuoc',
			width: 100,
			render: (text: string) => <span>{text.toUpperCase()}</span>,
		},
		{
			title: 'Tên thuốc',
			dataIndex: 'ten_thuoc',
			key: 'name',
			width: 250,
			ellipsis: true,
			sorter: (a: any, b: any) => a.name.localeCompare(b.name),
			fixed: 'left',
		},
		{
			key: 'biet_duoc',
			dataIndex: 'biet_duoc',
			title: 'Biệt dược',
			width: 200,
			ellipsis: true,
		},
		{
			key: 'unit',
			dataIndex: 'unit',
			title: 'Đơn vị',
			width: 100,
			align: 'center',
		},
		{
			key: 'quantity',
			dataIndex: 'quantity',
			title: 'Số lượng',
			width: 100,
			align: 'center',
			sorter: (a: any, b: any) => a.quantity - b.quantity,
		},
		{
			key: 'expiry_date',
			dataIndex: 'expDate',
			title: 'Ngày hết hạn',
			width: 100,
			align: 'center',
			render: (text: string) =>
				text ? formatDateToString(new Date(text)) : '',
			sorter: (a: any, b: any) => a.exDate - b.exDate,
		},
		{
			key: 'actions',
			dataIndex: '',
			title: '',
			width: 150,
			align: 'right',
			fixed: 'right',
			render: (item: PrescriptionItem) => (
				<Space>
					<Button
						size='small'
						icon={<BiEdit size={20} />}
						onClick={() => {
							setMedicineSelected(item);
							setIsAddMedicine(true);
						}}
						type='link'
					/>
					<Tooltip title='Xoá khỏi danh mục thuốc'>
						<Button
							size='small'
							onClick={() => handleDelete(item)}
							icon={<BiTrash size={20} />}
							type='text'
							danger
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<div className='container-fluid'>
			{modalHolder}
			{messageHolder}
			<div className='container'>
				<div className='row py-3'>
					<div className='col'>
						<Space align='center'>
							<Typography.Title
								style={{
									margin: 0,
								}}
								type='secondary'
								level={3}>
								Quản lý kho thuốc
							</Typography.Title>

							{selectedRowKeys.length > 0 && (
								<Button
									danger
									type='text'
									onClick={() => {
										modal.confirm({
											title: 'Xoá thuốc',
											content: `Bạn có chắc chắn muốn xoá ${selectedRowKeys.length} mục đã chọn khỏi danh mục?`,
											onOk: async () => {
												const promises = selectedRowKeys.map((id: React.Key) =>
													(window as any).beeclinicAPI.deleteMedicineById(id)
												);
												Promise.all(promises)
													.then(() => {
														messageAPI.success('Đã xoá thuốc khỏi danh mục');
														getStoragesItems();
														setSelectedRowKeys([]);
													})
													.catch((error) => {
														messageAPI.error('Xoá thuốc không thành công');
														console.error(error);
													});
											},
											onCancel() {},
										});
									}}
									size='small'>
									Xoá {selectedRowKeys.length} mục đã chọn
								</Button>
							)}
						</Space>
					</div>
					<div className='col text-end'>
						<Flex>
							<Input.Search
								style={{
									width: '100%',
								}}
								placeholder='Tìm kiếm thuốc'
								allowClear
								onChange={(val) => handleSearchMedicine(val.target.value)}
								onClear={() => setMedicines(results)}
								onSearch={(value) => handleSearchMedicine(value)}
								onPressEnter={(e: any) => handleSearchMedicine(e.target.value)}
							/>
							<Button
								type='link'
								icon={<BiPlus size={20} />}
								onClick={() => {
									setIsAddMedicine(true);
								}}>
								Thêm thuốc
							</Button>
						</Flex>
					</div>
				</div>
				<Table
					pagination={{
						pageSize: 20,
						showSizeChanger: true,
						pageSizeOptions: ['10', '20', '50'],
					}}
					loading={isLoading}
					rowSelection={{
						selectedRowKeys,
						onChange: onSelectChange,
						columnWidth: 50,
					}}
					size='small'
					columns={columns}
					dataSource={medicines}
					bordered
					rowKey={(record) => `${record.id}`}
				/>
			</div>

			<AddMedicine
				visible={isAddMedicine}
				onClose={() => {
					setIsAddMedicine(false);
					setMedicineSelected(null);
				}}
				onAdd={async () => {
					await getStoragesItems();
				}}
				medicine={medicineSelected}
			/>
		</div>
	);
};

export default Storages;
