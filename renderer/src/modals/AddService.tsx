/** @format */

import { Form, Input, InputNumber, message, Modal } from 'antd';
import type { ServiceModel } from '../types/ServiceModel';
import { useEffect } from 'react';

export interface AddServiceProps {
	visible: boolean;
	onClose: () => void;
	service?: ServiceModel;
	onOK: () => void;
	onAdd?: (service: ServiceModel) => void;
}

const AddService = (props: AddServiceProps) => {
	const [form] = Form.useForm();
	const [messageAPI, messageHolder] = message.useMessage();

	const { onClose, visible, service, onOK, onAdd } = props;

	useEffect(() => {
		form.setFieldValue('gia', 0);
	}, []);

	useEffect(() => {
		service && form.setFieldsValue(service);
	}, [service]);

	const handleClose = () => {
		form.resetFields();
		onClose();
	};

	const handleAddService = async (vals: any) => {
		if (!vals.ten_dich_vu) {
			messageAPI.error('Tên dịch vụ - Thủ thuật không được bỏ trống');
			return;
		}

		const serviceData = {
			ten_dich_vu: vals.ten_dich_vu,
			mo_ta: vals.mo_ta || '',
			gia: vals.gia || 0,
			thoi_gian: vals.thoi_gian || 0,
		};

		if (service) {
			await (window as any).beeclinicAPI.updateServiceById(
				service.id,
				serviceData
			);

			messageAPI.success('Cập nhật dịch vụ - thủ thuật thành công');
		} else {
			const res = await (window as any).beeclinicAPI.addService(serviceData);

			onAdd &&
				onAdd({
					id: res.id,
					...serviceData,
				});
			messageAPI.success('Thêm dịch vụ - thủ thuật thành công');
		}

		onOK();
		handleClose();
	};

	/*
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_dich_vu TEXT NOT NULL,
    mo_ta TEXT,
    gia REAL,
    thoi_gian INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  */
	return (
		<div>
			{messageHolder}

			<Modal
				onCancel={handleClose}
				open={visible}
				onOk={() => form.submit()}
				title={service ? 'Cập nhật' : 'Thêm dịch vụ - Thủ thuật'}>
				<Form
					form={form}
					onFinish={handleAddService}
					layout='vertical'
					size='large'
					variant='filled'>
					<Form.Item
						name={'ten_dich_vu'}
						label='Tên dịch vụ'
						rules={[
							{
								required: true,
								message: 'Tên dịch vụ - Thủ thuật không được bỏ trống',
							},
						]}>
						<Input
							placeholder='Nhập tên dịch vụ - Thủ thuật'
							allowClear
							maxLength={100}
						/>
					</Form.Item>
					<Form.Item name={'mo_ta'} label='Mô tả'>
						<Input.TextArea
							rows={4}
							maxLength={1000}
							showCount
							allowClear
							placeholder='Giới thiệu dịch vụ - Thủ thuật'
						/>
					</Form.Item>
					<div className='row'>
						<div className='col'>
							<Form.Item name={'gia'} label='Giá cho 1 lần thực hiện'>
								<InputNumber
									style={{
										width: '100%',
									}}
									placeholder='Nhập giá'
								/>
							</Form.Item>
						</div>
						<div className='col'>
							<Form.Item name={'thoi_gian'} label='Thời gian thực hiện (phút)'>
								<InputNumber
									style={{
										width: '100%',
									}}
									placeholder='Nhập thời gian'
								/>
							</Form.Item>
						</div>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default AddService;
