/** @format */

import {
	Button,
	DatePicker,
	Drawer,
	Form,
	Input,
	Select,
	Image,
	Space,
	Upload,
	type UploadProps,
	message,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { parseDateInput } from '../utils/datetime';
import { handleSaveFile } from '../utils/handleFile';

export interface AddPatientProps {
	visible: boolean;
	onClose: () => void;
	patient?: any;
}

const AddPatient = (props: AddPatientProps) => {
	const { visible, onClose } = props;

	const [filelists, setFilelists] = useState<any>([]);
	const [isLoading, setIsLoading] = useState(false);

	const [form] = Form.useForm();

	const handleChangeImage: UploadProps['onChange'] = ({
		fileList: newFileList,
	}) => {
		setFilelists(
			newFileList.map((file) => ({
				...file,
				status: 'success',
			}))
		);
	};

	const handleAddPatient = async (vals: any) => {
		setIsLoading(true);
		try {
			const data = {
				...vals,
				photoUrl:
					vals.photoUrl && vals.photoUrl.file
						? await handleSaveFile(vals.photoUrl.file)
						: '',
			};
			await (window as any).beeclinicAPI.addPatient(data);
			message.success('Lưu thông tin bệnh nhân thành công');
			handleClose();
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setFilelists([]);
		form.resetFields();
		onClose();
	};

	return (
		<Drawer
			loading={isLoading}
			open={visible}
			onClose={handleClose}
			title='Thêm bệnh nhân mới'
			width={'100%'}
			footer={null}>
			<div className='container-fluid'>
				<div className='container'>
					<Form
						form={form}
						onFinish={handleAddPatient}
						size='large'
						layout='vertical'
						variant='filled'
						initialValues={{
							gender: 'male',
						}}>
						<Form.Item name='photoUrl'>
							<Upload
								type='select'
								onChange={handleChangeImage}
								fileList={filelists}
								listType='picture-circle'
								maxCount={1}
								accept='image/*'>
								{filelists.length > 0 ? null : 'Tải lên'}
							</Upload>
						</Form.Item>
						<div className='row'>
							<div className='col'>
								<Form.Item
									name='name'
									label='Họ và tên'
									rules={[
										{ required: true, message: 'Vui lòng nhập họ và tên' },
									]}>
									<Input
										onBlur={(e) =>
											form.setFieldValue('name', e.target.value.toUpperCase())
										}
										autoComplete=''
										autoFocus
										placeholder='Nhập họ và tên'
										allowClear
									/>
								</Form.Item>
								<div className='row'>
									<div className='col'>
										<Form.Item name='gender' label='Giới tính'>
											<Select
												allowClear
												options={[
													{ label: 'Nam', value: 'male' },
													{ label: 'Nữ', value: 'female' },
												]}
											/>
										</Form.Item>
									</div>
									<div className='col'>
										<Form.Item name='age' label='Ngày sinh'>
											<DatePicker
												format={'DD/MM/YYYY'}
												style={{ width: '100%' }}
												onBlur={(val: any) => {
													const value = val.target.value;
													const dateStr = value ? parseDateInput(value) : null;

													if (dateStr) {
														form.setFieldValue(
															'age',
															dayjs(dateStr, 'YYYY-MM-DD', true)
														);
													} else {
														form.setFieldValue('age', null);
													}
												}}
											/>
										</Form.Item>
									</div>
								</div>
								<div className='row'>
									<div className='col'>
										<Form.Item name='phone' label='Số điện thoại'>
											<Input
												placeholder='Nhập số điện thoại'
												allowClear
												maxLength={10}
											/>
										</Form.Item>
									</div>
									<div className='col'>
										<Form.Item name='citizenId' label='Số CMND/CCCD'>
											<Input allowClear />
										</Form.Item>
									</div>
								</div>
								<Form.Item name='email' label='Email'>
									<Input
										type='email'
										autoComplete='email'
										placeholder='Nhập email'
										allowClear
									/>
								</Form.Item>
								<Form.Item name='address' label='Địa chỉ'>
									<Input
										autoComplete='address'
										placeholder='Nhập địa chỉ'
										allowClear
									/>
								</Form.Item>
							</div>
							<div className='col'>
								<Form.Item name='medicalHistory' label='Lịch sử bệnh án'>
									<Input.TextArea
										autoComplete='medicalHistory'
										placeholder='Nhập lịch sử bệnh án'
										allowClear
										rows={4}
									/>
								</Form.Item>
								<Form.Item name='allergies' label='Dị ứng'>
									<Input.TextArea
										autoComplete='allergies'
										placeholder='Nhập thông tin dị ứng'
										allowClear
										rows={4}
									/>
								</Form.Item>
								<Form.Item name='notes' label='Ghi chú thêm'>
									<Input.TextArea
										autoComplete='notes'
										placeholder='Nhập ghi chú thêm'
										allowClear
										rows={4}
									/>
								</Form.Item>
							</div>
						</div>
					</Form>

					<div className='mt-3 text-end'>
						<Space>
							<Button onClick={handleClose} size='large' className='px-5'>
								Huỷ bỏ
							</Button>
							<Button
								className='px-5'
								type='primary'
								onClick={() => form.submit()}
								size='large'>
								Đồng ý
							</Button>
						</Space>
					</div>
				</div>
			</div>
		</Drawer>
	);
};

export default AddPatient;
