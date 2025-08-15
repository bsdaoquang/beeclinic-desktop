/** @format */

import { useEffect, useState } from 'react';
import type { PrescriptionItem } from '../modals/PrescriptionModel';
import type { ColumnProps } from 'antd/es/table';
import {
	Button,
	message,
	Modal,
	Space,
	Table,
	Tooltip,
	Typography,
} from 'antd';
import { BiEdit, BiTrash } from 'react-icons/bi';

const Storages = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);
	const [results, setResults] = useState<PrescriptionItem[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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
		console.log('selectedRowKeys changed: ', newSelectedRowKeys);
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

	const columns: ColumnProps<PrescriptionItem>[] = [
		{
			title: 'Tên thuốc',
			dataIndex: 'ten_thuoc',
			width: 300,
			ellipsis: true,
			sorter: (a: any, b: any) => a.name.localeCompare(b.name),
		},
		{
			key: 'actions',
			dataIndex: '',
			title: '',
			width: 150,
			align: 'right',
			render: (item: PrescriptionItem) => (
				<Space>
					<Button icon={<BiEdit size={20} />} type='link' />
					<Tooltip title='Xoá khỏi danh mục thuốc'>
						<Button
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
						<Typography.Title type='secondary' level={3}>
							Quản lý kho thuốc
						</Typography.Title>
					</div>
					<div className='col text-end'></div>
				</div>
				<Table
					rowSelection={{
						selectedRowKeys,
						onChange: onSelectChange,
						columnWidth: 50,
					}}
					size='small'
					columns={columns}
					dataSource={medicines}
					bordered
				/>
			</div>
		</div>
	);
};

export default Storages;
