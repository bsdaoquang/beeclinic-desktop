/** @format */

import { Form, Input, InputNumber, Modal } from 'antd';
import { useEffect, useState } from 'react';

export interface BackupModalProps {
	open: boolean;
	onClose: () => void;
	onBackupSuccess: () => void;
}

const BackupModal = (props: BackupModalProps) => {
	const { open, onClose, onBackupSuccess } = props;

	const [isLoading, setIsLoading] = useState(false);

	const [form] = Form.useForm();

	useEffect(() => {
		form.setFieldValue('keep', 7);
	}, []);

	const handleBackup = async (vals: { passphrase: string; keep?: number }) => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.run(vals);

			if (res) {
				form.resetFields();
				onBackupSuccess();
			}
		} catch (error) {
			console.error('Backup failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			form.resetFields();
			onClose();
		}
	};
	return (
		<Modal
			open={open}
			onCancel={handleClose}
			okText='Tạo sao lưu'
			cancelText='Hủy'
			confirmLoading={isLoading}
			loading={isLoading}
			onOk={() => form.submit()}
			title='Tạo bản sao lưu mới'>
			<Form
				form={form}
				layout='vertical'
				size='large'
				variant='filled'
				onFinish={handleBackup}>
				<Form.Item
					label='Mật khẩu sao lưu'
					name='passphrase'
					rules={[
						{ required: true, message: 'Vui lòng nhập mật khẩu sao lưu' },
					]}>
					<Input.Password />
				</Form.Item>
				<Form.Item
					label='Xác nhận mật khẩu sao lưu'
					name='confirm'
					rules={[
						{ required: true, message: 'Vui lòng xác nhận mật khẩu sao lưu' },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue('passphrase') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('Mật khẩu sao lưu không khớp'));
							},
						}),
					]}>
					<Input.Password />
				</Form.Item>
				<Form.Item
					help='Nếu số bản hiện tại trên Google Driver lớn hơn số này, những bản trước đó sẽ bị xóa.'
					name={'keep'}
					label='Số bản sao lưu giữ lại (tùy chọn)'>
					<InputNumber min={1} max={14} />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default BackupModal;
