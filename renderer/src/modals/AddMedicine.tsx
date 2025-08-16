/** @format */

import {
	Button,
	Checkbox,
	DatePicker,
	Form,
	Input,
	InputNumber,
	message,
	Modal,
	Select,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import type { PrescriptionItem } from '../types/PrescriptionModel';
import { parseDateInput } from '../utils/datetime';
import { randomAlnumLower } from '../utils/prescriptions';

export interface AddMedicineProps {
	onAdd: () => void;
	onClose: () => void;
	visible: boolean;
	medicine?: PrescriptionItem | null;
}

const AddMedicine = (props: AddMedicineProps) => {
	const { onAdd, onClose, visible, medicine } = props;
	const [form] = Form.useForm();
	const [messageAPI, messageHolder] = message.useMessage();

	const medicineNameRef = useRef<any>(null);

	useEffect(() => {
		visible && medicineNameRef.current?.focus();
	}, [visible]);

	useEffect(() => {
		if (medicine) {
			form.setFieldsValue({
				...medicine,
				expDate: medicine.expDate ? dayjs(medicine.expDate) : null,
			});
		} else {
			form.setFieldsValue({
				ma_thuoc: randomAlnumLower(6),
				expDate: dayjs().add(1, 'year'),
				unit: 'viên',
			});
		}
	}, [medicine, visible]);

	const handleAddMedicine = async (values: any) => {
		const data = {
			...values,
			quantity: values.quantity || 0,
			expDate: values.expDate ? dayjs(values.expDate).toISOString() : null,
		};

		delete data.isContinue;
		try {
			if (medicine && medicine.id) {
				await (window as any).beeclinicAPI.updateMedicineById(
					medicine.id,
					data
				);
			} else {
				await (window as any).beeclinicAPI.addMedicine(data);
			}

			onAdd();

			if (values.isContinue) {
				form.resetFields();
				form.setFieldValue('ma_thuoc', randomAlnumLower(6));
				form.setFieldValue('expDate', dayjs().add(1, 'year'));
			} else {
				handleClose();
			}
		} catch (error) {
			console.log(error);
			messageAPI.error('Thêm thuốc không thành công');
		}
	};

	const handleClose = () => {
		form.resetFields();
		onClose();
	};

	return (
		<Modal
			open={visible}
			footer={[
				<Button key='cancel' type='text' danger onClick={handleClose}>
					Hủy
				</Button>,
				<Button
					key='submit'
					type='primary'
					onClick={() => {
						form.setFieldsValue({ isContinue: false });
						form.submit();
					}}>
					Lưu
				</Button>,
				<Button
					key='continue'
					onClick={() => {
						form.setFieldsValue({ isContinue: true });
						form.submit();
					}}>
					Lưu và Thêm mới
				</Button>,
			]}
			onCancel={handleClose}
			okText='Lưu'
			cancelText='Hủy'
			title={medicine ? 'Cập nhật' : 'Thêm thuốc'}>
			{messageHolder}
			<Form
				initialValues={{ isContinue: false }}
				form={form}
				layout='vertical'
				variant='filled'
				size='large'
				onFinish={handleAddMedicine}>
				<div className='row'>
					<div className='col'>
						<Form.Item name={'ma_thuoc'} label='Mã thuốc'>
							<Input allowClear maxLength={100} placeholder='Nhập mã thuốc' />
						</Form.Item>
					</div>
					<div className='col'>
						<Form.Item name={'expDate'} label='Ngày hết hạn'>
							<DatePicker
								format={'DD/MM/YYYY'}
								style={{ width: '100%' }}
								onBlur={(val: any) => {
									const value = val.target.value;

									if (
										(value && value.length < 8) ||
										(value && !value.includes('/'))
									) {
										const dateStr = value ? parseDateInput(value) : null;

										if (dateStr) {
											form.setFieldValue(
												'expDate',
												dayjs(dateStr, 'YYYY-MM-DD', true)
											);
										} else {
											form.setFieldValue('expDate', null);
										}
									} else {
										return;
									}
								}}
							/>
						</Form.Item>
					</div>
				</div>
				<div className='d-none'>
					<Form.Item name={'isContinue'} valuePropName='checked'>
						<Checkbox />
					</Form.Item>
				</div>
				<Form.Item
					rules={[
						{
							required: true,
							message: 'Tên thuốc không được để trống',
						},
					]}
					name={'ten_thuoc'}
					label='Tên thuốc'>
					<Input
						allowClear
						maxLength={100}
						autoFocus
						placeholder='Nhập tên thuốc, ví dụ: Paracetamol 500mg'
					/>
				</Form.Item>
				<Form.Item name={'biet_duoc'} label='Biệt dược'>
					<Input allowClear maxLength={100} placeholder='Nhập biệt dược' />
				</Form.Item>
				<Form.Item name={'instruction'} label='Cách dùng'>
					<Input
						allowClear
						maxLength={500}
						placeholder='Uống, sáng 1 viên, chiều 1 viên'
					/>
				</Form.Item>
				<div className='row'>
					<div className='col'>
						<Form.Item name={'unit'} label='Đơn vị tính'>
							<Select
								allowClear
								placeholder='Chọn đơn vị tính'
								options={[
									{ label: 'Viên', value: 'viên' },
									{ label: 'Ống', value: 'ống' },
									{ label: 'Gói', value: 'gói' },
									{ label: 'Chai', value: 'chai' },
									{ label: 'Lọ', value: 'lọ' },
									{ label: 'Tuýp', value: 'tuýp' },
									{ label: 'Vỉ', value: 'vỉ' },
									{ label: 'Ml', value: 'ml' },
									{ label: 'Gam', value: 'g' },
									{ label: 'Miếng', value: 'miếng' },
								]}
							/>
						</Form.Item>
					</div>

					<div className='col'>
						<Form.Item name={'quantity'} label='Số lượng'>
							<InputNumber
								min={0}
								style={{ width: '100%' }}
								maxLength={100}
								placeholder='Nhập số lượng'
							/>
						</Form.Item>
					</div>
				</div>
			</Form>
		</Modal>
	);
};

export default AddMedicine;
