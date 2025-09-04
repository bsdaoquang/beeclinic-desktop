/** @format */
/*
  Trang này để quản lý sao lưu và phục hồi dữ liệu phòng khám
  Nếu không có kết nối internet -> Hiển thị thông báo không thể sao lưu trực tuyến
  nếu có kết nối internet:
  Nếu chưa đăng nhập -> Đăng nhập
  Nếu đã đăng nhập -> Hiển thị bản sao lưu gần nhất và các bản sao lưu khác (nếu có)
  Cài đặt lịch sao lưu tự động (nếu có)
  Nút "Sao lưu ngay" để tạo bản sao lưu mới
  Nút "Phục hồi" để phục hồi từ bản sao lưu đã chọn
  Hiển thị trạng thái sao lưu và phục hồi (thành công, thất bại, đang tiến hành)
  Hướng dẫn người dùng cách sao lưu và phục hồi dữ liệu phòng khám
*/

import {
	Button,
	Divider,
	Flex,
	message,
	Modal,
	Space,
	Switch,
	Table,
	Tooltip,
	Typography,
} from 'antd';
import type { ColumnProps } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { FaGoogleDrive } from 'react-icons/fa6';
import BackupModal from '../modals/BackupModal';
import { MdSettingsBackupRestore } from 'react-icons/md';
import { GoTrash } from 'react-icons/go';

interface BackupFile {
	id: string;
	name: string;
	createdTime: string;
	size: string;
}

declare global {
	interface Window {
		beeclinicAPI: {
			connectGoogle: () => Promise<{ ok: boolean }>;
			isConnected: () => Promise<{ ok: boolean }>;
			run: (p: { passphrase: string; keep?: number }) => Promise<any>;
			delete: (p: { fileId: string }) => Promise<any>;
			list: () => Promise<Array<BackupFile>>;
			restore: (p: { fileId: string; passphrase: string }) => Promise<any>;
			setSchedule: (p: {
				cronExp?: string;
				passphrase: string;
				keep?: number;
			}) => Promise<{ ok: boolean }>;
			onScheduledOk: (cb: (ts: string) => void) => void;
			onScheduledErr: (cb: (msg: string) => void) => void;
		};
	}
}

const ClinicBackup = () => {
	// kiểm tra kết nối internet
	const isOnline = navigator.onLine;

	const [isConnected, setIsConnected] = useState(false);
	const [backupList, setBackupList] = useState<BackupFile[]>([]);
	const [isBackupManual, setIsBackupManual] = useState(false);
	const [isLoadBackups, setIsLoadBackups] = useState(false);
	const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

	const [messageApi, messageHolder] = message.useMessage();
	const [modalAPI, modalHolder] = Modal.useModal();

	useEffect(() => {
		checkConnection();
		// Lắng nghe sự kiện thay đổi trạng thái kết nối mạng
		const handleOnline = () => {
			messageApi.open({
				type: 'success',
				content: 'Kết nối mạng đã được khôi phục.',
			});
			checkConnection();
		};

		const handleOffline = () => {
			messageApi.open({
				type: 'warning',
				content: 'Mất kết nối mạng. Vui lòng kiểm tra kết nối internet.',
			});
			setIsConnected(false);
		};
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	useEffect(() => {
		if (isConnected) {
			getBackupList();
		}
	}, [isConnected]);

	// Kiểm tra kết nối Google Drive khi component được mount
	const checkConnection = async () => {
		const result = await window.beeclinicAPI.isConnected();
		setIsConnected(result.ok);
	};

	const getBackupList = async () => {
		setIsLoadBackups(true);
		try {
			const list = await window.beeclinicAPI.list();
			setBackupList(list);
		} catch (error) {
			messageApi.error('Lấy danh sách bản sao lưu thất bại. Vui lòng thử lại.');
		} finally {
			setIsLoadBackups(false);
		}
	};

	if (!isOnline) {
		// Hiển thị thông báo không thể sao lưu trực tuyến
		return (
			<div className='container alert alert-warning' role='alert'>
				<p>
					Không thể kết nối mạng internet. Vui lòng kiểm tra kết nối internet
					của bạn và thử lại.
				</p>
			</div>
		);
	}

	const handleConnectGoogle = async () => {
		const result = await window.beeclinicAPI.connectGoogle();
		if (result.ok) {
			setIsConnected(true);
		} else {
			messageApi.error('Kết nối Google Drive thất bại. Vui lòng thử lại.');
		}
	};

	const handleDeleteBackup = async (fileId: string) => {
		try {
			// Xử lý xóa bản sao lưu
			const res = await window.beeclinicAPI.delete({ fileId });
			console.log(res);
			// Sau khi xóa thành công, cập nhật lại danh sách bản sao lưu
			setBackupList((prevList) =>
				prevList.filter((backup) => backup.id !== fileId)
			);
		} catch (error) {
			messageApi.error('Xóa bản sao lưu thất bại. Vui lòng thử lại.');
		}
	};

	const columns: ColumnProps<BackupFile>[] = [
		{
			title: 'Tên tệp',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Thời gian tạo',
			dataIndex: 'createdTime',
			key: 'createdTime',
			render: (text) => new Date(text).toLocaleString('vi-VN'),
			width: 200,
		},

		{
			title: 'Kích thước',
			dataIndex: 'size',
			key: 'size',
			align: 'right',
			render: (text) => `${(Number(text) / (1024 * 1024)).toFixed(2)} MB`,
			width: 120,
		},
		{
			title: '',
			key: 'action',
			dataIndex: '',
			render: (item: BackupFile) => (
				<Space>
					<Tooltip title='Phục hồi từ bản sao lưu này'>
						<Button
							type='link'
							icon={<MdSettingsBackupRestore size={22} />}
							onClick={() => {
								/* Xử lý phục hồi từ bản sao lưu */
							}}
						/>
					</Tooltip>
					<Tooltip title='Xóa bản sao lưu này'>
						<Button
							onClick={async () => {
								await handleDeleteBackup(item.id);
								messageApi.success('Xóa bản sao lưu thành công.');
							}}
							danger
							type='link'
							icon={<GoTrash size={20} />}
						/>
					</Tooltip>
				</Space>
			),
			width: 150,
			align: 'right',
			fixed: 'right',
		},
	];

	return (
		<div className='container'>
			{messageHolder}
			{modalHolder}
			<Flex justify='space-between' className='w-100'>
				<div>
					<Typography.Title level={3} className='mb-1' type='secondary'>
						Sao lưu và phục hồi dữ liệu
					</Typography.Title>
					<Typography.Paragraph className='text-justify text-muted'>
						Bạn có thể sao lưu và phục hồi dữ liệu phòng khám an toàn trên
						Google Drive cá nhân, giúp bảo vệ và khôi phục dữ liệu khi cần
						thiết.
					</Typography.Paragraph>
				</div>
				<Button
					type='primary'
					className='px-5'
					onClick={() => {
						// check internet
						if (!isOnline) {
							modalAPI.error({
								title: 'Lỗi kết nối mạng',
								content:
									'Không thể kết nối mạng internet. Vui lòng kiểm tra kết nối internet của bạn và thử lại.',
							});
							return;
						}

						if (!isConnected) {
							modalAPI.error({
								title: 'Chưa kết nối Google Drive',
								content:
									'Vui lòng kết nối với Google Drive trước khi sao lưu dữ liệu.',
							});
							return;
						}

						// Hiển thị modal nhập passphrase
						setIsBackupManual(true);
					}}>
					Sao lưu ngay
				</Button>
			</Flex>

			<div className='mt-4'>
				{isConnected ? (
					<>
						<Space className='mb-2'>
							<Switch />
							<Button type='text' size='small'>
								Bật sao lưu tự động hàng ngày
							</Button>
						</Space>

						<Divider orientation='left' orientationMargin={0}>
							Danh sách các bản sao lưu gần nhất
						</Divider>
						{selectedKeys.length > 0 && (
							<div className='mb-2'>
								<Button
									danger
									onClick={async () => {
										/* Xử lý xóa các bản sao lưu đã chọn */
										await Promise.all(
											selectedKeys.map((fileId) =>
												handleDeleteBackup(String(fileId))
											)
										);
										messageApi.success('Xóa bản sao lưu thành công.');
										setSelectedKeys([]);
									}}>
									Xóa bản sao lưu đã chọn ({selectedKeys.length})
								</Button>
							</div>
						)}
						<Table
							rowSelection={{
								type: 'checkbox',
								selectedRowKeys: selectedKeys,
								onChange: (selectedRowKeys) => {
									setSelectedKeys(selectedRowKeys);
								},
							}}
							loading={isLoadBackups}
							columns={columns}
							dataSource={backupList}
							rowKey='id'
							size='small'
							bordered
							scroll={{ x: 600 }}
							locale={{
								emptyText: 'Dữ liệu chưa được sao lưu lên Google Drive',
							}}
							pagination={false}
						/>
					</>
				) : (
					<div className='text-center p-5'>
						<Typography.Paragraph className='text-justify text-muted'>
							Chưa kết nối với Google Drive. Vui lòng nhấn nút bên dưới để kết
							nối với Google Drive cá nhân của bạn.
						</Typography.Paragraph>
						<Button
							onClick={handleConnectGoogle}
							size='large'
							className=''
							icon={<FaGoogleDrive color='#4285F4' size={20} />}>
							Google Driver
						</Button>
					</div>
				)}
			</div>
			<BackupModal
				open={isBackupManual}
				onClose={() => setIsBackupManual(false)}
				onBackupSuccess={() => {
					getBackupList();
					setIsBackupManual(false);
					messageApi.success('Sao lưu dữ liệu thành công.');
				}}
			/>
		</div>
	);
};

export default ClinicBackup;
